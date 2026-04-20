#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

const flags = { '--postsDir': null, '--out': null };
process.argv.forEach((val, idx, args) => {
  if (val in flags) {
    if (idx + 1 < args.length) {
      flags[val] = args[idx + 1];
    }
  }
});

let abort = false;
Object.entries(flags).forEach(([flag, value]) => {
  if (!value) {
    abort = true;
    console.error(`Please provide the ${flag} flag`);
  }
});

if (abort) process.exit(1);

const postsDir = flags['--postsDir'];
const outputFile = flags['--out'];

const files = readdirSync(postsDir).filter((f) => f.endsWith('.md'));

const posts = files.map((filename) => {
  const raw = readFileSync(join(postsDir, filename), 'utf-8');
  const separatorMatch = raw.match(/^-{3,}$/m);
  const headerEnd = separatorMatch ? separatorMatch.index : -1;
  const header = headerEnd !== -1 ? raw.slice(0, headerEnd) : '';

  const meta = header.trim() ? yaml.load(header, { schema: yaml.CORE_SCHEMA }) : {};
  const slug = filename.replace(/\.md$/, '').replace(/\s+/g, '-').toLowerCase();

  return {
    slug,
    filename,
    ...meta,
    title: meta.title || filename.replace(/\.md$/, ''),
  };
});

// Sort by date descending
posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

writeFileSync(outputFile, JSON.stringify(posts, null, 2));
console.log(`Generated blog index with ${posts.length} post(s).`);
