import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execFileSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLI_PATH = join(__dirname, 'ngx-blogdown-index.mjs');

function run(args, { expectFail = false } = {}) {
  try {
    const result = execFileSync('node', [CLI_PATH, ...args], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout: result, stderr: '', exitCode: 0 };
  } catch (err) {
    if (!expectFail) throw err;
    return { stdout: err.stdout ?? '', stderr: err.stderr, exitCode: err.status };
  }
}

function runCapturingStderr(args) {
  return spawnSync('node', [CLI_PATH, ...args], { encoding: 'utf-8' });
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

  it('should omit author when not provided', () => {
    writeFileSync(
      join(postsDir, 'no-author.md'),
      `title: No Author
---
Content.`,
    );

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.equal(index[0].author, undefined);
  });

  it('should omit missing fields from output', () => {
    writeFileSync(join(postsDir, 'minimal.md'), '# Just content, no frontmatter');

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.equal(index[0].date, undefined);
    assert.equal(index[0].cover, undefined);
    assert.equal(index[0].tagline, undefined);
    assert.equal(index[0].author, undefined);
  });

  it('should parse array fields from YAML frontmatter', () => {
    writeFileSync(
      join(postsDir, 'tagged.md'),
      `title: Tagged Post
tags:
  - angular
  - typescript
---
Content.`,
    );

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.deepEqual(index[0].tags, ['angular', 'typescript']);
  });

  it('should parse inline array fields from YAML frontmatter', () => {
    writeFileSync(
      join(postsDir, 'inline-tags.md'),
      `title: Inline Tags
tags: [angular, typescript]
---
Content.`,
    );

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.deepEqual(index[0].tags, ['angular', 'typescript']);
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

  it('should compute readTime from body word count at ~200 wpm', () => {
    const words = Array(400).fill('word').join(' ');
    writeFileSync(join(postsDir, 'long.md'), `title: Long\n---\n${words}`);

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.equal(index[0].readTime, 2);
  });

  it('should preserve readTime from frontmatter when explicitly set', () => {
    writeFileSync(join(postsDir, 'fixed.md'), `title: Fixed\nreadTime: 99\n---\nshort body`);

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.equal(index[0].readTime, 99);
  });

  it('should clamp computed readTime to a minimum of 1 minute', () => {
    writeFileSync(join(postsDir, 'tiny.md'), `title: Tiny\n---\nhi`);

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.equal(index[0].readTime, 1);
  });

  it('should handle frontmatter with colons in quoted values', () => {
    writeFileSync(
      join(postsDir, 'colon.md'),
      `title: "My Post: A Subtitle"
tagline: "This is it: the one"
---
Content.`,
    );

    run(['--postsDir', postsDir, '--out', outFile]);
    const index = JSON.parse(readFileSync(outFile, 'utf-8'));

    assert.equal(index[0].title, 'My Post: A Subtitle');
    assert.equal(index[0].tagline, 'This is it: the one');
  });

  describe('language variants', () => {
    it('should group <base>.<lang>.md as a translation under the base entry', () => {
      writeFileSync(
        join(postsDir, 'Self Host 101.md'),
        `title: Self Host 101
tagline: How we run our stack
date: 2026-04-27
cover: cover.png
---
Body.`,
      );
      writeFileSync(
        join(postsDir, 'Self Host 101.de.md'),
        `title: Self Host 101 (DE)
tagline: Wie wir unseren Stack betreiben
---
Inhalt.`,
      );

      run(['--postsDir', postsDir, '--out', outFile]);
      const index = JSON.parse(readFileSync(outFile, 'utf-8'));

      assert.equal(index.length, 1);
      assert.equal(index[0].slug, 'self-host-101');
      assert.equal(index[0].filename, 'Self Host 101.md');
      assert.equal(index[0].title, 'Self Host 101');
      assert.deepEqual(index[0].translations, {
        de: {
          filename: 'Self Host 101.de.md',
          title: 'Self Host 101 (DE)',
          tagline: 'Wie wir unseren Stack betreiben',
          readTime: 1,
        },
      });
    });

    it('should support multiple language variants for the same base', () => {
      writeFileSync(join(postsDir, 'hello.md'), 'title: Hello\n---\nBody.');
      writeFileSync(join(postsDir, 'hello.de.md'), 'title: Hallo\n---\nKörper.');
      writeFileSync(join(postsDir, 'hello.fr.md'), 'title: Bonjour\n---\nCorps.');

      run(['--postsDir', postsDir, '--out', outFile]);
      const index = JSON.parse(readFileSync(outFile, 'utf-8'));

      assert.equal(index.length, 1);
      assert.deepEqual(Object.keys(index[0].translations).sort(), ['de', 'fr']);
      assert.equal(index[0].translations.de.title, 'Hallo');
      assert.equal(index[0].translations.fr.title, 'Bonjour');
    });

    it('should normalize the language code to lowercase', () => {
      writeFileSync(join(postsDir, 'hello.md'), 'title: Hello\n---\nBody.');
      writeFileSync(join(postsDir, 'hello.DE.md'), 'title: Hallo\n---\nKörper.');

      run(['--postsDir', postsDir, '--out', outFile]);
      const index = JSON.parse(readFileSync(outFile, 'utf-8'));

      assert.deepEqual(Object.keys(index[0].translations), ['de']);
    });

    it('should support region-qualified codes like pt-BR', () => {
      writeFileSync(join(postsDir, 'hello.md'), 'title: Hello\n---\nBody.');
      writeFileSync(join(postsDir, 'hello.pt-BR.md'), 'title: Olá\n---\nCorpo.');

      run(['--postsDir', postsDir, '--out', outFile]);
      const index = JSON.parse(readFileSync(outFile, 'utf-8'));

      assert.equal(index[0].translations['pt-br'].title, 'Olá');
    });

    it('should treat a variant with no base file as a standalone post and warn', () => {
      writeFileSync(join(postsDir, 'orphan.de.md'), 'title: Waise\n---\nKörper.');

      const result = runCapturingStderr(['--postsDir', postsDir, '--out', outFile]);
      assert.equal(result.status, 0);
      assert.match(result.stderr, /orphan\.de\.md/);
      assert.match(result.stderr, /no base/i);

      const index = JSON.parse(readFileSync(outFile, 'utf-8'));
      assert.equal(index.length, 1);
      assert.equal(index[0].translations, undefined);
      assert.equal(index[0].slug, 'orphan.de');
    });

    it('should not add a translations field when there are no variants', () => {
      writeFileSync(join(postsDir, 'solo.md'), 'title: Solo\n---\nBody.');

      run(['--postsDir', postsDir, '--out', outFile]);
      const index = JSON.parse(readFileSync(outFile, 'utf-8'));

      assert.equal(index.length, 1);
      assert.equal(index[0].translations, undefined);
    });

    it('should preserve arbitrary frontmatter fields in the translation entry', () => {
      writeFileSync(join(postsDir, 'p.md'), 'title: P\n---\nBody.');
      writeFileSync(
        join(postsDir, 'p.de.md'),
        `title: P (DE)
tagline: Tag
cover: alt.png
tags: [a, b]
---
Inhalt.`,
      );

      run(['--postsDir', postsDir, '--out', outFile]);
      const index = JSON.parse(readFileSync(outFile, 'utf-8'));

      assert.deepEqual(index[0].translations.de, {
        filename: 'p.de.md',
        title: 'P (DE)',
        tagline: 'Tag',
        cover: 'alt.png',
        tags: ['a', 'b'],
        readTime: 1,
      });
    });
  });
});
