/** Base metadata fields guaranteed by the library for every blog post. */
export interface BlogPostBase {
  /** URL-friendly identifier derived from the filename of the base post. */
  slug: string;
  /** Markdown filename of the base (default-language) post. */
  filename: string;
  /** Display title of the post. */
  title: string;
  /** Author name; sourced from frontmatter `author:`. Allowed `null` so consumers can model "intentionally unknown" distinctly from "field missing". */
  author?: string | null;
  /** Estimated reading time in whole minutes; sourced from frontmatter `readTime:` or auto-computed by the CLI from the body at ~200 wpm (minimum 1). */
  readTime?: number;
  /**
   * Language variants of this post, keyed by lowercase language code (e.g. `'de'`).
   * Populated by the `ngx-blogdown-index` CLI when sibling `<base>.<lang>.md`
   * files are present in the posts directory.
   */
  translations?: Record<string, BlogPostTranslation>;
}

/**
 * A localized version of a post. Carries the variant's filename plus any
 * frontmatter fields that override the base post when this language is active.
 */
export interface BlogPostTranslation {
  /** Markdown filename of the language variant (e.g. `My Post.de.md`). */
  filename: string;
  /** Frontmatter overrides; shape mirrors the post type the consumer declares. */
  [field: string]: unknown;
}

/** A full blog post including its rendered HTML content. */
export type BlogPost<T extends BlogPostBase = BlogPostBase> = T & {
  /** The post body rendered from markdown to HTML. */
  htmlContent: string;
};

/** Configuration for the ngx-blogdown library. */
export interface NgBlogConfig {
  /** Path to the JSON index file containing all post metadata. */
  indexPath: string;
  /** Directory path where markdown post files are served from. */
  postsDir: string;
  /**
   * Optional base URL prepended to relative image references inside post markdown
   * (e.g. `![alt](foo.png)` → `<imagesDir>/foo.png`). Absolute URLs (`http://`,
   * `https://`, `//`, `data:`) and rooted paths (`/foo.png`) are left unchanged.
   */
  imagesDir?: string;
  /**
   * Active language code, returned by a getter so callers can wire it to a
   * signal or other reactive source. When set and a post has a matching entry
   * in its `translations` map, the localized filename and frontmatter fields
   * are used by `getPosts()` and `getPost()`. Returning a falsy value falls
   * back to the base post.
   */
  lang?: () => string | null | undefined;
}

/** SEO meta tag values extracted from a blog post. */
export interface SeoTags {
  /** Page title. */
  title: string | null;
  /** Meta description, derived from the post's tagline. */
  description: string | null;
  /** Open Graph image URL, derived from the post's cover. */
  image: string | null;
  /** Publication date. */
  date: string | null;
  /** Author name. */
  author: string | null;
}
