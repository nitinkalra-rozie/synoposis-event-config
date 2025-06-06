import { UserRole } from 'src/app/core/enum/auth-roles.enum';

function getPathsByUserRole(userRole: UserRole): string[] {
  switch (userRole) {
    case UserRole.SUPERADMIN:
      return [
        'av-workspace',
        'insights-editor',
        'content-editor',
        'agenda',
        'analytics',
      ];
    case UserRole.ADMIN:
      return ['av-workspace'];
    case UserRole.EVENTORGANIZER:
      return ['agenda', 'analytics'];
    case UserRole.EDITOR:
      return ['insights-editor', 'content-editor'];
    default:
      return [];
  }
}

function isPathPermitted(
  currentUrl: string,
  permittedPaths: string[]
): boolean {
  const trimmedUrl = currentUrl.startsWith('/')
    ? currentUrl.slice(1)
    : currentUrl;
  const topLevelPath = trimmedUrl.split('/')[0] || '';
  return permittedPaths.includes(topLevelPath);
}

function getDefaultRedirectForRole(userRole: UserRole): string {
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

function extractCustomPermissionsFromToken(token: string): string[] {
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
  accessToken: string | null,
  currentUrl: string,
  userRole: UserRole
): boolean | string {
  if (!accessToken) return '/login';

  let customPermissions: string[] = [];

  try {
    customPermissions = extractCustomPermissionsFromToken(accessToken);
  } catch (error) {
    console.warn('Failed to extract custom permissions from token:', error);
  }

  const permittedPaths = [
    ...getPathsByUserRole(userRole),
    ...customPermissions,
  ];
  return isPathPermitted(currentUrl, permittedPaths)
    ? true
    : getDefaultRedirectForRole(userRole);
}
