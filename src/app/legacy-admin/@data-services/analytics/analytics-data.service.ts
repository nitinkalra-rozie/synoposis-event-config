import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/backend-api.service';
import { environment } from 'src/environments/environment';

export interface AnalyticsData {
  executiveSummary: {
    totalInteractions: number;
    uniqueUsers: number;
    totalPageViews: number;
    averageTimeSpentSeconds: number;
    topSessions: {
      sessionId: string;
      sessionTitle: string;
      pagePaths: string[];
      views: number;
      users: number;
    }[];
    engagementTimes: {
      sessionPage: { avgTimeSeconds: number; users: number };
      debriefPage: { avgTimeSeconds: number; users: number };
      liveReplayPage: { avgTimeSeconds: number; users: number };
      primaryDebriefPage: { avgTimeSeconds: number; users: number };
    };
    timeframe: {
      startDate: string;
      endDate: string;
    };
  };
  topSessions: {
    sessions: {
      sessionId: string;
      sessionTitle: string;
      pagePaths: string[];
      views: number;
      users: number;
    }[];
    total: number;
    page: number;
    limit: number;
    timeframe: {
      startDate: string;
      endDate: string;
    };
  };
  topEngagedUsers: {
    users: {
      userSession: string;
      userIdentifier: string;
      name: string;
      company: string;
      title: string;
      email: string;
      interactions: number;
      sessionsViewed: number;
    }[];
    total: number;
    page: number;
    limit: number;
    timeframe: {
      startDate: string;
      endDate: string;
    };
  };
  deviceDistribution: {
    devices: {
      deviceType: string;
      count: number;
    }[];
    timeframe: {
      startDate: string;
      endDate: string;
    };
  };
  browserDistribution: {
    browsers: {
      browser: string;
      count: number;
    }[];
    timeframe: {
      startDate: string;
      endDate: string;
    };
  };
  dailyBreakout: {
    dailyStats: {
      date: string;
      interactions: number;
      uniqueUsers: number;
      pageViews: number;
    }[];
    timeframe: {
      startDate: string;
      endDate: string;
    };
  };
  googleAnalytics: {
    totalData: {
      totalInteractions: number;
      uniqueUsers: number;
      totalPageViews: number;
      totalEngagementDuration: number;
      averageTimeSpentSeconds: number;
    };
    pagesVisited: {
      pagePath: string;
      views: number;
      users: number;
    }[];
    deviceTypes: {
      deviceType: string;
      count: number;
    }[];
    browsers: {
      browser: string;
      count: number;
    }[];
    regions: {
      country: string;
      count: number;
    }[];
    dailyStats: {
      date: string;
      interactions: number;
      uniqueUsers: number;
      pageViews: number;
    }[];
    timeframe: {
      startDate: string;
      endDate: string;
    };
  };
}

export interface AnalyticsRequest {
  action: string;
  eventName: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsDataService {
  private _backendApiService = inject(LegacyBackendApiService);
  private _http = inject(HttpClient);
  private _apiEndpoint = environment.analyticsApiEndpoint || '/api/analytics';

  getAnalyticsData(
    params: Partial<AnalyticsRequest>
  ): Observable<{ success: boolean; data: AnalyticsData }> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
      'X-Api-Key': environment.X_API_KEY,
    });

    const eventName = this._backendApiService.getCurrentEventName();

    const defaultRequest: AnalyticsRequest = {
      action: 'ALL',
      eventName,
      startDate: this._getDefaultStartDate(),
      endDate: this._getDefaultEndDate(),
      page: 1,
      limit: 10,
    };

    const request = { ...defaultRequest, ...params };

    return this._http.post<{ success: boolean; data: AnalyticsData }>(
      this._apiEndpoint,
      request,
      { headers }
    );
  }

  exportAnalyticsData(
    params: Partial<AnalyticsRequest>,
    format: 'pdf' | 'csv'
  ): Observable<Blob> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
      'X-Api-Key': environment.X_API_KEY,
    });

    const eventName = this._backendApiService.getCurrentEventName();

    const defaultRequest: AnalyticsRequest = {
      action: 'EXPORT',
      eventName,
      startDate: this._getDefaultStartDate(),
      endDate: this._getDefaultEndDate(),
      page: 1,
      limit: 50,
    };

    const request = { ...defaultRequest, ...params, format };

    return this._http.post(`${this._apiEndpoint}/export`, request, {
      headers,
      responseType: 'blob',
    });
  }

  private _getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to 30 days ago
    return date.toISOString().split('T')[0] + 'T00:00:00Z';
  }

  private _getDefaultEndDate(): string {
    const date = new Date();
    return date.toISOString().split('T')[0] + 'T23:59:59Z';
  }
}
