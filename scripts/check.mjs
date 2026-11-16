import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, extname, relative } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { root } from './sync-content.mjs';

const dist = resolve(root, 'dist');
async function filesIn(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), 'Publishing artifact must not contain symlinks.');
    const path = resolve(directory, entry.name);
    files.push(...(entry.isDirectory() ? await filesIn(path) : [path]));
  }
  return files;
}
const files = await filesIn(dist);
const htmlFiles = files.filter(file => extname(file) === '.html');
assert.equal(htmlFiles.length, 5, 'Expected home, three cases and a 404 page.');
const pages = new Map(await Promise.all(htmlFiles.map(async file => [file, await readFile(file, 'utf8')])));
let linkCount = 0;
for (const [file, html] of pages) {
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `One h1 required: ${file}`);
  assert(!/Điền số liệu|PENDING_|CV_Evidence|portfolio-source-review|\.agents[\/\\]/.test(html), `Internal/editorial content leaked into ${file}`);
  assert(!/0\.9984|99[,.]84%/.test(html), `Unverified AIC metric in ${file}`);
  assert(html.includes('Skip to content'), `Skip link missing: ${file}`);
  const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0] || '';
  for (const contact of ['https://github.com/Kin-jong-un2657', 'mailto:hatrungkien2657@gmail.com']) {
    assert(footer.includes(`href="${contact}"`), `Confirmed footer contact missing in ${file}`);
    if (file === resolve(dist, 'index.html')) {
      const hero = html.match(/<section class="shell hero"[\s\S]*?<\/section>/)?.[0] || '';
      assert(hero.includes(`href="${contact}"`), `Confirmed hero contact missing: ${contact}`);
    }
  }
  assert(!/maximum-scale|user-scalable=no|https?:\/\/[^" ]+\.(?:css|js)["']/i.test(html), 'No zoom lock or runtime CDN dependencies.');
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const target = match[1].replaceAll('&amp;', '&');
    if (/^(?:https?:|mailto:|data:)/.test(target)) continue;
    const [path, anchor] = target.split('#');
    const resolved = path ? resolve(path.startsWith('/') ? dist : dirname(file), path.startsWith('/') ? `.${path}` : path) : file;
    assert((await stat(resolved).catch(() => null))?.isFile(), `Broken asset/link ${target} in ${relative(dist, file)}`);
    if (anchor) {
      const targetHtml = pages.get(resolved) || await readFile(resolved, 'utf8');
      assert(targetHtml.includes(`id="${anchor}"`), `Missing anchor ${target}`);
    }
    linkCount += 1;
  }
}
for (const file of files) {
  const name = relative(dist, file).replaceAll('\\', '/');
  assert(!/CV_Evidence|\.agents|node_modules|source-manifest|\.py$|\.json$|\.md$|\.env/.test(name), `Unexpected publishing file: ${name}`);
}
for (const id of ['iam302t', 'aic211', 'miniecommerce']) {
  const html = await readFile(resolve(dist, `case-studies/${id}.html`), 'utf8');
  for (const section of ['summary', 'constraints', 'architecture', 'decisions', 'evaluation']) assert(html.includes(`id="${section}"`));
  assert(html.includes(`assets/diagrams/${id}.svg`));
}
const cv = await readFile(resolve(dist, 'assets/CV_Updated.pdf'));
const sourceCv = await readFile(resolve(root, '../CV_Updated.pdf')).catch(() => readFile(resolve(root, 'public/assets/CV_Updated.pdf')));
assert(cv.equals(sourceCv), 'Downloaded CV must exactly match its source.');
const css = await readFile(resolve(dist, 'assets/styles.css'), 'utf8');
assert(css.includes('prefers-reduced-motion') && css.includes('focus-visible'));
console.log(JSON.stringify({ result: 'pass', pages: htmlFiles.length, localLinksAndAssets: linkCount, publishingFiles: files.length, cvSha256: createHash('sha256').update(cv).digest('hex'), runtimeCdnDependencies: 0, privateEvidencePublished: false }, null, 2));
