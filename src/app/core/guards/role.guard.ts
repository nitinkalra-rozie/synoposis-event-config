import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'src/app/legacy-admin/services/auth.service';
import { UserRole } from 'src/app/legacy-admin/shared/enums';

export const RoleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const userRole = authService.getUserRole();

  if (
    userRole === UserRole.EVENTORGANIZER &&
    !route.routeConfig?.path?.includes('analytics')
  ) {
    router.navigate(['/analytics']);
    return false;
  }

  return true;
};
