import { InjectionToken, Provider } from '@angular/core';
import { NgBlogConfig } from './blog.models';
import { BlogService } from './blog.service';

export const NG_BLOG_CONFIG = new InjectionToken<NgBlogConfig>('NG_BLOG_CONFIG');

export function provideNgBlogdown(config: NgBlogConfig): Provider[] {
  return [{ provide: NG_BLOG_CONFIG, useValue: config }, BlogService];
}
