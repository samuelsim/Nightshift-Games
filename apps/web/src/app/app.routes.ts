import type { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'join/:code', loadComponent: () => import('./pages/room-page.component').then(m => m.RoomPageComponent) },
  { path: 'room/:code', loadComponent: () => import('./pages/room-page.component').then(m => m.RoomPageComponent) },
  { path: '**', redirectTo: '' }
];
