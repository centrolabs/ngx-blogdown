# Changelog

## [2.0.0] - 2026-05-13

### Breaking

- `ngx-blogdown-index` CLI no longer emits one top-level index entry per `.md` file. Sibling files matching `<base>.<lang>.md` are now grouped under their base post as `translations[lang]`. Consumers that read variant rows directly from the index must read them from the new `translations` map instead. Slugs always derive from the base filename, so post URLs stay stable across languages.

### Added

- Multilingual post support. Drop `<base>.<lang>.md` next to a post for a localized variant; only the frontmatter fields that differ from the base need to be present. Region-qualified codes like `pt-BR` are recognized.
- `NgBlogConfig.lang?: () => string | null | undefined` — optional active-language getter. When set and a post has a matching `translations[lang]` entry, `getPosts()` and `getPost()` merge the variant's filename and frontmatter onto the base. Falsy return values fall back to the base post.
- `provideNgBlogdown` now accepts a factory in addition to a static config, so the config can depend on other injectables (e.g. a translation service supplying `lang`).
- `BlogPostTranslation` interface, exported from the public API.

## [1.5.0] - 2026-05-16

### Added

- `author?: string | null` and `readTime?: number` are now first-class optional fields on `BlogPostBase`. Consumers can rely on them without redeclaring them in their own post types.
- The `ngx-blogdown-index` CLI auto-computes `readTime` (whole minutes) from the post body at ~200 wpm, clamped to a 1-minute minimum. Frontmatter `readTime:` still takes precedence when explicitly set.

## [1.4.1] - 2026-04-20

### Fixed

- Set the executable bit on the `ngx-blogdown-index` CLI source so fresh `npm install` pulls a runnable binary (previously failed with `Permission denied` on some systems).

## [1.4.0] - 2026-04-20

### Added

- Optional `imagesDir` config. When set, relative image references in post markdown (e.g. `![alt](foo.png)` or `![alt](./foo.png)`) are rewritten to `<imagesDir>/foo.png` at render time. Absolute URLs, protocol-relative URLs, rooted paths, and `data:` URIs pass through unchanged.

## [1.3.0] - 2026-03-19

### Changed

- Replaced `BlogPostMeta` with a minimal `BlogPostBase` interface (`slug`, `filename`, `title`). Extend it to define your own frontmatter fields.
- `getPosts()` and `getPost()` now accept a generic type parameter for custom metadata shapes.
- Moved `js-yaml` from `dependencies` to `peerDependencies`.

## [1.2.0] - 2026-03-17

### Fixed

- Included `bin/` directory in published package so `ngx-blogdown-index` CLI is available when installed as a dependency.

## [1.1.0] - 2026-03-17

### Changed

- Widened Angular peer dependency from `^20.3.0` to `>=20.3.0` to support Angular 21+.

## [1.0.0] - 2026-03-17

### Added

- `BlogService` with `getPosts()`, `getPost()`, and `getSeoTags()` methods.
- `provideNgBlogdown()` provider function for standalone Angular apps.
- `BlogPostMeta`, `BlogPost`, `NgBlogConfig`, and `SeoTags` interfaces.
- `ngx-blogdown-index` CLI tool for generating blog index JSON from markdown files.
