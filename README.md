# ngx-blogdown

Monorepo for [`@centrolabs/ngx-blogdown`](https://www.npmjs.com/package/@centrolabs/ngx-blogdown) — a lightweight Angular library for building markdown-powered blogs.

## Projects

| Project | Path | Description |
| ------- | ---- | ----------- |
| `ngx-blogdown` | `projects/ngx-blogdown` | The library (published to npm) |
| `demo` | `projects/demo` | Demo application |

## Prerequisites

- Node.js 22+
- Angular CLI 20+

## Getting Started

```bash
npm install
```

## Development

### Serve the demo app

```bash
ng serve demo
```

### Build the library

```bash
ng build ngx-blogdown
```

Build artifacts are output to `dist/ngx-blogdown/`.

## Testing

### Library unit tests

```bash
ng test ngx-blogdown --no-watch --browsers=ChromeHeadless
```

### CLI tool tests

```bash
node --test projects/ngx-blogdown/bin/ngx-blogdown-index.spec.mjs
```

## Linting

```bash
ng lint ngx-blogdown
```

## CI/CD

CI runs automatically on pull requests to `main`:

- Lint
- Unit tests (Angular + CLI)
- Production build

Publishing to npm is triggered by pushing a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## License

MIT
