import puppeteer from 'puppeteer-core';
import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { root } from '../scripts/sync-content.mjs';
import { startServer } from '../scripts/serve.mjs';

const output = resolve(root, 'qa/artifacts');
await mkdir(output, { recursive: true });
const chrome = process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome');
await access(chrome).catch(() => { throw new Error('Set CHROME_PATH to an installed Chrome binary.'); });
const server = await startServer(0);
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--disable-gpu', '--no-first-run', '--disable-background-networking'] });
const axe = await readFile(resolve(root, 'node_modules/axe-core/axe.min.js'), 'utf8');
const report = { errors: [], httpFailures: [], responsive: [], accessibility: [], interactions: [], screenshots: [] };
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function openPage(path, theme = 'dark', width = 1440, height = 1000) {
  const page = await browser.newPage();
  page.on('pageerror', error => report.errors.push(`${path}: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(`${path}: ${message.text()}`); });
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(origin)) report.httpFailures.push(`${response.status()} ${response.url()}`); });
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(origin + path, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}
async function noOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert(dimensions.scroll <= dimensions.width + 1, `${label} horizontally overflows: ${JSON.stringify(dimensions)}`);
  report.responsive.push({ label, ...dimensions });
}
async function audit(page, label) {
  await page.addScriptTag({ content: axe });
  const results = await page.evaluate(async () => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }));
  const violations = results.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }));
  report.accessibility.push({ label, violations });
}
async function screenshot(page, name, fullPage = false) {
  await page.screenshot({ path: resolve(output, name), fullPage });
  report.screenshots.push(name);
}

try {
  for (const theme of ['dark', 'light']) {
    for (const [width, height] of [[320, 800], [375, 812], [768, 1024], [1024, 768], [1440, 1000]]) {
      const page = await openPage('/', theme, width, height);
      await noOverflow(page, `home-${theme}-${width}`);
      assert.equal(await page.$eval('html', el => el.dataset.theme), theme);
      assert.equal(await page.$$eval('[data-project-tags]:not([hidden])', els => els.length), 3);
      if (width === 1440 || width === 375) {
        await audit(page, `home-${theme}-${width}`);
        await screenshot(page, `home-${width}-${theme}.png`);
        if (width === 1440 && theme === 'dark') await screenshot(page, 'home-full-dark.png', true);
      }
      await page.close();
    }
  }

  const page = await openPage('/');
  await page.click('[data-tech="Flask"]');
  assert.equal(new URL(page.url()).searchParams.get('tech'), 'Flask');
  assert.deepEqual(await page.$$eval('[data-project-tags]:not([hidden]) h3', els => els.map(el => el.textContent)), ['Integrity at every layer']);
  assert.equal(await page.$eval('[data-filter-status]', el => el.textContent), '1 case study using Flask');
  await page.click('[data-tech="PyTorch"]');
  assert.equal(await page.$$eval('[data-project-tags]:not([hidden])', els => els.length), 1);
  await page.goBack();
  await page.waitForFunction(() => document.querySelector('[data-filter-status]').textContent.includes('Flask'));
  await page.reload({ waitUntil: 'networkidle0' });
  assert.equal(await page.$eval('[data-tech="Flask"]', el => el.getAttribute('aria-pressed')), 'true');
  await page.click('[data-tech="all"]');
  assert.equal(new URL(page.url()).searchParams.has('tech'), false);
  await page.click('[data-theme-toggle]');
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  await page.reload({ waitUntil: 'networkidle0' });
  assert.equal(await page.$eval('html', el => el.dataset.theme), 'light');
  assert.equal(await page.$eval('meta[name="theme-color"]', el => el.content), '#F5F8FC');
  await page.evaluate(() => localStorage.removeItem('hk-theme'));
  report.interactions.push('Technology filters, URL state, Back, reload and theme persistence passed.');
  await page.close();

  const keyboard = await openPage('/');
  await keyboard.keyboard.press('Tab');
  assert.equal(await keyboard.evaluate(() => document.activeElement.textContent), 'Skip to content');
  await keyboard.keyboard.press('Enter');
  await keyboard.keyboard.press('Tab');
  const focus = await keyboard.evaluate(() => ({ tag: document.activeElement.tagName, outline: getComputedStyle(document.activeElement).outlineStyle }));
  assert.notEqual(focus.outline, 'none');
  await keyboard.focus('[data-tech="SQL"]');
  await keyboard.keyboard.press('Enter');
  assert.equal(await keyboard.$eval('[data-tech="SQL"]', el => el.getAttribute('aria-pressed')), 'true');
  report.interactions.push('Skip link, visible keyboard focus and Enter activation passed.');
  await keyboard.close();

  for (const theme of ['dark', 'light']) for (const id of ['iam302t', 'miniecommerce', 'aic211']) {
    const page = await openPage(`/case-studies/${id}.html`, theme, 375, 812);
    await noOverflow(page, `${id}-${theme}-375`);
    for (const section of ['summary', 'constraints', 'architecture', 'decisions', 'evaluation']) assert(await page.$(`#${section}`));
    await page.$eval('.diagram img', el => el.scrollIntoView());
    await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
    assert(!(await page.$eval('body', el => el.innerText)).includes('Điền số liệu'));
    if (id === 'aic211') assert(await page.$('.status-pending'));
    await audit(page, `${id}-${theme}-375`);
    await screenshot(page, `case-${id}-${theme}-mobile.png`);
    await page.setViewport({ width: 1440, height: 1000 });
    await noOverflow(page, `${id}-${theme}-1440`);
    await audit(page, `${id}-${theme}-1440`);
    if (id === 'iam302t' && theme === 'dark') {
      await page.evaluate(() => scrollTo(0, 0));
      await screenshot(page, 'case-iam302t-desktop.png');
    }
    await page.close();
  }

  const blocked = await browser.newPage();
  blocked.on('pageerror', error => report.errors.push(`storage fallback: ${error.message}`));
  await blocked.evaluateOnNewDocument(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } }));
  await blocked.goto(origin, { waitUntil: 'networkidle0' });
  const initial = await blocked.$eval('html', el => el.dataset.theme);
  await blocked.click('[data-theme-toggle]');
  await blocked.waitForFunction(value => document.documentElement.dataset.theme !== value, {}, initial);
  report.interactions.push('Theme works with localStorage blocked.');
  await blocked.close();

  const landscape = await openPage('/', 'dark', 812, 375);
  await noOverflow(landscape, 'home-landscape-812');
  await landscape.setViewport({ width: 375, height: 812 });
  await landscape.addStyleTag({ content: 'html{font-size:200%}' });
  await noOverflow(landscape, 'home-text-zoom-200percent');
  await landscape.close();

  const cv = await fetch(`${origin}/assets/CV_Updated.pdf`);
  assert.equal(cv.status, 200);
  assert.equal(cv.headers.get('content-type'), 'application/pdf');
  report.interactions.push('Direct PDF download returns 200 application/pdf.');
  report.passed = report.errors.length === 0 && report.httpFailures.length === 0 && report.accessibility.every(result => result.violations.length === 0);
  await writeFile(resolve(output, 'browser-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, responsiveChecks: report.responsive.length, accessibilityAudits: report.accessibility.length, consoleErrors: report.errors, httpFailures: report.httpFailures, violations: report.accessibility.filter(result => result.violations.length).map(result => ({ label: result.label, violations: result.violations })) }, null, 2));
  if (!report.passed) process.exitCode = 1;
} catch (error) {
  report.passed = false;
  report.fatal = error.stack;
  await writeFile(resolve(output, 'browser-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
