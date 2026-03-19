import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlogService } from 'ngx-blogdown';
import { DemoPost } from '../demo-post';

@Component({
  selector: 'app-blog-list',
  imports: [RouterLink],
  templateUrl: './blog-list.html',
  styleUrl: './blog-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BlogListComponent {
  private blog = inject(BlogService);
  posts = signal<DemoPost[]>([]);

  constructor() {
    this.blog.getPosts<DemoPost>().then((posts) => this.posts.set(posts));
  }
}
