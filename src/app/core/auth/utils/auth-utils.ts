import { ROUTE_PERMISSIONS } from 'src/app/core/config/permission-config';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

function getRequiredRolesForRoute(routePath: string): UserRole[] {
  const permission = ROUTE_PERMISSIONS.find((p) =>
    routePath.startsWith(p.path)
  );
  return permission?.roles || [];
}

export function hasRoutePermission(
  userRole: UserRole,
  routePath: string
): boolean {
  if (userRole === UserRole.Unauthenticated) {
    return false;
  }
  const requiredRoles = getRequiredRolesForRoute(routePath);
  return requiredRoles.includes(userRole);
}

export function getDefaultRedirectUrl(userRole: UserRole): string {
  switch (userRole) {
    case UserRole.SuperAdmin:
    case UserRole.CentralizedManager:
    case UserRole.Admin:
      return '/av-workspace';
    case UserRole.Editor:
      return '/insights-editor';
    case UserRole.EventOrganizer:
      return '/agenda';
    case UserRole.Unauthenticated:
      return '/login';
    default:
      return '/unauthorized';
  }
}

export function isUserAuthenticated(userRole: UserRole): boolean {
  return userRole !== UserRole.Unauthenticated;
}

export function generateSecurePassword(length: number = 16): string {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

  const mandatoryChars = [
    uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)],
    lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)],
    numberChars[Math.floor(Math.random() * numberChars.length)],
    specialChars[Math.floor(Math.random() * specialChars.length)],
  ];

  const remainingLength = length - mandatoryChars.length;
  const randomChars = Array.from(
    { length: remainingLength },
    () => allChars[Math.floor(Math.random() * allChars.length)]
  );

  const passwordArray = [...mandatoryChars, ...randomChars];

  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}
