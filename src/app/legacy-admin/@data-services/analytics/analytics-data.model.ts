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
