#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

// Matches `<base>.<lang>.md` where lang is a 2-3 letter primary subtag with an
// optional region (`de`, `en`, `pt-BR`, `zh-CN`). A pragmatic BCP-47 subset.
const VARIANT_RE = /^(?<base>.+?)\.(?<lang>[a-z]{2,3}(?:-[a-z]{2,4})?)\.md$/i;

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

function parsePost(filename) {
  const raw = readFileSync(join(postsDir, filename), 'utf-8');
  const separator = raw.match(/^-{3,}$/m);
  const header = separator ? raw.slice(0, separator.index) : '';
  const body = separator ? raw.slice(separator.index + separator[0].length) : raw;
  const meta = header.trim() ? yaml.load(header, { schema: yaml.CORE_SCHEMA }) : {};
  return { meta, body };
}

// ~200 wpm is the standard adult silent-reading rate; clamped to 1 so any post still surfaces a printable estimate.
function computeReadTime(body) {
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200));
}

function slugify(name) {
  return name.replace(/\s+/g, '-').toLowerCase();
}

const baseFilenames = [];
const variantFiles = [];

for (const filename of files) {
  const groups = filename.match(VARIANT_RE)?.groups;
  const baseFilename = groups && `${groups.base}.md`;

  if (groups && fileSet.has(baseFilename)) {
    variantFiles.push({ baseFilename, lang: groups.lang.toLowerCase(), filename });
  } else {
    if (groups) {
      console.warn(
        `Warning: '${filename}' looks like a language variant but no base '${baseFilename}' was found — treating as a standalone post.`,
      );
    }
    baseFilenames.push(filename);
  }
}

const byFilename = new Map();
const posts = baseFilenames.map((filename) => {
  const { meta, body } = parsePost(filename);
  const post = {
    slug: slugify(filename.replace(/\.md$/, '')),
    filename,
    ...meta,
    title: meta.title || filename.replace(/\.md$/, ''),
    readTime: meta.readTime ?? computeReadTime(body),
  };
  byFilename.set(filename, post);
  return post;
});

for (const { baseFilename, lang, filename } of variantFiles) {
  const base = byFilename.get(baseFilename);
  const { meta, body } = parsePost(filename);
  base.translations ??= {};
  base.translations[lang] = {
    ...meta,
    filename,
    readTime: meta.readTime ?? computeReadTime(body),
  };
}

posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

writeFileSync(outputFile, JSON.stringify(posts, null, 2));
console.log(`Generated blog index with ${posts.length} post(s).`);
