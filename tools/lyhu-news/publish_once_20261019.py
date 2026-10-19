"""One authorized publication test, fixed article and expiring deadline."""
import os, sys
from datetime import datetime, timezone
from publish import Http, process_job

def main():
    now = datetime.now(timezone.utc)
    if now >= datetime(2026, 10, 19, 6, 0, tzinfo=timezone.utc):
        raise ValueError('One-off authorization window expired')
    base = os.environ.get('SUPABASE_URL', '').rstrip('/')
    secret = os.environ.get('SUPABASE_SECRET_KEY', '')
    if base != 'https://wepxcpifgxghfvdgnkeh.supabase.co' or not secret.startswith('sb_secret_'):
        raise ValueError('Invalid backend configuration')
    prefix = base + '/storage/v1/object/public/public-assets/news/2026-10-18/'
    job = {
        'id': 'ebed39d1-3a06-468c-a638-9a659c201d1d',
        'request_id': 'lyhu-news:2026-10-18:7',
        'slug': 'khach-cho-tra-gia-tai-quay-dung-doan',
        'title': 'Khách đứng chờ, nhân viên tìm mãi không thấy giá: sửa sao cho gọn?',
        'content_hash': '2576b44a06c22addac7bb5db236cf15232a748391168c96f999d12ece028a307',
        'thumbnail_url': prefix + 'hoan-thien-18-10-tra-gia.webp',
        'asset_urls': [prefix + 'hoan-thien-18-10-tra-gia.webp', prefix + 'hoan-thien-18-10-tra-gia-inline.webp'],
        'ready_for_publish': True,
        'checks': dict(editorial=True, sources=True, dedup=True, images=True),
        # Explicit user request to publish this completed draft NOW, not backfill a daily slot.
        'due_at_utc': now.isoformat(),
    }
    api = Http(base, secret, 'https://www.lyhu.com.vn', ['wepxcpifgxghfvdgnkeh.supabase.co'])
    print(process_job(job, api, dry_run=False))
    print('https://www.lyhu.com.vn/tin-tuc/' + job['slug'])

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('One-off publication failed: ' + type(error).__name__)
        sys.exit(1)
