"""Validate a Cloud daily handoff and stage exact drafts; never publish here.

Run from tools/lyhu-news. No AI API and no credentials in the handoff.
The Cloud writer commits public article packages only; private QA stays on Drive.
"""
import argparse
import hashlib
import json
import re
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from import_approved import Backend, BASE, SITE, ensure_asset, ensure_draft
from publish import Http, ICT, SLUG, eq, parse_time, sha256, validate_manifest, validate_row

CHECKS = ('editorial', 'sources', 'dedup', 'images')


def webp_size(raw):
    """Read dimensions from a WebP container, without a network dependency."""
    offset = 12
    while offset + 8 <= len(raw):
        kind = raw[offset:offset + 4]
        size = int.from_bytes(raw[offset + 4:offset + 8], 'little')
        payload = raw[offset + 8:offset + 8 + size]
        if len(payload) != size:
            break
        if kind == b'VP8X' and size >= 10:
            return 1 + int.from_bytes(payload[4:7], 'little'), 1 + int.from_bytes(payload[7:10], 'little')
        if kind == b'VP8 ' and size >= 10 and payload[3:6] == b'\x9d\x01\x2a':
            return int.from_bytes(payload[6:8], 'little') & 16383, int.from_bytes(payload[8:10], 'little') & 16383
        if kind == b'VP8L' and size >= 5 and payload[0] == 47:
            bits = int.from_bytes(payload[1:5], 'little')
            return (bits & 16383) + 1, ((bits >> 14) & 16383) + 1
        offset += 8 + size + (size % 2)
    raise ValueError('Unreadable WebP dimensions')


def load_day(folder, target, now):
    """Read and validate the whole day before any upload or database mutation."""
    day = datetime.strptime(target, '%Y-%m-%d').date()
    today = now.astimezone(ICT).date()
    if not today <= day <= today + timedelta(days=3):
        raise ValueError('Handoff date outside current/next three days')
    data = json.loads((folder / 'handoff.json').read_text(encoding='utf-8'))
    if set(data) != {'schema_version', 'target_date_ict', 'articles'} or data['schema_version'] != 1 or data['target_date_ict'] != target:
        raise ValueError('Unexpected handoff schema')
    articles = data['articles']
    if len(articles) != 3 or {p.get('slot') for p in articles} != {7, 13, 19}:
        raise ValueError('Expected three unique slots')
    if len({p.get('slug') for p in articles}) != 3:
        raise ValueError('Duplicate slugs')
    loaded = []
    for p in sorted(articles, key=lambda p: p['slot']):
        allowed = {'slot', 'title', 'slug', 'category_slug', 'request_id', 'content', 'content_hash', 'ready_for_publish', 'checks', 'assets'}
        if set(p) != allowed or p['ready_for_publish'] is not True or set(p['checks']) != set(CHECKS) or not all(p['checks'][c] is True for c in CHECKS):
            raise ValueError('Incomplete editorial review')
        slot = p['slot']
        if p['request_id'] != f'lyhu-news:{target}:{slot}' or not SLUG.fullmatch(p['slug']) or not SLUG.fullmatch(p['category_slug']):
            raise ValueError('Identity mismatch')
        if not isinstance(p['title'], str) or not 10 <= len(p['title']) <= 180:
            raise ValueError('Invalid title')
        content = p['content']
        if sha256(content) != p['content_hash'] or content.count('__INLINE_IMAGE__') != 1:
            raise ValueError('Content hash or inline placeholder mismatch')
        if re.search(r'<(?:html|head|body|main|h1|script|iframe|form|style)\b|\bon\w+\s*=|javascript:', content, re.I):
            raise ValueError('Unsafe HTML')
        if re.search(r'minh họa AI|do AI tạo|TODO|PLACEHOLDER|bản giữ chỗ', content, re.I):
            raise ValueError('Unfinished copy or outdated public caption')
        if not 250 <= len(re.sub('<[^>]+>', ' ', content).split()) <= 1200:
            raise ValueError('Article word count outside guard')
        assets = {}
        if set(p['assets']) != {'cover.webp', 'inline.webp'}:
            raise ValueError('Expected cover and inline')
        for name, digest in p['assets'].items():
            raw = (folder / str(slot) / name).read_bytes()
            if not re.fullmatch('[0-9a-f]{64}', digest) or hashlib.sha256(raw).hexdigest() != digest:
                raise ValueError('Asset hash mismatch')
            if not 1000 <= len(raw) <= 2_000_000 or raw[:4] != b'RIFF' or raw[8:12] != b'WEBP':
                raise ValueError('Invalid WebP')
            width, height = webp_size(raw)
            if name == 'cover.webp' and (width * 9 != height * 16 or width < 1200):
                raise ValueError('Cover must be 16:9 and at least 1200 pixels wide')
            if min(width, height) < 400:
                raise ValueError('Image too small')
            assets[name] = raw
        due = datetime(day.year, day.month, day.day, slot, tzinfo=ICT).astimezone(timezone.utc)
        loaded.append((p, assets, due))
    return loaded


def stage_day(loaded, target, backend, api):
    categories = {}
    # Preflight every identity before staging any new draft.
    for p, _, due in loaded:
        rows = backend.rows('blog_categories', {'slug': eq(p['category_slug']), 'select': 'id'})
        if len(rows) != 1:
            raise ValueError('Category absent or ambiguous')
        categories[p['slot']] = rows[0]['id']
        existing = backend.rows('blog_posts', {'request_id': eq(p['request_id']), 'select': 'id,slug,status,published_at'})
        expected_id = str(uuid.uuid5(uuid.NAMESPACE_URL, p['request_id']))
        if existing and (len(existing) != 1 or existing[0]['id'] != expected_id or existing[0]['slug'] != p['slug']):
            raise ValueError('Slot already owned by another article; no overwrite')
        if existing and not ((existing[0]['status'] == 'draft' and existing[0]['published_at'] is None) or
                             (existing[0]['status'] == 'published' and existing[0]['published_at'])):
            raise ValueError('Existing article canceled or archived')
        collisions = backend.rows('blog_posts', {'slug': eq(p['slug']), 'select': 'id'})
        if any(r['id'] != expected_id for r in collisions):
            raise ValueError('Slug collision')
        if datetime.now(timezone.utc) >= due + timedelta(minutes=60) and not existing:
            raise ValueError('Cannot stage a missed publication')
    jobs = []
    for p, assets, due in loaded:
        identity = str(uuid.uuid5(uuid.NAMESPACE_URL, p['request_id']))
        prefix = f"daily-{target}-{p['slot']}-{p['content_hash'][:12]}"
        urls = {name: ensure_asset(backend, api, prefix + '/' + name, raw) for name, raw in assets.items()}
        content = p['content'].replace('__INLINE_IMAGE__', urls['inline.webp'])
        job = dict(id=identity, request_id=p['request_id'], slot=p['slot'], slug=p['slug'],
                   title=p['title'], thumbnail_url=urls['cover.webp'], asset_urls=list(urls.values()),
                   content_hash=sha256(content), ready_for_publish=True, checks=p['checks'], due_at_utc=due.isoformat())
        row = dict(id=identity, request_id=p['request_id'], slug=p['slug'], title=p['title'],
                   content=content, thumbnail_url=urls['cover.webp'], category_id=categories[p['slot']],
                   status='draft', published_at=None, meta_title=p['title'][:65])
        validate_row(job, row)
        actual = ensure_draft(backend, row)
        validate_row(job, actual)
        jobs.append(job)
    manifest = dict(schema_version=1, target_date_ict=target, articles=jobs)
    validate_manifest(manifest, target)
    return manifest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--date', required=True)
    parser.add_argument('--inbox', default='inbox')
    parser.add_argument('--queue-dir', default='runtime-queue')
    parser.add_argument('--stage', action='store_true')
    args = parser.parse_args()
    loaded = load_day(Path(args.inbox) / args.date, args.date, datetime.now(timezone.utc))
    if not args.stage:
        print(json.dumps({'result': 'package_valid', 'date': args.date, 'articles': 3}))
        return
    backend = Backend()
    api = Http(BASE, backend.secret, SITE, ['wepxcpifgxghfvdgnkeh.supabase.co'])
    manifest = stage_day(loaded, args.date, backend, api)
    dest = Path(args.queue_dir)
    dest.mkdir(parents=True, exist_ok=True)
    (dest / (args.date + '.json')).write_text(json.dumps(manifest, ensure_ascii=False), encoding='utf-8')
    print(json.dumps({'result': 'drafts_staged_and_verified', 'date': args.date, 'articles': 3}))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(json.dumps({'result': 'handoff_failed', 'error_type': type(error).__name__}))
        sys.exit(1)
