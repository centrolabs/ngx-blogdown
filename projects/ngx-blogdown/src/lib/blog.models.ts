/** Base metadata fields guaranteed by the library for every blog post. */
export interface BlogPostBase {
  /** URL-friendly identifier derived from the filename. */
  slug: string;
  /** Original markdown filename including extension. */
  filename: string;
  /** Display title of the post. */
  title: string;
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
