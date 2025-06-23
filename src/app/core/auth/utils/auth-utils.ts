import { ROUTE_PERMISSIONS } from 'src/app/core/config/permission-config';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

export function getRequiredRolesForRoute(routePath: string): UserRole[] {
  const permission = ROUTE_PERMISSIONS.find((p) =>
    routePath.startsWith(p.path)
  );
  return permission?.roles || [];
}

export function hasRoutePermission(
  userRole: UserRole,
  routePath: string
): boolean {
  if (userRole === UserRole.UNAUTHENTICATED) {
    return false;
  }
  const requiredRoles = getRequiredRolesForRoute(routePath);
  return requiredRoles.includes(userRole);
}

export function getDefaultRedirectUrl(userRole: UserRole): string {
  switch (userRole) {
    case UserRole.SUPERADMIN:
    case UserRole.ADMIN:
      return '/av-workspace';
    case UserRole.EDITOR:
      return '/insights-editor';
    case UserRole.EVENTORGANIZER:
      return '/agenda';
    case UserRole.UNAUTHENTICATED:
      return '/login';
    default:
      return '/unauthorized';
  }
}

export function isUserAuthenticated(userRole: UserRole): boolean {
  return userRole !== UserRole.UNAUTHENTICATED;
}
