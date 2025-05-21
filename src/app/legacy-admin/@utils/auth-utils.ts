import { UserRole } from 'src/app/core/enum/auth-roles.enum';

export function getPathsByUserRole(userRole: UserRole): string[] {
  switch (userRole) {
    case UserRole.SUPERADMIN:
      return [
        'admin',
        'insights-editor',
        'content-editor',
        'agenda',
        'analytics',
      ];
    case UserRole.ADMIN:
      return ['admin'];
    case UserRole.EVENTORGANIZER:
      return ['agenda', 'analytics'];
    case UserRole.EDITOR:
      return ['insights-editor', 'content-editor'];
    default:
      return [];
  }
}

export function isPathPermitted(
  currentUrl: string,
  permittedPaths: string[]
): boolean {
  const trimmedUrl = currentUrl.startsWith('/')
    ? currentUrl.slice(1)
    : currentUrl;
  const topLevelPath = trimmedUrl.split('/')[0] || '';
  return permittedPaths.includes(topLevelPath);
}

export function getDefaultRedirectForRole(userRole: UserRole): string {
  switch (userRole) {
    case UserRole.EVENTORGANIZER:
      return '/analytics';
    case UserRole.EDITOR:
      return '/insights-editor';
    case UserRole.ADMIN:
    case UserRole.SUPERADMIN:
      return '/admin';
    default:
      return '/login';
  }
}

export function extractCustomPermissionsFromToken(token: string): string[] {
  try {
    const base64Url = token.split('.')[1];
    const decodedPayload: { 'custom:permissions'?: string[] } = JSON.parse(
      atob(base64Url)
    );
    const permissions = decodedPayload['custom:permissions'];
    if (
      Array.isArray(permissions) &&
      permissions.every((item) => typeof item === 'string')
    ) {
      return permissions;
    }
    return [];
  } catch (error) {
    console.error('Error decoding token or extracting permissions:', error);
    return [];
  }
}

export function validateUserAccess(
  authToken: string | null,
  currentUrl: string,
  resolveUserRole: () => UserRole,
  additionalPaths: string[] = []
): boolean | string {
  if (!authToken) return '/login';

  let userRole: UserRole;
  try {
    userRole = resolveUserRole();
  } catch {
    return '/login';
  }

  const permittedPaths = [...getPathsByUserRole(userRole), ...additionalPaths];
  return isPathPermitted(currentUrl, permittedPaths)
    ? true
    : getDefaultRedirectForRole(userRole);
}
