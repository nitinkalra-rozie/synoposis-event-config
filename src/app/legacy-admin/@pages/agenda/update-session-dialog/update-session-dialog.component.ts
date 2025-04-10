import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { map, startWith } from 'rxjs/operators';
import { BackendApiService } from 'src/app/legacy-admin/@services/backend-api.service';
import { Session, SpeakerDetails } from '../agenda.component';
import { UploadImageComponent } from '../upload-image-component/upload-image.component';

@Component({
  selector: 'app-update-session-dialog',
  templateUrl: './update-session-dialog.component.html',
  styleUrls: ['./update-session-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatCardModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatProgressBarModule,
    MatSelectModule,
    UploadImageComponent,
  ],
})
export class UpdateSessionDialogComponent {
  public dialogData = inject(MAT_DIALOG_DATA) as {
    adjustSessionTimesFn: (data: Session[]) => Session[];
    displayErrorMessageFn: (msg: string) => void;
    data: Session;
    type: string;
    trackList: string[];
  };

  public dialogRef = inject(MatDialogRef<UpdateSessionDialogComponent>);
  public fb = inject(FormBuilder);

  public sessionForm: FormGroup = this.createForm(this.dialogData.data);
  public trackOptions: string[] = this.dialogData.trackList || [];
  public filteredTrackOptions: Signal<string[]> = toSignal(
    this.sessionForm.get('Track')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || ''))
    )
  );
  public type: WritableSignal<string> = signal(this.dialogData.type);
  public isLoading: boolean = false;
  public isUploading = false;
  private _backendApiService = inject(BackendApiService);

  public get trackControl(): FormControl {
    return this.sessionForm.get('Track') as FormControl;
  }

  updateSpeakerImage(speakerImage: string, speaker: any): void {
    speaker.get('S3FileKey').setValue(speakerImage);
  }

  removeImage(speaker): void {
    speaker.get('Url')?.setValue(null);
  }

  createForm(session: Session): FormGroup {
    return this.fb.group({
      GenerateInsights: [true, Validators.required],
      Event: [{ value: session.Event, disabled: true }, Validators.required],
      Track: [session.Track || 'General', Validators.required],
      SessionTitle: [session.SessionTitle, Validators.required],
      SessionId: [
        { value: session.SessionId, disabled: true },
        Validators.required,
      ],
      SessionDescription: [session.SessionDescription],
      Status: [session.Status, Validators.required],
      EndsAt: [session.EndsAt, Validators.required],
      Type: [session.Type, Validators.required],
      PrimarySessionId: [session.PrimarySessionId],
      EventDay: [session.EventDay],
      Duration: [{ value: session.Duration, disabled: false }],
      Location: [session.Location],
      SessionSubject: [session.SessionSubject],
      StartsAt: [session.StartsAt, Validators.required],
      SpeakersInfo: this.fb.array(
        session.SpeakersInfo.map((speaker) => this.createSpeakerForm(speaker))
      ),
    });
  }

  onSelectionChange(selectedValue: string): void {
    // Clear the newTrack control if the selection is not "other"
    if (selectedValue !== 'other') {
      this.sessionForm.get('newTrack').setValue('');
    }
  }

  createSpeakerForm(speaker?: SpeakerDetails): FormGroup {
    return this.fb.group({
      Name: [speaker?.Name || '', Validators.required],
      Title: [speaker?.Title || ''],
      Organization: [speaker?.Organization || ''],
      Url: [speaker?.Url || ''],
      S3FileKey: [this.getS3KeyFromUrl(speaker?.Url) || ''],
      SpeakerBio: [speaker?.SpeakerBio || ''],
      isModerator: [speaker?.isModerator || false],
    });
  }

  getS3KeyFromUrl(presignedUrl: string): string {
    if (presignedUrl) {
      const S3FileKey = new URL(presignedUrl).pathname.substring(1);
      return S3FileKey;
    } else {
      return '';
    }
  }

  public get speakers(): FormArray {
    return this.sessionForm.get('SpeakersInfo') as FormArray;
  }

  addSpeaker(): void {
    this.speakers.push(this.createSpeakerForm());
  }

  removeSpeaker(index: number): void {
    this.speakers.removeAt(index);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  updateSessionTimes(sessions: Session[]): Session[] {
    return sessions.map((session) => {
      const updatedSession = { ...session };
      if (
        typeof updatedSession.StartsAt === 'string' &&
        !updatedSession.StartsAt.endsWith('+0000')
      ) {
        updatedSession.StartsAt += '+0000';
      }
      if (
        typeof updatedSession.EndsAt === 'string' &&
        !updatedSession.EndsAt.endsWith('+0000')
      ) {
        updatedSession.EndsAt += '+0000';
      }
      return updatedSession;
    });
  }

  convertIsoToCustomFormat(isoString: string): string {
    const d = new Date(isoString);
    const date = [
      d.getFullYear(),
      (d.getMonth() + 1).toString().padStart(2, '0'),
      d.getDate().toString().padStart(2, '0'),
    ].join('-');
    const time = [
      d.getHours().toString().padStart(2, '0'),
      d.getMinutes().toString().padStart(2, '0'),
      d.getSeconds().toString().padStart(2, '0'),
    ].join(':');
    return `${date} ${time}`;
  }

  saveChanges(): void {
    this.isLoading = true;
    if (this.sessionForm.valid) {
      const sessionData: Session = this.sessionForm.getRawValue();
      if (
        this.convertIsoToCustomFormat(sessionData.StartsAt) >
        this.convertIsoToCustomFormat(sessionData.EndsAt)
      ) {
        this.dialogData.displayErrorMessageFn(
          'Error incorrect Start and End time. Please update.'
        );
        this.isLoading = false;
        return;
      }
      if (this.dialogData.adjustSessionTimesFn) {
        sessionData.SpeakersInfo = sessionData.SpeakersInfo.map((speaker) => {
          speaker.Url = '';
          return speaker;
        });
        const formattedSessionDetails = this.updateSessionTimes([sessionData]);

        const updatedSessionDetails: Session[] =
          this.dialogData.adjustSessionTimesFn(formattedSessionDetails);

        this._backendApiService.updateAgenda(updatedSessionDetails).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.dialogRef.close('SUCCESS');
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error fetching data:', error);
            this.dialogData.displayErrorMessageFn(
              'Error updating session data. Please try again.'
            );
          },
        });
      }
    } else {
      this.dialogData.displayErrorMessageFn(
        'Session details not valid. Please update the session details and retry.'
      );
    }
  }

  private validateImage(file: File): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (!validTypes.includes(file.type)) {
      this.dialogData.displayErrorMessageFn(
        'Invalid file type. Please upload a JPEG, PNG or GIF.'
      );
      return false;
    }

    if (file.size > maxSize) {
      this.dialogData.displayErrorMessageFn(
        'File size too large. Max 5MB allowed.'
      );
      return false;
    }

    return true;
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.trackOptions.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
  }
}
