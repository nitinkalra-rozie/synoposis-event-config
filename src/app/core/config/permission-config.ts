import { RoutePermission } from 'src/app/core/auth/data-service/auth.data-model';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  {
    path: '/av-workspace',
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
  },
  {
    path: '/insights-editor',
    roles: [UserRole.EDITOR, UserRole.SUPERADMIN],
  },
  {
    path: '/content-editor',
    roles: [UserRole.EDITOR, UserRole.SUPERADMIN],
  },
  {
    path: '/agenda',
    roles: [UserRole.EVENTORGANIZER, UserRole.SUPERADMIN],
  },
  {
    path: '/analytics',
    roles: [UserRole.EVENTORGANIZER, UserRole.SUPERADMIN],
  },
];
