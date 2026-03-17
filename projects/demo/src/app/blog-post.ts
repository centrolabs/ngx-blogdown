import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BlogPost, BlogService } from 'ngx-blogdown';

@Component({
  selector: 'app-blog-post',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (post(); as p) {
      <article>
        <h1>{{ p.title }}</h1>
        <small>{{ p.date }} — {{ p.author }}</small>
        <div [innerHTML]="p.htmlContent"></div>
      </article>
    } @else {
      <p>Loading...</p>
    }
  `,
})
export default class BlogPostComponent {
  private blog = inject(BlogService);
  private route = inject(ActivatedRoute);
  post = signal<BlogPost | null>(null);

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.blog.getPost(slug).then((post) => this.post.set(post));
  }
}
