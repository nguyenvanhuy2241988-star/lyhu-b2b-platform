"""Import an explicitly approved public package, then publish exactly that draft.

No AI calls. Source packages must already be authorized for public release.
The reviewed plan pins identities and every source hash; the deadline is mandatory.
"""
import argparse
import hashlib
import json
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, build_opener, HTTPRedirectHandler

from publish import Http, eq, parse_time, process_job, sha256, validate_row

BASE = 'https://wepxcpifgxghfvdgnkeh.supabase.co'
SITE = 'https://www.lyhu.com.vn'


class Backend:
    def __init__(self):
        if os.environ.get('SUPABASE_URL', '').rstrip('/') != BASE:
            raise ValueError('Wrong project')
        self.secret = os.environ['SUPABASE_SECRET_KEY']
        if not self.secret.startswith('sb_secret_'):
            raise ValueError('Backend key required')

    def request(self, path, method='GET', data=None, mime='application/json'):
        if not any(path.startswith(p) for p in (
            '/rest/v1/blog_posts?', '/rest/v1/blog_categories?',
            '/storage/v1/object/public-assets/news/lyhu-cloud-handoff/',
        )):
            raise ValueError('Unapproved credential destination')
        class NoRedirect(HTTPRedirectHandler):
            def redirect_request(self, *args, **kwargs):
                return None
        headers = {'apikey': self.secret, 'Content-Type': mime,
                   'Prefer': 'return=representation', 'x-upsert': 'false',
                   'User-Agent': 'LYHU-Approved-Importer/1.0'}
        req = Request(BASE + path, data=data, headers=headers, method=method)
        with build_opener(NoRedirect()).open(req, timeout=30) as response:
            raw = response.read(5_000_001)
            if len(raw) > 5_000_000:
                raise ValueError('Response too large')
            return raw

    def rows(self, table, filters):
        result = json.loads(self.request('/rest/v1/' + table + '?' + urlencode(filters)))
        if not isinstance(result, list):
            raise ValueError('Expected rows')
        return result

    def insert(self, row):
        return json.loads(self.request('/rest/v1/blog_posts?select=id', 'POST',
                                      json.dumps(row).encode('utf-8')))


def check_deadline(plan):
    if datetime.now(timezone.utc) >= parse_time(plan['expires_at_utc']):
        raise ValueError('Approved publication window expired')


def load_package(folder, plan):
    raw = (folder / 'post.json').read_bytes()
    if hashlib.sha256(raw).hexdigest() != plan['post_json_sha256']:
        raise ValueError('Package changed')
    post = json.loads(raw)
    for field in ('title', 'slug', 'request_id', 'category_slug'):
        if post[field] != plan[field]:
            raise ValueError('Approved identity changed')
    content = post['content']
    if sha256(content) != plan['source_content_sha256']:
        raise ValueError('Approved content changed')
    if content.count('__INLINE_IMAGE__') != 1:
        raise ValueError('Expected exactly one inline image')
    if re.search(r'<(?:html|head|body|main|h1|script|iframe|form)\b|\bon\w+\s*=|javascript:', content, re.I):
        raise ValueError('Unsafe or unadapted article HTML')
    assets = {}
    for name in ('cover.webp', 'inline.webp'):
        raw = (folder / name).read_bytes()
        if hashlib.sha256(raw).hexdigest() != plan['assets'][name]:
            raise ValueError('Approved image changed')
        if not 1000 <= len(raw) <= 2_000_000 or raw[:4] != b'RIFF' or raw[8:12] != b'WEBP':
            raise ValueError('Invalid optimized WebP')
        assets[name] = raw
    return post, assets


def materialize_job(post, urls, article_id):
    content = post['content'].replace('__INLINE_IMAGE__', urls['inline.webp'])
    if '__COVER_IMAGE__' in content or '__INLINE_IMAGE__' in content:
        raise ValueError('Unresolved asset token')
    job = dict(id=article_id, request_id=post['request_id'], slug=post['slug'],
               title=post['title'], thumbnail_url=urls['cover.webp'],
               asset_urls=list(urls.values()), content_hash=sha256(content),
               ready_for_publish=True,
               checks=dict(editorial=True, sources=True, dedup=True, images=True),
               due_at_utc=datetime.now(timezone.utc).isoformat())
    return job, content


def ensure_draft(backend, row):
    rows = backend.rows('blog_posts', {'request_id': eq(row['request_id']), 'select': '*'})
    if not rows:
        # A slug collision belongs to another article; never overwrite it.
        collision = backend.rows('blog_posts', {'slug': eq(row['slug']), 'select': 'id'})
        if collision:
            raise ValueError('Slug already owned')
        try:
            backend.insert(row)
        except (HTTPError, TimeoutError, OSError):
            # Read back after an ambiguous write. Never issue a second insert here.
            pass
        rows = backend.rows('blog_posts', {'request_id': eq(row['request_id']), 'select': '*'})
    if len(rows) != 1:
        raise ValueError('Expected exactly one draft')
    actual = rows[0]
    for field in ('id', 'request_id', 'slug', 'title', 'content', 'thumbnail_url', 'category_id'):
        if actual.get(field) != row[field]:
            raise ValueError('Existing article differs; no overwrite')
    if not ((actual['status'] == 'draft' and actual['published_at'] is None) or
            (actual['status'] == 'published' and actual['published_at'])):
        raise ValueError('Existing article not publishable')
    return actual


def ensure_asset(backend, api, path, raw):
    url = BASE + '/storage/v1/object/public/public-assets/news/lyhu-cloud-handoff/' + path
    try:
        _, _, existing = api.request(url)
    except HTTPError as error:
        if error.code not in (400, 404):
            raise
        existing = None
    if existing is None:
        try:
            backend.request('/storage/v1/object/public-assets/news/lyhu-cloud-handoff/' + path,
                            'POST', raw, 'image/webp')
        except (HTTPError, TimeoutError, OSError):
            # Verify after uncertain upload; never upsert/overwrite.
            pass
        _, _, existing = api.request(url)
    if hashlib.sha256(existing).digest() != hashlib.sha256(raw).digest():
        raise ValueError('Public asset hash mismatch')
    api.check_image(url)
    return url


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--plan', required=True)
    parser.add_argument('--package', required=True)
    args = parser.parse_args()
    plan = json.loads(Path(args.plan).read_text(encoding='utf-8'))
    check_deadline(plan)
    post, assets = load_package(Path(args.package), plan)
    backend = Backend()
    api = Http(BASE, backend.secret, SITE, ['wepxcpifgxghfvdgnkeh.supabase.co'])
    categories = backend.rows('blog_categories', {'slug': eq(post['category_slug']), 'select': 'id'})
    if len(categories) != 1:
        raise ValueError('Category missing or ambiguous')
    urls = {}
    for name, raw in assets.items():
        check_deadline(plan)
        path = plan['asset_prefix'] + '/' + name
        if not re.fullmatch(r'[a-zA-Z0-9_-]+/(cover|inline)\.webp', path):
            raise ValueError('Unapproved storage path')
        urls[name] = ensure_asset(backend, api, path, raw)
    article_id = str(uuid.uuid5(uuid.NAMESPACE_URL, post['request_id']))
    job, content = materialize_job(post, urls, article_id)
    row = dict(id=article_id, request_id=post['request_id'], slug=post['slug'],
               title=post['title'], content=content, thumbnail_url=job['thumbnail_url'],
               category_id=categories[0]['id'], status='draft', published_at=None,
               meta_title=post['title'][:65])
    validate_row(job, row)
    check_deadline(plan)
    ensure_draft(backend, row)
    check_deadline(plan)
    result = process_job(job, api, dry_run=False)
    print(json.dumps(dict(result=result, id=article_id, request_id=job['request_id'],
                          url=SITE + '/tin-tuc/' + job['slug'])))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(json.dumps({'result': 'failed', 'error_type': type(error).__name__}))
        sys.exit(1)
