import { CommonModule } from '@angular/common';
import { Component, inject, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { TIMEZONE_OPTIONS } from 'src/app/legacy-admin/@data-providers/timezone.data-provider';
import {
  Session,
  SpeakerDetails
} from 'src/app/legacy-admin/@pages/agenda/agenda.component';
import { BackendApiService } from 'src/app/legacy-admin/@services/backend-api.service';
import * as XLSX from 'xlsx';
import {
  resizeImage, UploadImageComponent,
  uploadSpeakerImage, urlToFile
} from '../upload-image-component/upload-image.component';

@Component({
  selector: 'app-upload-agenda-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatProgressBarModule,
    MatExpansionModule,
    UploadImageComponent,
  ],
  templateUrl: './upload-agenda-dialog.component.html',
  styleUrls: ['./upload-agenda-dialog.component.scss'],
  styles: [
    /* The styles we provided earlier */
  ],
})
export class UploadAgendaDialogComponent {
  public dialogRef = inject(MatDialogRef<UploadAgendaDialogComponent>);
  public dialogData = inject(MAT_DIALOG_DATA) as {
    nextSessionId: string;
    eventName: string;
    trackList: string[];
    adjustSessionTimesFn: (data: any) => Session[];
    displayErrorMessageFn: (msg: string) => void;
  };
  public nextSessionId: string = this.dialogData.nextSessionId;
  public eventName: string = this.dialogData.eventName;
  public trackOptions: string[] = this.dialogData.trackList || [];

  public sessions: Session[] = [];
  public errorMessage: string = '';
  public isLoading: boolean;
  public isUploading: boolean;
  public displayedColumns: string[] = [
    'Session Title',
    'Start Time',
    'End Time',
    'Track',
    'Type',
    'Stage',
  ];
  public selectedTimezone: string = '+0:00';
  public timezones: { value: string; label: string }[] =
    inject(TIMEZONE_OPTIONS);
  public isDragging = false;
  public filteredTrackOptions: Signal<string[]>;
  private _speakerImageMap: Record<string, string> = { '': '' };
  private _backendApiService = inject(BackendApiService);

  getFilteredTrackOptions(input: string): string[] {
    // If there is no input, return all available options.
    if (!input) {
      return this.trackOptions;
    }
    const filterValue = input.toLowerCase();
    return this.trackOptions.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
  }

  onFileChange(evt: Event): void {
    const target = evt.target as HTMLInputElement;
    if (!target.files || target.files.length !== 1) {
      this.errorMessage = 'Please select exactly one file.';
      return;
    }
    this.handleFile(target.files[0]);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  createDateTimeString(dateStr: string, timeStr: string): string {
    // Parse the date and time
    const date = new Date(dateStr); // Creates a Date object from the date string

    const timeParts = timeStr.match(/(\d+):(\d+) (AM|PM)/i); // Extract hours, minutes, and period
    if (!timeParts) {
      throw new Error('Invalid time format. Expected format: "HH:MM AM/PM"');
    }

    let hours = parseInt(timeParts[1], 10);
    const minutes = parseInt(timeParts[2], 10);
    const period = timeParts[3].toUpperCase();

    // Convert 12-hour time to 24-hour time
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    // Set the time on the date object
    date.setHours(hours, minutes, 0, 0);

    // Format the date and time in the desired format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours24 = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    const secs = String(date.getSeconds()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day} ${hours24}:${mins}:${secs}`;
    // Create the final date string in the format "YYYY-MM-DD HH:MM:SS+00:00"
    return formattedDate;
  }

  getNextSessionId(): string {
    const nextId = this.nextSessionId;
    const maxSessionId = parseInt(this.nextSessionId.split('_')[1], 10); // Default to 0 if empty
    const newSessionIdNumber = maxSessionId + 1;
    const prefix = this.eventName;
    this.nextSessionId = `${prefix}_${newSessionIdNumber.toString().padStart(3, '0')}`;
    return nextId;
  }

  convertExcelDateToReadable(date: string): string {
    let jsDate = new Date();
    if (date) {
      const excelDate = 45746;
      jsDate = new Date((excelDate - 25569) * 86400 * 1000);
    }
    const year = jsDate.getFullYear();
    const month = String(jsDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(jsDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Format as "YYYY-MM-DD"
  }

  getDurationInMinutes(startTime, endTime): string {
    // Helper function to convert a 12-hour time string to minutes since midnight.
    const parseTime = (timeStr): number => {
      const [time, period] = timeStr.trim().split(' ');
      const [hoursStr, minutesStr] = time.split(':');
      let hours = Number(hoursStr);
      const minutes = Number(minutesStr);

      if (hours === 12) hours = 0;
      if (period.toUpperCase() === 'PM') hours += 12;
      return hours * 60 + minutes;
    };
    const startMinutes = parseTime(startTime);
    let endMinutes = parseTime(endTime);

    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const totalMinutes = endMinutes - startMinutes;
    return `${totalMinutes}` || '40';
  }

  addSpeaker(session: Session): void {
    if (!session.SpeakersInfo) {
      session.SpeakersInfo = [];
    }
    session.SpeakersInfo.push({
      Title: '',
      Url: '',
      SpeakerBio: '',
      S3FileKey: '',
      Name: '',
      isModerator: false,
      Organization: '',
    });
  }

  removeSpeaker(session: Session, index: number): void {
    if (session.SpeakersInfo && session.SpeakersInfo.length > index) {
      session.SpeakersInfo.splice(index, 1);
    }
  }

  close(): void {
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

  isSessionDatesValid(sessions: Session[]): boolean {
    for (const session of sessions) {
      const startsAt = new Date(session.StartsAt);
      const endsAt = new Date(session.EndsAt);
      if (endsAt <= startsAt) {
        return false;
      }
    }
    return true;
  }

  updateSpeakerImage(speakerImage: string, speaker: SpeakerDetails): void {
    speaker.S3FileKey = speakerImage;
  }

 
  confirm(): void {
    if (this.validateSessions()) {
      if (!this.isSessionDatesValid(this.sessions)) {
        this.dialogData.displayErrorMessageFn(
          'Invalid Session Start and End time. Please update the details and retry.'
        );
        return;
      }
      this.isLoading = true;
      if (this.dialogData.adjustSessionTimesFn) {
        const updatedSessionDetails = this.dialogData.adjustSessionTimesFn(
          this.updateSessionTimes(this.sessions)
        );
        this._backendApiService.updateAgenda(updatedSessionDetails).subscribe({
          next: (response) => {
            this.dialogRef.close('SUCCESS');
            this.isLoading = false;
          },
          error: (error) => {
            this.dialogData.displayErrorMessageFn(
              'Server Error. Failed update the session data.'
            );
            console.error('Error fetching data:', error);
            this.isLoading = false;
          },
        });
      } else {
        this.dialogData.displayErrorMessageFn(
          'Error formatting Session Date and Time'
        );
        return;
      }
    } else {
      this.dialogData.displayErrorMessageFn(
        'Session details not valid. Please update the session details and retry.'
      );
    }
  }

  convertExcelTimeToReadable(timeValue: number): string {
    const totalHours = timeValue * 24;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    // Format as "HH:MM AM/PM"
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }


  private validateSessions(): boolean {
    const invalidSessions = this.sessions.filter(
      (session) =>
        !session.SessionTitle?.trim() ||
        !session.SessionId?.trim() ||
        !session.StartsAt
    );

    if (invalidSessions.length > 0) {
      this.errorMessage = `Please fill all required fields for ${invalidSessions.length} session(s)`;
      return false;
    }
    return true;
  }

  private async getSpeakersDetails(
    speakerData: any[],
    speakers: string,
    moderators: string
  ): Promise<SpeakerDetails[]> {
    if (!speakerData) speakerData = []; // Guard against undefined/null

    const speakerList = speakers
      .trim()
      .split(',')
      .map((name) => name.trim());
    const moderatorList = moderators
      .trim()
      .split(',')
      .map((name) => name.trim());
    const speakerInfo: SpeakerDetails[] = [];

    // Helper async function to avoid duplicate code.
    const addSpeaker = async (
      name: string,
      isModerator: boolean
    ): Promise<void> => {
      if (name === '') {
        return;
      }
      const speaker = speakerData.find((s) => s.Name === name) || {};
      let S3FileKey = '';
      if (speaker.Url) {
        if (this._speakerImageMap && speaker.Url in this._speakerImageMap) {
          S3FileKey = this._speakerImageMap[speaker.Url];
        } else {
          this._speakerImageMap[speaker.Url] = '';
          const speakerImageFile = await urlToFile(
            speaker.Url,
            speaker.Name
          );
          if (speakerImageFile) {
            const resizedFile = await resizeImage(speakerImageFile, 400, 400);
            S3FileKey = await uploadSpeakerImage(
              resizedFile,
              this._backendApiService
            );
            this._speakerImageMap[speaker.Url] = S3FileKey;
          } else {
            this.errorMessage += `Error fetching Image: ${speaker.Url}<br>`;
            speaker.Url = '';
          }
        }
      }
      speakerInfo.push({
        Title: speaker.Title || '',
        S3FileKey: S3FileKey,
        Url: speaker.Url || '',
        SpeakerBio: speaker.bio || '',
        Name: speaker.Name || name,
        isModerator,
        Organization: speaker.Organization || '',
      });
    };

    const speakerPromises = speakerList.map((name) => addSpeaker(name, false));
    const moderatorPromises = moderatorList.map((name) =>
      addSpeaker(name, true)
    );

    await Promise.all([...speakerPromises, ...moderatorPromises]);
    return speakerInfo;
  }

  private handleFile(file: File): void {
    const reader: FileReader = new FileReader();

    reader.onload = async (e: any) => {
      try {
        this.isLoading = true;
        const bstr: string = e.target.result;
        const workbook: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames.find(
          (name) => name.toLowerCase() === 'session details'
        );
        const speakerSheetName = workbook.SheetNames.find(
          (name) => name.toLowerCase() === 'speaker details'
        );

        if (!sheetName) {
          this.errorMessage =
            'The Excel file does not contain a "session details" tab.';
          return;
        }

        if (!speakerSheetName) {
          this.errorMessage =
            'The Excel file does not contain a "speaker details" tab.';
          return;
        }

        const jsonData: any[] = XLSX.utils.sheet_to_json(
          workbook.Sheets[sheetName],
          { defval: '' }
        );
        const speakerJsonData: any[] = XLSX.utils.sheet_to_json(
          workbook.Sheets[speakerSheetName],
          { defval: '' }
        );
        this.sessions = await Promise.all(
          jsonData.map(async (row) => {
            // Await the asynchronous getSpeakersDetails call
            const speakersInfo = await this.getSpeakersDetails(
              speakerJsonData,
              row['Speakers'],
              row['Moderator']
            );

            const session: Session = {
              GenerateInsights: false,
              Event: this.eventName,
              Track: row['Track'] || 'General',
              SessionTitle: row['SessionTitle'] || row['Session Title'] || '',
              SessionId:
                row['SessionId'] ||
                row['Session ID'] ||
                this.getNextSessionId(),
              SpeakersInfo: speakersInfo || [],
              SessionDescription:
                row['Description'] || row['Session Description'] || '',
              Status: 'NOT_STARTED',
              Editor: '',
              EndsAt:
                row['Date'] && row['End Time']
                  ? this.createDateTimeString(
                      this.convertExcelDateToReadable(row['Date']),
                      this.convertExcelTimeToReadable(row['End Time'])
                    )
                  : '',
              Type: row['Type'] || row['Session Type'] || 'presentation',
              PrimarySessionId:
                row['PrimarySessionId'] || row['Primary Session ID'] || '',
              EventDay: row['EventDay'] || row['Event Day'] || 'Day 1',
              Duration:
                this.getDurationInMinutes(
                  this.convertExcelTimeToReadable(row['Start Time']),
                  this.convertExcelTimeToReadable(row['End Time'])
                ) || '40',
              Location: row['Location'] || row['Stage'] || '',
              SessionSubject:
                row['SessionSubject'] || row['Session Subject'] || '',
              StartsAt:
                row['Date'] && row['Start Time']
                  ? this.createDateTimeString(
                      this.convertExcelDateToReadable(row['Date']),
                      this.convertExcelTimeToReadable(row['Start Time'])
                    )
                  : '',
            };

            return session;
          })
        );

        // Now map over the sessions to ensure PrimarySessionId is set from SessionId
        this.sessions = this.sessions.map((session) => ({
          ...session,
          PrimarySessionId: session.SessionId,
        }));

        // Assign cache S3FileKey from the _speakerImageMap for multiple occarances of the same speaker
        for (const session of this.sessions) {
          for (const speaker of session.SpeakersInfo) {
            speaker.S3FileKey = this._speakerImageMap?.[speaker.Url] ?? '';
            speaker.Url = this._speakerImageMap?.[speaker.Url]
              ? speaker.Url
              : '';
          }
        }
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
        console.error('Error processing Excel file:', error);
        this.errorMessage = 'There was an error processing the file.';
      }
    };

    reader.onerror = () => {
      this.errorMessage = 'Error reading file';
    };

    if (
      file.type.match(
        /(application\/vnd.ms-excel|application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet)/
      )
    ) {
      reader.readAsBinaryString(file);
    } else {
      this.errorMessage = 'Unsupported file type. Please upload an Excel file.';
    }
  }
}
