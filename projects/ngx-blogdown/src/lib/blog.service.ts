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
   * Fetches the blog post index. Results are cached in memory after the first call.
   *
   * @returns All blog post metadata from the configured index path.
   */
  async getPosts<T extends BlogPostBase = BlogPostBase>(): Promise<T[]> {
    if (this.indexCache()) return this.indexCache()! as T[];

    const posts = await firstValueFrom(this.http.get<BlogPostBase[]>(this.config.indexPath));
    this.indexCache.set(posts);
    return posts as T[];
  }

  /**
   * Fetches a single blog post by its slug, parses its markdown body into HTML,
   * and strips the YAML frontmatter.
   *
   * @param slug - The URL-friendly post identifier to look up.
   * @returns The full blog post with rendered HTML, or `null` if not found.
   */
  async getPost<T extends BlogPostBase = BlogPostBase>(slug: string): Promise<BlogPost<T> | null> {
    const posts = await this.getPosts<T>();
    const meta = posts.find((p) => p.slug === slug);
    if (!meta) return null;

    const raw = await firstValueFrom(
      this.http.get(`${this.config.postsDir}/${encodeURIComponent(meta.filename)}`, {
        responseType: 'text',
      }),
    );

    const separatorMatch = raw.match(/^-{3,}$/m);
    const headerEnd = separatorMatch ? separatorMatch.index! : -1;
    const body = headerEnd !== -1 ? raw.slice(headerEnd + separatorMatch![0].length).trim() : raw;

    const htmlContent = await this.markdown.parse(body);

    return { ...meta, htmlContent };
  }

  /**
   * Derives SEO meta tags from a post's metadata.
   *
   * @param postMeta - The post metadata to extract tags from.
   * @returns SEO-friendly tag values for use in `<meta>` elements.
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
