# Changelog

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
