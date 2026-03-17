import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { marked } from 'marked';
import { BlogPost, BlogPostMeta, SeoTags } from './blog.models';
import { NG_BLOG_CONFIG } from './blog.config';

/**
 * Core service for fetching and rendering markdown blog posts.
 *
 * Provided via {@link provideNgBlogdown}. Requires `HttpClient` to be available.
 */
@Injectable()
export class BlogService {
  private http = inject(HttpClient);
  private config = inject(NG_BLOG_CONFIG);

  private indexCache = signal<BlogPostMeta[] | null>(null);

  /**
   * Fetches the blog post index. Results are cached in memory after the first call.
   *
   * @returns All blog post metadata from the configured index path.
   */
  async getPosts(): Promise<BlogPostMeta[]> {
    if (this.indexCache()) return this.indexCache()!;

    const posts = await firstValueFrom(this.http.get<BlogPostMeta[]>(this.config.indexPath));
    this.indexCache.set(posts);
    return posts;
  }

  /**
   * Fetches a single blog post by its slug, parses its markdown body into HTML,
   * and strips the YAML frontmatter.
   *
   * @param slug - The URL-friendly post identifier to look up.
   * @returns The full blog post with rendered HTML, or `null` if not found.
   */
  async getPost(slug: string): Promise<BlogPost | null> {
    const posts = await this.getPosts();
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

    const htmlContent = await marked(body);

    return { ...meta, htmlContent };
  }

  /**
   * Derives SEO meta tags from a post's metadata.
   *
   * @param postMeta - The post metadata to extract tags from.
   * @returns SEO-friendly tag values for use in `<meta>` elements.
   */
  getSeoTags(postMeta: BlogPostMeta): SeoTags {
    return {
      title: postMeta.title,
      description: postMeta.tagline,
      image: postMeta.cover,
      date: postMeta.date,
      author: postMeta.author ?? null,
    };
  }
}
