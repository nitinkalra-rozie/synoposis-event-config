import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { BaseChartDirective } from 'ng2-charts';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { TopBarComponent } from 'src/app/legacy-admin/@components/top-bar/top-bar.component';
import {
  AnalyticsData,
  ChartConfig,
  DateRange,
  DateRangeValue,
} from 'src/app/legacy-admin/@data-services/analytics/analytics-data.model';
import { AnalyticsDataService } from 'src/app/legacy-admin/@data-services/analytics/analytics-data.service';
import { SnackbarService } from 'src/app/legacy-admin/@data-services/snackbar/snackbar-service';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';

@Component({
  selector: 'app-analytics-dashboard',
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    BaseChartDirective,
    TopBarComponent,
  ],
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  constructor() {
    effect(() => {
      const data = this._analyticsQuery$();
      if (data) {
        this.analyticsData.set(data);
      }
    });
    effect(() => {
      const displayCount = this.dashboardSettings().displayCount;
      this.refreshData();
    });
  }
  // App logo and branding
  public logoPath = '../../../assets/login/rozie-synopsis-logo.svg';
  public eventLogo = signal<string | null>(null);

  // Core reactive state
  public analyticsData = signal<AnalyticsData | null>(null);
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);
  public lastUpdated = signal<Date>(new Date());

  // Chart and UI state
  public selectedTimeMetric = signal<
    'all' | 'interactions' | 'users' | 'pageViews'
  >('all');
  public sessionSortField = signal<'views' | 'users'>('views');
  public sessionSortDirection = signal<'asc' | 'desc'>('desc');
  public showAllGeographic = signal<boolean>(false);
  public showAllBrowsers = signal<boolean>(false);

  // Export state
  public isExporting = signal(false);
  public exportProgress = signal(0);

  // Date Ranges configuration
  public dateRanges: DateRange[] = [
    {
      name: 'Today',
      startDate: new Date(),
      endDate: new Date(),
    },
    {
      name: 'Yesterday',
      startDate: new Date(new Date().setDate(new Date().getDate() - 1)),
      endDate: new Date(new Date().setDate(new Date().getDate() - 1)),
    },
    {
      name: 'Last 7 Days',
      startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
      endDate: new Date(),
    },
    {
      name: 'Last 30 Days',
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: new Date(),
    },
  ];

  // Form Controls
  public dateRange = new FormGroup({
    start: new FormControl<Date | null>(this.dateRanges[2].startDate),
    end: new FormControl<Date | null>(this.dateRanges[2].endDate),
  });
  public selectedDateRangeName = signal<string>(this.dateRanges[2].name);

  // Dashboard Configuration
  public dashboardSettings = signal<{
    showKPICards: boolean;
    showTimeAnalysis: boolean;
    showTopSessions: boolean;
    showUserEngagement: boolean;
    showGeographicDistribution: boolean;
    showDeviceBrowser: boolean;
    showSessionType: boolean;
    displayCount: number;
    anonymizeUsers: boolean;
  }>({
    showKPICards: true,
    showTimeAnalysis: true,
    showTopSessions: true,
    showUserEngagement: true,
    showGeographicDistribution: true,
    showDeviceBrowser: true,
    showSessionType: true,
    displayCount: 12,
    anonymizeUsers: true,
  });

  // Reactive computed properties for KPIs
  public totalInteractions = computed(
    () => this.analyticsData()?.executiveSummary?.totalInteractions || 0
  );
  public uniqueUsers = computed(
    () => this.analyticsData()?.executiveSummary?.uniqueUsers || 0
  );
  public totalPageViews = computed(
    () => this.analyticsData()?.executiveSummary?.totalPageViews || 0
  );
  public averageTimeSpent = computed(
    () => this.analyticsData()?.executiveSummary?.averageTimeSpentSeconds || 0
  );

  public topSessions = computed(() => {
    const sessions = this.analyticsData()?.topSessions?.sessions || [];
    const sortField = this.sessionSortField();
    const sortDirection = this.sessionSortDirection();

    return [...sessions].sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      return (a[sortField] - b[sortField]) * multiplier;
    });
  });

  public topUsers = computed(
    () => this.analyticsData()?.topEngagedUsers?.users || []
  );

  //chart data
  public dailyData = computed(() => {
    const stats = this.analyticsData()?.dailyBreakout?.dailyStats || [];
    const sortedStats = [...stats].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      labels: sortedStats.map((s) => s.date),
      interactions: sortedStats.map((s) => s.interactions),
      users: sortedStats.map((s) => s.uniqueUsers),
      pageViews: sortedStats.map((s) => s.pageViews),
    };
  });

  // time analysis chart data
  public timeAnalysisChartData = computed<ChartConfig>(() => {
    const data = this.dailyData();
    const metric = this.selectedTimeMetric();

    const datasets: any[] = [];

    if (metric === 'all') {
      datasets.push(
        {
          data: data.interactions,
          label: 'Interactions',
          backgroundColor: 'rgba(83, 74, 216, 0.7)',
          borderColor: '#534ad8',
        },
        {
          data: data.pageViews,
          label: 'Page Views',
          backgroundColor: 'rgba(34, 135, 225, 0.7)',
          borderColor: '#2287e1',
        },
        {
          data: data.users,
          label: 'Unique Users',
          backgroundColor: 'rgba(131, 76, 157, 0.7)',
          borderColor: '#834c9d',
        }
      );
    } else if (metric === 'interactions') {
      datasets.push({
        data: data.interactions,
        label: 'Interactions',
        backgroundColor: 'rgba(83, 74, 216, 0.7)',
        borderColor: '#534ad8',
      });
    } else if (metric === 'users') {
      datasets.push({
        data: data.users,
        label: 'Unique Users',
        backgroundColor: 'rgba(131, 76, 157, 0.7)',
        borderColor: '#834c9d',
      });
    } else if (metric === 'pageViews') {
      datasets.push({
        data: data.pageViews,
        label: 'Page Views',
        backgroundColor: 'rgba(34, 135, 225, 0.7)',
        borderColor: '#2287e1',
      });
    }

    return {
      labels: data.labels,
      datasets,
    };
  });

  //sessions histogram chart data
  public sessionsHistogramChartData = computed<ChartConfig>(() => {
    const sessions = this.topSessions();

    if (sessions.length === 0) {
      return { labels: [], datasets: [] };
    }

    const maxBars = 8;
    const displaySessions = sessions.slice(0, maxBars);

    const shortenTitles = (title: string, maxLength = 20): string => {
      if (!title) return 'Unnamed Session';
      if (title.length <= maxLength) return title;
      return title.substring(0, maxLength) + '...';
    };

    return {
      labels: displaySessions.map((session) =>
        shortenTitles(session.sessionTitle)
      ),
      datasets: [
        {
          data: displaySessions.map((session) => session.views),
          label: 'Views',
          backgroundColor: 'rgba(83, 74, 216, 0.7)',
          borderColor: '#534ad8',
        },
        {
          data: displaySessions.map((session) => session.users),
          label: 'Users',
          backgroundColor: 'rgba(131, 76, 157, 0.7)',
          borderColor: '#834c9d',
        },
      ],
    };
  });

  //device data
  public deviceData = computed(() => {
    const devices = this.analyticsData()?.deviceDistribution?.devices || [];
    return {
      labels: devices.map((d) => d.deviceType),
      data: devices.map((d) => d.count),
    };
  });

  //geographic data
  public geographicData = computed(() => {
    const regions = this.analyticsData()?.googleAnalytics?.regions || [];
    const filteredRegions = regions
      .filter((region) => region.country !== '(not set)')
      .sort((a, b) => b.count - a.count);

    const topCount = 6;
    const showAll = this.showAllGeographic();

    let displayRegions: { country: string; count: number }[] = [];
    let othersCount = 0;
    let hasOthers = false;

    if (showAll || filteredRegions.length <= topCount) {
      displayRegions = [...filteredRegions];
    } else {
      const top = filteredRegions.slice(0, topCount - 1);
      const others = filteredRegions.slice(topCount - 1);
      othersCount = others.reduce((sum, region) => sum + region.count, 0);
      displayRegions = [...top, { country: 'Others', count: othersCount }];
      hasOthers = true;
    }

    // Create unique colors for the chart
    const chartColors = [
      'rgba(83, 74, 216, 0.7)', // purple
      'rgba(131, 76, 157, 0.7)', // magenta
      'rgba(34, 135, 225, 0.7)', // blue
      'rgba(76, 175, 80, 0.7)', // green
      'rgba(255, 152, 0, 0.7)', // orange
      'rgba(236, 64, 122, 0.7)', // pink
      'rgba(0, 150, 136, 0.7)', // teal
      'rgba(255, 193, 7, 0.7)', // amber
      'rgba(156, 39, 176, 0.7)', // purple
      'rgba(63, 81, 181, 0.7)', // indigo
    ];

    // Make sure we have enough colors
    while (chartColors.length < displayRegions.length) {
      chartColors.push(...chartColors);
    }

    return {
      labels: displayRegions.map((region) => region.country),
      data: displayRegions.map((region) => region.count),
      // For the table view (all data)
      allRegions: filteredRegions,
      total: filteredRegions.reduce((sum, region) => sum + region.count, 0),
      colors: chartColors.slice(0, displayRegions.length),
      hasOthers,
      othersCount,
      topCountries: hasOthers
        ? [
            ...displayRegions.slice(0, topCount - 1),
            { country: 'Others', count: othersCount },
          ]
        : displayRegions.slice(0, 5),
    };
  });

  public browserData = computed(() => {
    const browsers = this.analyticsData()?.browserDistribution?.browsers || [];
    // Sort browsers by count
    const sortedBrowsers = [...browsers].sort((a, b) => b.count - a.count);

    const topCount = 3; // Max number to show individually
    const showAll = this.showAllBrowsers();

    // For the chart, either show all or top 3 with others combined
    let displayBrowsers: { browser: string; count: number }[] = [];

    if (showAll || sortedBrowsers.length <= topCount) {
      displayBrowsers = [...sortedBrowsers];
    } else {
      // Take top 2 and combine the rest
      const top = sortedBrowsers.slice(0, topCount - 1); // Top 2
      const others = sortedBrowsers.slice(topCount - 1); // Everything else

      const othersCount = others.reduce(
        (sum, browser) => sum + browser.count,
        0
      );
      displayBrowsers = [...top, { browser: 'Others', count: othersCount }];
    }

    return {
      labels: displayBrowsers.map((b) => b.browser),
      data: displayBrowsers.map((b) => b.count),
      allBrowsers: sortedBrowsers,
      total: sortedBrowsers.reduce((sum, browser) => sum + browser.count, 0),
    };
  });

  //session type data
  public sessionTypeData = computed(() => {
    const data = this.analyticsData()?.executiveSummary?.engagementTimes;
    if (!data) return null;

    return {
      labels: ['Session Page', 'Debrief Page', 'Live Replay Page'],
      avgTimeData: [
        Math.round(data.sessionPage.avgTimeSeconds),
        Math.round(data.debriefPage.avgTimeSeconds),
        Math.round(data.liveReplayPage.avgTimeSeconds),
      ],
      userCountData: [
        data.sessionPage.users,
        data.debriefPage.users,
        data.liveReplayPage.users,
      ],
    };
  });

  public barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true },
      datalabels: {
        display: true,
        anchor: 'end',
        align: 'top',
        formatter: (value: any) => value,
        font: { weight: 'bold' },
        color: '#333333',
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          font: { size: 11, weight: 'bold' },
        },
        offset: true,
        padding: 10,
      },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
    },
  };

  public sessionChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: { beginAtZero: true, grid: { display: false } },
      y: { grid: { display: false } },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      datalabels: {
        display: true,
        align: 'end',
        anchor: 'end',
        formatter: (value: any) => value,
        font: { weight: 'bold' },
        color: '#333333',
      },
    },
  };

  public lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true }, tooltip: { enabled: true } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
    },
  };

  public pieChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', display: true },
      tooltip: { enabled: true },
      datalabels: {
        display: true,
        formatter: (value: any, context: any) => {
          const label = context.chart.data.labels[context.dataIndex];
          return `${label}: ${Math.round(value)}`;
        },
        color: '#333333',
        font: { weight: 'bold' },
      },
    },
    cutout: '65%',
  };

  // Create a manual trigger for refreshing data
  private _refreshTrigger$ = new BehaviorSubject<void>(undefined);

  // Reactive data queries - convert form changes to signal
  private _dateRangeChanges$ = toSignal(
    this.dateRange.valueChanges.pipe(
      startWith(this.dateRange.value),
      debounceTime(300),
      distinctUntilChanged(
        (prev, curr) =>
          prev?.start?.getTime() === curr?.start?.getTime() &&
          prev?.end?.getTime() === curr?.end?.getTime()
      )
    ),
    { initialValue: this.dateRange.value as DateRangeValue }
  );

  private _analyticsQuery$ = toSignal(
    combineLatest([
      this.dateRange.valueChanges.pipe(
        startWith(this.dateRange.value),
        debounceTime(300),
        distinctUntilChanged(
          (prev, curr) =>
            prev?.start?.getTime() === curr?.start?.getTime() &&
            prev?.end?.getTime() === curr?.end?.getTime()
        )
      ),
      this._refreshTrigger$,
    ]).pipe(
      switchMap(([dateRange]) => {
        if (!dateRange?.start || !dateRange?.end) {
          return of(null);
        }

        this.isLoading.set(true);
        this.error.set(null);

        const formattedStartDate =
          dateRange.start.toISOString().split('T')[0] + 'T00:00:00Z';
        const formattedEndDate =
          dateRange.end.toISOString().split('T')[0] + 'T23:59:59Z';

        return this._analyticsService
          .getAnalyticsData({
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            limit: this.dashboardSettings().displayCount,
          })
          .pipe(
            map((response) => {
              this.isLoading.set(false);
              if (response.success && response.data) {
                this.lastUpdated.set(new Date());
                return response.data as AnalyticsData;
              } else {
                this.error.set('Failed to fetch analytics data');
                return null;
              }
            }),
            catchError((err) => {
              console.error('Error fetching analytics data:', err);
              this.error.set(`Error: ${err.message || 'Unknown error'}`);
              this.isLoading.set(false);
              return of(null);
            })
          );
      })
    ),
    { initialValue: null }
  );

  // Services
  private _analyticsService = inject(AnalyticsDataService);
  private _backendApiService = inject(LegacyBackendApiService);
  private _router = inject(Router);
  private _snackbarService = inject(SnackbarService);

  ngOnInit(): void {
    this.validateEventAccess();
  }

  ngOnDestroy(): void {
    console.log(
      'Analytics dashboard component destroyed at:',
      new Date().toISOString()
    );
  }

  // Reactive methods
  validateEventAccess(): void {
    this.isLoading.set(true);
    const currentEventName = this._backendApiService.getCurrentEventName();

    if (!currentEventName) {
      this._snackbarService.warning(
        'No event selected. Redirecting to admin page.',
        'Dismiss'
      );
      this._router.navigate(['/av-workspace']);
      return;
    }

    this.fetchEventConfig();
  }

  fetchEventConfig(): void {
    const getConfigMethod = this._backendApiService['_getEventConfig'];
    if (getConfigMethod && typeof getConfigMethod === 'function') {
      getConfigMethod.call(this._backendApiService).subscribe({
        next: (response: any) => {
          if (response.success && response.data?.Information?.Logos) {
            this.eventLogo.set(response.data.Information.Logos.Light || null);
          }
        },
        error: (err) => console.error('Error fetching event config:', err),
      });
    }
  }

  // Reactive date range methods
  applyDateRange(range: DateRange): void {
    this.dateRange.setValue({ start: range.startDate, end: range.endDate });
    this.selectedDateRangeName.set(range.name);
  }

  applyCustomDateRange(): void {
    this.selectedDateRangeName.set('Custom');
  }

  refreshData(): void {
    // Force re-trigger of reactive stream
    this._refreshTrigger$.next();
  }

  // Keep the old method for template compatibility
  fetchAnalyticsData(): void {
    this.refreshData();
  }

  // Reactive settings updates
  updateDisplayCount(count: number): void {
    this.dashboardSettings.update((settings) => ({
      ...settings,
      displayCount: count,
    }));
  }

  toggleKPICards(): void {
    this.dashboardSettings.update((settings) => ({
      ...settings,
      showKPICards: !settings.showKPICards,
    }));
  }

  toggleTimeAnalysis(): void {
    this.dashboardSettings.update((settings) => ({
      ...settings,
      showTimeAnalysis: !settings.showTimeAnalysis,
    }));
  }

  toggleTopSessions(): void {
    this.dashboardSettings.update((settings) => ({
      ...settings,
      showTopSessions: !settings.showTopSessions,
    }));
  }

  toggleUserEngagement(): void {
    this.dashboardSettings.update((settings) => ({
      ...settings,
      showUserEngagement: !settings.showUserEngagement,
    }));
  }

  toggleDeviceBrowser(): void {
    this.dashboardSettings.update((settings) => ({
      ...settings,
      showDeviceBrowser: !settings.showDeviceBrowser,
    }));
  }

  toggleSessionType(): void {
    this.dashboardSettings.update((settings) => ({
      ...settings,
      showSessionType: !settings.showSessionType,
    }));
  }

  toggleAnonymizeUsers(): void {
    this.dashboardSettings.update((settings) => ({
      ...settings,
      anonymizeUsers: !settings.anonymizeUsers,
    }));
  }

  toggleGeographicDistribution(): void {
    this.dashboardSettings.update((settings) => ({
      ...settings,
      showGeographicDistribution: !settings.showGeographicDistribution,
    }));
  }

  // Reactive sorting methods
  sortSessionsBy(field: 'views' | 'users'): void {
    if (this.sessionSortField() === field) {
      this.sessionSortDirection.update((direction) =>
        direction === 'asc' ? 'desc' : 'asc'
      );
    } else {
      this.sessionSortField.set(field);
      this.sessionSortDirection.set('desc');
    }
  }

  // Toggle methods for UI state
  toggleAllGeographic(): void {
    this.showAllGeographic.update((current) => !current);
  }

  toggleAllBrowsers(): void {
    this.showAllBrowsers.update((current) => !current);
  }

  // Update metric selection
  updateTimeAnalysisChart(): void {
    // Chart data is now reactive through computed signal
    // This method can be simplified or removed
  }

  updateSessionsHistogram(): void {
    // Chart data is now reactive through computed signal
    // This method can be simplified or removed
  }

  // Utility methods (unchanged)
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return minutes === 0
      ? `${remainingSeconds}s`
      : `${minutes}m ${remainingSeconds}s`;
  }

  formatUserEmail(email: string): string {
    if (this.dashboardSettings().anonymizeUsers) {
      const parts = email.split('@');
      if (parts.length === 2) {
        const username = parts[0];
        const domain = parts[1];
        if (username.length > 2) {
          return `${username.substring(0, 2)}****@${domain}`;
        }
      }
    }
    return email;
  }

  // Export methods (unchanged but could be made reactive)
  downloadAsPDF(): void {
    const content = document.getElementById('dashboard-content');
    if (!content) return;

    this._snackbarService.info('Generating PDF...', 'Dismiss');

    const currentEventName = this._backendApiService.getCurrentEventName();
    const eventLogoUrl = this.eventLogo();

    html2canvas(content, { scale: 2, useCORS: true }).then((canvas) => {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.setFillColor(245, 245, 245);
      pdf.rect(0, 0, pdfWidth, 25, 'F');

      if (this.logoPath) {
        pdf.addImage(this.logoPath, 'PNG', 10, 5, 15, 15);
      }

      if (eventLogoUrl) {
        pdf.addImage(eventLogoUrl, 'PNG', pdfWidth - 50, 5, 40, 15);
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Event Analytics Dashboard', pdfWidth / 2, 12, {
        align: 'center',
      });

      pdf.setFontSize(12);
      pdf.setTextColor(102, 102, 102);
      pdf.text(`Event: ${currentEventName || 'N/A'}`, pdfWidth / 2, 18, {
        align: 'center',
      });

      const startDate = this.dateRange.value.start?.toLocaleDateString() || '';
      const endDate = this.dateRange.value.end?.toLocaleDateString() || '';
      pdf.setFontSize(10);
      pdf.text(`Date Range: ${startDate} - ${endDate}`, pdfWidth / 2, 22, {
        align: 'center',
      });

      pdf.addImage(imgData, 'JPEG', 0, 25, pdfWidth, pdfHeight);

      const totalPages = Math.ceil(
        pdfHeight / (pdf.internal.pageSize.getHeight() - 25)
      );
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFillColor(245, 245, 245);
        pdf.rect(0, pdf.internal.pageSize.getHeight() - 10, pdfWidth, 10, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(102, 102, 102);
        pdf.text(
          `Generated on ${new Date().toLocaleString()}`,
          10,
          pdf.internal.pageSize.getHeight() - 4
        );
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pdfWidth - 20,
          pdf.internal.pageSize.getHeight() - 4
        );
      }

      pdf.save(`analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
      this._snackbarService.success('PDF downloaded successfully', 'Dismiss');
    });
  }

  downloadAsCSV(): void {
    this.isLoading.set(true);

    const startDate = this.dateRange.value.start;
    const endDate = this.dateRange.value.end;

    if (!startDate || !endDate) {
      this._snackbarService.error(
        'Please select a valid date range',
        'Dismiss'
      );
      this.isLoading.set(false);
      return;
    }

    const formattedStartDate =
      startDate.toISOString().split('T')[0] + 'T00:00:00Z';
    const formattedEndDate = endDate.toISOString().split('T')[0] + 'T23:59:59Z';

    this._analyticsService
      .exportAnalyticsData(
        {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
        'csv'
      )
      .subscribe({
        next: (blob) => {
          this.isLoading.set(false);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this._snackbarService.success(
            'CSV downloaded successfully',
            'Dismiss'
          );
        },
        error: (err) => {
          console.error('Error exporting analytics data:', err);
          this._snackbarService.error(
            `Export error: ${err.message || 'Unknown error'}`,
            'Dismiss'
          );
          this.isLoading.set(false);
        },
      });
  }

  exportReport(): void {
    if (!this.dateRange.value.start || !this.dateRange.value.end) {
      this._snackbarService.error(
        'Please select start and end dates',
        'Dismiss'
      );
      return;
    }

    this.isExporting.set(true);
    this.exportProgress.set(0);

    this._snackbarService.info(
      'Export Started - Report download in progress...',
      'Dismiss',
      5000
    );

    const progressInterval = setInterval(() => {
      this.exportProgress.update((current) => {
        const next = current + 10;
        if (next >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return next;
      });
    }, 200);

    const startDateStr = this.formatDateForAPI(this.dateRange.value.start);
    const endDateStr = this.formatDateForAPI(this.dateRange.value.end);

    this._analyticsService.exportReport(startDateStr, endDateStr).subscribe({
      next: (rawBlob: Blob) => {
        clearInterval(progressInterval);
        this.exportProgress.set(100);
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Text = reader.result as string;
          const binaryString = window.atob(base64Text);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const xlsxBlob = new Blob([bytes.buffer], {
            type: 'application/vnd.openxmlformats-officedocument-spreadsheetml.sheet',
          });
          const url = window.URL.createObjectURL(xlsxBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `sessions-report-${startDateStr}-to-${endDateStr}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);

          this._snackbarService.success(
            'Report downloaded successfully!',
            'Dismiss'
          );
          this.isExporting.set(false);
          this.exportProgress.set(0);
        };
        reader.readAsText(rawBlob);
      },
      error: (error) => {
        clearInterval(progressInterval);
        console.error('Export failed:', error);
        this._snackbarService.error(
          'Export Failed - Please try again later',
          'Dismiss'
        );
        this.isExporting.set(false);
        this.exportProgress.set(0);
      },
    });
  }

  showEventDetails(sessionId: string): void {
    window.open(`/session/${sessionId}`, '_blank');
  }

  showUserDetails(userId: string): void {
    this._snackbarService.info('User details feature coming soon', 'Dismiss');
  }

  private formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
