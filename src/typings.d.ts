export {}; // This line turns the file into a module

declare global {
  interface Navigator {
    permissions?: Permissions;
    readonly wakeLock: WakeLock;
  }

  interface Permissions {
    query(options: PermissionDescriptor): Promise<PermissionStatus>;
  }

  interface PermissionDescriptor {
    name: PermissionName;
  }

  interface PermissionStatus {
    state: 'granted' | 'denied' | 'prompt';
    onchange?: EventListener;
  }

  // This is necessary if TypeScript does not recognize "PermissionName" type.
  type PermissionName = 'microphone' | 'geolocation' | 'notifications' | any;
}
