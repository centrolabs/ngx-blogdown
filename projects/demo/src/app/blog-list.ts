import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlogPostMeta, BlogService } from 'ngx-blogdown';

@Component({
  selector: 'app-blog-list',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Blog</h1>
    @for (post of posts(); track post.slug) {
      <article>
        <h2><a [routerLink]="['/blog', post.slug]">{{ post.title }}</a></h2>
        <p>{{ post.tagline }}</p>
        <small>{{ post.date }} — {{ post.author }}</small>
      </article>
    }
  `,
})
export default class BlogListComponent {
  private blog = inject(BlogService);
  posts = signal<BlogPostMeta[]>([]);

  constructor() {
    this.blog.getPosts().then((posts) => this.posts.set(posts));
  }
}
