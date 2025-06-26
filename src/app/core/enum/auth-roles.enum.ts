export enum UserRole {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  EDITOR = 'EDITOR',
  EVENTORGANIZER = 'EVENT_ORGANIZER',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPER_ADMIN',
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  routerLink: string;
  roles: UserRole[];
  isSvg?: boolean;
}

export interface JwtPayload {
  email?: string;
  username?: string;
  exp?: number;
  iat?: number;
  sub?: string;
}
