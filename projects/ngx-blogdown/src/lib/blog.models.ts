export interface BlogPostMeta {
  slug: string;
  filename: string;
  title: string;
  date: string;
  cover: string;
  tagline: string;
  author: string | null;
}

export interface BlogPost extends BlogPostMeta {
  htmlContent: string;
}

export interface NgBlogConfig {
  indexPath: string;
  postsDir: string;
}

export interface SeoTags {
  title: string | null;
  description: string | null;
  image: string | null;
  date: string | null;
  author: string | null;
}
