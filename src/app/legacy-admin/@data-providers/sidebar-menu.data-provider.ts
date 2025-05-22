import { InjectionToken } from '@angular/core';
import { MenuItem, UserRole } from 'src/app/core/enum/auth-roles.enum';

export const NAVIGATION_MENU = new InjectionToken<MenuItem[]>(
  'NAVIGATION_MENU',
  {
    factory: () => [
      {
        id: 'admin',
        label: 'Admin Dashboard',
        icon: 'syn:space_dashboard_outlined',
        isSvg: true,
        routerLink: '/admin',
        roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
      },
      {
        id: 'insights-editor',
        label: 'Insights Editor',
        icon: 'dashboard',
        routerLink: '/insights-editor',
        roles: [UserRole.SUPERADMIN, UserRole.EDITOR],
      },
      {
        id: 'content-editor',
        label: 'Content Editor',
        icon: 'description',
        routerLink: '/content-editor',
        roles: [UserRole.SUPERADMIN, UserRole.EDITOR],
      },
      {
        id: 'agenda',
        label: 'Agenda Tool',
        icon: 'event',
        routerLink: '/agenda',
        roles: [UserRole.SUPERADMIN, UserRole.EVENTORGANIZER],
      },
      {
        id: 'analytics',
        label: 'Analytics Dashboard',
        icon: 'analytics',
        routerLink: '/analytics',
        roles: [UserRole.SUPERADMIN, UserRole.EVENTORGANIZER],
      },
    ],
  }
);
