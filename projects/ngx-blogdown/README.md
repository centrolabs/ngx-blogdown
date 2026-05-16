# @centrolabs/ngx-blogdown

A lightweight Angular library for building markdown-powered blogs. You handle the layout, we handle the pipeline.

## Installation

```bash
npm install @centrolabs/ngx-blogdown marked js-yaml
```

## Setup

### 1. Provide the library

```ts
import { provideHttpClient } from '@angular/common/http';
import { provideNgBlogdown } from '@centrolabs/ngx-blogdown';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideNgBlogdown({
      indexPath: '/blog/index.json',
      postsDir: '/blog/posts',
      // Optional: prefix relative image paths in post markdown.
      // `![alt](foo.png)` → `<img src="/blog/images/foo.png">`
      imagesDir: '/blog/images',
    }),
  ],
});
```

### 2. Write your posts

Create markdown files with YAML frontmatter in your posts directory:

```markdown
title: My First Post
date: 2026-01-15
cover: /images/first-post.png
tagline: A short description of this post
author: Jane Doe
# readTime: 5   # optional — auto-computed from word count when omitted

---

# My First Post

Write your content here using **markdown**.
```

### 3. Generate the index

Use the bundled CLI to generate a JSON index from your markdown files:

```bash
npx ngx-blogdown-index --postsDir src/content/posts --out src/content/index.json
```

This scans all `.md` files, extracts frontmatter, and outputs a sorted JSON index.

## Usage

Inject `BlogService` anywhere you need blog data:

```ts
import { BlogService, BlogPostBase } from '@centrolabs/ngx-blogdown';

// Extend BlogPostBase with your own frontmatter fields
interface MyPost extends BlogPostBase {
  date: string;
  tagline: string;
  cover: string;
  author: string;
}

@Component({
  template: `
    @for (post of posts; track post.slug) {
      <article>
        <h2>{{ post.title }}</h2>
        <p>{{ post.tagline }}</p>
      </article>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogListComponent {
  private blogService = inject(BlogService);
  posts: MyPost[] = [];

  async ngOnInit() {
    this.posts = await this.blogService.getPosts<MyPost>();
  }
}
```

### Rendering a single post

```ts
const post = await this.blogService.getPost<MyPost>('my-first-post');
if (post) {
  // post.htmlContent contains the rendered HTML
  // post.date, post.author, etc. are typed
}
```

### SEO tags

```ts
const meta = posts.find((p) => p.slug === 'my-first-post')!;
const seo = this.blogService.getSeoTags(meta);
// { title, description, image, date, author }
```

### Multilingual posts

Drop a `<base>.<lang>.md` next to a post to publish a localized version:

```
posts/
  My First Post.md       # base (default language)
  My First Post.de.md    # German variant
  My First Post.fr.md    # French variant
```

The CLI groups each variant under `translations[lang]` on its base entry, so
the index keeps a single row per post. Variants only need the frontmatter
fields that actually differ — any field they omit falls back to the base.

Wire the active language by passing a `lang` getter (and use the factory form
of `provideNgBlogdown` if it depends on another injectable):

```ts
provideNgBlogdown(() => {
  const i18n = inject(TranslationService);
  return {
    indexPath: '/blog/index.json',
    postsDir: '/blog/posts',
    lang: () => i18n.lang(),
  };
});
```

`getPosts()` and `getPost()` now merge the matching translation onto the base
post automatically. Region codes like `pt-BR` are supported. Slugs always
come from the base filename, so URLs stay stable across languages.

## API

### `provideNgBlogdown(config | factory)`

Registers the library providers. Call this in your application bootstrap.
Pass a static config object, or a factory that runs in an injection context
when the config depends on other injectables.

| Field                 | Type                  | Description                                                              |
| --------------------- | --------------------- | ------------------------------------------------------------------------ |
| `config.indexPath`    | `string`              | Path to the JSON index file                                              |
| `config.postsDir`     | `string`              | Directory where markdown files are served                                |
| `config.imagesDir?`   | `string`              | Optional prefix for relative image paths inside post markdown            |
| `config.lang?`        | `() => string \| null` | Optional active language; selects the matching `translations[lang]` entry |

### `BlogService`

| Method                 | Returns                        | Description                                         |
| ---------------------- | ------------------------------ | --------------------------------------------------- |
| `getPosts<T>()`        | `Promise<T[]>`                 | Fetches all post metadata. Cached after first call. |
| `getPost<T>(slug)`     | `Promise<BlogPost<T> \| null>` | Fetches and renders a single post by slug.          |
| `getSeoTags(postMeta)` | `SeoTags`                      | Derives SEO meta tags from post metadata.           |

### CLI: `ngx-blogdown-index`

```
ngx-blogdown-index --postsDir <path> --out <file>
```

| Flag         | Description                              |
| ------------ | ---------------------------------------- |
| `--postsDir` | Directory containing `.md` files         |
| `--out`      | Output path for the generated JSON index |

The generated index is sorted by date (newest first). Slugs are derived from filenames (lowercased, spaces replaced with hyphens). Each post's `readTime` (in minutes) is auto-computed from its body word count at ~200 wpm unless overridden in frontmatter.

### Built-in fields on `BlogPostBase`

| Field      | Type     | Source                                                                              |
| ---------- | -------- | ----------------------------------------------------------------------------------- |
| `slug`     | `string` | Derived from filename                                                               |
| `filename` | `string` | Markdown filename                                                                   |
| `title`    | `string` | Frontmatter `title:` (falls back to filename)                                       |
| `author`   | `string` | Frontmatter `author:` (optional)                                                    |
| `readTime` | `number` | Frontmatter `readTime:` or auto-computed minutes from body word count (minimum `1`) |

## Peer Dependencies

| Package           | Version    |
| ----------------- | ---------- |
| `@angular/core`   | `>=20.3.0` |
| `@angular/common` | `>=20.3.0` |
| `js-yaml`         | `^4.1.0`   |
| `marked`          | `^17.0.0`  |

## License

MIT
