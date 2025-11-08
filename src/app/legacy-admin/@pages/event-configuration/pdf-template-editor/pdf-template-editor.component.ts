import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';

interface TemplateConfig {
  primaryColor: string;
  secondaryColor: string;
  headerBackgroundGradientColor1: string;
  headerBackgroundGradientColor2: string;
  headerBackgroundGradientColor3: string;
  rozieLogoBackgroundColor1: string;
  rozieLogoBackgroundColor2: string;
  topicsGradientColor1: string;
  topicsGradientColor2: string;
  backgroundGradientColor1: string;
  backgroundGradientColor2: string;
  backgroundGradientColor3: string;
  contentBackgroundColor1: string;
  contentBackgroundColor2: string;
  headerSpeakerBioGradient1: string;
  headerSpeakerBioGradient2: string;
  checkboxIcon: string;
  backgroundMask: string;
  eventLogoDark: string;
  eventLogoLight: string;
  speaker_bio: boolean;
}

/**
 * TemplateEditorComponent
 *
 * This Angular standalone component provides a dialog interface for editing PDF report theme templates.
 * It supports updating, previewing, and resetting a set of color/image configuration values for events using presets.
 * Boolean and color fields are supported, along with clipboard copy functionality.
 *
 * Usage:
 * - Open as a dialog, passing `{ data: <existing-PDFReport-theme> }` via MAT_DIALOG_DATA.
 * - Allows the user to select a preset, edit fields, copy JSON to clipboard, and save/cancel.
 *
 * Key Features:
 *  - Displays/edits a PDFReport theme using a strongly-typed TemplateConfig structure
 *  - Supports color/image/boolean config fields with live input
 *  - Allows selecting and applying predefined theme presets
 *  - Handles saving and updating backend with new configuration
 */
@Component({
  selector: 'app-pdf-template-editor',
  templateUrl: './pdf-template-editor.component.html',
  styleUrls: ['./pdf-template-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatSnackBarModule, MatButtonModule],
})
export class TemplateEditorComponent {
  constructor(private cdr: ChangeDetectorRef) {
    this._dialogData = inject(MAT_DIALOG_DATA);
    this.config = signal<TemplateConfig>(
      this._dialogData?.data?.Themes?.PDFReport || this.presets['SLC2025']
    );
  }
  public readonly presets: Record<string, TemplateConfig> = {
    SLC2025: {
      primaryColor: '#EC7C2A',
      secondaryColor: '#C8641F',
      headerBackgroundGradientColor1: '#EC7C2A',
      headerBackgroundGradientColor2: '#C8641F',
      headerBackgroundGradientColor3: '#EC7C2A',
      rozieLogoBackgroundColor1: '#EC7C2A',
      rozieLogoBackgroundColor2: '#C8641F',
      topicsGradientColor1: '#EC7C2A',
      topicsGradientColor2: '#C8641F',
      backgroundGradientColor1: '#FCF8F5',
      backgroundGradientColor2: '#FFFFFF',
      backgroundGradientColor3: '#FFFFFF',
      contentBackgroundColor1: 'rgba(255, 255, 255, 0.94)',
      contentBackgroundColor2: 'rgba(255, 255, 255, 0.94)',
      checkboxIcon: 'emoji@2x.png',
      backgroundMask:
        'https://rozie-logos.s3.ca-central-1.amazonaws.com/SISO/slc2025-bg.svg',
      speaker_bio: true,
      headerSpeakerBioGradient1: '#EC7C2A',
      headerSpeakerBioGradient2: '#C8641F',
      eventLogoDark:
        'https://rozie-logos.s3.ca-central-1.amazonaws.com/SISO/slc2025-dark.svg',
      eventLogoLight:
        'https://rozie-logos.s3.ca-central-1.amazonaws.com/SISO/slc-pure-white.svg',
    },
    SISO20251: {
      topicsGradientColor1: '#101439',
      headerBackgroundGradientColor1: '#101439',
      topicsGradientColor2: '#101439',
      headerBackgroundGradientColor2: '#666DF7',
      headerBackgroundGradientColor3: '#101439',
      backgroundMask:
        'https://elsa-events-dev-assets.s3.ca-central-1.amazonaws.com/background_image.svg',
      checkboxIcon: 'emoji@2x.png',
      headerSpeakerBioGradient1: '#E6ECF5',
      headerSpeakerBioGradient2: '#E6ECF5',
      primaryColor: '#101439',
      backgroundGradientColor1: '#27B1E480',
      backgroundGradientColor2: '#F2F1FF',
      backgroundGradientColor3: '#F2F1FF',
      eventLogoDark:
        'https://rozie-logos.s3.ca-central-1.amazonaws.com/bcs/bcs2025-logo-dark.png',
      contentBackgroundColor1: 'rgba(255, 255, 255, 0.7)',
      contentBackgroundColor2: 'rgba(255, 255, 255, 0.7)',
      rozieLogoBackgroundColor2: '#2A3172',
      rozieLogoBackgroundColor1: '#101439',
      eventLogoLight:
        'https://rozie-logos.s3.ca-central-1.amazonaws.com/bcs/bcs2025-logo-light.png',
      speaker_bio: true,
      secondaryColor: '#101439',
    },
    HLTH: {
      primaryColor: '#DF4D4C',
      secondaryColor: '#D8107E',
      headerBackgroundGradientColor1: '#8d0374',
      headerBackgroundGradientColor2: '#DF4D4C',
      headerBackgroundGradientColor3: '#D8107E',
      rozieLogoBackgroundColor1: '#100C21',
      rozieLogoBackgroundColor2: '#100C21',
      topicsGradientColor1: '#EA8E35',
      topicsGradientColor2: '#D8107E',
      backgroundGradientColor1: '#e6714d59',
      backgroundGradientColor2: '#de406b1f',
      backgroundGradientColor3: '#d80f7e78',
      contentBackgroundColor1: '#ffffff8a',
      contentBackgroundColor2: '#ffffff69',
      checkboxIcon: 'emoji_orange@2x.png',
      backgroundMask: 'background_orange@2x.png',
      speaker_bio: true,
      headerSpeakerBioGradient1: '#8d0374',
      headerSpeakerBioGradient2: '#D8107E',
      eventLogoDark: '',
      eventLogoLight: '',
    },
    ITC: {
      primaryColor: '#2c22c0',
      secondaryColor: '#8f30bb',
      headerBackgroundGradientColor1: '#191640',
      headerBackgroundGradientColor2: '#6d3b8b',
      headerBackgroundGradientColor3: '#191640',
      rozieLogoBackgroundColor1: '#534ad8',
      rozieLogoBackgroundColor2: '#834c9d',
      topicsGradientColor1: '#009e3b',
      topicsGradientColor2: '#08b94c',
      backgroundGradientColor1: '#b6b4e4',
      backgroundGradientColor2: '#fff',
      backgroundGradientColor3: '#b9e2ff',
      contentBackgroundColor1: '#cfcdf3cc',
      contentBackgroundColor2: '#e9e8ff80',
      checkboxIcon: 'emoji@2x.png',
      backgroundMask: 'background@2x.png',
      speaker_bio: true,
      headerSpeakerBioGradient1: '#191640',
      headerSpeakerBioGradient2: '#6d3b8b',
      eventLogoDark: '',
      eventLogoLight: '',
    },
  } as const;
  public isLoading = false;
  public config!: ReturnType<typeof signal<TemplateConfig>>;

  private _dialogData: any;
  private _dialogRef = inject(MatDialogRef<TemplateEditorComponent>);
  private _snackBar = inject(MatSnackBar);
  private _legacyBackendApiService = inject(LegacyBackendApiService);

  onColorChange(event: Event, key: keyof TemplateConfig): void {
    const input = event.target as HTMLInputElement;
    let newValue: string | boolean = input.value;
    if (input.type === 'checkbox') {
      newValue = input.checked;
    }
    this.config.set({
      ...this.config(),
      [key]: newValue,
    });
  }

  onPresetSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const presetName = select.value as keyof typeof this.presets;
    if (presetName && this.presets[presetName]) {
      this.config.set(this.presets[presetName]);
    }
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  async copyToClipboard(): Promise<void> {
    try {
      const json = JSON.stringify(this.config(), null, 2);
      await navigator.clipboard.writeText(json);
      this._showToast('✓ Configuration copied to clipboard!');
    } catch (err) {
      this._showToast('Failed to copy to clipboard. Please try again.');
    }
  }

  resetToDefault(): void {
    this.config.set(this.presets['SLC2025']);
  }

  async saveAndClose(): Promise<void> {
    try {
      this.isLoading = true;
      const { Domain: domain, EventIdentifier: eventNameIdentifier } =
        this._dialogData.data;
      const payload = {
        domain,
        eventNameIdentifier,
        PDFReport: this.config(),
      };
      const response = await this._updateEventConfigs(payload);
      this._showToast('Event configuration updated successfully');
      this._dialogRef.close('SUCCESS');
    } catch (error: any) {
      this._showToast(
        error.message || 'Failed to update event configuration',
        true
      );
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  cancel(): void {
    this._dialogRef.close();
  }

  // Helper to show success/error toast notifications.
  private _showToast(message: string, isError: boolean = false): void {
    this._snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: isError ? ['error-snackbar'] : ['success-snackbar'],
    });
  }

  // Calls the backend API to save the event configuration.
  private async _updateEventConfigs(payload: any): Promise<any> {
    try {
      return await firstValueFrom(
        this._legacyBackendApiService.updateEventConfigs(payload)
      );
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Failed to update event configuration'
      );
    }
  }
}
