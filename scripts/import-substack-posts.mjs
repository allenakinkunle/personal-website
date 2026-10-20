import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parse } from 'csv-parse/sync';
import TurndownService from 'turndown';

const exportDirectory = process.argv[2];
const outputDirectory = process.argv[3] ?? 'src/content/writing';

if (!exportDirectory) {
  console.error('Usage: npm run import:substack -- /path/to/export [/path/to/output]');
  process.exit(1);
}

const postsCsv = join(exportDirectory, 'posts.csv');
const postsDirectory = join(exportDirectory, 'posts');

if (!existsSync(postsCsv) || !existsSync(postsDirectory)) {
  console.error('The export must contain posts.csv and a posts directory.');
  process.exit(1);
}

const turndown = new TurndownService({
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  headingStyle: 'atx',
  strongDelimiter: '**',
});

turndown.addRule('pullquote', {
  filter: (node) => node.nodeName === 'DIV' && node.classList.contains('pullquote'),
  replacement: (content) => `\n\n> ${content.trim().replace(/\n+/g, '\n> ')}\n\n`,
});

turndown.addRule('removeSubstackChrome', {
  filter: (node) => {
    if (['BUTTON', 'FIGURE', 'FORM', 'IFRAME', 'PICTURE', 'SCRIPT', 'STYLE', 'SVG'].includes(node.nodeName)) return true;
    return Boolean(node.classList) && (
      node.classList.contains('subscription-widget') ||
      node.classList.contains('twitter-embed') ||
      node.classList.contains('vimeo-wrap') ||
      node.classList.contains('soundcloud-wrap')
    );
  },
  replacement: () => '',
});

const records = parse(readFileSync(postsCsv, 'utf8'), {
  bom: true,
  columns: true,
  skip_empty_lines: true,
});

mkdirSync(outputDirectory, { recursive: true });

const plainText = (markdown) => markdown
  .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/[`*_>#~-]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const makeDescription = (markdown) => {
  const paragraphs = markdown
    .split(/\n\s*\n/)
    .map(plainText)
    .filter((paragraph) => paragraph.length > 30);
  const text = paragraphs[0] ?? 'An essay from Allen Akin’s Just The Right Fit archive.';
  if (text.length <= 180) return text;
  return `${text.slice(0, 177).replace(/\s+\S*$/, '')}...`;
};

let imported = 0;

for (const record of records) {
  if (record.is_published !== 'true') continue;

  const [postId, ...slugParts] = record.post_id.split('.');
  const slug = slugParts.join('.');
  const sourceFile = join(postsDirectory, `${record.post_id}.html`);
  const outputFile = join(outputDirectory, `${slug}.md`);

  if (!slug || !existsSync(sourceFile)) {
    console.warn(`Skipped ${record.post_id}: matching HTML was not found.`);
    continue;
  }

  if (existsSync(outputFile)) {
    console.warn(`Skipped ${basename(outputFile)}: the destination already exists.`);
    continue;
  }

  const html = readFileSync(sourceFile, 'utf8');
  const markdown = turndown.turndown(html)
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
  const tags = /book review/i.test(record.title) ? ['Life', 'Books'] : ['Life'];
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(record.title.trim())}`,
    `description: ${JSON.stringify(makeDescription(markdown))}`,
    `date: ${record.post_date.slice(0, 10)}`,
    'section: life',
    `tags: ${JSON.stringify(tags)}`,
    'draft: false',
    `substackId: ${JSON.stringify(postId)}`,
    `originalUrl: ${JSON.stringify(`https://allenakinkunle.substack.com/p/${slug}`)}`,
    '---',
    '',
  ].join('\n');

  writeFileSync(outputFile, `${frontmatter}${markdown}\n`);
  imported += 1;
}

console.log(`Imported ${imported} published Substack posts into ${outputDirectory}.`);
