const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
function load(file, imports = {}, globals = {}) {
  const result = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true
  });
  assert.equal((result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
  const exports = {};
  vm.runInNewContext(result.outputText, { exports, require: n => {
    if (!(n in imports)) throw Error(`Unexpected import ${n}`);
    return imports[n];
  }, URL, Date, Set, Map, console, process: { env: { CRON_SECRET: 'test-secret', GEMINI_API_KEY: 'test-key' } }, ...globals });
  return exports;
}
const quality = load('src/lib/newsQuality.ts');
test('exactly three daily Vietnam slots, stable identifiers and day rollover', () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    const slot = quality.getNewsSlot(new Date(`2026-10-18T${String(hour).padStart(2,'0')}:00:00Z`));
    if (slot) slots.push(slot.requestId);
  }
  assert.equal(slots.join(','), 'lyhu-news:2026-10-18:7,lyhu-news:2026-10-18:13,lyhu-news:2026-10-18:19');
  assert.equal(quality.getNewsSlot(new Date('2026-10-18T00:59:00Z')).requestId, slots[0]);
  assert.equal(quality.getNewsSlot(new Date('2026-10-17T18:00:00Z')), null);
});
test('search citations deduplicate and reject malformed or non-HTTPS links', () => {
  const sources = quality.getGroundedSources([{ web: { uri: 'https://example.com/news#one' } }, { web: { uri: 'https://example.com/news#two' } }, { web: { uri: 'javascript:alert(1)' } }, {}]);
  assert.equal(sources.length, 1);
  assert.equal(sources[0].url, 'https://example.com/news');
});
const article = '<h2>Context</h2><h2>Evidence</h2><h2>Analysis</h2><h2>Actions</h2><p>' + 'nội dung '.repeat(450) + '</p>[PEXELS_IMAGE_1][PEXELS_IMAGE_2]';
const chunks = [{ web: { uri: 'https://example.com/one', title: 'Source one' } }, { web: { uri: 'https://example.org/two', title: 'Source two' } }];
test('quality checks reject short, unfinished, unsourced or duplicate-image articles', () => {
  assert.ok(quality.newsQualityIssues('<p>short</p>', [], []).length >= 4);
  const clean = article.replace(/\[PEXELS_IMAGE_\d\]/g, '');
  assert.equal(quality.newsQualityIssues(clean, ['a','b','c'], quality.getGroundedSources(chunks)).length, 0);
  assert.ok(quality.newsQualityIssues(clean, ['a','a','b'], quality.getGroundedSources(chunks)).length);
  assert.ok(quality.newsQualityIssues(article, ['a','b','c'], quality.getGroundedSources(chunks)).length);
});
async function runRoute({ approved = true, sources = chunks, duplicate = false, authorized = true } = {}) {
  const inserted = [];
  let fetches = 0;
  const db = { from(table) {
    let row;
    const result = () => ({ data: table === 'ai_news_topics' ? [] : [], error: null });
    const q = {
      select() { return q; }, eq() { return q; }, not() { return q; },
      range: async () => result(),
      maybeSingle: async () => ({ data: duplicate ? { id: 'old' } : null, error: null }),
      single: async () => ({ data: row ? { id: 'new', ...row } : { id: 'category' }, error: null }),
      insert(value) { row = value; inserted.push(value); return q; },
      then(resolve) { return Promise.resolve(result()).then(resolve); }
    }; return q;
  } };
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : ['2026-10-18T00:00:00Z'])); } }
  const route = load('src/app/api/marketing/cron/fmcg-news/route.ts', {
    'next/server': { NextResponse: { json: (body, init = {}) => ({ body, status: init.status || 200 }) } },
    '@supabase/supabase-js': { createClient: () => db },
    '@/lib/titleSimilarity': { findMaxTitleSimilarity: () => ({ maxSim: 0 }), stripYearFromTitle: s => s },
    '@/lib/newsImageHelper': { resolveNewsImages: async () => ['a','b','c'] },
    '@/lib/newsQuality': quality,
    '@/lib/indexnow': { submitToIndexNow: async () => {}, SITE_HOST: 'example.com' }
  }, { Date: Clock, fetch: async () => {
    fetches++;
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: fetches === 1 ? article + '\n---JSON_START---\n' + JSON.stringify({ topic: 'Retail evidence', category_slug: 'tin-nganh-fmcg', image_search_queries: [] }) + '\n---JSON_END---' : JSON.stringify({ approved, score: approved ? 90 : 50, issues: approved ? [] : ['Unsupported claim'] }) }] }, groundingMetadata: { groundingChunks: sources } }] }) };
  } });
  const response = await route.GET({ headers: { get: n => n === 'authorization' && authorized ? 'Bearer test-secret' : 'vercel-cron/1.0' } });
  return { inserted, fetches, response };
}
test('passing article publishes once with a slot identifier and sources', async () => {
  const result = await runRoute();
  assert.equal(result.inserted[0].status, 'published');
  assert.equal(result.inserted[0].request_id, 'lyhu-news:2026-10-18:7');
  assert.ok(result.inserted[0].content.includes('Nguồn tham khảo'));
});
test('failed review or missing search sources saves a draft', async () => {
  for (const options of [{ approved: false }, { sources: [] }]) {
    const result = await runRoute(options);
    assert.equal(result.inserted[0].status, 'draft');
    assert.equal(result.inserted[0].published_at, null);
  }
});
test('duplicate invocation does no generation and fake cron header does not authenticate', async () => {
  const duplicate = await runRoute({ duplicate: true });
  assert.equal(duplicate.fetches, 0);
  assert.equal(duplicate.inserted.length, 0);
  const unauthorized = await runRoute({ authorized: false });
  assert.equal(unauthorized.response.status, 401);
  assert.equal(unauthorized.fetches, 0);
});
test('only three news cron invocations remain; unrelated jobs are preserved', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json')));
  const news = config.crons.filter(c => /fmcg-news|spider-news|lifestyle-news/.test(c.path));
  assert.equal(news.length, 1);
  assert.equal(news[0].schedule, '0 0,6,12 * * *');
  assert.equal(config.crons.filter(c => !news.includes(c)).length, 6);
});
