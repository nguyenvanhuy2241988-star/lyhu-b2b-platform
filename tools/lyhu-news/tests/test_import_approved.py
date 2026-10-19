import copy
import json
import unittest
from unittest.mock import patch
from pathlib import Path
from import_approved import ensure_draft, load_package, sha256, check_deadline


class MemoryBackend:
    def __init__(self, row=None, lost=False):
        self.row = row
        self.lost = lost
        self.inserts = 0

    def rows(self, table, filters):
        return [self.row] if self.row else []

    def insert(self, row):
        self.inserts += 1
        self.row = copy.deepcopy(row)
        if self.lost:
            raise TimeoutError()


class ApprovedImportTests(unittest.TestCase):
    def fixture(self):
        return dict(id='fixed', request_id='approved:one', slug='approved-one', title='title',
                    content='content', thumbnail_url='image', category_id='category',
                    status='draft', published_at=None)

    def test_lost_insert_response_and_rerun_create_only_one_article(self):
        row = self.fixture()
        backend = MemoryBackend(lost=True)
        self.assertEqual(ensure_draft(backend, row), row)
        self.assertEqual(ensure_draft(backend, row), row)
        self.assertEqual(backend.inserts, 1)

    def test_existing_changed_or_archived_article_not_overwritten(self):
        row = self.fixture()
        for field, value in [('content', 'edited'), ('id', 'other'), ('status', 'archived')]:
            actual = {**row, field: value}
            backend = MemoryBackend(actual)
            with self.assertRaises(ValueError):
                ensure_draft(backend, row)
            self.assertEqual(backend.inserts, 0)
            self.assertEqual(backend.row, actual)

    def test_expired_plan_blocks(self):
        with self.assertRaises(ValueError):
            check_deadline({'expires_at_utc': '2000-01-01T00:00:00Z'})

    def test_changed_source_package_blocks_before_backend(self):
        with patch.object(Path, 'read_bytes', return_value=b'{}'):
            with self.assertRaises(ValueError):
                load_package(Path('approved'), {'post_json_sha256': '0' * 64})


if __name__ == '__main__':
    unittest.main()
