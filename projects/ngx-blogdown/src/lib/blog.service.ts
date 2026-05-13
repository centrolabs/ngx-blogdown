import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Marked, Tokens } from 'marked';
import { BlogPost, BlogPostBase, SeoTags } from './blog.models';
import { NG_BLOG_CONFIG } from './blog.config';

const ABSOLUTE_URL_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#|data:)/i;

/**
 * Core service for fetching and rendering markdown blog posts.
 *
 * Provided via {@link provideNgBlogdown}. Requires `HttpClient` to be available.
 */
@Injectable()
export class BlogService {
  private http = inject(HttpClient);
  private config = inject(NG_BLOG_CONFIG);

  private indexCache = signal<BlogPostBase[] | null>(null);
  private markdown = this.buildMarkdownParser();

  /**
   * Fetches the blog post index, with localized fields merged in when the
   * configured `lang()` matches a post's `translations` entry. The raw index
   * is cached after the first call; localization is re-applied on every call.
   */
  async getPosts<T extends BlogPostBase = BlogPostBase>(): Promise<T[]> {
    const posts = await this.fetchIndex<T>();
    return posts.map((post) => this.localize(post));
  }

  /**
   * Fetches a single blog post by its slug, parses its markdown body into HTML,
   * and strips the YAML frontmatter. When the configured `lang()` matches a
   * translation, the variant's filename and frontmatter fields take precedence
   * over the base.
   *
   * @returns The full blog post with rendered HTML, or `null` if not found.
   */
  async getPost<T extends BlogPostBase = BlogPostBase>(slug: string): Promise<BlogPost<T> | null> {
    const posts = await this.fetchIndex<T>();
    const entry = posts.find((p) => p.slug === slug);
    if (!entry) return null;

    const localized = this.localize(entry);
    const raw = await firstValueFrom(
      this.http.get(`${this.config.postsDir}/${encodeURIComponent(localized.filename)}`, {
        responseType: 'text',
      }),
    );

    const separator = raw.match(/^-{3,}$/m);
    const body = separator ? raw.slice(separator.index! + separator[0].length).trim() : raw;
    const htmlContent = await this.markdown.parse(body);

    return { ...localized, htmlContent };
  }

  /**
   * Derives SEO meta tags from a post's metadata. Pass a post returned by
   * {@link getPosts} to get already-localized tags.
   */
  getSeoTags<T extends BlogPostBase>(postMeta: T): SeoTags {
    const meta = postMeta as Record<string, unknown>;
    return {
      title: postMeta.title,
      description: (meta['tagline'] as string) ?? null,
      image: (meta['cover'] as string) ?? null,
      date: (meta['date'] as string) ?? null,
      author: (meta['author'] as string) ?? null,
    };
  }

  private async fetchIndex<T extends BlogPostBase>(): Promise<T[]> {
    const cached = this.indexCache();
    if (cached) return cached as T[];

    const posts = await firstValueFrom(this.http.get<BlogPostBase[]>(this.config.indexPath));
    this.indexCache.set(posts);
    return posts as T[];
  }

  private localize<T extends BlogPostBase>(post: T): T {
    const lang = this.config.lang?.();
    if (!lang) return post;

    const variant = post.translations?.[lang];
    if (!variant) return post;

    return { ...post, ...(variant as Partial<T>) };
  }

  private buildMarkdownParser(): Marked {
    const imagesDir = this.config.imagesDir?.replace(/\/+$/, '');
    if (!imagesDir) return new Marked();

    return new Marked({
      walkTokens: (token) => {
        if (token.type !== 'image') return;
        const image = token as Tokens.Image;
        if (!image.href || ABSOLUTE_URL_RE.test(image.href)) return;
        image.href = `${imagesDir}/${image.href.replace(/^\.\//, '')}`;
      },
    });
  }
}
