import { Routes } from '@angular/router';

export const shellRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('../users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../settings/settings.component').then(
            (m) => m.SettingsComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('../profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'calculator',
        loadComponent: () =>
          import('../calculator/calculator.component').then(
            (m) => m.CalculatorComponent,
          ),
      },
    ],
  },
];
