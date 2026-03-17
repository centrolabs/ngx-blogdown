#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

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

  const meta = {};
  for (const line of header.trim().split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      meta[key] = value;
    }
  }

  const slug = filename.replace(/\.md$/, '').replace(/\s+/g, '-').toLowerCase();

  return {
    slug,
    filename,
    title: meta.title || filename.replace(/\.md$/, ''),
    date: meta.date || '',
    cover: meta.cover || '',
    tagline: meta.tagline || '',
    author: meta.author || null,
  };
});

// Sort by date descending
posts.sort((a, b) => b.date.localeCompare(a.date));

writeFileSync(outputFile, JSON.stringify(posts, null, 2));
console.log(`Generated blog index with ${posts.length} post(s).`);
