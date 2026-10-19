# LYHU Cloud → GitHub → website

Status: implementation prepared; Cloud delivery and scheduling still require a successful live test. Do not describe this as enabled.

The Cloud writer uses its existing subscription tools, not a paid AI API. GitHub never writes articles or generates images. Supabase credentials remain exclusively in GitHub Secrets.

## Public package

Commit all files atomically to `tools/lyhu-news/inbox/YYYY-MM-DD/`:

* `handoff.json`
* `7/cover.webp`, `7/inline.webp`
* `13/cover.webp`, `13/inline.webp`
* `19/cover.webp`, `19/inline.webp`

Only the final article copy and publication assets go to this public repository. Keep source notes, claim verification, corpus indexes, dedup candidates and the private editorial journal on Drive. The writer must read the updated LYHU Skill, original logos, current published/draft/queued corpus and previous handoff packages before choosing subjects.

`handoff.json` has exactly `schema_version: 1`, `target_date_ict: YYYY-MM-DD`, and `articles` (exactly slots 7,13,19). Each article has exactly:

```
slot: integer 7 / 13 / 19
request_id: lyhu-news:YYYY-MM-DD:7 (or :13/:19)
title: final Vietnamese title
slug: unique lowercase ASCII slug
category_slug: an existing category slug
content: safe HTML body, one __INLINE_IMAGE__ token, no h1/cover duplication
content_hash: SHA256 of content's exact UTF-8 bytes
ready_for_publish: true only after actual review
checks: {editorial:true, sources:true, dedup:true, images:true}
assets: {"cover.webp": SHA256, "inline.webp": SHA256}
```

The hashes are 64 lowercase hex characters. Public captions say only “Ảnh minh họa”. Cover is 1600×900 or another exact 16:9 size with safe logo/text margins. Inline images can have a different shape; inspect actual rendered images and retain their natural ratio. Do not mark failed or incomplete reviews true to fill slots. Publish fewer articles and report failure if needed.

## Daily operating sequence

1. Cloud prepares tomorrow's three distinct articles at 20:00 Asia/Ho_Chi_Minh. Confirm this schedule actually exists on ChatGPT web; local Codex automations do not work when the computer is off.
2. Cloud creates image blobs and commits the package atomically using GitHub connector. An ambiguous commit response requires reading the branch before another attempt. Never self-approve platform confirmation prompts.
3. `accept_daily.py --date YYYY-MM-DD` validates the entire local package without credentials or writes.
4. `accept_daily.py --date YYYY-MM-DD --stage` uploads immutable, hash-verified assets; inserts only deterministic UUID5 drafts; re-reads exact fields; builds `runtime-queue/YYYY-MM-DD.json` in the runner. It never publishes or overwrites an article.
5. `publish.py --queue-dir runtime-queue --publish` handles only the current 07/13/19 ICT slot within 60 minutes. Existing published IDs are verified, never republished. Missing/changed/canceled drafts fail closed.
6. Logs and DB/public-page readback establish success. GitHub runner queue files are disposable; regenerate from the immutable package after restart. Do not rely on a Windows manifest or local process.

## Cutover gates

Before enabling `LYHU_PUBLISHER_ENABLED`, prove the fresh Cloud runtime can create the package/commit without local help, stage three real reviewed drafts, and verify all three with publisher dry-run. Confirm previous ChatGPT/local publishing schedules are paused and Gemini skips the reserved request IDs. Do not disable unrelated video work or silently replace Gemini with unreviewed output. Enable the repository workflow only after these checks, then inspect the first scheduled publication and its public URL.

If Cloud execution, usage limits, permissions or tools block the writer, report the actual failure and leave publication gated. A successful GitHub publication test alone does not establish an unattended daily writer.
