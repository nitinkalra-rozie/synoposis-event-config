// src/typings.d.ts

export {}; // This line turns the file into a module

declare global {


  type WakeLockType = 'screen';
  interface Navigator {
    permissions?: Permissions;
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
