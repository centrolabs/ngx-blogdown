#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

const VARIANT_RE = /^(.+?)\.([a-z]{2,3}(?:-[a-z]{2,4})?)\.md$/i;

const flags = { '--postsDir': null, '--out': null };
process.argv.forEach((val, idx, args) => {
  if (val in flags && idx + 1 < args.length) flags[val] = args[idx + 1];
});

const missing = Object.entries(flags)
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  missing.forEach((flag) => console.error(`Please provide the ${flag} flag`));
  process.exit(1);
}

const postsDir = flags['--postsDir'];
const outputFile = flags['--out'];

const files = readdirSync(postsDir).filter((f) => f.endsWith('.md'));
const fileSet = new Set(files);

function parseFrontmatter(filename) {
  const raw = readFileSync(join(postsDir, filename), 'utf-8');
  const separator = raw.match(/^-{3,}$/m);
  const header = separator ? raw.slice(0, separator.index) : '';
  return header.trim() ? yaml.load(header, { schema: yaml.CORE_SCHEMA }) : {};
}

function slugify(name) {
  return name.replace(/\s+/g, '-').toLowerCase();
}

const baseFilenames = [];
const variantFiles = [];

for (const filename of files) {
  const match = filename.match(VARIANT_RE);
  if (match && fileSet.has(`${match[1]}.md`)) {
    variantFiles.push({ baseFilename: `${match[1]}.md`, lang: match[2].toLowerCase(), filename });
  } else {
    if (match) {
      console.warn(
        `Warning: '${filename}' looks like a language variant but no base '${match[1]}.md' was found — treating as a standalone post.`,
      );
    }
    baseFilenames.push(filename);
  }
}

const byFilename = new Map();
const posts = baseFilenames.map((filename) => {
  const meta = parseFrontmatter(filename);
  const post = {
    slug: slugify(filename.replace(/\.md$/, '')),
    filename,
    ...meta,
    title: meta.title || filename.replace(/\.md$/, ''),
  };
  byFilename.set(filename, post);
  return post;
});

for (const { baseFilename, lang, filename } of variantFiles) {
  const base = byFilename.get(baseFilename);
  const meta = parseFrontmatter(filename);
  base.translations ??= {};
  base.translations[lang] = { ...meta, filename };
}

posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

writeFileSync(outputFile, JSON.stringify(posts, null, 2));
console.log(`Generated blog index with ${posts.length} post(s).`);
