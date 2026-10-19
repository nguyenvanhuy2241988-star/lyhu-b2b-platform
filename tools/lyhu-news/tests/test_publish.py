import copy
import json
import unittest
from datetime import datetime, timezone
from urllib.error import URLError
from urllib.parse import urlparse, parse_qs
from publish import Http, eq, process_job, sha256, validate_manifest, ICT

BASE = 'https://wepxcpifgxghfvdgnkeh.supabase.co'
CONTENT = '<p>' + 'Nội dung đã kiểm tra. ' * 90 + '</p><img src="' + BASE + '/body.webp">'


def fixture():
    row = dict(id='11111111-1111-4111-8111-111111111111', request_id='lyhu-news:2026-10-19:13',
               slug='bai-thu', title='Bài thử, “có dấu”', content=CONTENT,
               thumbnail_url=BASE + '/cover.webp', status='draft', published_at=None,
               updated_at='2026-10-19T00:00:00+00:00')
    job = {k: row[k] for k in ('id', 'request_id', 'slug', 'title', 'thumbnail_url')}
    job.update(content_hash=sha256(CONTENT), asset_urls=[row['thumbnail_url'], BASE + '/body.webp'],
               checks=dict(editorial=True, sources=True, dedup=True, images=True), ready_for_publish=True)
    return job, row


class FakeApi:
    def __init__(self, row, lost=False, race=False):
        self.row = copy.deepcopy(row)
        self.writes = 0
        self.lost, self.race = lost, race
        self.verified = False

    def rows(self, job):
        return copy.deepcopy(self.row)

    def check_image(self, url):
        pass

    def publish(self, job, row):
        self.writes += 1
        if self.race:
            raise ValueError('Concurrent modification')
        self.row.update(status='published', published_at='2026-10-19T06:00:00Z')
        if self.lost:
            raise URLError('response lost')

    def verify_public(self, job, row):
        self.verified = True


class PublisherTests(unittest.TestCase):
    def test_dry_run_does_not_write(self):
        job, row = fixture()
        api = FakeApi(row)
        self.assertEqual(process_job(job, api), 'dry_run_ready')
        self.assertEqual(api.writes, 0)

    def test_changed_content_and_unready_block_writes(self):
        for change in ('hash', 'ready', 'placeholder', 'image'):
            with self.subTest(change=change):
                job, row = fixture()
                if change == 'hash': row['content'] += ' changed'
                if change == 'ready': job['ready_for_publish'] = False
                if change == 'placeholder':
                    row['content'] = '<p>Bản giữ chỗ</p>'
                    job['content_hash'] = sha256(row['content'])
                if change == 'image': job['asset_urls'] = []
                api = FakeApi(row)
                with self.assertRaises(ValueError): process_job(job, api, False)
                self.assertEqual(api.writes, 0)

    def test_lost_response_readback_no_duplicate_write(self):
        job, row = fixture()
        api = FakeApi(row, lost=True)
        self.assertEqual(process_job(job, api, False), 'published')
        self.assertEqual(process_job(job, api, False), 'already_published')
        self.assertEqual(api.writes, 1)
        self.assertTrue(api.verified)

    def test_race_is_not_forced(self):
        job, row = fixture()
        api = FakeApi(row, race=True)
        with self.assertRaises(ValueError): process_job(job, api, False)
        self.assertEqual(api.row['status'], 'draft')

    def test_patch_has_exact_identity_and_snapshot_filters(self):
        job, row = fixture()
        job['due_at_utc'] = datetime.now(timezone.utc).isoformat()
        api = Http(BASE, 'sb_secret_TEST_ONLY', 'https://www.lyhu.com.vn', [urlparse(BASE).hostname])
        captured = {}
        def request(url, method='GET', body=None, authenticated=False):
            captured.update(url=url, method=method, body=body, authenticated=authenticated)
            return 200, {}, json.dumps([row]).encode()
        api.request = request
        api.publish(job, row)
        filters = parse_qs(urlparse(captured['url']).query)
        for k in ('id', 'request_id', 'slug', 'title', 'updated_at', 'content', 'thumbnail_url'):
            self.assertEqual(filters[k], [eq(row[k])])
        self.assertEqual(filters['status'], ['eq.draft'])
        self.assertEqual(filters['published_at'], ['is.null'])
        self.assertEqual(set(captured['body']), {'status', 'published_at', 'updated_at'})

    def test_scalar_filters_preserve_uuid_and_html_exactly(self):
        values = ['ebed39d1-3a06-468c-a638-9a659c201d1d',
                  '2026-10-17T19:59:13.861492+00:00',
                  '<p title="a,b">x & y (z) \\ text</p>']
        for value in values:
            query = __import__('urllib.parse', fromlist=['urlencode']).urlencode({'id': eq(value)})
            self.assertEqual(parse_qs(query)['id'], ['eq.' + value])

    def test_expired_window_cannot_write(self):
        job, row = fixture()
        job['due_at_utc'] = '2000-01-01T00:00:00Z'
        api = Http(BASE, 'sb_secret_TEST_ONLY', 'https://www.lyhu.com.vn', [])
        api.request = lambda *a, **kw: self.fail('No HTTP write allowed')
        with self.assertRaises(ValueError): api.publish(job, row)

    def test_manifest_slot_validation(self):
        jobs = []
        for hour in (7, 13, 19):
            job, _ = fixture()
            job.update(id=f'{hour:08d}-1111-4111-8111-111111111111', slot=hour,
                       request_id=f'lyhu-news:2026-10-19:{hour}', due_at_utc=f'2026-10-19T{hour-7:02d}:00:00Z')
            jobs.append(job)
        m = dict(schema_version=1, target_date_ict='2026-10-19', articles=jobs)
        self.assertEqual(len(validate_manifest(m, '2026-10-19')), 3)
        m['articles'][0]['due_at_utc'] = '2026-10-19T01:00:00Z'
        with self.assertRaises(ValueError): validate_manifest(m, '2026-10-19')

    def test_reject_external_image_before_fetch(self):
        api = Http(BASE, 'sb_secret_TEST_ONLY', 'https://www.lyhu.com.vn', [urlparse(BASE).hostname])
        api.request = lambda *a, **kw: self.fail('No external fetch allowed')
        with self.assertRaises(ValueError): api.check_image('https://example.com/image.png')


if __name__ == '__main__':
    unittest.main()
