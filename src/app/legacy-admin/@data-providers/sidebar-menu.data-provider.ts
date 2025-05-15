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
        route: '/admin',
        roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
      },
      {
        id: 'insights-editor',
        label: 'Insights Editor',
        icon: 'dashboard',
        route: '/insights-editor',
        roles: [UserRole.SUPERADMIN, UserRole.EDITOR],
      },
      {
        id: 'content-editor',
        label: 'Content Editor',
        icon: 'description',
        route: '/content-editor',
        roles: [UserRole.SUPERADMIN, UserRole.EDITOR],
      },
      {
        id: 'agenda',
        label: 'Agenda Tool',
        icon: 'event',
        route: '/agenda',
        roles: [UserRole.SUPERADMIN, UserRole.EVENTORGANIZER],
      },
      {
        id: 'analytics',
        label: 'Analytics Dashboard',
        icon: 'analytics',
        route: '/analytics',
        roles: [UserRole.SUPERADMIN, UserRole.EVENTORGANIZER],
      },
    ],
  }
);
