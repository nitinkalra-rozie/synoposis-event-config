export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  EVENTORGANIZER = 'EVENTORGANIZER',
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  routerLink: string;
  roles: UserRole[];
  isSvg?: boolean;
}
