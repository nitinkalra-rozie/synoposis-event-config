import { RoutePermission } from 'src/app/core/auth/models/auth.model';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  {
    path: '/event-configuration',
    roles: [UserRole.SuperAdmin],
  },
  {
    path: '/content-editor',
    roles: [UserRole.SuperAdmin],
  },
];
