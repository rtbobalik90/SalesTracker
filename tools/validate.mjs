import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';

const root = path.resolve(process.cwd());
const site = path.join(root, 'site');
const indexPath = path.join(site, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');
const failures = [];

function assert(condition, message) { if (!condition) failures.push(message); }
assert(html.includes('sales-tracker-build" content="v616-folder-build'), 'Missing v616 build marker');
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
const indexHash = crypto.createHash('sha256').update(fs.readFileSync(indexPath)).digest('hex');
assert(indexHash === manifest.generated_index_sha256, 'Index hash mismatch');
assert(jsFiles.length === manifest.inline_scripts.length, `Script count mismatch: ${jsFiles.length} files vs ${manifest.inline_scripts.length} manifest`);
assert(manifest.inline_scripts.length === 112, `Expected 112 extracted scripts, found ${manifest.inline_scripts.length}`);
assert(manifest.style_blocks.length === 169, `Expected 169 extracted style blocks, found ${manifest.style_blocks.length}`);

if (failures.length) {
  console.error(`Validation failed (${failures.length}):`);
  failures.forEach((f,i)=>console.error(`${i+1}. ${f}`));
  process.exit(1);
}
console.log(`Validation passed: ${jsFiles.length} JavaScript files, ${manifest.style_blocks.length} CSS blocks, all asset references present.`);
