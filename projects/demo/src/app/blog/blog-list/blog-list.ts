import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlogPostMeta, BlogService } from 'ngx-blogdown';

@Component({
  selector: 'app-blog-list',
  imports: [RouterLink],
  templateUrl: './blog-list.html',
  styleUrl: './blog-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BlogListComponent {
  private blog = inject(BlogService);
  posts = signal<BlogPostMeta[]>([]);

  constructor() {
    this.blog.getPosts().then((posts) => this.posts.set(posts));
  }
}
