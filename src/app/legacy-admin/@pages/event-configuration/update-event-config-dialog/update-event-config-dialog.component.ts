import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';

/**
 * UpdateSessionDialogComponent
 *
 * This component is a standalone Angular Material dialog for editing event configuration settings.
 * It builds a dynamic form from a type-annotated DEFAULT_JSON schema and merges in provided dialog data.
 * Boolean schema fields render as Material radio buttons. All form fields are mapped and validated by type.
 * On submission, the merged data is sent to the backend service as a payload.
 *
 * Usage:
 * Open as a dialog, passing `{ data: <existing-event-config> }` via MAT_DIALOG_DATA.
 *
 * Key Features:
 *  - Dynamic form generation with complex nesting
 *  - Type-sensitive rendering (boolean fields use radio buttons)
 *  - Supports add/remove for array fields (languages, sponsors)
 *  - Merges defaults with provided config using type info
 */
@Component({
  selector: 'app-update-event-config-dialog',
  standalone: true,
  templateUrl: './update-event-config-dialog.component.html',
  styleUrls: ['./update-event-config-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatRadioModule,
  ],
})
export class UpdateEventConfigDialogComponent implements OnInit {
  dialogData = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<UpdateEventConfigDialogComponent>);
  private _legacyBackendApiService = inject(LegacyBackendApiService);
  private _snackBar = inject(MatSnackBar);
  /** Dynamic default schema with type/value wrappers for intelligent form rendering */
  DEFAULT_JSON = {
    EnableTranslation: { type: 'boolean', value: false },
    EnableDiarization: { type: 'boolean', value: false },
    EventStatus: { type: 'string', value: '' },
    SupportedLanguages: {
      type: 'array',
      value: [
        {
          value: { type: 'string', value: '' },
          code: { type: 'string', value: '' },
          label: { type: 'string', value: '' },
        },
      ],
    },
    OriginalLanguageCode: { type: 'string', value: '' },
    Features: {
      type: 'object',
      value: {
        ShowAgendaDateFilter: { type: 'boolean', value: false },
        ShowPromotionalMessage: { type: 'boolean', value: false },
        ShowHashtags: { type: 'boolean', value: false },
        ShowAgendaTrackFilter: { type: 'boolean', value: false },
        ShowTrackTrendsButton: { type: 'boolean', value: false },
        ShowSponsorsInfoWhileLoadingDebrief: { type: 'boolean', value: false },
        ShowDailyDebriefButton: { type: 'boolean', value: false },
        ShowCollectEmailsDialog: { type: 'boolean', value: false },
        ShowModeratorsOnTop: { type: 'boolean', value: false },
        ShowSessionCardTrack: { type: 'boolean', value: false },
        ShowFooterSponsorLogo: { type: 'boolean', value: false },
        ShowAccessSessionReportsButton: { type: 'boolean', value: false },
        ShowSessionCardTime: { type: 'boolean', value: false },
        ShowSpeakersFilter: { type: 'boolean', value: false },
      },
    },
    ModelSettings: {
      type: 'object',
      value: {
        Provider: { type: 'string', value: '' },
      },
    },
    AudioConfig: {
      type: 'object',
      value: {
        Stability: { type: 'number', value: 0 },
        UseSpeakerBoost: { type: 'boolean', value: false },
        Service: { type: 'string', value: '' },
        SimilarityBoost: { type: 'number', value: 0 },
        Style: { type: 'number', value: 0 },
        VoiceId: { type: 'string', value: '' },
        AudioAutoGeneration: { type: 'boolean', value: false },
        ModelId: { type: 'string', value: '' },
      },
    },
    Information: {
      type: 'object',
      value: {
        Timezone: { type: 'string', value: '' },
        EventDomain: { type: 'string', value: '' },
        BoothNumber: { type: 'string', value: '' },
        EventNameDisplay: { type: 'string', value: '' },
        FooterUrl: { type: 'string', value: '' },
        Images: {
          type: 'object',
          value: {
            EventQR: { type: 'string', value: '' },
          },
        },
        SelectedLanguage: { type: 'string', value: '' },
        Hashtags: { type: 'string', value: '' },
        Texts: {
          type: 'object',
          value: {
            WelcomeMessage: { type: 'string', value: '' },
            ThankYouMessage: { type: 'string', value: '' },
          },
        },
        Logos: {
          type: 'object',
          value: {
            Dark: { type: 'string', value: '' },
            Light: { type: 'string', value: '' },
          },
        },
      },
    },
    Themes: {
      type: 'object',
      value: {
        Light: {
          type: 'object',
          value: {
            BackgroundImage: { type: 'string', value: '' },
            Colors: {
              type: 'object',
              value: {
                CardGradientHoverEnd: { type: 'string', value: '' },
                PrimaryGradientStart: { type: 'string', value: '' },
                PrimaryColorVariant2: { type: 'string', value: '' },
                BackgroundPatchLeftTop: { type: 'string', value: '' },
                CardGradientHoverStart: { type: 'string', value: '' },
                BackgroundPatchGradientBottomEnd: { type: 'string', value: '' },
                BackgroundPatchRightMiddle: { type: 'string', value: '' },
                BackgroundPatchGradientBottomStart: {
                  type: 'string',
                  value: '',
                },
                BackgroundPatchLeftMiddle: { type: 'string', value: '' },
                PrimaryGradientEnd: { type: 'string', value: '' },
              },
            },
          },
        },
      },
    },
    Sponsors: {
      type: 'array',
      value: [
        {
          Logo: { type: 'string', value: '' },
          Name: { type: 'string', value: '' },
        },
      ],
    },
  };

  /** Holds the merged data used to build the form */
  jsonData = this.mergeWithDefault(this.dialogData.data, this.DEFAULT_JSON);

  /** Built FormGroup backing the editor UI */
  form!: FormGroup;
  /** Loading state shown as Material progress bar */
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Lifecycle hook builds the dynamic form structure on init.
   */
  ngOnInit(): void {
    this.form = this.buildFormFromJson(this.jsonData);
    setTimeout(() => this.cdr.detectChanges());
  }

  /**
   * Recursively merges user event config input with the provided DEFAULT_JSON schema.
   * Respects type/value wrappers, preserving all dynamic and nested default structure.
   *
   * @param input - Possibly partial config object to merge
   * @param defaultJson - The DEFAULT_JSON schema
   * @returns Fully merged plain object for binding to forms
   */
  mergeWithDefault(input: any, defaultJson: any) {
    // If this is a type/value wrapper, recurse on its value
    if (
      defaultJson &&
      typeof defaultJson === 'object' &&
      'type' in defaultJson &&
      'value' in defaultJson
    ) {
      const defType = defaultJson.type;
      const defVal = defaultJson.value;
      if (
        defType === 'object' &&
        typeof defVal === 'object' &&
        defVal !== null &&
        !Array.isArray(defVal)
      ) {
        // recurse for objects
        const result = {};
        for (const key in defVal) {
          result[key] = this.mergeWithDefault(
            input ? input[key] : undefined,
            defVal[key]
          );
        }
        return result;
      } else if (defType === 'array' && Array.isArray(defVal)) {
        if (Array.isArray(input) && input.length > 0) {
          if (
            typeof defVal[0] === 'object' &&
            defVal[0] &&
            'type' in defVal[0]
          ) {
            // Arrays of objects, recurse each entry using the default object's schema
            return input.map((item, idx) =>
              this.mergeWithDefault(item, defVal[0])
            );
          } else {
            // Arrays of primitives
            return input;
          }
        } else {
          // Use empty copy of default
          if (
            typeof defVal[0] === 'object' &&
            defVal[0] &&
            'type' in defVal[0]
          ) {
            return [this.mergeWithDefault(undefined, defVal[0])];
          } else {
            return JSON.parse(JSON.stringify(defVal));
          }
        }
      } else {
        // primitive (string, number, boolean, etc.)
        return input !== undefined && input !== null ? input : defVal;
      }
    }
    // In case the input DEFAULT_JSON does not wrap as expected fallback
    if (Array.isArray(defaultJson)) {
      if (Array.isArray(input) && input.length > 0) {
        if (typeof defaultJson[0] === 'object') {
          return input.map((item, idx) =>
            this.mergeWithDefault(item, defaultJson[0])
          );
        } else {
          return input;
        }
      } else {
        return JSON.parse(JSON.stringify(defaultJson));
      }
    } else if (typeof defaultJson === 'object' && defaultJson !== null) {
      const result = {};
      for (const key in defaultJson) {
        if (input && key in input) {
          result[key] = this.mergeWithDefault(input[key], defaultJson[key]);
        } else {
          result[key] = JSON.parse(JSON.stringify(defaultJson[key]));
        }
      }
      return result;
    } else {
      return input !== undefined && input !== null ? input : defaultJson;
    }
  }

  /**
   * Recursively build FormGroup tree from merged JSON data structure
   * @param data - The fully merged config object
   * @returns FormGroup representing the editor structure
   */
  buildFormFromJson(data: any): FormGroup {
    const group: Record<string, AbstractControl> = {};

    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (Array.isArray(value)) {
        group[key] = this.fb.array(
          value.map((v) =>
            typeof v === 'object' && v !== null
              ? this.buildFormFromJson(v)
              : this.fb.control(v)
          )
        );
      } else if (value !== null && typeof value === 'object') {
        group[key] = this.buildFormFromJson(value);
      } else {
        group[key] = this.fb.control(value);
      }
    });

    return this.fb.group(group);
  }

  /**
   * Get controls object for current FormGroup (for structural template rendering)
   */
  getControls(group: FormGroup): { [key: string]: AbstractControl } {
    return group.controls;
  }

  /**
   * Get controls for current FormArray (used for rendering arrays in template)
   */
  getArrayControls(array: FormArray): AbstractControl[] {
    return array.controls;
  }

  /**
   * Type guard for FormGroup
   */
  isFormGroup(control: AbstractControl): control is FormGroup {
    return control instanceof FormGroup;
  }

  /**
   * Type guard for FormArray
   */
  isFormArray(control: AbstractControl): control is FormArray {
    return control instanceof FormArray;
  }

  /**
   * Type guard for FormControl
   */
  isFormControl(control: AbstractControl): control is FormControl {
    return control instanceof FormControl;
  }

  /** Add a new language entry to the SupportedLanguages array */
  addLanguage() {
    const langArray = this.form.get('SupportedLanguages') as FormArray;
    if (!langArray) return;

    langArray.push(
      this.fb.group({
        value: [''],
        code: [''],
        label: [''],
      })
    );
  }

  /** Remove a language entry by array index */
  removeLanguage(index: number) {
    const langArray = this.form.get('SupportedLanguages') as FormArray;
    if (!langArray) return;

    langArray.removeAt(index);
  }

  /** Add a new sponsor to the Sponsors array */
  addSponsor() {
    const sponsorsArray = this.form.get('Sponsors') as FormArray;
    if (!sponsorsArray) return;

    sponsorsArray.push(
      this.fb.group({
        Logo: [''],
        Name: [''],
      })
    );
  }

  /** Remove a sponsor entry by array index */
  removeSponsor(index: number) {
    const sponsorsArray = this.form.get('Sponsors') as FormArray;
    if (!sponsorsArray) return;

    sponsorsArray.removeAt(index);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this._snackBar.open(
        'Please fill in all required fields correctly.',
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    try {
      this.isLoading = true;

      // Get form values
      const formData = this.form.value;
      const { Domain: domain, EventIdentifier: eventNameIdentifier } =
        this.dialogData.data;
      const {
        SupportedLanguages: supportedLanguages,
        EnableDiarization: enableDiarization,
        EnableTranslation: enableTranslation,
        EventStatus: eventStatus,
      } = formData;
      // Prepare the payload by combining domain and eventNameIdentifier with form data
      delete formData['EnableTranslation'];
      delete formData['EnableDiarization'];
      delete formData['SupportedLanguages'];
      delete formData['EventStatus'];
      const payload = {
        domain,
        eventNameIdentifier,
        enableTranslation,
        enableDiarization,
        eventStatus,
        supportedLanguages,
        ...formData,
      };

      // Update event configuration
      const response = await this._updateEventConfigs(payload);
      this._snackBar.open('Event configuration updated successfully', 'Close', {
        duration: 3000,
      });
      this.dialogRef.close('SUCCESS');
    } catch (error: any) {
      this._snackBar.open(
        error.message || 'Failed to update event configuration',
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
    } finally {
      this.isLoading = false;
    }
  }

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

  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Extracts type string of a property at a specific key path from DEFAULT_JSON
   * Used to determine how to render primitive controls (e.g., boolean as radio group)
   * @param key - Field name
   * @param group - Parent FormGroup instance (for tree pathing)
   * @returns Type string ('boolean', 'string', 'array', etc.) or undefined
   */
  getFieldType(key: string, group: FormGroup): string {
    // Traverse the structure to resolve type by key path
    // This relies on naming in DEFAULT_JSON and form structure matching
    let fullPath: string[] = [];
    let parent = group;
    while (parent && parent.parent) {
      const parentKey = Object.entries(
        (parent.parent as FormGroup).controls
      ).find(([k, v]) => v === parent)?.[0];
      if (parentKey) {
        fullPath.unshift(parentKey);
        parent = parent.parent as FormGroup;
      } else {
        break;
      }
    }
    fullPath.push(key);

    // Recursively resolve
    let typeNode: any = this.DEFAULT_JSON;
    for (const keyPiece of fullPath) {
      if (typeNode && 'value' in typeNode) {
        typeNode = typeNode.value;
      }
      if (typeNode && typeNode[keyPiece]) {
        typeNode = typeNode[keyPiece];
      } else {
        return undefined;
      }
    }
    return typeNode && typeof typeNode === 'object' && 'type' in typeNode
      ? typeNode.type
      : undefined;
  }
}
