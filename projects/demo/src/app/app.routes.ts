import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./blog/blog-list/blog-list') },
  { path: 'blog/:slug', loadComponent: () => import('./blog/blog-post/blog-post') },
];
