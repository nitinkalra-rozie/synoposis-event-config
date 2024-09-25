enum RightSidebarState {
  Hidden = 1,
  Collapsed = 2,
  Expanded = 3,
}

enum DashboardTabs {
  SessionSpecific = 100,
  ProjectSpecific = 200,
}

enum RightSidebarSelectedAction {
  None = 10,
  SessionDetails = 20,
  Transcript = 30,
  AllLiveSessions = 40,
}

enum ControlPanelState {
  Default = 'Default',
  WidgetCollapsed = 'WidgetCollapsed',
  WidgetExpanded = 'WidgetExpanded',
}

export {
  DashboardTabs,
  RightSidebarSelectedAction,
  RightSidebarState,
  ControlPanelState,
};
