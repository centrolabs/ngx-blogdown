/** Metadata for a blog post, as stored in the index JSON file. */
export interface BlogPostMeta {
  /** URL-friendly identifier derived from the filename. */
  slug: string | null;
  /** Original markdown filename including extension. */
  filename: string | null;
  /** Display title of the post. */
  title: string | null;
  /** Publication date as an ISO date string (e.g. `"2026-01-15"`). */
  date: string | null;
  /** URL or path to the post's cover image. */
  cover: string | null;
  /** Short summary or subtitle for the post. */
  tagline: string | null;
  /** Author name, or `null` if not specified. */
  author: string | null;
  /** Tags of the blog */
  tags: string[];
}

/** A full blog post including its rendered HTML content. */
export interface BlogPost extends BlogPostMeta {
  /** The post body rendered from markdown to HTML. */
  htmlContent: string;
}

/** Configuration for the ngx-blogdown library. */
export interface NgBlogConfig {
  /** Path to the JSON index file containing all post metadata. */
  indexPath: string;
  /** Directory path where markdown post files are served from. */
  postsDir: string;
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
