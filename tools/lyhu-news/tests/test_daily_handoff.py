import copy
import hashlib
import json
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import Mock, patch

from accept_daily import load_day, stage_day
from publish import sha256
from run_daily import select_target


class DailyHandoffTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 10, 19, 7, tzinfo=timezone.utc)
        self.raw = b'RIFF' + b'\0' * 4 + b'WEBP' + b'x' * 1100
        self.content = '<p>' + 'hàng về kiểm rõ số lượng ' * 60 + '</p><img src="__INLINE_IMAGE__"><figcaption>Ảnh minh họa</figcaption>'
        self.data = dict(schema_version=1, target_date_ict='2026-10-20', articles=[dict(
            slot=s, title='Kiểm hàng rõ ràng khi nhận', slug=f'kiem-hang-{s}', category_slug='goc-kinh-doanh',
            request_id=f'lyhu-news:2026-10-20:{s}', content=self.content, content_hash=sha256(self.content),
            ready_for_publish=True, checks=dict(editorial=True, sources=True, dedup=True, images=True),
            assets={n: hashlib.sha256(self.raw).hexdigest() for n in ('cover.webp', 'inline.webp')}
        ) for s in (7, 13, 19)])

    def load(self, data=None, raw=None):
        with patch.object(Path, 'read_text', return_value=json.dumps(data or self.data)), patch.object(Path, 'read_bytes', return_value=raw or self.raw):
            return load_day(Path('inbox/2026-10-20'), '2026-10-20', self.now)

    def test_valid_day_has_exact_ict_slots(self):
        loaded = self.load()
        self.assertEqual([v[2].hour for v in loaded], [0, 6, 12])

    def test_runner_rolls_ict_date_only_at_evening_staging(self):
        self.assertEqual(select_target(datetime(2026, 10, 19, 14, 47, tzinfo=timezone.utc)), ('2026-10-20', True, 21))
        self.assertEqual(select_target(datetime(2026, 10, 19, 0, 7, tzinfo=timezone.utc)), ('2026-10-19', False, 7))
        self.assertIsNone(select_target(datetime(2026, 10, 19, 13, 0, tzinfo=timezone.utc)))

    def test_changed_asset_fails_before_network(self):
        with self.assertRaises(ValueError):
            self.load(raw=self.raw + b'changed')

    def test_unreviewed_or_modified_content_rejected(self):
        for field, value in [('ready_for_publish', False), ('content', self.content + '<p>changed</p>')]:
            data = copy.deepcopy(self.data)
            data['articles'][0][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                self.load(data)

    def test_private_extra_fields_and_duplicate_slots_rejected(self):
        for mutation in ('private', 'slot'):
            data = copy.deepcopy(self.data)
            if mutation == 'private':
                data['corpus_index'] = ['must never be public']
            else:
                data['articles'][1]['slot'] = 7
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                self.load(data)

    def test_existing_other_owner_blocks_entire_day(self):
        backend = Mock()
        backend.rows.side_effect = [[{'id': 'category'}], [{'id': 'another-owner', 'slug': 'something-else'}]]
        with self.assertRaises(ValueError), patch('accept_daily.ensure_asset') as upload, patch('accept_daily.ensure_draft') as write:
            stage_day(self.load(), '2026-10-20', backend, Mock())
        upload.assert_not_called()
        write.assert_not_called()


if __name__ == '__main__':
    unittest.main()
