"""Rebuild the exact Cloud queue in a GitHub runner, then handle this slot only."""
import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from accept_daily import load_day, stage_day
from import_approved import Backend, BASE, SITE
from publish import Http, ICT, process_job


def select_target(now):
    local = now.astimezone(ICT)
    h = local.hour
    if 7 <= h < 13:
        slot = 7
    elif 13 <= h < 19:
        slot = 13
    elif 19 <= h < 21:
        slot = 19
    elif 21 <= h <= 23:
        slot = 21
    else:
        return None
    stage_only = slot == 21
    date = (local + timedelta(days=int(stage_only))).strftime('%Y-%m-%d')
    return date, stage_only, slot

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--publish', action='store_true')
    args = parser.parse_args()
    target = select_target(datetime.now(timezone.utc))
    if target is None:
        print(json.dumps({'result': 'outside_window'}))
        return
    date, stage_only, hour = target
    loaded = load_day(Path('inbox') / date, date, datetime.now(timezone.utc))
    if not args.publish:
        print(json.dumps({'result': 'package_valid_no_writes', 'date': date}))
        return
    backend = Backend()
    api = Http(BASE, backend.secret, SITE, ['wepxcpifgxghfvdgnkeh.supabase.co'])
    manifest = stage_day(loaded, date, backend, api)
    Path('runtime-queue').mkdir(exist_ok=True)
    Path('runtime-queue', date + '.json').write_text(json.dumps(manifest), encoding='utf-8')
    if stage_only:
        print(json.dumps({'result': 'tomorrow_drafts_staged', 'date': date}))
        return
    job = next(j for j in manifest['articles'] if j['slot'] == hour)
    result = process_job(job, api, dry_run=False)
    print(json.dumps({'request_id': job['request_id'], 'result': result, 'slug': job['slug']}))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(json.dumps({'result': 'daily_failed', 'error_type': type(error).__name__}))
        sys.exit(1)
