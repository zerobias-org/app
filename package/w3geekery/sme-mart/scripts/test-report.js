#!/usr/bin/env node

/**
 * Test Report Generator for SME Mart
 *
 * Runs ng test with JSON reporter and generates a self-contained HTML report
 * with drilldown, search, filtering by status and file type.
 *
 * Adapted from zerobias-com/ui scripts/test-report.js (PR #68).
 *
 * Usage:
 *   node scripts/test-report.js            # run tests + generate report
 *   node scripts/test-report.js --reuse    # regenerate from existing JSON
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const reuse = args.includes('--reuse');

const jsonFile = path.join('test-results', 'sme-mart.json');
fs.mkdirSync('test-results', { recursive: true });

const startTime = Date.now();

if (reuse && fs.existsSync(jsonFile)) {
  console.log('  Reusing existing results...');
} else {
  console.log('  Running sme-mart tests...');
  try {
    execSync(
      `npx ng test --reporters json --output-file ${jsonFile}`,
      { stdio: 'pipe', timeout: 300_000 }
    );
  } catch (e) {
    // ng test exits non-zero when tests fail — still want the JSON
  }
}

if (!fs.existsSync(jsonFile)) {
  console.error('  No test results found. Run tests first.');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
} catch {
  console.error('  Failed to parse test results JSON.');
  process.exit(1);
}

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

// --- Build tree structure for the HTML ---
function buildTree(data) {
  const projectRoot = process.cwd() + '/';
  const files = [];

  for (const suite of data.testResults) {
    const filePath = suite.name.replace(projectRoot, '');
    const fileDuration = suite.endTime - suite.startTime;
    const basename = filePath.split('/').pop();
    const typeMatch = basename.match(/\.([^.]+)\.spec\.ts$/);
    const fileType = typeMatch ? typeMatch[1] : 'other';
    const root = { name: filePath, children: Object.create(null), tests: [], fileDuration, fileType };

    for (const assertion of suite.assertionResults) {
      let node = root;
      for (const ancestor of assertion.ancestorTitles) {
        if (!node.children[ancestor]) {
          node.children[ancestor] = { name: ancestor, children: Object.create(null), tests: [] };
        }
        node = node.children[ancestor];
      }
      node.tests.push({
        title: assertion.title,
        status: assertion.status,
        duration: assertion.duration,
        failureMessages: assertion.failureMessages || [],
      });
    }

    files.push(root);
  }

  files.sort((a, b) => (a.fileType || 'other').localeCompare(b.fileType || 'other'));

  return [{
    name: 'sme-mart',
    files,
    summary: {
      total: data.numTotalTests,
      passed: data.numPassedTests,
      failed: data.numFailedTests,
      skipped: data.numPendingTests + data.numTodoTests,
      suites: data.numTotalTestSuites,
    },
  }];
}

const tree = buildTree(data);
const now = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

// Read the HTML template from zb/ui — it's a self-contained SPA with
// search, filter by status/type, expand/collapse, slowest tests panel.
// Inlined here for zero external dependencies.
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SME Mart Test Report</title>
<style>
  :root {
    --bg: #1a1a2e; --surface: #16213e; --surface2: #0f3460;
    --text: #e0e0e0; --text-dim: #888;
    --pass: #4ade80; --fail: #f87171; --skip: #fbbf24;
    --border: #2a2a4a; --accent: #818cf8; --hover: #1e2a4a;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'SF Mono','Cascadia Code','Fira Code',monospace; background: var(--bg); color: var(--text); font-size: 13px; line-height: 1.5; }
  .header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
  .header h1 { font-size: 18px; font-weight: 600; color: #fff; }
  .header .meta { color: var(--text-dim); font-size: 12px; }
  .stats { display: flex; gap: 16px; margin-left: auto; }
  .stat { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; }
  .stat .dot { width: 8px; height: 8px; border-radius: 50%; }
  .stat .dot.pass { background: var(--pass); }
  .stat .dot.fail { background: var(--fail); }
  .stat .dot.skip { background: var(--skip); }
  .toolbar { padding: 12px 24px; border-bottom: 1px solid var(--border); display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .search { flex: 1; min-width: 200px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text); font-family: inherit; font-size: 13px; outline: none; }
  .search:focus { border-color: var(--accent); }
  .search::placeholder { color: var(--text-dim); }
  .filters { display: flex; gap: 4px; }
  .filter-btn { padding: 6px 14px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text-dim); cursor: pointer; font-family: inherit; font-size: 12px; transition: all 0.15s; }
  .filter-btn:hover { border-color: var(--accent); color: var(--text); }
  .filter-btn.active { background: var(--surface2); border-color: var(--accent); color: #fff; }
  .expand-controls { display: flex; gap: 8px; }
  .expand-btn { padding: 6px 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text-dim); cursor: pointer; font-family: inherit; font-size: 12px; }
  .expand-btn:hover { border-color: var(--accent); color: var(--text); }
  .type-badge { font-size: 10px; padding: 1px 6px; border-radius: 8px; font-weight: 500; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.5px; }
  .type-component { background: rgba(129,140,248,0.15); color: #818cf8; }
  .type-service { background: rgba(74,222,128,0.15); color: #4ade80; }
  .type-pipe { background: rgba(251,191,36,0.15); color: #fbbf24; }
  .type-roundtrip { background: rgba(34,211,238,0.15); color: #22d3ee; }
  .type-other { background: rgba(136,136,136,0.15); color: #888; }
  .content { padding: 12px 24px; }
  .project { margin-bottom: 8px; }
  .project-header { padding: 10px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px; user-select: none; }
  .project-header:hover { background: var(--hover); }
  .project-header .arrow { transition: transform 0.15s; color: var(--text-dim); font-size: 11px; }
  .project-header.open .arrow { transform: rotate(90deg); }
  .project-header .name { font-weight: 600; color: #fff; font-size: 14px; }
  .project-header .badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
  .badge-pass { background: rgba(74,222,128,0.15); color: var(--pass); }
  .badge-fail { background: rgba(248,113,113,0.15); color: var(--fail); }
  .project-body { display: none; margin: 4px 0 4px 20px; }
  .project-header.open + .project-body { display: block; }
  .file { margin: 2px 0; }
  .file-header { padding: 6px 10px; cursor: pointer; display: flex; align-items: center; gap: 8px; border-radius: 4px; user-select: none; font-size: 12px; }
  .file-header:hover { background: var(--hover); }
  .file-header .arrow { font-size: 10px; transition: transform 0.15s; color: var(--text-dim); flex-shrink: 0; }
  .file-header.open .arrow { transform: rotate(90deg); }
  .file-header .file-icon { font-size: 11px; flex-shrink: 0; }
  .file-header .file-dur { font-size: 11px; font-weight: 500; min-width: 55px; text-align: right; flex-shrink: 0; }
  .file-header .path { color: var(--accent); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .file-header .file-tests { color: var(--text-dim); font-size: 11px; flex-shrink: 0; white-space: nowrap; }
  .file-body { display: none; margin-left: 18px; }
  .file-header.open + .file-body { display: block; }
  .describe { margin: 1px 0; }
  .describe-header { padding: 4px 10px; cursor: pointer; display: flex; align-items: center; gap: 8px; border-radius: 4px; user-select: none; font-size: 12px; }
  .describe-header:hover { background: var(--hover); }
  .describe-header .arrow { font-size: 10px; transition: transform 0.15s; color: var(--text-dim); }
  .describe-header.open .arrow { transform: rotate(90deg); }
  .describe-body { display: none; margin-left: 18px; }
  .describe-header.open + .describe-body { display: block; }
  .test { padding: 3px 10px 3px 18px; display: flex; align-items: center; gap: 8px; font-size: 12px; border-radius: 4px; }
  .test:hover { background: var(--hover); }
  .test .icon { font-size: 11px; flex-shrink: 0; }
  .test.passed .icon { color: var(--pass); }
  .test.failed .icon { color: var(--fail); }
  .test.skipped .icon, .test.pending .icon { color: var(--skip); }
  .test .duration { font-size: 11px; min-width: 55px; text-align: right; font-weight: 500; flex-shrink: 0; }
  .test .title { min-width: 0; }
  .failure-msg { margin: 2px 0 6px 18px; padding: 8px 12px; background: rgba(248,113,113,0.08); border-left: 3px solid var(--fail); border-radius: 0 4px 4px 0; font-size: 11px; white-space: pre-wrap; word-break: break-word; color: var(--fail); max-height: 300px; overflow-y: auto; }
  .dur-fast { color: #4ade80; } .dur-med { color: #a3e635; } .dur-slow { color: #fbbf24; } .dur-vslow { color: #fb923c; } .dur-crit { color: #f87171; }
  .no-results { text-align: center; padding: 40px; color: var(--text-dim); font-size: 14px; }
  .row-metrics { margin-left: auto; display: flex; align-items: center; gap: 12px; font-size: 11px; flex-shrink: 0; }
  .row-metrics .m-tests { color: var(--text-dim); } .row-metrics .m-pass { color: var(--pass); } .row-metrics .m-fail { color: var(--fail); } .row-metrics .m-dur { font-weight: 500; min-width: 50px; text-align: right; }
</style>
</head>
<body>
<div class="header">
  <h1>SME Mart — Test Report</h1>
  <span class="meta">${now} PT &middot; ${totalDuration}s</span>
  <div class="stats" id="stats"></div>
</div>
<div class="toolbar">
  <input type="text" class="search" id="search" placeholder="Search tests..." autocomplete="off">
  <div class="filters" id="filters"></div>
  <div class="expand-controls">
    <button class="expand-btn" onclick="expandAll()">Expand All</button>
    <button class="expand-btn" onclick="collapseAll()">Collapse All</button>
  </div>
</div>
<div class="content" id="content"></div>
<script>
const DATA = ${JSON.stringify(tree)};
let activeFilter = 'all';
let searchQuery = '';

function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function statusIcon(s) { return s === 'passed' ? '\\u2714' : s === 'failed' ? '\\u2718' : '\\u25CB'; }
function normalizeStatus(s) { return (s === 'pending' || s === 'todo') ? 'skipped' : s; }
function formatDuration(ms) { if (ms == null) return ''; if (ms < 1) return '<1ms'; if (ms < 1000) return ms.toFixed(0) + 'ms'; return (ms / 1000).toFixed(2) + 's'; }
function durClass(ms) { if (ms == null || ms < 10) return 'dur-fast'; if (ms < 50) return 'dur-med'; if (ms < 150) return 'dur-slow'; if (ms < 500) return 'dur-vslow'; return 'dur-crit'; }
function collectTests(n) { let t = [...n.tests]; for (const c of Object.values(n.children)) t = t.concat(collectTests(c)); return t; }
function sumDuration(t) { return t.reduce((s, x) => s + (x.duration || 0), 0); }
function countByStatus(t) { const c = {passed:0,failed:0,skipped:0}; for (const x of t) c[normalizeStatus(x.status)]++; return c; }
function matchesSearch(t) { return !searchQuery || t.toLowerCase().includes(searchQuery.toLowerCase()); }
function matchesFilter(s) { return activeFilter === 'all' || normalizeStatus(s) === activeFilter; }
function testVisible(t, ctx) { return matchesFilter(t.status) && matchesSearch(ctx + ' ' + t.title); }

function renderMetrics(tests, dur) {
  const c = countByStatus(tests); const d = dur != null ? dur : sumDuration(tests); const dc = durClass(d);
  let h = '<span class="row-metrics"><span class="m-tests">' + tests.length + ' tests</span>';
  if (c.passed > 0) h += '<span class="m-pass">\\u2714 ' + c.passed + '</span>';
  if (c.failed > 0) h += '<span class="m-fail">\\u2718 ' + c.failed + '</span>';
  h += '<span class="m-dur ' + dc + '">' + formatDuration(d) + '</span></span>';
  return h;
}
function renderTest(t) {
  const s = normalizeStatus(t.status); const dc = durClass(t.duration);
  let h = '<div class="test ' + s + '"><span class="icon">' + statusIcon(t.status) + '</span>';
  if (t.duration != null) h += '<span class="duration ' + dc + '">' + formatDuration(t.duration) + '</span>';
  h += '<span class="title">' + escapeHtml(t.title) + '</span></div>';
  if (t.failureMessages.length > 0) h += '<div class="failure-msg">' + escapeHtml(t.failureMessages.join('\\n')) + '</div>';
  return h;
}
function renderDescribe(n, ctx) {
  const all = collectTests(n); const vis = all.filter(t => testVisible(t, ctx + ' ' + n.name));
  if (!vis.length) return '';
  let h = '<div class="describe"><div class="describe-header" onclick="toggle(this)"><span class="arrow">\\u25B6</span><span>' + escapeHtml(n.name) + '</span>' + renderMetrics(vis, sumDuration(vis)) + '</div><div class="describe-body">';
  for (const c of Object.values(n.children)) h += renderDescribe(c, ctx + ' ' + n.name);
  for (const t of n.tests) if (testVisible(t, ctx + ' ' + n.name)) h += renderTest(t);
  return h + '</div></div>';
}
function renderFile(f, pn) {
  const all = collectTests(f); const vis = all.filter(t => testVisible(t, pn + ' ' + f.name));
  if (!vis.length) return '';
  const sp = f.name.replace(/^src\\//, ''); const fd = f.fileDuration || sumDuration(vis);
  const dc = durClass(fd); const c = countByStatus(vis);
  const fi = c.failed > 0 ? '\\u2718' : '\\u2714'; const ic = c.failed > 0 ? 'dur-crit' : 'dur-fast';
  const ft = f.fileType || 'other';
  let h = '<div class="file"><div class="file-header" onclick="toggle(this)"><span class="arrow">\\u25B6</span><span class="file-icon ' + ic + '">' + fi + '</span><span class="file-dur ' + dc + '">' + formatDuration(fd) + '</span><span class="type-badge type-' + ft + '">' + ft + '</span><span class="path" title="' + escapeHtml(sp) + '">' + escapeHtml(sp) + '</span><span class="file-tests">' + vis.length + '</span></div><div class="file-body">';
  for (const c of Object.values(f.children)) h += renderDescribe(c, pn + ' ' + f.name);
  for (const t of f.tests) if (testVisible(t, pn + ' ' + f.name)) h += renderTest(t);
  return h + '</div></div>';
}
function render() {
  const el = document.getElementById('content');
  let html = '', tp = 0, tf = 0, ts = 0;
  for (const p of DATA) {
    let ph = '', pv = 0;
    for (const f of p.files) { ph += renderFile(f, p.name); const all = collectTests(f); pv += all.filter(t => testVisible(t, p.name + ' ' + f.name)).length; }
    if (!pv) continue;
    const c = countByStatus(p.files.flatMap(f => collectTests(f)).filter(t => testVisible(t, p.name)));
    tp += c.passed; tf += c.failed; ts += c.skipped;
    const hf = c.failed > 0;
    html += '<div class="project"><div class="project-header open" onclick="toggle(this)"><span class="arrow">\\u25B6</span><span class="name">' + escapeHtml(p.name) + '</span><span class="badge ' + (hf ? 'badge-fail' : 'badge-pass') + '">' + (hf ? c.failed + ' failed' : 'all passed') + '</span><span class="row-metrics"><span class="m-tests">' + pv + ' tests</span></span></div><div class="project-body">' + ph + '</div></div>';
  }
  if (!html) html = '<div class="no-results">No tests match</div>';
  el.innerHTML = html;
  document.getElementById('stats').innerHTML = '<div class="stat"><span class="dot pass"></span>' + tp + ' passed</div><div class="stat"><span class="dot fail"></span>' + tf + ' failed</div><div class="stat"><span class="dot skip"></span>' + ts + ' skipped</div>';
  document.getElementById('filters').innerHTML = ['all','passed','failed','skipped'].map(f => '<button class="filter-btn' + (f === activeFilter ? ' active' : '') + '" onclick="setFilter(\\'' + f + '\\')">' + f.charAt(0).toUpperCase() + f.slice(1) + '</button>').join('');
}
function toggle(el) { el.classList.toggle('open'); }
function expandAll() { document.querySelectorAll('.project-header,.file-header,.describe-header').forEach(e => e.classList.add('open')); }
function collapseAll() { document.querySelectorAll('.project-header,.file-header,.describe-header').forEach(e => e.classList.remove('open')); }
function setFilter(f) { activeFilter = f; render(); }
document.getElementById('search').addEventListener('input', e => { searchQuery = e.target.value; render(); });
render();
</script>
</body>
</html>`;

const reportPath = 'test-results/report.html';
fs.writeFileSync(reportPath, html);

const totalPassed = tree.reduce((s, p) => s + p.summary.passed, 0);
const totalFailed = tree.reduce((s, p) => s + p.summary.failed, 0);
const totalTests = tree.reduce((s, p) => s + p.summary.total, 0);
const totalSuites = tree.reduce((s, p) => s + p.summary.suites, 0);

const icon = totalFailed === 0 ? '\u2714' : '\u2718';
console.log(`\n  ${icon} ${totalPassed}/${totalTests} passed, ${totalFailed} failed (${totalSuites} suites, ${totalDuration}s)`);
console.log(`  Report: ${reportPath}\n`);

if (!reuse) {
  try { require('child_process').execSync(`open ${reportPath}`, { stdio: 'ignore' }); } catch {}
}
