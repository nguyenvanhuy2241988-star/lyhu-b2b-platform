"""Owner-requested caption and image fitting correction, one fixed article."""
import json
import re
import sys
import hashlib
from pathlib import Path
from urllib.parse import urlencode
from datetime import datetime, timezone
from import_approved import Backend, BASE, SITE, ensure_asset, check_deadline
from publish import Http, eq, sha256

def main():
    check_deadline({'expires_at_utc': '2026-10-19T12:00:00Z'})
    backend = Backend()
    api = Http(BASE, backend.secret, SITE, ['wepxcpifgxghfvdgnkeh.supabase.co'])
    identity = {'id': eq('08153990-6605-5ff5-8329-ec7489f2b157'),
                'request_id': eq('lyhu-cloud-handoff:2026-10-19:20261019T061541Z-a72c'),
                'slug': eq('mo-thung-thay-thieu-goi-kiem-lai-roi-bao-nha-cung-cap-cho-ro'),
                'status': 'eq.published'}
    rows = backend.rows('blog_posts', {**identity, 'select': '*'})
    if len(rows) != 1:
        raise ValueError('Exact published article missing')
    row = rows[0]
    prefix = '20261019T061541Z-a72c-v2'
    hashes = {'cover.webp': '58dea8b598c35afe00a3c2589ef36aee5a19be317e43d9267232e40a9c41dfee',
              'inline.webp': '6955b8a8a0fe3827d8eae8eea7ea94f3f3042e3e6582872f063acf62c8fd864b'}
    urls = {}
    for name, digest in hashes.items():
        raw = (Path('approved/20261019-short-shipment-v2') / name).read_bytes()
        if hashlib.sha256(raw).hexdigest() != digest:
            raise ValueError('Image changed')
        urls[name] = ensure_asset(backend, api, prefix + '/' + name, raw)
    if row['thumbnail_url'] != urls['cover.webp']:
        if sha256(row['content']) != 'ea9fc921841497b273b23a49825423e6109fd36c5ac84a927e76c509435c5887':
            raise ValueError('Article changed since review')
        content = re.sub(r'^<p[^>]*>Ảnh bìa và ảnh trong bài là minh họa AI, không phải cảnh chụp thực tế LYHU\.</p>', '', row['content'])
        content = content.replace('Ảnh minh họa AI; bao bì minh họa, không phải sản phẩm thật.', 'Ảnh minh họa')
        content = content.replace('Minh họa AI:', 'Minh họa:')
        content = content.replace('/20261019T061541Z-a72c/inline.webp', '/' + prefix + '/inline.webp')
        if 'minh họa AI' in content or urls['inline.webp'] not in content:
            raise ValueError('Caption correction failed')
        filters = {**identity, 'content': eq(row['content']),
                   'thumbnail_url': eq(row['thumbnail_url']), 'updated_at': eq(row['updated_at'])}
        body = dict(content=content, thumbnail_url=urls['cover.webp'], updated_at=datetime.now(timezone.utc).isoformat())
        try:
            backend.request('/rest/v1/blog_posts?' + urlencode(filters), 'PATCH', json.dumps(body).encode('utf-8'))
        except OSError:
            pass  # Read back; never blindly repeat the write.
        after = backend.rows('blog_posts', {**identity, 'select': '*'})
        if len(after) != 1 or after[0]['content'] != content or after[0]['thumbnail_url'] != urls['cover.webp']:
            raise ValueError('Readback mismatch')
        row = after[0]
    elif urls['inline.webp'] not in row['content'] or 'minh họa AI' in row['content']:
        raise ValueError('Partial revision; manual review needed')
    api.verify_public({'slug': row['slug'], 'asset_urls': list(urls.values())}, row)
    print(json.dumps({'result': 'revised_and_verified', 'id': row['id'], 'url': SITE + '/tin-tuc/' + row['slug']}))

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(json.dumps({'result': 'failed', 'error_type': type(error).__name__,
                          'reason': str(error) if type(error) is ValueError else 'request_failed'}))
        sys.exit(1)
