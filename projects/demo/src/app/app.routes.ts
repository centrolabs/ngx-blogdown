import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./blog-list') },
  { path: 'blog/:slug', loadComponent: () => import('./blog-post') },
];
