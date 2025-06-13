import { UserRole } from 'src/app/core/enum/auth-roles.enum';

export const ROUTE_PERMISSIONS = {
  avWorkspace: [
    UserRole.ADMIN,
    UserRole.SUPERADMIN,
    UserRole.EVENTORGANIZER,
    UserRole.EDITOR,
  ],
  editor: [UserRole.SUPERADMIN, UserRole.EDITOR],
  admin: [UserRole.ADMIN, UserRole.SUPERADMIN],
  eventOrganizer: [UserRole.SUPERADMIN, UserRole.EVENTORGANIZER],
};
