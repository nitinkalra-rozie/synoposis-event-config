export type AvWorkspaceView = 'centralized' | 'stage';

export interface AvWorkspaceAccess {
  availableViews: AvWorkspaceView[];
  defaultView: AvWorkspaceView | null;
}
