"""LYHU scheduled publisher. Python 3.11+, standard library only."""
import argparse
import hashlib
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ICT = ZoneInfo('Asia/Ho_Chi_Minh')
UUID = re.compile(r'^[0-9a-fA-F-]{36}$')
SLUG = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


def sha256(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def eq(value):
    # A single eq operand is raw; urlencode escapes the complete query value.
    # Quoting here changes UUID/text values (list operators differ).
    return 'eq.' + str(value)


def parse_time(value):
    dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if dt.tzinfo is None:
        raise ValueError('Timestamp must include timezone')
    return dt.astimezone(timezone.utc)


def validate_manifest(manifest, date):
    if manifest.get('schema_version') != 1 or manifest.get('target_date_ict') != date:
        raise ValueError('Manifest schema/date mismatch')
    jobs = manifest.get('articles', [])
    if len(jobs) != 3 or {j.get('slot') for j in jobs} != {7, 13, 19}:
        raise ValueError('Manifest must contain exactly slots 7, 13, 19')
    if len({j.get('id') for j in jobs}) != 3:
        raise ValueError('Duplicate article IDs')
    for j in jobs:
        if not UUID.fullmatch(j.get('id', '')) or not SLUG.fullmatch(j.get('slug', '')):
            raise ValueError('Invalid id/slug')
        if j.get('request_id') != f"lyhu-news:{date}:{j['slot']}":
            raise ValueError('Unexpected request_id')
        due = parse_time(j['due_at_utc']).astimezone(ICT)
        if due.strftime('%Y-%m-%d') != date or (due.hour, due.minute, due.second, due.microsecond) != (j['slot'], 0, 0, 0):
            raise ValueError('Slot/time mismatch')
    return sorted(jobs, key=lambda j: j['slot'])


class Http:
    def __init__(self, supabase_url, secret, site_url, image_hosts, sleep=time.sleep):
        self.base = supabase_url.rstrip('/')
        self.secret = secret
        self.site = site_url.rstrip('/')
        self.image_hosts = set(image_hosts)
        self.sleep = sleep

    def request(self, url, method='GET', body=None, authenticated=False):
        headers = {'User-Agent': 'LYHU-Publisher/1.0', 'Accept': 'application/json'}
        if authenticated:
            if not url.startswith(self.base + '/rest/v1/blog_posts?'):
                raise ValueError('Credential destination refused')
            headers.update({'apikey': self.secret, 'Prefer': 'return=representation, handling=strict, max-affected=1'})
            # New sb_secret_ keys are API keys, not bearer JWTs.
            if not self.secret.startswith('sb_secret_'):
                headers['Authorization'] = 'Bearer ' + self.secret
        if body is not None:
            headers['Content-Type'] = 'application/json'
        req = Request(url, data=json.dumps(body).encode() if body is not None else None, headers=headers, method=method)
        # Never follow redirects on privileged requests: avoids leaking keys.
        if authenticated:
            from urllib.request import HTTPRedirectHandler, build_opener
            class NoRedirect(HTTPRedirectHandler):
                def redirect_request(self, *args, **kwargs):
                    return None
            opener = build_opener(NoRedirect())
            response = opener.open(req, timeout=25)
        else:
            response = urlopen(req, timeout=25)
        with response as r:
            data = r.read(5_000_001)
            if len(data) > 5_000_000:
                raise ValueError('HTTP response too large')
            return r.status, r.headers, data

    def rows(self, job):
        q = {'id': eq(job['id']), 'request_id': eq(job['request_id']), 'select': 'id,request_id,slug,title,content,thumbnail_url,status,published_at,updated_at'}
        status, _, raw = self.request(self.base + '/rest/v1/blog_posts?' + urlencode(q), authenticated=True)
        rows = json.loads(raw)
        if status != 200 or not isinstance(rows, list) or len(rows) != 1:
            raise ValueError('Expected exactly one article')
        return rows[0]

    def check_image(self, url):
        p = urlparse(url)
        if p.scheme != 'https' or p.hostname not in self.image_hosts or p.username or p.password:
            raise ValueError('Unapproved image origin')
        status, headers, raw = self.request(url)
        if status != 200 or not headers.get('Content-Type', '').startswith('image/') or not raw:
            raise ValueError('Image unavailable')

    def publish(self, job, row):
        q = {'id': eq(job['id']), 'request_id': eq(job['request_id']),
             'slug': eq(row['slug']), 'title': eq(row['title']),
             'status': 'eq.draft', 'published_at': 'is.null', 'updated_at': eq(row['updated_at']),
             'content': eq(row['content']), 'thumbnail_url': eq(row['thumbnail_url'])}
        url = self.base + '/rest/v1/blog_posts?' + urlencode(q)
        if len(url) > 24000:
            raise ValueError('Article exceeds CAS URL bound; use a reviewed RPC implementation')
        now = datetime.now(timezone.utc)
        if not parse_time(job['due_at_utc']) <= now < parse_time(job['due_at_utc']) + timedelta(hours=6):
            raise ValueError('Publication window closed before write')
        body = {'status': 'published', 'published_at': now.isoformat(), 'updated_at': now.isoformat()}
        _, _, raw = self.request(url, 'PATCH', body, authenticated=True)
        result = json.loads(raw)
        if len(result) != 1:
            raise ValueError('Concurrent change; no article published by this request')

    def verify_public(self, job, row):
        import html
        for attempt in range(3):
            try:
                status, _, raw = self.request(self.site + '/tin-tuc/' + job['slug'])
                page = html.unescape(raw.decode('utf-8'))
                if status == 200 and row['title'] in page and all(url in page for url in job['asset_urls']):
                    return
            except (HTTPError, URLError, TimeoutError, OSError):
                pass
            if attempt < 2:
                self.sleep(30)
        raise ValueError('DB published but public page not verified; do not unpublish automatically')


def validate_row(job, row):
    if row['id'] != job['id'] or row['request_id'] != job['request_id'] or row['slug'] != job['slug']:
        raise ValueError('Article identity mismatch')
    if job.get('ready_for_publish') is not True or not all(job.get('checks', {}).get(c) is True for c in ('editorial', 'sources', 'dedup', 'images')):
        raise ValueError('Article not marked fully ready')
    if not re.fullmatch(r'[0-9a-f]{64}', job.get('content_hash', '')) or sha256(row['content']) != job['content_hash']:
        raise ValueError('Content differs from approved manifest')
    if row['title'] != job.get('title') or row['thumbnail_url'] != job.get('thumbnail_url'):
        raise ValueError('Title/cover differs from approved manifest')
    text = re.sub('<[^>]+>', ' ', row['content'])
    if len(text.split()) < 250 or re.search(r'bản giữ chỗ|chưa sẵn sàng|TODO|PLACEHOLDER', text, re.I):
        raise ValueError('Incomplete article')
    assets = job.get('asset_urls', [])
    if len(set(assets)) < 2 or row['thumbnail_url'] not in assets:
        raise ValueError('Missing cover/inline image')
    if not all(url in row['content'] for url in assets if url != row['thumbnail_url']):
        raise ValueError('Inline image missing from article')
    if re.search(r'<script\b|\bon\w+\s*=|javascript:', row['content'], re.I):
        raise ValueError('Unsafe article HTML')


def process_job(job, api, dry_run=True):
    row = api.rows(job)
    validate_row(job, row)
    if row['status'] == 'published' and row['published_at']:
        api.verify_public(job, row)
        return 'already_published'
    if row['status'] != 'draft' or row['published_at'] is not None:
        raise ValueError('Article is not an unpublished draft')
    for url in job['asset_urls']:
        api.check_image(url)
    if dry_run:
        return 'dry_run_ready'
    try:
        api.publish(job, row)
    except (HTTPError, URLError, TimeoutError, OSError):
        # A write may have committed even if its response was lost. Read back;
        # never blindly retry a privileged write.
        row = api.rows(job)
        validate_row(job, row)
        if row['status'] != 'published' or not row['published_at']:
            raise ValueError('Write outcome not published; retry on next scheduled run') from None
    after = api.rows(job)
    validate_row(job, after)
    if after['status'] != 'published' or not after['published_at']:
        raise ValueError('DB publication not confirmed')
    api.verify_public(job, after)
    return 'published'


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--queue-dir', default='queue')
    p.add_argument('--publish', action='store_true', help='Explicitly enable DB writes; default is dry-run')
    p.add_argument('--check-all', action='store_true', help='Dry-run all three slots even outside their windows')
    p.add_argument('--date', help='Manifest date for --check-all only, YYYY-MM-DD')
    args = p.parse_args()
    if (args.check_all and args.publish) or (args.date and not args.check_all):
        raise ValueError('check-all/date cannot enable publication')
    now = datetime.now(timezone.utc)
    date = now.astimezone(ICT).strftime('%Y-%m-%d')
    if args.date:
        datetime.strptime(args.date, '%Y-%m-%d')
        date = args.date
    # Outside a due window do nothing. Within a window missing queue is an error.
    active_hour = now.astimezone(ICT).hour
    if not args.check_all and active_hour not in (7, 13, 19):
        print(json.dumps({'status': 'outside_publication_window', 'date': date}))
        return 0
    manifest = json.loads((Path(args.queue_dir) / (date + '.json')).read_text(encoding='utf-8-sig'))
    jobs = validate_manifest(manifest, date)
    base = os.environ['SUPABASE_URL']
    secret = os.environ.get('SUPABASE_SECRET_KEY') or os.environ['SUPABASE_SERVICE_ROLE_KEY']
    parsed = urlparse(base)
    if parsed.scheme != 'https' or parsed.username or parsed.password or parsed.path not in ('', '/'):
        raise ValueError('Invalid Supabase URL')
    if secret.startswith('sb_publishable_') or not secret:
        raise ValueError('A server-only secret is required')
    api = Http(base, secret, 'https://www.lyhu.com.vn', [parsed.hostname])
    failed = False
    for job in jobs:
        if not args.check_all and job['slot'] != active_hour:
            continue
        try:
            result = process_job(job, api, not args.publish)
            print(json.dumps({'request_id': job['request_id'], 'result': result}))
        except Exception:
            # Never log response bodies/headers/URLs (may contain secrets/content).
            print(json.dumps({'request_id': job['request_id'], 'result': 'failed_check_or_request'}))
            failed = True
    return 1 if failed else 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print(json.dumps({'result': 'configuration_or_manifest_error', 'error_type': type(exc).__name__}))
        sys.exit(1)
