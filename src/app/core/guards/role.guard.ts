import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'src/app/legacy-admin/services/auth.service';
import { UserRole } from 'src/app/legacy-admin/shared/enums';
export const RoleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const userRole = authService.getUserRole();
  const currentPath = route.routeConfig?.path;

  const allowedRoutesMap = {
    [UserRole.ADMIN]: ['admin'],
    [UserRole.SUPERADMIN]: [
      'admin',
      'insights-editor',
      'content-editor',
      'agenda',
      'analytics',
    ],
    [UserRole.EVENTORGANIZER]: ['agenda', 'analytics'],
    [UserRole.EDITOR]: ['insights-editor', 'content-editor'],
  };

  const allowedRoutes = allowedRoutesMap[userRole] || [];

  const isAllowed = allowedRoutes.some((path) => currentPath?.startsWith(path));
  if (!isAllowed) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
