import { InjectionToken, Provider } from '@angular/core';
import { NgBlogConfig } from './blog.models';
import { BlogService } from './blog.service';

/** Injection token for supplying {@link NgBlogConfig} to the library. */
export const NG_BLOG_CONFIG = new InjectionToken<NgBlogConfig>('NG_BLOG_CONFIG');

/**
 * Provides the ngx-blogdown library with the given configuration.
 *
 * Accepts either a static config object or a factory function that runs in an
 * injection context — use the factory form when the config depends on other
 * injectables (e.g. a translation service supplying the active `lang`).
 *
 * @example Static config
 * ```ts
 * provideNgBlogdown({ indexPath: '/blog/index.json', postsDir: '/blog/posts' })
 * ```
 *
 * @example Factory with injected dependencies
 * ```ts
 * provideNgBlogdown(() => {
 *   const i18n = inject(TranslationService);
 *   return {
 *     indexPath: '/blog/index.json',
 *     postsDir: '/blog/posts',
 *     lang: () => i18n.lang(),
 *   };
 * });
 * ```
 */
export function provideNgBlogdown(config: NgBlogConfig | (() => NgBlogConfig)): Provider[] {
  const configProvider: Provider =
    typeof config === 'function'
      ? { provide: NG_BLOG_CONFIG, useFactory: config }
      : { provide: NG_BLOG_CONFIG, useValue: config };
  return [configProvider, BlogService];
}
