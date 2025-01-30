import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TopBarComponent } from 'src/app/components/shared/top-bar/top-bar.component';
import { SidebarControlPanelComponent } from 'src/app/@components/sidebar-control-panel/sidebar-control-panel.component';

import {
  PromptManagementService,
  SessionReportType,
  PromptVersion,
  PromptContent,
} from 'src/app/@services/prompt-management.service';

interface SessionType {
  sessionType: string;
  reportTypes: string[];
}

@Component({
  standalone: true,
  selector: 'app-prompt-management',
  templateUrl: './prompt-management.component.html',
  styleUrls: ['./prompt-management.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatIconModule,
    MatSnackBarModule,
    TopBarComponent,
    SidebarControlPanelComponent,
  ],
})
export class PromptManagementComponent implements OnInit {
  constructor(
    private service: PromptManagementService,
    private snackBar: MatSnackBar
  ) {}

  public selectedTabIndex = 0;
  public sessionReportPairs = signal<SessionReportType[]>([]);

  public rawData = signal<string[][]>([]);

  // Transformed data using computed signal
  public sessionTypes = computed<SessionType[]>(() => {
    const sessionMap = new Map<string, Set<string>>();

    this.rawData().forEach(([sessionType, reportType]) => {
      if (!sessionMap.has(sessionType)) {
        sessionMap.set(sessionType, new Set());
      }
      sessionMap.get(sessionType)?.add(reportType);
    });

    return Array.from(sessionMap.entries()).map(
      ([sessionType, reportTypes]) => ({
        sessionType,
        reportTypes: Array.from(reportTypes),
      })
    );
  });

  // Selected values signals
  public selectedSession = signal<string>('');
  public selectedReportType = signal<string>('');

  // Available report types computed from selection
  public availableReportTypes = computed(() => {
    if (!this.selectedSession()) return [];
    const session = this.sessionTypes().find(
      (s) => s.sessionType === this.selectedSession()
    );
    return session ? session.reportTypes : [];
  });

  public promptVersions = signal<PromptVersion[]>([]);
  public versions = computed(() => this.promptVersions());
  public displayedColumns = ['version', 'promptTitle', 'promptDescription'];
  public selectedVersion: string | null = null;
  public promptContentSignal = signal<PromptContent | null>(null);
  public promptContent = computed(() => this.promptContentSignal());

  public userInputs: Record<string, string | number> = {};
  public finalPrompt: string | null = null;

  ngOnInit(): void {
    this.fetchSessionReportTypes();
  }

  // Format display names for UI
  formatDisplayName(value: string): string {
    return value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  fetchSessionReportTypes(): void {
    this.service.getSessionReportTypes().subscribe({
      next: (data) => {
        if (!data || !Array.isArray(data.types)) {
          this.showError('API did not return a valid "types" array');
          return;
        }
        this.rawData.set(data.types);
      },
      error: (err) => {
        this.showError(`Failed to fetch session types: ${err.message}`);
      },
    });
  }

  fetchVersions(): void {
    if (!this.selectedSession() || !this.selectedReportType()) return;
    this.service
      .getPromptVersions(this.selectedSession(), this.selectedReportType())
      .subscribe({
        next: (data) => {
          this.promptVersions.set(data.versions);
          this.selectedVersion = null;
        },
        error: (err) => {
          this.showError(`Failed to fetch prompt versions: ${err.message}`);
        },
      });
  }

  onSelectVersion(row: PromptVersion): void {
    this.selectedVersion = row.version;
  }

  goToVisualizeTab(): void {
    // If no version selected, we can show an error
    if (!this.selectedVersion) {
      this.showWarning('Please select a version first');
      return;
    }
    this.selectedTabIndex = 1; // Switch to tab 2
    this.fetchPromptContent();
  }

  /**
   * TAB 2 LOGIC
   */
  fetchPromptContent(): void {
    if (
      !this.selectedSession() ||
      !this.selectedReportType() ||
      !this.selectedVersion
    )
      return;
    this.promptContentSignal.set(null);
    this.finalPrompt = null; // reset
    this.userInputs = {}; // reset

    this.service
      .getPromptContent(
        this.selectedSession(),
        this.selectedReportType(),
        this.selectedVersion
      )
      .subscribe({
        next: (content) => {
          this.promptContentSignal.set(content);
          // Initialize userInputs with empty strings or 0
          content.inputs.forEach((input) => {
            this.userInputs[input.prompt_key] =
              input.type === 'number' ? 0 : '';
          });
        },
        error: (err) => {
          this.showError(`Failed to fetch prompt content: ${err.message}`);
        },
      });
  }

  visualizePrompt(): void {
    const content = this.promptContent();
    if (!content) return;

    // Check required fields
    for (const i of content.inputs) {
      if (i.required) {
        const val = this.userInputs[i.prompt_key];
        if (val === '' || val == null) {
          this.showWarning(`Please fill in all required values: ${i.title}`);
          return;
        }
      }
    }

    // Format the prompt using placeholders
    // The original Python code used `cleandoc` & `.format(**args)`
    // We can do a simple string replace or a TS template approach
    let promptText = content.prompt;
    for (const i of content.inputs) {
      const key = i.prompt_key;
      const val = String(this.userInputs[key] ?? '');
      // naive replacement: {my_key} -> val
      promptText = promptText.replaceAll(`{${key}}`, val);
    }
    this.finalPrompt = promptText;
  }

  /**
   * TAB 3 LOGIC
   */
  uploadOrRefreshPrompts(): void {
    this.service.uploadOrRefreshDefaultPrompts().subscribe({
      next: (res) => {
        this.showSuccess('Prompts uploaded successfully!');
      },
      error: (err) => {
        this.showError(`Failed to upload prompts: ${err.message}`);
      },
    });
  }

  /**
   * UTILS
   */
  showSuccess(msg: string): void {
    this.snackBar.open(msg, 'OK', {
      duration: 3000,
      panelClass: 'snackbar-success',
    });
  }
  showError(msg: string): void {
    this.snackBar.open(msg, 'Dismiss', {
      duration: 5000,
      panelClass: 'snackbar-error',
    });
  }
  showWarning(msg: string): void {
    this.snackBar.open(msg, 'Dismiss', {
      duration: 4000,
      panelClass: 'snackbar-warn',
    });
  }
}
