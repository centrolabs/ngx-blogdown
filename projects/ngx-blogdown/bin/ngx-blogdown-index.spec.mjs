import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLI_PATH = join(__dirname, 'ngx-blogdown-index.mjs');

function run(args, { expectFail = false } = {}) {
  try {
    const stdout = execFileSync('node', [CLI_PATH, ...args], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    if (!expectFail) throw err;
    return { stderr: err.stderr, exitCode: err.status };
  }
}

describe('ngx-blogdown-index CLI', () => {
  let tempDir;
  let postsDir;
  let outFile;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'blogdown-test-'));
    postsDir = join(tempDir, 'posts');
    outFile = join(tempDir, 'index.json');
    mkdirSync(postsDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should exit with error when --postsDir is missing', () => {
    const { exitCode, stderr } = run(['--out', outFile], { expectFail: true });
    assert.notEqual(exitCode, 0);
    assert.ok(stderr.includes('--postsDir'));
  });

  it('should exit with error when --out is missing', () => {
    const { exitCode, stderr } = run(['--postsDir', postsDir], { expectFail: true });
    assert.notEqual(exitCode, 0);
    assert.ok(stderr.includes('--out'));
  });

  it('should exit with error when both flags are missing', () => {
    const { exitCode, stderr } = run([], { expectFail: true });
    assert.notEqual(exitCode, 0);
    assert.ok(stderr.includes('--postsDir'));
    assert.ok(stderr.includes('--out'));
  });

  it('should generate an empty index for a directory with no markdown files', () => {
    const { stdout } = run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));
    assert.deepEqual(index, []);
    assert.ok(stdout.includes('0 post(s)'));
  });

  it('should ignore non-markdown files', () => {
    writeFileSync(join(postsDir, 'notes.txt'), 'not a post');
    writeFileSync(join(postsDir, 'image.png'), 'fake image');
    const { stdout } = run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));
    assert.deepEqual(index, []);
    assert.ok(stdout.includes('0 post(s)'));
  });

  it('should parse a single markdown file with full frontmatter', () => {
    writeFileSync(
      join(postsDir, 'Hello World.md'),
      `title: Hello World
date: 2026-01-15
cover: /img/hello.png
tagline: A greeting
author: Alice
---
# Hello

Content here.`,
    );

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.equal(index.length, 1);
    assert.equal(index[0].slug, 'hello-world');
    assert.equal(index[0].filename, 'Hello World.md');
    assert.equal(index[0].title, 'Hello World');
    assert.equal(index[0].date, '2026-01-15');
    assert.equal(index[0].cover, '/img/hello.png');
    assert.equal(index[0].tagline, 'A greeting');
    assert.equal(index[0].author, 'Alice');
  });

  it('should use filename as title when title is missing', () => {
    writeFileSync(
      join(postsDir, 'my-post.md'),
      `date: 2026-01-01
---
Content.`,
    );

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.equal(index[0].title, 'my-post');
  });

  it('should set author to null when not provided', () => {
    writeFileSync(
      join(postsDir, 'no-author.md'),
      `title: No Author
---
Content.`,
    );

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.equal(index[0].author, null);
  });

  it('should default missing fields to empty strings', () => {
    writeFileSync(join(postsDir, 'minimal.md'), '# Just content, no frontmatter');

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.equal(index[0].date, '');
    assert.equal(index[0].cover, '');
    assert.equal(index[0].tagline, '');
    assert.equal(index[0].author, null);
  });

  it('should generate slug from filename (lowercase, spaces to hyphens)', () => {
    writeFileSync(join(postsDir, 'My Great Post.md'), 'title: X\n---\nContent');

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.equal(index[0].slug, 'my-great-post');
  });

  it('should sort posts by date descending', () => {
    writeFileSync(join(postsDir, 'old.md'), 'title: Old\ndate: 2025-01-01\n---\nOld post.');
    writeFileSync(join(postsDir, 'new.md'), 'title: New\ndate: 2026-06-01\n---\nNew post.');
    writeFileSync(join(postsDir, 'mid.md'), 'title: Mid\ndate: 2025-06-01\n---\nMid post.');

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.equal(index.length, 3);
    assert.equal(index[0].title, 'New');
    assert.equal(index[1].title, 'Mid');
    assert.equal(index[2].title, 'Old');
  });

  it('should output valid JSON with 2-space indentation', () => {
    writeFileSync(join(postsDir, 'test.md'), 'title: Test\n---\nContent.');
    run(['--postsDir', postsDir, '--out', outFile]);

    const raw = readFileSync(outFile, 'utf-8');
    assert.ok(raw.includes('  "slug"'));
    JSON.parse(raw); // should not throw
  });

  it('should handle multiple posts', () => {
    for (let i = 1; i <= 5; i++) {
      writeFileSync(
        join(postsDir, `post-${i}.md`),
        `title: Post ${i}\ndate: 2026-0${i}-01\n---\nContent ${i}.`,
      );
    }

    const { stdout } = run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.equal(index.length, 5);
    assert.ok(stdout.includes('5 post(s)'));
  });

  it('should handle frontmatter with colons in values', () => {
    writeFileSync(
      join(postsDir, 'colon.md'),
      `title: My Post: A Subtitle
tagline: This is it: the one
---
Content.`,
    );

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.equal(index[0].title, 'My Post: A Subtitle');
    assert.equal(index[0].tagline, 'This is it: the one');
  });
});
