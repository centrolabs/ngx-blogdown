import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNgBlogdown, NG_BLOG_CONFIG } from './blog.config';
import { BlogService } from './blog.service';
import { provideHttpClient } from '@angular/common/http';
import { NgBlogConfig } from './blog.models';

describe('blog.config', () => {
  const testConfig: NgBlogConfig = {
    indexPath: '/api/posts.json',
    postsDir: '/content/posts',
  };

  describe('NG_BLOG_CONFIG', () => {
    it('should be an InjectionToken', () => {
      expect(NG_BLOG_CONFIG.toString()).toContain('NG_BLOG_CONFIG');
    });
  });

  describe('provideNgBlogdown', () => {
    it('should return an array of providers', () => {
      const providers = provideNgBlogdown(testConfig);
      expect(Array.isArray(providers)).toBeTrue();
      expect(providers.length).toBe(2);
    });

    it('should provide the config via the injection token', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideHttpClient(), provideNgBlogdown(testConfig)],
      });

      const config = TestBed.inject(NG_BLOG_CONFIG);
      expect(config).toEqual(testConfig);
    });

    it('should provide BlogService', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideHttpClient(), provideNgBlogdown(testConfig)],
      });

      const service = TestBed.inject(BlogService);
      expect(service).toBeInstanceOf(BlogService);
    });

    it('should use the exact config values provided', () => {
      const customConfig: NgBlogConfig = {
        indexPath: '/custom/index.json',
        postsDir: '/custom/posts',
      };

      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideHttpClient(), provideNgBlogdown(customConfig)],
      });

      const config = TestBed.inject(NG_BLOG_CONFIG);
      expect(config.indexPath).toBe('/custom/index.json');
      expect(config.postsDir).toBe('/custom/posts');
    });
  });
});
