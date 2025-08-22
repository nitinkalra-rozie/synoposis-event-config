import { RoutePermission } from 'src/app/core/auth/models/auth.model';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  {
    path: '/av-workspace',
    roles: [UserRole.SuperAdmin, UserRole.CentralizedManager, UserRole.Admin],
  },
  {
    path: '/insights-editor',
    roles: [UserRole.Editor, UserRole.SuperAdmin],
  },
  {
    path: '/content-editor',
    roles: [UserRole.Editor, UserRole.SuperAdmin],
  },
  {
    path: '/agenda',
    roles: [UserRole.EventOrganizer, UserRole.SuperAdmin],
  },
  {
    path: '/analytics',
    roles: [UserRole.EventOrganizer, UserRole.SuperAdmin],
  },
];
