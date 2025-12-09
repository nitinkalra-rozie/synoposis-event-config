/**
 * EventConfigurationComponent
 *
 * This component displays and manages event configurations in an Angular Material data table.
 * It provides server-side/async-driven interactive features, including sorting, filtering, and pagination using MatTableDataSource, MatPaginator, and MatSort.
 * The user may filter events by keyword, select for editing, and navigate paginated results.
 * The paginator and sorting are both tightly synchronized with all data changes, keeping the table and its controls up to date.
 *
 * Used in Elsa Events Admin for robust event configuration workflow.
 *
 * Main responsibilities:
 *  - Fetch and display all event configs
 *  - Provide real-time filtering
 *  - Enable detail editing via dialogs
 *  - Maintain proper table/page state on async refresh
 */
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';

import { TopBarComponent } from 'src/app/legacy-admin/@components/top-bar/top-bar.component';
import { TemplateEditorComponent } from './pdf-template-editor/pdf-template-editor.component';

import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { BackendApiService } from 'src/app/legacy-admin/@services/backend-api.service';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';
import { UpdateEventConfigDialogComponent } from './update-event-config-dialog/update-event-config-dialog.component';

interface Application {
  value: string;
  name: string;
}

interface SelectedConfig {
  type: string;
  application_id: string;
  config: any;
}

export interface SpeakerDetails {
  Title: string;
  Organization: string;
  Url: string;
  S3FileKey: string;
  SpeakerBio: string;
  isModerator: boolean;
  Name: string;
}

export interface Session {
  GenerateInsights: boolean;
  EventDay: string;
  SessionTitle: string;
  SessionDescription: string;
  SessionSubject: string;
  SessionId: string;
  PrimarySessionId: string;
  Track: string;
  Status: string;
  Location: string;
  StartsAt: string;
  EndsAt: string;
  Editor: string;
  Duration: string;
  Type: string;
  Event: string;
  SpeakersInfo: Array<SpeakerDetails>;
  ShouldHideOnSecondScreen?: boolean;
  pdfVersion?: number;
}

interface RealtimeInsight {
  Timestamp: string;
  Insights: Array<string>;
}

@Component({
  selector: 'app-elsa-event-configuration',
  templateUrl: './event-configuration.component.html',
  styleUrls: ['./event-configuration.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSnackBarModule,
    MatDialogModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSortModule,
    MatMenuModule,
    MatTableModule,
    MatToolbarModule,
    TopBarComponent,
    MatPaginatorModule,
  ],
  providers: [],
})
export class EventConfigurationComponent implements OnInit, AfterViewInit {
  constructor(
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    console.log('AgendaComponent loaded');
    this.matIconRegistry.addSvgIconSet(
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/mdi.svg')
    );
  }

  @ViewChild(MatPaginator) public paginator!: MatPaginator;
  @ViewChild(MatSort) public sort!: MatSort;

  public pageSize = 10;
  public breadCrumbItems!: Array<{}>;
  public yourHtmlContent!: SafeHtml;
  public isLoading: boolean = true;
  public dataLoaded: boolean = false;
  public trends: Array<{ title: string; description: string }> = [];
  public selectedTimezone: string = '+0:00';
  public eventTimezone: string = '+0:00';

  public displayedColumns: string[] = ['EventIdentifier', 'Domain', 'actions'];

  public dataSource = new MatTableDataSource<Session>([]);
  public selectedRowIndex: number | null = null;
  public totalRecords = 10;

  private _backendApiService = inject(BackendApiService);
  private _legacyBackendApiService = inject(LegacyBackendApiService);
  private _authFacade = inject(AuthFacade);

  // -- Lifecycle and Methods with explicit return types:
  ngOnInit(): void {
    // BreadCrumb Set
    this.breadCrumbItems = [
      { label: 'Elsa Events' },
      { label: 'Edit Report', active: true },
    ];
    this.isLoading = true;
    this.getEventConfigurations();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  showError(): void {
    this.snackBar.open(
      'This session debriefs are not available yet!',
      'Close',
      { duration: 5000, panelClass: ['error-snackbar'] }
    );
  }

  trackByFn(index: number, item: string): number {
    return index; // or a unique identifier if you have one
  }

  public getEventConfigurations = (): void => {
    this.isLoading = true;
    this._legacyBackendApiService
      ._getEventConfigs()
      .subscribe((response: any) => {
        const data = response.data;
        if (data.length > 0) {
          this.dataSource = new MatTableDataSource(data);
          this.dataSource.data = data;
          this.totalRecords = data.length;
          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          }, 100);
          this.cdr.detectChanges();
        }
        this.isLoading = false;
      });
  };

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      this.paginator.firstPage();
      this.cdr.detectChanges();
    }
  }

  trackByIndex(index: number, _item: any): number {
    return index;
  }

  refreshEventConfigurations(): void {
    this.getEventConfigurations();
  }

  displayErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 20000,
      panelClass: ['snackbar-error'],
    });
  }

  openTemplateEditor(data: any): void {
    console.log('Opening Template Editor with data:', data);
    const dialogRef = this.dialog.open(TemplateEditorComponent, {
      width: '1200px',
      maxWidth: 'none',
      data: {
        data: data,
        displayErrorMessageFn: (msg) => this.displayErrorMessage(msg),
      },
      panelClass: 'custom-dialog-container',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result == 'SUCCESS') {
        this.getEventConfigurations();
      }
    });
  }

  openSessionDetailsModal(data: any, type: string): void {
    const { Features, eventStatus: EventStatus } = data as any;
    const EnableTranslation = Features?.EnableTranslation ?? false;
    const EnableDiarization = Features?.EnableDiarization ?? false;
    delete Features?.EnableTranslation;
    delete Features?.EnableDiarization;
    data = {
      ...data,
      EnableTranslation,
      EnableDiarization,
      EventStatus,
      Features: {
        ...Features,
      },
    };

    const dialogRef = this.dialog.open(UpdateEventConfigDialogComponent, {
      width: '1200px',
      maxWidth: 'none',
      data: {
        data: data,
        displayErrorMessageFn: (msg) => this.displayErrorMessage(msg),
        type: type,
      },
      panelClass: 'custom-dialog-container',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result == 'SUCCESS') {
        this.getEventConfigurations();
      }
    });
  }
}
