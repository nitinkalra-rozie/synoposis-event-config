// microphone.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MicrophoneService {
  constructor() {}

  async checkAndRequestMicrophonePermission(): Promise<boolean> {
    try {
      const permStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      if (permStatus.state === 'granted') {
        return true;
      } else if (permStatus.state === 'prompt') {
        return this.requestMicrophoneAccess();
      } else {
        // Permission is denied
        return false;
      }
    } catch (error) {
      console.error('Error checking microphone permissions:', error);
      return false;
    }
  }

  private async requestMicrophoneAccess(): Promise<boolean> {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error('Microphone access denied:', error);
      return false;
    }
  }
}
