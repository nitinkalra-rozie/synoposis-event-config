import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { BaseChartDirective } from 'ng2-charts';
import { TopBarComponent } from 'src/app/legacy-admin/@components/top-bar/top-bar.component';
import {
  AnalyticsData,
  AnalyticsDataService,
} from 'src/app/legacy-admin/@data-services/analytics/analytics-data.service';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/backend-api.service';

interface DateRange {
  name: string;
  startDate: Date;
  endDate: Date;
}

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
  constructor() {}

  // App logo and branding
  public logoPath = '../../../assets/login/rozie-synopsis-logo.svg';
  public eventLogo: string | null = null;

  // Data
  public analyticsData = signal<AnalyticsData | null>(null);
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  // Time Analysis Chart
  public selectedTimeMetric = 'all';
  public timeAnalysisChartData: any = {};

  // Sessions histogram chart data
  public sessionsHistogramChartData: any = {};

  // Date Ranges
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

  // Derived data
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

  // Session sorting
  public sessionSortField: 'views' | 'users' = 'views';
  public sessionSortDirection: 'asc' | 'desc' = 'desc';

  public topSessions = computed(() => {
    const sessions = this.analyticsData()?.topSessions?.sessions || [];
    return this.sortSessions([...sessions]);
  });
  public topUsers = computed(
    () => this.analyticsData()?.topEngagedUsers?.users || []
  );

  public deviceData = computed(() => {
    const devices = this.analyticsData()?.deviceDistribution?.devices || [];
    return {
      labels: devices.map((d) => d.deviceType),
      data: devices.map((d) => d.count),
    };
  });

  // Geographic distribution data
  public showAllGeographic = signal<boolean>(false);
  public showAllBrowsers = signal<boolean>(false);

  public geographicData = computed(() => {
    const regions = this.analyticsData()?.googleAnalytics?.regions || [];
    // Sort by count descending and filter out "(not set)"
    const filteredRegions = regions
      .filter((region) => region.country !== '(not set)')
      .sort((a, b) => b.count - a.count);

    const topCount = 6; // Max number to show individually
    const showAll = this.showAllGeographic();

    // For the chart, either show top 6 or all based on flag
    let displayRegions: { country: string; count: number }[] = [];
    let othersCount = 0;
    let hasOthers = false;

    if (showAll || filteredRegions.length <= topCount) {
      displayRegions = [...filteredRegions];
    } else {
      // Take top 5 and combine the rest
      const top = filteredRegions.slice(0, topCount - 1); // Top 5
      const others = filteredRegions.slice(topCount - 1); // Everything else

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

  public dailyData = computed(() => {
    const stats = this.analyticsData()?.dailyBreakout?.dailyStats || [];
    // Sort stats by date
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

  // Chart Options with enhanced styling
  public barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}`;
          },
        },
      },
      datalabels: {
        display: true,
        anchor: 'end',
        align: 'top',
        formatter: (value: any) => value,
        font: {
          weight: 'bold',
        },
        color: '#333333',
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          font: {
            size: 11,
            weight: 'bold',
          },
        },
        offset: true,
        padding: 10,
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
      },
    },
    layout: {
      padding: {
        bottom: 20,
      },
    },
  };

  public sessionChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
      datalabels: {
        display: true,
        align: 'end',
        anchor: 'end',
        formatter: (value: any) => value,
        font: {
          weight: 'bold',
        },
        color: '#333333',
      },
    },
  };

  public lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
      },
    },
  };

  public pieChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        display: true,
      },
      tooltip: {
        enabled: true,
      },
      datalabels: {
        display: true,
        formatter: (value: any, context: any) => {
          const label = context.chart.data.labels[context.dataIndex];
          return `${label}: ${Math.round(value)}`;
        },
        color: '#333333',
        font: {
          weight: 'bold',
        },
      },
    },
    cutout: '65%',
  };

  // Last updated timestamp
  public lastUpdated = signal<Date>(new Date());

  // Services
  private _analyticsService = inject(AnalyticsDataService);
  private _backendApiService = inject(LegacyBackendApiService);
  private _snackBar = inject(MatSnackBar);
  private _sanitizer = inject(DomSanitizer);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.validateEventAccess();

    // Initialize charts
    this.updateTimeAnalysisChart();
    this.updateSessionsHistogram();
  }

  ngOnDestroy(): void {
    // Log component cleanup for analytics purposes
    console.log(
      'Analytics dashboard component destroyed at:',
      new Date().toISOString()
    );

    // We're not using any subscriptions directly in the component that need cleanup,
    // as we're using the async pipe in the template or one-time subscriptions in methods
  }

  /**
   * Validates if the user has access to an event and redirects if not
   */
  validateEventAccess(): void {
    this.isLoading.set(true);

    // Check if event name exists
    const currentEventName = this._backendApiService.getCurrentEventName();

    if (!currentEventName) {
      this._snackBar.open(
        'No event selected. Redirecting to admin page.',
        'Dismiss',
        {
          duration: 3000,
        }
      );
      this._router.navigate(['/admin']);
      return;
    }

    // Get event configuration (logo)
    this.fetchEventConfig();

    // Continue with loading analytics data
    this.fetchAnalyticsData();
  }

  /**
   * Fetches event configuration including logos
   */
  fetchEventConfig(): void {
    // Access the private method using typescript hack since we need the logo info
    const getConfigMethod = this._backendApiService['_getEventConfig'];
    if (getConfigMethod && typeof getConfigMethod === 'function') {
      getConfigMethod.call(this._backendApiService).subscribe({
        next: (response: any) => {
          if (
            response.success &&
            response.data &&
            response.data.Information &&
            response.data.Information.Logos
          ) {
            this.eventLogo = response.data.Information.Logos.Light || null;
          }
        },
        error: (err) => {
          console.error('Error fetching event config:', err);
        },
      });
    } else {
      console.error('Could not access event config method');
    }
  }

  // Update the time analysis chart based on selected metric
  updateTimeAnalysisChart(): void {
    const data = this.dailyData();

    if (this.selectedTimeMetric === 'all') {
      this.timeAnalysisChartData = {
        labels: data.labels,
        datasets: [
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
          },
        ],
      };
    } else if (this.selectedTimeMetric === 'interactions') {
      this.timeAnalysisChartData = {
        labels: data.labels,
        datasets: [
          {
            data: data.interactions,
            label: 'Interactions',
            backgroundColor: 'rgba(83, 74, 216, 0.7)',
            borderColor: '#534ad8',
          },
        ],
      };
    } else if (this.selectedTimeMetric === 'users') {
      this.timeAnalysisChartData = {
        labels: data.labels,
        datasets: [
          {
            data: data.users,
            label: 'Unique Users',
            backgroundColor: 'rgba(131, 76, 157, 0.7)',
            borderColor: '#834c9d',
          },
        ],
      };
    } else if (this.selectedTimeMetric === 'pageViews') {
      this.timeAnalysisChartData = {
        labels: data.labels,
        datasets: [
          {
            data: data.pageViews,
            label: 'Page Views',
            backgroundColor: 'rgba(34, 135, 225, 0.7)',
            borderColor: '#2287e1',
          },
        ],
      };
    }
  }

  fetchAnalyticsData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const startDate = this.dateRange.value.start;
    const endDate = this.dateRange.value.end;

    if (!startDate || !endDate) {
      this.error.set('Please select a valid date range');
      this.isLoading.set(false);
      return;
    }

    // Format dates
    const formattedStartDate =
      startDate.toISOString().split('T')[0] + 'T00:00:00Z';
    const formattedEndDate = endDate.toISOString().split('T')[0] + 'T23:59:59Z';

    this._analyticsService
      .getAnalyticsData({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        limit: this.dashboardSettings().displayCount,
      })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.analyticsData.set(response.data);
            this.lastUpdated.set(new Date());
            this.updateTimeAnalysisChart(); // Initialize the time analysis chart
            this.updateSessionsHistogram(); // Initialize the sessions histogram chart
            this.isLoading.set(false);
          } else {
            this.error.set('Failed to fetch analytics data');
            this.isLoading.set(false);
          }
        },
        error: (err) => {
          console.error('Error fetching analytics data:', err);
          this.error.set(`Error: ${err.message || 'Unknown error'}`);
          this.isLoading.set(false);
        },
      });
  }

  applyDateRange(range: DateRange): void {
    this.dateRange.setValue({
      start: range.startDate,
      end: range.endDate,
    });
    this.selectedDateRangeName.set(range.name);
    this.fetchAnalyticsData();
  }

  applyCustomDateRange(): void {
    this.selectedDateRangeName.set('Custom');
    this.fetchAnalyticsData();
  }

  refreshData(): void {
    this.fetchAnalyticsData();
  }

  updateDisplayCount(count: number): void {
    this.dashboardSettings.update((settings) => ({
      ...settings,
      displayCount: count,
    }));
    this.fetchAnalyticsData();
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

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  }

  formatUserEmail(email: string): string {
    if (this.dashboardSettings().anonymizeUsers) {
      // Show only first 2 chars and domain
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

  /**
   * Generate and download a professional PDF of the dashboard
   */
  downloadAsPDF(): void {
    const content = document.getElementById('dashboard-content');
    if (!content) return;

    this._snackBar.open('Generating PDF...', 'Dismiss', { duration: 3000 });

    // Configure PDF options for higher quality
    const pdfOptions = {
      margin: 10,
      filename: `analytics-${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        letterRendering: true,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    const currentEventName = this._backendApiService.getCurrentEventName();
    const eventLogoUrl = this.eventLogo;

    // Create the PDF with custom styling
    html2canvas(content, { scale: 2, useCORS: true }).then((canvas) => {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Add header to the PDF
      pdf.setFillColor(245, 245, 245);
      pdf.rect(0, 0, pdfWidth, 25, 'F');

      // Add Synopsis logo
      if (this.logoPath) {
        pdf.addImage(this.logoPath, 'PNG', 10, 5, 15, 15);
      }

      // Add event logo if available
      if (eventLogoUrl) {
        pdf.addImage(eventLogoUrl, 'PNG', pdfWidth - 50, 5, 40, 15);
      }

      // Add title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Event Analytics Dashboard', pdfWidth / 2, 12, {
        align: 'center',
      });

      // Add event name
      pdf.setFontSize(12);
      pdf.setTextColor(102, 102, 102);
      pdf.text(`Event: ${currentEventName || 'N/A'}`, pdfWidth / 2, 18, {
        align: 'center',
      });

      // Add date range
      const startDate = this.dateRange.value.start?.toLocaleDateString() || '';
      const endDate = this.dateRange.value.end?.toLocaleDateString() || '';
      pdf.setFontSize(10);
      pdf.setTextColor(102, 102, 102);
      pdf.text(`Date Range: ${startDate} - ${endDate}`, pdfWidth / 2, 22, {
        align: 'center',
      });

      // Add the dashboard screenshot
      pdf.addImage(imgData, 'JPEG', 0, 25, pdfWidth, pdfHeight);

      // Add footer
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

      pdf.save(pdfOptions.filename);

      this._snackBar.open('PDF downloaded successfully', 'Dismiss', {
        duration: 3000,
      });
    });
  }

  downloadAsCSV(): void {
    this.isLoading.set(true);

    const startDate = this.dateRange.value.start;
    const endDate = this.dateRange.value.end;

    if (!startDate || !endDate) {
      this.error.set('Please select a valid date range');
      this.isLoading.set(false);
      return;
    }

    // Format dates
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

          // Create a download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          this._snackBar.open('CSV downloaded successfully', 'Dismiss', {
            duration: 3000,
          });
        },
        error: (err) => {
          console.error('Error exporting analytics data:', err);
          this.error.set(`Export error: ${err.message || 'Unknown error'}`);
          this.isLoading.set(false);
        },
      });
  }

  showEventDetails(sessionId: string): void {
    // Navigate to session details page
    window.open(`/session/${sessionId}`, '_blank');
  }

  showUserDetails(userId: string): void {
    // Would navigate to user details if available
    this._snackBar.open('User details feature coming soon', 'Dismiss', {
      duration: 3000,
    });
  }

  // Sort sessions by the selected field
  sortSessionsBy(field: 'views' | 'users'): void {
    if (this.sessionSortField === field) {
      // Toggle sort direction if clicking the same field
      this.sessionSortDirection =
        this.sessionSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Default to descending when changing fields
      this.sessionSortField = field;
      this.sessionSortDirection = 'desc';
    }

    // Force a refresh of the topSessions computed value
    this.analyticsData.update((data) => ({ ...data }));
  }

  // Sort sessions based on current sort settings
  sortSessions(sessions: any[]): any[] {
    return sessions.sort((a, b) => {
      const multiplier = this.sessionSortDirection === 'asc' ? 1 : -1;
      return (a[this.sessionSortField] - b[this.sessionSortField]) * multiplier;
    });
  }

  // Update the sessions histogram chart
  updateSessionsHistogram(): void {
    const sessions = this.analyticsData()?.topSessions?.sessions || [];

    if (sessions.length === 0) {
      this.sessionsHistogramChartData = {};
      return;
    }

    // Get sessions sorted by the current sort field and direction
    const sortedSessions = this.sortSessions([...sessions]);
    const maxBars = 8; // Reduce number of bars shown to prevent overcrowding
    const displaySessions = sortedSessions.slice(0, maxBars);

    // Generate shortened session titles for the labels - make them shorter
    const shortenTitles = (title: string, maxLength = 20): string => {
      if (!title) return 'Unnamed Session';
      if (title.length <= maxLength) return title;
      return title.substring(0, maxLength) + '...';
    };

    this.sessionsHistogramChartData = {
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
  }

  // Toggle showing all geographic data or collapsed
  toggleAllGeographic(): void {
    this.showAllGeographic.update((current) => !current);
  }

  // Toggle showing all browser data or collapsed
  toggleAllBrowsers(): void {
    this.showAllBrowsers.update((current) => !current);
  }
}
