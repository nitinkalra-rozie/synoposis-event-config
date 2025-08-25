export enum UserRole {
  Unauthenticated = 'UNAUTHENTICATED',
  Editor = 'EDITOR',
  EventOrganizer = 'EVENT_ORGANIZER',
  Admin = 'ADMIN',
  SuperAdmin = 'SUPER_ADMIN',
  CentralizedManager = 'CENTRALIZED_MANAGER',
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
