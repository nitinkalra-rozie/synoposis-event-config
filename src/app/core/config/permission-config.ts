import { RoutePermission } from 'src/app/core/auth/data-service/auth-data-model';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  {
    path: '/av-workspace',
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
    redirectUrl: '/av-workspace',
  },
  {
    path: '/insights-editor',
    roles: [UserRole.EDITOR, UserRole.SUPERADMIN],
    redirectUrl: '/insights-editor',
  },
  {
    path: '/content-editor',
    roles: [UserRole.EDITOR, UserRole.SUPERADMIN],
    redirectUrl: '/insights-editor',
  },
  {
    path: '/agenda',
    roles: [UserRole.EVENTORGANIZER, UserRole.SUPERADMIN],
    redirectUrl: '/agenda',
  },
  {
    path: '/analytics',
    roles: [UserRole.EVENTORGANIZER, UserRole.SUPERADMIN],
    redirectUrl: '/agenda',
  },
];
