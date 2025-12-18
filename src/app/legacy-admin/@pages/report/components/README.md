# Report Components Structure

This folder contains the refactored components from the main `report.component`.

## Component Structure

```
components/
├── shared/
│   └── report.types.ts          # Shared types and interfaces
├── session-debrief/
│   ├── session-debrief.component.ts
│   ├── session-debrief.component.html
│   └── session-debrief.component.scss
├── daily-debrief/
│   ├── daily-debrief.component.ts
│   ├── daily-debrief.component.html
│   └── daily-debrief.component.scss
├── track-debrief/
│   ├── track-debrief.component.ts
│   ├── track-debrief.component.html
│   └── track-debrief.component.scss
├── executive-summary/
│   ├── executive-summary.component.ts
│   ├── executive-summary.component.html
│   └── executive-summary.component.scss
├── audio-player-dialog/
│   ├── audio-player-dialog.component.ts
│   ├── audio-player-dialog.component.html
│   └── audio-player-dialog.component.scss
└── loading-dialog/
    ├── loading-dialog.component.ts
    ├── loading-dialog.component.html
    └── loading-dialog.component.scss
```

## Component Responsibilities

### SessionDebriefComponent
- Displays session debrief table with filters
- Handles session selection via checkboxes
- Manages filters: search, file filter, event day, PDF filter, range selection
- Emits events for parent component to handle business logic

### DailyDebriefComponent
- Displays daily debrief table
- Handles daily debrief selection
- Manages event day filter
- Emits events for generation and publishing

### TrackDebriefComponent
- Displays track debrief table
- Handles track debrief selection
- Manages filters: search, publish filter, PDF filter, range selection
- Emits events for generation and publishing

### ExecutiveSummaryComponent
- Displays executive summary table
- Handles executive summary selection
- Emits events for generation and publishing

### AudioPlayerDialogComponent
- Dialog component for playing audio files
- Displays audio player controls in a modal

### LoadingDialogComponent
- Dialog component for displaying loading state
- Shows spinner and optional message during operations

## Integration

To use these components in the main `report.component.html`, replace the corresponding sections with:

```html
<app-session-debrief
  [dataSource]="dataSource"
  [displayedColumns]="displayedColumns"
  [selectedSessions]="selectedSessions"
  ...
  (sessionToggle)="onSessionToggle($event.sessionId, $event.checked)"
  (generatePdf)="generatePDF()"
  ...>
</app-session-debrief>
```

## Data Flow

1. Parent component (`report.component`) manages all business logic and data
2. Child components receive data via `@Input()` properties
3. Child components emit events via `@Output()` EventEmitters
4. Parent component handles events and updates data accordingly

