import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogPost, BlogService } from 'ngx-blogdown';

@Component({
  selector: 'app-blog-post',
  imports: [RouterLink],
  templateUrl: './blog-post.html',
  styleUrl: './blog-post.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BlogPostComponent {
  private blog = inject(BlogService);
  private route = inject(ActivatedRoute);
  private meta = inject(Meta);
  private title = inject(Title);
  private destroyRef = inject(DestroyRef);

  post = signal<BlogPost | null>(null);

  private defaultTitle = 'ngx-blogdown Demo';
  private defaultDescription = 'A demo blog powered by ngx-blogdown.';

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.blog.getPost(slug).then((post) => {
      this.post.set(post);
      if (post) {
        this.updateMetaTags(post);
      }
    });

    this.destroyRef.onDestroy(() => this.resetMetaTags());
  }

  private updateMetaTags(post: BlogPost) {
    const seo = this.blog.getSeoTags(post);

    this.title.setTitle(seo.title ? `${seo.title} | ngx-blogdown` : this.defaultTitle);

    const description = seo.description || this.defaultDescription;

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:title', content: seo.title || this.defaultTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: `/blog/${post.slug}` });

    if (seo.image) {
      this.meta.updateTag({ property: 'og:image', content: seo.image });
      this.meta.updateTag({ name: 'twitter:image', content: seo.image });
    }

    this.meta.updateTag({ name: 'twitter:title', content: seo.title || this.defaultTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }

  private resetMetaTags() {
    this.title.setTitle(this.defaultTitle);
    this.meta.updateTag({ name: 'description', content: this.defaultDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: this.defaultTitle });
    this.meta.updateTag({ property: 'og:description', content: this.defaultDescription });
    this.meta.updateTag({ property: 'og:url', content: '/' });
    this.meta.removeTag("property='og:image'");
    this.meta.updateTag({ name: 'twitter:title', content: this.defaultTitle });
    this.meta.updateTag({ name: 'twitter:description', content: this.defaultDescription });
    this.meta.removeTag("name='twitter:image'");
  }
}
