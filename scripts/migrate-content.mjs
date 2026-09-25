import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const sourceDir = join(root, '_posts');
const targetDir = join(root, 'src/content/writing');
const imageSource = join(root, 'img');
const imageTarget = join(root, 'public/img');

mkdirSync(targetDir, { recursive: true });
mkdirSync(imageTarget, { recursive: true });
for (const name of readdirSync(imageSource)) copyFileSync(join(imageSource, name), join(imageTarget, name));

for (const name of readdirSync(sourceDir).filter((file) => file.endsWith('.md'))) {
  const source = readFileSync(join(sourceDir, name), 'utf8');
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Could not read frontmatter in ${name}`);
  const frontmatter = match[1];
  const value = (key) => {
    const field = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
    return field.replace(/^['"]|['"]$/g, '');
  };
  const date = name.slice(0, 10);
  const slug = basename(name, '.md').slice(11);
  const body = match[2]
    .replace(/\{%\s*highlight\s+([^\s%]+)\s*%\}/g, '```$1')
    .replace(/\s*\{%\s*endhighlight\s*%\}/g, '\n```')
    .replace(/\{:\s*target="_blank"\}/g, '')
    .replace(/<p class="math"[^>]*>\s*([\s\S]*?)\s*<\/p>/g, '\n$1\n')
    .replace(/^\s*\$\$\s*$/gm, () => '$$');
  const next = [
    '---',
    `title: ${JSON.stringify(value('title'))}`,
    `description: ${JSON.stringify(value('excerpt'))}`,
    `date: ${date}`,
    'section: math',
    `tags: ${value('tags').replaceAll("'", '"')}`,
    `heroImage: /img/${value('image_url')}`,
    'draft: false',
    '---',
    '',
    body.trim(),
    '',
  ].join('\n');
  writeFileSync(join(targetDir, `${slug}.md`), next);
}
