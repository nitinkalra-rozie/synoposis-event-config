import {
  AvWorkspaceAccess,
  AvWorkspaceView,
} from 'src/app/av-workspace/models/av-workspace-view.model';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

function getAvWorkspaceDefaultView(
  userGroups: string[] | null,
  isAdmin: boolean
): AvWorkspaceView | null {
  if (!userGroups?.length) return null;

  if (
    hasRole(userGroups, UserRole.SuperAdmin) ||
    hasRole(userGroups, UserRole.CentralizedManager) ||
    isAdmin
  ) {
    return 'centralized';
  }

  if (hasRole(userGroups, UserRole.Admin)) {
    return 'stage';
  }

  return null;
}

function getAvailableViews(
  userGroups: string[] | null,
  isAdmin: boolean
): AvWorkspaceView[] {
  if (!userGroups?.length) return [];

  const views: AvWorkspaceView[] = [];

  if (
    hasRole(userGroups, UserRole.SuperAdmin) ||
    hasRole(userGroups, UserRole.CentralizedManager) ||
    isAdmin
  ) {
    return ['centralized', 'stage'];
  }

  const hasAdmin = hasRole(userGroups, UserRole.Admin);
  const hasCentralizedManager = hasRole(
    userGroups,
    UserRole.CentralizedManager
  );

  if (hasAdmin && hasCentralizedManager) {
    return ['centralized', 'stage'];
  }

  if (hasCentralizedManager) {
    views.push('centralized');
  }

  if (hasAdmin) {
    views.push('stage');
  }

  return views;
}

function hasRole(userGroups: string[] | null, role: UserRole): boolean {
  return userGroups?.some((group) => group.includes(role)) ?? false;
}

export function getAvWorkspaceAccess(
  userGroups: string[] | null,
  isAdmin: boolean
): AvWorkspaceAccess {
  const availableViews = getAvailableViews(userGroups, isAdmin);
  const defaultView = getAvWorkspaceDefaultView(userGroups, isAdmin);

  return {
    availableViews,
    defaultView,
  };
}
