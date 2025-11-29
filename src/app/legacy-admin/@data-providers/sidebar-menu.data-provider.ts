import { InjectionToken } from '@angular/core';
import { MenuItem, UserRole } from 'src/app/core/enum/auth-roles.enum';

export const NAVIGATION_MENU = new InjectionToken<MenuItem[]>(
  'NAVIGATION_MENU',
  {
    factory: () => [
      {
        id: 'event-configuration',
        label: 'Event Configuration',
        icon: 'display_settings',
        routerLink: '/event-configuration',
        roles: [UserRole.SuperAdmin, UserRole.EventOrganizer],
      },
      // {
      //   id: 'content-editor',
      //   label: 'Content Editor',
      //   icon: 'description',
      //   routerLink: '/content-editor',
      //   roles: [UserRole.SuperAdmin, UserRole.Editor],
      // },
      {
        id: 'report',
        label: 'Report',
        icon: 'assessment',
        routerLink: '/report',
        roles: [UserRole.SuperAdmin, UserRole.EventOrganizer],
      },
    ],
  }
);
