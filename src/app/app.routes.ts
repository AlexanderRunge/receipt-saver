import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'new-receipt',
    loadComponent: () => import('./pages/new-receipt/new-receipt.page').then( m => m.NewReceiptPage)
  },
];
