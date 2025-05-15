import { UserRole } from 'src/app/core/enum/auth-roles.enum';

export function getAllowedPaths(role: UserRole): string[] {
  switch (role) {
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

export function isAllowed(url: string, allowedPaths: string[]): boolean {
  const normalized = url.startsWith('/') ? url.slice(1) : url;
  const firstSegment = normalized.split('/')[0] || '';
  return allowedPaths.includes(firstSegment);
}

export function getRedirectUrl(role: UserRole): string {
  switch (role) {
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

/**
 * Extracts extra permissions from token (e.g., custom Cognito claims).
 */
export function getExtraPathsFromToken(token: string): string[] {
  try {
    const decoded: any = JSON.parse(atob(token.split('.')[1]));
    return decoded['custom:permissions'] ?? [];
  } catch {
    return [];
  }
}

export function authorizeAccess(
  token: string | null,
  url: string,
  getRole: () => UserRole,
  extra: string[] = []
): boolean | string {
  if (!token) return '/login';

  let role: UserRole;
  try {
    role = getRole();
  } catch {
    return '/login';
  }

  const allowedPaths = [...getAllowedPaths(role), ...extra];
  return isAllowed(url, allowedPaths) ? true : getRedirectUrl(role);
}
