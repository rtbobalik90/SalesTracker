import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';

// v616.1 root-layout build: the application lives at the repository root
// (index.html, assets/) so it deploys under classic branch-based GitHub
// Pages AND under the Actions workflow with no settings changes.
const root = path.resolve(process.cwd());
const site = root;
const indexPath = path.join(site, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');
const failures = [];

function assert(condition, message) { if (!condition) failures.push(message); }
assert(html.includes('sales-tracker-build" content="v616'), 'Missing v616 build marker');
assert(html.includes('./assets/css/app.css'), 'Missing external stylesheet reference');
assert(html.includes('id="pg-daily"') || html.includes("id='pg-daily'"), 'Daily Sales page marker missing');
assert(html.includes('id="pg-credits"') || html.includes("id='pg-credits'"), 'Credit Memo page marker missing');
assert(html.includes('Full-State Data Vault') || html.includes('full-state'), 'Data vault marker missing');

const srcRefs = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
const cssRefs = [...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]).filter(x => x.includes('assets/css/'));
for (const ref of [...srcRefs, ...cssRefs]) {
  if (/^https?:\/\//i.test(ref)) continue;
  const target = path.resolve(site, ref.replace(/^\.\//, ''));
  assert(fs.existsSync(target), `Missing referenced asset: ${ref}`);
}

const jsRoot = path.join(site, 'assets', 'js');
const jsFiles = [];
(function walk(dir){
  for (const name of fs.readdirSync(dir)) {
    const p=path.join(dir,name); const st=fs.statSync(p);
    if (st.isDirectory()) walk(p); else if (name.endsWith('.js')) jsFiles.push(p);
  }
})(jsRoot);
for (const file of jsFiles) {
  try { execFileSync(process.execPath, ['--check', file], {stdio:'pipe'}); }
  catch (err) { failures.push(`JavaScript syntax error: ${path.relative(root,file)}\n${String(err.stderr || err.message)}`); }
}

const manifest = JSON.parse(fs.readFileSync(path.join(site,'build-manifest.json'),'utf8'));
const localScriptRefs = srcRefs.filter(ref => !/^https?:\/\//i.test(ref)).map(ref => ref.replace(/^\.\//,'').split('?')[0]);
const expectedScriptRefs = manifest.inline_scripts.map(row => row.file);
assert(JSON.stringify(localScriptRefs) === JSON.stringify(expectedScriptRefs), 'Extracted JavaScript load order does not match manifest');
for (const row of manifest.inline_scripts) {
  const bytes = fs.readFileSync(path.join(site,row.file));
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  assert(hash === row.sha256, `JavaScript hash mismatch: ${row.file}`);
}
const cssHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(site,manifest.css_file))).digest('hex');
assert(cssHash === manifest.css_sha256, 'CSS hash mismatch');

if (failures.length) {
  console.error('Validation FAILED:');
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}
console.log(`Validation passed: ${jsFiles.length} JavaScript files, ${manifest.style_blocks?.length ?? manifest.style_blocks} CSS blocks, all asset references present.`);
