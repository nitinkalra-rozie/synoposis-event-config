import {
  Component,
  inject,
  Inject,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  FormControl,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Session, SpeakerDetails } from '../agenda.component';
import { MatSelectModule } from '@angular/material/select';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { map, startWith } from 'rxjs/operators';
import { BackendApiService } from 'src/app/@services/backend-api.service';

@Component({
  selector: 'app-large-modal-dialog',
  templateUrl: './original-debrief-modal-dialog.component.html',
  styleUrls: ['./original-debrief-modal-dialog.component.scss'],
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
  ],
})
export class SessionDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<SessionDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public dialogData: { data: Session; type: string; trackList: string[] },
    private fb: FormBuilder
  ) {
    this.sessionForm = this.createForm(this.dialogData.data);
    this.trackOptions = this.dialogData.trackList || [];
    this.filteredTrackOptions = toSignal(
      this.sessionForm.get('Track').valueChanges.pipe(
        startWith(''),
        map((value) => this._filter(value || ''))
      )
    );
  }
  public sessionForm: FormGroup;
  public type: WritableSignal<String> = signal(this.dialogData.type);
  public filteredTrackOptions: Signal<string[]>;
  public isLoading: boolean;
  public trackOptions: string[] = [];
  private _backendApiService = inject(BackendApiService);

  public get trackControl(): FormControl {
    return this.sessionForm.get('Track') as FormControl;
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
      SpeakerBio: [speaker?.SpeakerBio || ''],
      isModerator: [speaker?.isModerator || false],
    });
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

  saveChanges(): void {
    console.log(this.sessionForm.getRawValue());
    this.isLoading = true;
    if (this.sessionForm.valid) {
      this._backendApiService
        .updateAgenda([this.sessionForm.getRawValue()])
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.dialogRef.close('SUCCESS');
          },
          error: (error) => {
            console.error('Error fetching data:', error);
          },
        });
    }
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.trackOptions.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
  }
}
