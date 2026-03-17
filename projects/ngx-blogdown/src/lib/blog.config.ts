import { InjectionToken, Provider } from '@angular/core';
import { NgBlogConfig } from './blog.models';
import { BlogService } from './blog.service';

/** Injection token for supplying {@link NgBlogConfig} to the library. */
export const NG_BLOG_CONFIG = new InjectionToken<NgBlogConfig>('NG_BLOG_CONFIG');

/**
 * Provides the ngx-blogdown library with the given configuration.
 *
 * Register the returned providers in your application's bootstrap or route config.
 *
 * @param config - Paths to the blog index file and posts directory.
 * @returns An array of providers including {@link BlogService} and the config token.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideHttpClient(),
 *     provideNgBlogdown({ indexPath: '/blog/index.json', postsDir: '/blog/posts' }),
 *   ],
 * });
 * ```
 */
export function provideNgBlogdown(config: NgBlogConfig): Provider[] {
  return [{ provide: NG_BLOG_CONFIG, useValue: config }, BlogService];
}
