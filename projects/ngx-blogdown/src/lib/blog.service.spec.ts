import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BlogService } from './blog.service';
import { BlogPostMeta } from './blog.models';
import { provideNgBlogdown } from './blog.config';

const TEST_CONFIG = { indexPath: '/assets/blog/index.json', postsDir: '/assets/blog/posts' };

const MOCK_POSTS: BlogPostMeta[] = [
  {
    slug: 'hello-world',
    filename: 'Hello World.md',
    title: 'Hello World',
    date: '2026-01-15',
    cover: '/covers/hello.png',
    tagline: 'A first post',
    author: 'Alice',
  },
  {
    slug: 'second-post',
    filename: 'second-post.md',
    title: 'Second Post',
    date: '2026-02-10',
    cover: '/covers/second.png',
    tagline: 'Another post',
    author: null,
  },
];

const MOCK_MARKDOWN = `title: Hello World
date: 2026-01-15
cover: /covers/hello.png
tagline: A first post
author: Alice
---
# Hello

This is **bold** text.`;

const FILE_URL = `${TEST_CONFIG.postsDir}/${encodeURIComponent('Hello World.md')}`;

/** Wait for all pending microtasks to drain (needed for firstValueFrom promise chains). */
function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

describe('BlogService', () => {
  let service: BlogService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNgBlogdown(TEST_CONFIG),
      ],
    });
    service = TestBed.inject(BlogService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getPosts', () => {
    it('should fetch posts from the configured index path', async () => {
      const promise = service.getPosts();
      httpTesting.expectOne(TEST_CONFIG.indexPath).flush(MOCK_POSTS);
      const posts = await promise;
      expect(posts).toEqual(MOCK_POSTS);
    });

    it('should cache posts after the first fetch', async () => {
      const first = service.getPosts();
      httpTesting.expectOne(TEST_CONFIG.indexPath).flush(MOCK_POSTS);
      await first;

      const second = await service.getPosts();
      httpTesting.expectNone(TEST_CONFIG.indexPath);
      expect(second).toEqual(MOCK_POSTS);
    });

    it('should return the same data on subsequent calls', async () => {
      const first = service.getPosts();
      httpTesting.expectOne(TEST_CONFIG.indexPath).flush(MOCK_POSTS);
      const result1 = await first;
      const result2 = await service.getPosts();
      expect(result1).toBe(result2);
    });
  });

  describe('getPost', () => {
    it('should fetch and parse a markdown post by slug', async () => {
      const promise = service.getPost('hello-world');

      httpTesting.expectOne(TEST_CONFIG.indexPath).flush(MOCK_POSTS);
      await tick();

      httpTesting.expectOne(FILE_URL).flush(MOCK_MARKDOWN);

      const post = await promise;
      expect(post).toBeTruthy();
      expect(post!.slug).toBe('hello-world');
      expect(post!.title).toBe('Hello World');
      expect(post!.htmlContent).toContain('<h1>Hello</h1>');
      expect(post!.htmlContent).toContain('<strong>bold</strong>');
    });

    it('should return null for a non-existent slug', async () => {
      const promise = service.getPost('non-existent');
      httpTesting.expectOne(TEST_CONFIG.indexPath).flush(MOCK_POSTS);

      const post = await promise;
      expect(post).toBeNull();
    });

    it('should strip frontmatter and only render the body', async () => {
      const promise = service.getPost('hello-world');
      httpTesting.expectOne(TEST_CONFIG.indexPath).flush(MOCK_POSTS);
      await tick();

      httpTesting.expectOne(FILE_URL).flush(MOCK_MARKDOWN);

      const post = await promise;
      expect(post!.htmlContent).not.toContain('tagline');
      expect(post!.htmlContent).not.toContain('---');
    });

    it('should handle markdown without frontmatter', async () => {
      const noFrontmatter = '# Just a heading\n\nSome paragraph.';
      const promise = service.getPost('hello-world');
      httpTesting.expectOne(TEST_CONFIG.indexPath).flush(MOCK_POSTS);
      await tick();

      httpTesting.expectOne(FILE_URL).flush(noFrontmatter);

      const post = await promise;
      expect(post!.htmlContent).toContain('<h1>Just a heading</h1>');
      expect(post!.htmlContent).toContain('<p>Some paragraph.</p>');
    });

    it('should URL-encode the filename', async () => {
      const promise = service.getPost('hello-world');
      httpTesting.expectOne(TEST_CONFIG.indexPath).flush(MOCK_POSTS);
      await tick();

      const req = httpTesting.expectOne(FILE_URL);
      expect(req.request.responseType).toBe('text');
      req.flush(MOCK_MARKDOWN);

      await promise;
    });

    it('should use cached index on subsequent getPost calls', async () => {
      const first = service.getPost('hello-world');
      httpTesting.expectOne(TEST_CONFIG.indexPath).flush(MOCK_POSTS);
      await tick();

      httpTesting.expectOne(FILE_URL).flush(MOCK_MARKDOWN);
      await first;

      const second = service.getPost('second-post');
      await tick();

      httpTesting.expectNone(TEST_CONFIG.indexPath);
      httpTesting
        .expectOne(`${TEST_CONFIG.postsDir}/${encodeURIComponent('second-post.md')}`)
        .flush('# Second\n\nContent.');
      const post = await second;
      expect(post!.slug).toBe('second-post');
    });
  });

  describe('getSeoTags', () => {
    it('should map post meta to SEO tags', () => {
      const tags = service.getSeoTags(MOCK_POSTS[0]);
      expect(tags).toEqual({
        title: 'Hello World',
        description: 'A first post',
        image: '/covers/hello.png',
        date: '2026-01-15',
        author: 'Alice',
      });
    });

    it('should return null author when post has no author', () => {
      const tags = service.getSeoTags(MOCK_POSTS[1]);
      expect(tags.author).toBeNull();
    });

    it('should map tagline to description', () => {
      const tags = service.getSeoTags(MOCK_POSTS[0]);
      expect(tags.description).toBe(MOCK_POSTS[0].tagline);
    });

    it('should map cover to image', () => {
      const tags = service.getSeoTags(MOCK_POSTS[0]);
      expect(tags.image).toBe(MOCK_POSTS[0].cover);
    });
  });
});
