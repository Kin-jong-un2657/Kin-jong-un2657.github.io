import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const projectInfo = [
  { id: 'iam302t', sourceNumber: 1, title: 'Looking beyond the byteplot', fullTitle: 'CNN Byteplot & Entropy for Malware Classification', course: 'IAM302t', discipline: 'Malware research', role: 'Team Lead · 4-member academic team', timeline: 'September 2026–Present', tags: ['Python', 'PyTorch', 'pefile'], repo: 'https://github.com/Kin-jong-un2657/IAM302t-Group6-Byteplot', private: true, description: 'Static PE analysis and parent-grouped experiments on how packing changes what a CNN sees.', scope: ['182 disarmed PE audit records', '10 shared test parents in the E5 pilot'], status: 'Bounded research pilot', icon: 'file' },
  { id: 'miniecommerce', sourceNumber: 3, title: 'Integrity at every layer', fullTitle: 'MiniEcommerce Secure Web & Database System', course: 'PWD301', discipline: 'Backend engineering', role: 'Database & Product Developer · team project', timeline: 'September–October 2026', tags: ['Python', 'Flask', 'SQL', 'pytest'], repo: 'https://github.com/ChauLeGiaBao/MiniEcommerce-PWD301', private: false, description: 'Database constraints, product discovery and regression checks in a Flask and SQL Server application.', scope: ['3 database integrity rules', '14 authored pytest test functions'], status: 'Implemented academic project', icon: 'database' },
  { id: 'aic211', sourceNumber: 2, title: 'Reading between the emails', fullTitle: 'Spam, Phishing & BEC Email Detection', course: 'AIC211', discipline: 'ML threat detection', role: 'Team Lead · academic project', timeline: 'May–July 2026', tags: ['Python', 'scikit-learn', 'XGBoost'], repo: 'https://github.com/Kin-jong-un2657/AIC211-Spam-BEC-Email-Detection', private: false, description: 'Grouped email-threat detection with 99.18% accuracy and macro F1, 99.52% BEC recall and 0.10% benign-to-BEC FPR.', scope: ['9,497 held-out test emails', '16 pytest tests'], status: 'Corrected grouped evaluation', pending: false, icon: 'mail' }
];

const exists = async path => access(path).then(() => true, () => false);

function publicText(body, id) {
  let result = body
    .replace(/^\[Open the rendered architecture diagram\][^\n]*\n?/gm, '')
    .replace(/The user confirmed that the test information is correct\.[\s\S]*?(?=\n\n|$)/g, '')
    .replace(/This distinction corrects the prompt’s phrase[^.]*\./g, '')
    .replace(/This distinction corrects the prompt's phrase[^.]*\./g, '')
    .replace(/\[([^\]]+)\]\(CV_Evidence\/[^)]+\)/g, '$1');
  result = result.replace(/`?\[Điền số liệu:[^\]]+\]`?/g, () => {
    if (id === 'aic211') throw new Error('AIC211 requires confirmed results; unresolved placeholder found.');
    if (id === 'iam302t') return 'PENDING_PARENT_COUNT';
    return 'PENDING_TEST_REPORT';
  });
  return result.trim();
}

export async function syncContent() {
  const source = resolve(root, '../portfolio-content.md');
  const target = resolve(root, 'content/projects.json');
  if (!(await exists(source))) {
    if (!(await exists(target))) throw new Error('Missing content/projects.json. Run npm run sync:content in the CV workspace first.');
    return;
  }
  const markdown = (await readFile(source, 'utf8')).replace(/\r\n?/g, '\n');
  if (!markdown.includes('hatrungkien2657@gmail.com')) throw new Error('Confirmed contact is missing from portfolio-content.md.');
  const starts = [...markdown.matchAll(/^## Case Study (\d+) — (.+)$/gm)];
  const projects = projectInfo.map(info => {
    const index = starts.findIndex(match => Number(match[1]) === info.sourceNumber);
    if (index < 0) throw new Error(`Missing case study ${info.sourceNumber}.`);
    const begin = starts[index].index;
    const end = starts[index + 1]?.index ?? markdown.indexOf('\n## Questions Needed', begin);
    const body = markdown.slice(begin, end > begin ? end : undefined);
    const headings = [...body.matchAll(/^### (.+)$/gm)];
    const sections = headings.map((match, i) => ({
      title: match[1],
      markdown: publicText(body.slice(match.index + match[0].length, headings[i + 1]?.index), info.id)
    })).filter(section => section.title !== 'Evidence and Demonstration');
    for (const required of ['Executive Summary', 'Problem & Security/Engineering Constraints', 'System Architecture', 'Key Engineering Decisions', 'Quantitative Evaluation / Benchmarks']) {
      if (!sections.some(section => section.title === required)) throw new Error(`Missing ${required} for ${info.id}.`);
    }
    return { ...info, sections };
  });
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify({ reviewed: '2026-11-18', projects }, null, 2) + '\n');
  const assetRoot = resolve(root, 'public/assets');
  await mkdir(resolve(assetRoot, 'diagrams'), { recursive: true });
  await copyFile(resolve(root, '../CV_Updated.pdf'), resolve(assetRoot, 'CV_Updated.pdf'));
  for (const { id } of projects) {
    await copyFile(resolve(root, `../portfolio-assets/diagrams/${id}.svg`), resolve(assetRoot, `diagrams/${id}.svg`));
  }
  console.log('Synced 3 public case studies, approved diagrams and the current CV. No private source files copied.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await syncContent();
