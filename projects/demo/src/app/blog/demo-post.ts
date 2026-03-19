import { BlogPostBase } from 'ngx-blogdown';

export interface DemoPost extends BlogPostBase {
  date: string;
  tagline: string;
  author: string;
  cover: string | null;
}
