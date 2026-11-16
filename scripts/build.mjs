import { mkdir, readFile, writeFile, readdir, cp, copyFile, rm } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Marked } from 'marked';
import { root, syncContent } from './sync-content.mjs';

await syncContent();
const { projects } = JSON.parse(await readFile(resolve(root, 'content/projects.json'), 'utf8'));
const dist = resolve(root, 'dist');
// Only this explicitly named child directory can be cleared for a clean static build.
if (dirname(dist) !== resolve(root) || basename(dist) !== 'dist') throw new Error('Invalid build directory.');
await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, 'case-studies'), { recursive: true });
await cp(resolve(root, 'public'), dist, { recursive: true });
await mkdir(resolve(dist, 'assets/fonts'), { recursive: true });
const fontDirectory = resolve(root, 'node_modules/@fontsource-variable/manrope/files');
const font = (await readdir(fontDirectory)).find(name => name === 'manrope-latin-wght-normal.woff2');
if (!font) throw new Error('Manrope Latin variable font not found.');
await copyFile(resolve(fontDirectory, font), resolve(dist, 'assets/fonts/manrope-latin.woff2'));
await copyFile(resolve(root, 'node_modules/@fontsource-variable/manrope/LICENSE'), resolve(dist, 'assets/fonts/OFL.txt'));
await copyFile(resolve(root, 'src/app.js'), resolve(dist, 'assets/app.js'));

export const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const iconPaths = {
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 18"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8m-8 4h5"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon: '<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>',
  award: '<circle cx="12" cy="8" r="5"/><path d="m8 12-2 9 6-3 6 3-2-9"/>',
  left: '<path d="m12 5-7 7 7 7m-7-7h14"/>'
};
const icon = (name, className = '') => `<svg class="icon ${className}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.file}</svg>`;
const tags = project => project.tags.map(tag => `<span class="tag" translate="no">${escape(tag)}</span>`).join('');
const badge = (text, pending = false) => `<span class="status${pending ? ' status-pending' : ''}">${escape(text)}</span>`;
const inlineTheme = `(()=>{let t;try{t=localStorage.getItem('hk-theme')}catch{}if(t!=='dark'&&t!=='light')t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;document.querySelector('meta[name="theme-color"]').content=t==='dark'?'#0B1424':'#F5F8FC'})()`;

function head(title, description, prefix = './', canonicalPath = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0B1424"><meta name="description" content="${escape(description)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="website"><meta property="og:url" content="https://kin-jong-un2657.github.io/${canonicalPath}"><link rel="canonical" href="https://kin-jong-un2657.github.io/${canonicalPath}"><title>${escape(title)}</title><script>${inlineTheme}</script><link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml"><link rel="preload" href="${prefix}assets/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="${prefix}assets/styles.css"><script src="${prefix}assets/app.js" defer></script></head><body>`;
}
function nav(prefix = './') {
  return `<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="shell nav-row"><a class="wordmark" href="${prefix}index.html" aria-label="Ha Trung Kien, home"><span class="monogram" translate="no">HK<span aria-hidden="true">.</span></span><span class="wordmark-name">Ha Trung Kien</span></a><nav class="nav-links" aria-label="Main navigation"><a href="${prefix}index.html#work">Work</a><a href="${prefix}index.html#about">About</a><a href="${prefix}index.html#contact">Contact</a></nav><button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch color theme">${icon('sun', 'sun-icon')}${icon('moon', 'moon-icon')}<span data-theme-label>Theme</span></button></div></header>`;
}
function footer(prefix = './') {
  return `<footer class="site-footer"><div class="shell footer-row"><p>Ha Trung Kien <span class="muted">/ Information Security</span></p><a href="https://github.com/Kin-jong-un2657">GitHub ${icon('arrow')}</a><a href="mailto:hatrungkien2657@gmail.com">Email ${icon('mail')}</a><a href="${prefix}assets/CV_Updated.pdf" download>Download CV ${icon('download')}</a><span class="muted">© 2026</span></div></footer></body></html>`;
}

function fileIllustration() {
  let cells = '';
  for (let row = 0; row < 13; row += 1) for (let col = 0; col < 12; col += 1) {
    const opacity = row < 2 ? 0.7 : 0.14 + ((row * 7 + col * 11) % 7) * 0.09;
    cells += `<rect x="${42 + col * 17}" y="${80 + row * 14}" width="12" height="9" rx="2" fill="currentColor" opacity="${opacity.toFixed(2)}"/>`;
  }
  return `<figure class="file-visual"><div class="file-visual-top"><span>${icon('file')} A closer look</span><span>Static analysis</span></div><svg class="file-map" viewBox="0 0 400 300" width="400" height="300" role="img" aria-labelledby="map-title map-desc"><title id="map-title">An illustrative view inside a PE file</title><desc id="map-desc">A grid represents headers, sections and overlay data. This is an illustration, not a real sample or measured result.</desc><rect x="24" y="26" width="246" height="252" rx="12" fill="none" stroke="currentColor" opacity=".25"/><path d="M24 64h246" stroke="currentColor" opacity=".25"/><text x="42" y="51" fill="currentColor" font-size="12" font-family="Manrope,sans-serif">file.exe</text><circle cx="248" cy="46" r="3" fill="currentColor" opacity=".6"/>${cells}<path d="M258 96h26m-26 98h26m-26 61h26" stroke="currentColor" opacity=".4"/><g fill="currentColor" font-size="12" font-family="Manrope,sans-serif"><text x="292" y="100">Headers</text><text x="292" y="198">Sections</text><text x="292" y="259">Overlay</text></g></svg><figcaption>Inspect the bytes. Question the assumptions.<span>Illustrative PE layout</span></figcaption></figure>`;
}
function projectGraphic(project) {
  if (project.id === 'iam302t') return `<div class="project-graphic graphic-pe" aria-hidden="true"><div class="mini-file">${icon('file')}<span>PE</span></div><div class="byte-bars">${Array.from({ length: 24 }, (_, i) => `<i style="--level:${22 + ((i * 19) % 70)}%"></i>`).join('')}</div><p>Inspect / Represent / Evaluate</p></div>`;
  if (project.id === 'miniecommerce') return `<div class="project-graphic graphic-db" aria-hidden="true"><div class="relation"><span>User</span><i></i><span>Review</span><i></i><span>Product</span></div><p>Constraints belong in the database.</p></div>`;
  return `<div class="project-graphic graphic-email" aria-hidden="true"><div>${icon('mail')}<span>Benign</span></div><div>${icon('mail')}<span>Phishing</span></div><div>${icon('mail')}<span>BEC</span></div></div>`;
}
function card(project) {
  return `<article class="project-row" data-project-tags='${escape(JSON.stringify(project.tags))}'><div class="project-copy"><div class="project-label"><span>${escape(project.discipline)}</span><span>${escape(project.course)}</span></div><h3>${escape(project.title)}</h3><p class="project-description">${escape(project.description)}</p><div class="tags flex flex-wrap gap-2">${tags(project)}</div><ul class="scope-list">${project.scope.map(value => `<li>${escape(value)}</li>`).join('')}</ul><div class="project-bottom">${badge(project.status, project.id === 'aic211')}<a class="case-link" href="./case-studies/${project.id}.html">Read case study ${icon('arrow')}</a></div></div>${projectGraphic(project)}</article>`;
}

const home = `${head('Ha Trung Kien — Information Security & OJT Portfolio', 'Information Security student at FPT University. Explore static PE analysis, ML threat detection and secure Python/Flask engineering projects.')}${nav()}<main id="main">
<section class="shell hero" aria-labelledby="hero-title"><div class="hero-copy"><p class="availability"><span aria-hidden="true"></span>Seeking an OJT placement</p><h1 id="hero-title" translate="no">Ha Trung<br>Kien<span class="name-period">.</span></h1><p class="hero-focus">Information Security.<br>Malware & threat analysis.</p><p class="hero-intro">A careful look at the file, the model and the system behind it. Academic research and Python engineering at FPT University.</p><div class="hero-actions flex flex-wrap gap-3"><a class="button button-primary" href="#work">Explore my work ${icon('arrow')}</a><a class="button button-secondary" href="./assets/CV_Updated.pdf" download>Download CV ${icon('download')}</a></div><div class="hero-contact flex flex-wrap"><a href="https://github.com/Kin-jong-un2657">${icon('code')}<span translate="no">Kin-jong-un2657</span></a><a href="mailto:hatrungkien2657@gmail.com">${icon('mail')}<span>hatrungkien2657@gmail.com</span></a></div></div><div class="hero-aside">${fileIllustration()}<div class="scholarship">${icon('award')}<div><strong>Full-tuition scholarship</strong><p>FPT University · Information Security</p><span>2025–2028 / graduation expected 2028</span></div></div></div></section>
<section class="shell work-section" id="work" aria-labelledby="work-title"><div class="section-heading"><div><p class="section-context">Selected work</p><h2 id="work-title">From file analysis<br>to system integrity.</h2></div><p>Three academic projects. The implementation, the decisions and the limits behind each result.</p></div><div class="filter-row" data-filters hidden><div class="filter-buttons flex flex-wrap gap-2" role="group" aria-label="Filter case studies by technology">${['all', 'Python', 'PyTorch', 'scikit-learn', 'Flask', 'SQL'].map((tag, i) => `<button type="button" class="filter-button" data-tech="${tag}" aria-pressed="${i === 0}">${tag === 'all' ? 'All work' : tag}</button>`).join('')}</div><p data-filter-status role="status" aria-live="polite" aria-atomic="true">3 case studies</p></div><div class="project-list">${projects.map(card).join('')}</div><div class="empty-state" data-filter-empty hidden><h3>No case studies match this technology.</h3><button type="button" class="button button-secondary" data-clear-filter>Show all work</button></div></section>
<section class="about-section" id="about" aria-labelledby="about-title"><div class="shell"><div class="section-heading"><div><p class="section-context">Focus & foundations</p><h2 id="about-title">Curiosity, backed<br>by careful engineering.</h2></div><p>My work connects static file analysis, machine-learning evaluation and the everyday integrity of a backend system.</p></div><div class="competencies grid"><article>${icon('file')}<h3>Static PE & malware analysis</h3><p>PE structure, packing observations, aligned byte representations, parent-grouped evaluation and source-bias checks.</p><div class="tags"><span class="tag">pefile</span><span class="tag">Detect It Easy</span><span class="tag">Python</span></div></article><article>${icon('shield')}<h3>ML threat detection</h3><p>Malware and phishing/BEC classification, feature engineering, model comparison and honest interpretation of evaluation limits.</p><div class="tags"><span class="tag">PyTorch</span><span class="tag">scikit-learn</span><span class="tag">XGBoost</span><span class="tag">TF-IDF</span></div></article><article>${icon('database')}<h3>Secure backend & database</h3><p>Input validation, database constraints, migrations and regression checks across Python/Flask workflows.</p><div class="tags"><span class="tag">Flask</span><span class="tag">SQL Server</span><span class="tag">SQLAlchemy</span><span class="tag">Alembic</span></div></article><article>${icon('code')}<h3>Forensics & tools</h3><p>Static file inspection, reproducible research workflows and clear technical reporting, with a focus on traceable evidence.</p><div class="tags"><span class="tag">Git / GitHub</span><span class="tag">pytest</span><span class="tag">Google Colab</span><span class="tag">pandas / NumPy</span></div></article></div><div class="education"><div>${icon('award')}<h3>FPT University</h3><p>B.Sc. in Information Security</p></div><div><strong>Full-tuition scholarship for the entire degree program</strong><p>2025–2028 / Expected graduation: 2028</p></div></div></div></section>
<section class="shell contact-section" id="contact" aria-labelledby="contact-title"><p class="section-context">OJT opportunities</p><h2 id="contact-title">Let’s look closer.</h2><p>I’m seeking an internship in Information Security, Security Engineering, or Malware & Threat Analysis in Ho Chi Minh City.</p><a class="contact-email" href="mailto:hatrungkien2657@gmail.com">hatrungkien2657@gmail.com ${icon('arrow')}</a><div class="contact-links"><a href="https://github.com/Kin-jong-un2657">Explore GitHub ${icon('code')}</a><a href="./assets/CV_Updated.pdf" download>Download CV ${icon('download')}</a></div></section></main>${footer()}`;
await writeFile(resolve(dist, 'index.html'), home);

const sectionIds = { 'Executive Summary': 'summary', 'Problem & Security/Engineering Constraints': 'constraints', 'System Architecture': 'architecture', 'Key Engineering Decisions': 'decisions', 'Quantitative Evaluation / Benchmarks': 'evaluation', 'Required Corrections — Not Yet Implemented': 'corrections', 'Product Discovery: Capabilities and Routes': 'discovery' };
const sectionLabels = { summary: 'Executive summary', constraints: 'Security & engineering constraints', architecture: 'System architecture', decisions: 'Key engineering decisions', evaluation: 'Evaluation & evidence', corrections: 'Corrections still to make', discovery: 'Product discovery' };

function renderMarkdown(markdown, project, sectionId) {
  let tableNumber = 0;
  const renderer = {
    link({ href, tokens, text }) {
      const body = tokens ? this.parser.parseInline(tokens) : escape(text);
      if (!/^https:\/\//.test(href || '') && !/^mailto:/.test(href || '')) return body;
      return `<a href="${escape(href)}">${body}</a>`;
    },
    code({ lang, text }) {
      if (lang === 'mermaid') return `<figure class="diagram"><img src="../assets/diagrams/${project.id}.svg" width="${project.id === 'iam302t' ? 552 : 360}" height="${project.id === 'iam302t' ? 696 : project.id === 'aic211' ? 976 : 769}" alt="${escape(project.fullTitle)} architecture: see the explanation below for data flow and boundaries." loading="lazy"><figcaption><a href="../assets/diagrams/${project.id}.svg" target="_blank" rel="noopener">Open full-size architecture ${icon('arrow')}<span class="sr-only"> (opens in a new tab)</span></a></figcaption></figure>`;
      return `<pre><code>${escape(text)}</code></pre>`;
    },
    html({ text }) { return escape(text); },
    table(token) {
      const cell = (value, tag = 'td') => `<${tag}>${this.parser.parseInline(value.tokens)}</${tag}>`;
      return `<div class="table-wrap" tabindex="0" role="region" aria-label="${escape(sectionLabels[sectionId])} data table ${++tableNumber}"><table><thead><tr>${token.header.map(value => cell(value, 'th')).join('')}</tr></thead><tbody>${token.rows.map(row => `<tr>${row.map(value => cell(value)).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
  };
  const parser = new Marked({ gfm: true, renderer });
  return parser.parse(markdown)
    .replaceAll('PENDING_EMAIL_METRIC', badge('Metric re-evaluation pending', true))
    .replaceAll('PENDING_PARENT_COUNT', badge('Unique-parent count not verified', true))
    .replaceAll('PENDING_TEST_REPORT', badge('Run report not supplied', true));
}

for (const [index, project] of projects.entries()) {
  const toc = project.sections.map(section => `<a href="#${sectionIds[section.title]}">${sectionLabels[sectionIds[section.title]]}</a>`).join('');
  const body = project.sections.map(section => `<section class="prose-section" id="${sectionIds[section.title]}" aria-labelledby="title-${sectionIds[section.title]}"><h2 id="title-${sectionIds[section.title]}">${sectionLabels[sectionIds[section.title]]}</h2><div class="prose">${renderMarkdown(section.markdown, project, sectionIds[section.title])}</div></section>`).join('');
  const next = projects[(index + 1) % projects.length];
  const html = `${head(`${project.fullTitle} — Ha Trung Kien`, project.description, '../', `case-studies/${project.id}.html`)}${nav('../')}<main id="main"><div class="shell case-header"><a class="back-link" href="../index.html#work">${icon('left')} All case studies</a><p class="section-context">${escape(project.discipline)} / ${escape(project.course)}</p><h1>${escape(project.fullTitle)}</h1><p class="case-lead">${escape(project.description)}</p><div class="case-meta"><span>${escape(project.role)}</span><span>${escape(project.timeline)}</span></div><div class="tags flex flex-wrap gap-2">${tags(project)}</div><div class="case-status">${badge(project.status, project.id === 'aic211')}${project.private ? '<span class="access-note">Private repository; access required.</span>' : `<a href="${project.repo}">View ${project.id === 'miniecommerce' ? 'team ' : ''}repository ${icon('code')}</a>`}</div></div><div class="shell reading-layout"><aside class="case-toc"><nav aria-label="Case study contents"><p>In this case study</p>${toc}</nav></aside><article class="reading-content" aria-label="Technical case study">${body}<div class="next-case"><p>Continue exploring</p><a href="./${next.id}.html">${escape(next.title)} ${icon('arrow')}</a><a class="back-link" href="../index.html#contact">Contact Ha Trung Kien ${icon('mail')}</a></div></article></div></main>${footer('../')}`;
  await writeFile(resolve(dist, `case-studies/${project.id}.html`), html);
}

await writeFile(resolve(dist, '404.html'), `${head('Page not found — Ha Trung Kien', 'Return to the portfolio and explore the case studies.', '/')} ${nav('/')}<main class="shell error-page" id="main"><p class="section-context">Page not found</p><h1>Let’s get you<br>back to the work.</h1><p>This page isn’t here. The portfolio and case studies are a good place to start.</p><a class="button button-primary" href="/index.html">Back to the portfolio</a></main>${footer('/')}`);
await writeFile(resolve(dist, '.nojekyll'), '');
await writeFile(resolve(dist, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://kin-jong-un2657.github.io/sitemap.xml\n');
await writeFile(resolve(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://kin-jong-un2657.github.io/</loc></url>${projects.map(project => `<url><loc>https://kin-jong-un2657.github.io/case-studies/${project.id}.html</loc></url>`).join('')}</urlset>`);
const css = spawnSync(process.execPath, [resolve(root, 'node_modules/@tailwindcss/cli/dist/index.mjs'), '-i', 'src/styles.css', '-o', 'dist/assets/styles.css', '--minify'], { cwd: root, stdio: 'inherit' });
if (css.status !== 0) throw new Error('CSS compilation failed.');
console.log('Built a self-contained static portfolio in dist/: home, 3 case studies, 404, local assets and CV.');
