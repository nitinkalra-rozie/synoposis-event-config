import { InjectionToken } from '@angular/core';
import { MenuItem, UserRole } from 'src/app/core/enum/auth-roles.enum';

export const NAVIGATION_MENU = new InjectionToken<MenuItem[]>(
  'NAVIGATION_MENU',
  {
    factory: () => [
      {
        id: 'av-workspace',
        label: 'AV Workspace',
        icon: 'syn:space_dashboard_outlined',
        isSvg: true,
        routerLink: '/av-workspace',
        roles: [
          UserRole.SuperAdmin,
          UserRole.Admin,
          UserRole.CentralizedManager,
        ],
      },
      {
        id: 'insights-editor',
        label: 'Insights Editor',
        icon: 'dashboard',
        routerLink: '/insights-editor',
        roles: [UserRole.SuperAdmin, UserRole.Editor],
      },
      {
        id: 'content-editor',
        label: 'Content Editor',
        icon: 'description',
        routerLink: '/content-editor',
        roles: [UserRole.SuperAdmin, UserRole.Editor],
      },
      {
        id: 'agenda',
        label: 'Agenda Tool',
        icon: 'event',
        routerLink: '/agenda',
        roles: [UserRole.SuperAdmin, UserRole.EventOrganizer],
      },
      {
        id: 'analytics',
        label: 'Analytics Dashboard',
        icon: 'analytics',
        routerLink: '/analytics',
        roles: [UserRole.SuperAdmin, UserRole.EventOrganizer],
      },
    ],
  }
);
