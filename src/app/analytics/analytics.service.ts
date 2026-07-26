import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';
import {
  ActivityItem,
  AnalyticsData,
  AnalyticsDataType,
  AnalyticsDateRange,
  AnalyticsDateRangePreset,
  AnalyticsFilters,
  AnalyticsMetric,
  ChartSeries,
} from './analytics.models';

const LOADING_DELAY_MS = 800;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly defaultFilters: AnalyticsFilters = {
    dateRange: { preset: '30d' },
    dataType: 'all',
  };

  readonly filters = signal<AnalyticsFilters>({ ...this.defaultFilters });
  readonly isLoading = signal(false);

  private readonly allMetrics: AnalyticsMetric[] = [
    {
      id: 'revenue-total',
      label: 'Total Revenue',
      value: '$128,430',
      change: '+12.4%',
      isPositive: true,
      icon: 'bi-currency-dollar',
      color: 'text-emerald-600 bg-emerald-100',
      dataType: 'revenue',
    },
    {
      id: 'users-active',
      label: 'Active Users',
      value: '8,942',
      change: '+8.2%',
      isPositive: true,
      icon: 'bi-people',
      color: 'text-blue-600 bg-blue-100',
      dataType: 'users',
    },
    {
      id: 'traffic-sessions',
      label: 'Sessions',
      value: '214,580',
      change: '+5.6%',
      isPositive: true,
      icon: 'bi-graph-up-arrow',
      color: 'text-indigo-600 bg-indigo-100',
      dataType: 'traffic',
    },
    {
      id: 'conversions-rate',
      label: 'Conversion Rate',
      value: '3.8%',
      change: '-0.4%',
      isPositive: false,
      icon: 'bi-bullseye',
      color: 'text-rose-600 bg-rose-100',
      dataType: 'conversions',
    },
  ];

  private readonly allChartSeries: ChartSeries[] = [
    {
      id: 'revenue-trend',
      name: 'Revenue',
      color: '#059669',
      dataType: 'revenue',
      points: [
        { label: 'Mon', value: 18200, timestamp: daysAgo(2) },
        { label: 'Tue', value: 19450, timestamp: daysAgo(5) },
        { label: 'Wed', value: 20100, timestamp: daysAgo(12) },
        { label: 'Thu', value: 18800, timestamp: daysAgo(25) },
        { label: 'Fri', value: 22300, timestamp: daysAgo(45) },
        { label: 'Sat', value: 17600, timestamp: daysAgo(120) },
      ],
    },
    {
      id: 'users-trend',
      name: 'Active Users',
      color: '#2563eb',
      dataType: 'users',
      points: [
        { label: 'Mon', value: 8200, timestamp: daysAgo(3) },
        { label: 'Tue', value: 8450, timestamp: daysAgo(18) },
        { label: 'Wed', value: 8720, timestamp: daysAgo(35) },
        { label: 'Thu', value: 8942, timestamp: daysAgo(60) },
      ],
    },
    {
      id: 'traffic-trend',
      name: 'Sessions',
      color: '#4f46e5',
      dataType: 'traffic',
      points: [
        { label: 'Mon', value: 18200, timestamp: daysAgo(14) },
        { label: 'Tue', value: 19800, timestamp: daysAgo(28) },
        { label: 'Wed', value: 20500, timestamp: daysAgo(55) },
        { label: 'Thu', value: 214580, timestamp: daysAgo(200) },
      ],
    },
    {
      id: 'conversions-trend',
      name: 'Conversions',
      color: '#e11d48',
      dataType: 'conversions',
      points: [
        { label: 'Mon', value: 320, timestamp: daysAgo(70) },
        { label: 'Tue', value: 410, timestamp: daysAgo(95) },
        { label: 'Wed', value: 385, timestamp: daysAgo(180) },
      ],
    },
  ];

  private readonly allActivities: ActivityItem[] = [
    {
      id: 'act-1',
      title: 'Revenue milestone reached',
      description: 'Monthly revenue crossed $120k for the first time.',
      timestamp: daysAgo(1),
      type: 'revenue',
      icon: 'bi-currency-dollar',
    },
    {
      id: 'act-2',
      title: 'New user sign-ups spike',
      description: '842 new users registered in the last 24 hours.',
      timestamp: daysAgo(4),
      type: 'users',
      icon: 'bi-person-plus',
    },
    {
      id: 'act-3',
      title: 'Traffic surge detected',
      description: 'Organic sessions increased 18% week over week.',
      timestamp: daysAgo(20),
      type: 'traffic',
      icon: 'bi-lightning',
    },
    {
      id: 'act-4',
      title: 'Checkout funnel optimized',
      description: 'Conversion rate improved after cart UX update.',
      timestamp: daysAgo(80),
      type: 'conversions',
      icon: 'bi-bullseye',
    },
    {
      id: 'act-5',
      title: 'Quarterly revenue report',
      description: 'Q3 revenue summary exported by finance team.',
      timestamp: daysAgo(150),
      type: 'revenue',
      icon: 'bi-file-earmark-bar-graph',
    },
  ];

  readonly analyticsData = computed(() => this.filterData(this.filters()));

  setFilters(filters: AnalyticsFilters): void {
    this.filters.set(filters);
  }

  resetFilters(): void {
    this.filters.set({ ...this.defaultFilters });
  }

  getAnalyticsData(filters: AnalyticsFilters = this.filters()): Observable<AnalyticsData> {
    return of(this.filterData(filters)).pipe(delay(LOADING_DELAY_MS));
  }

  loadAnalytics(filters?: AnalyticsFilters): Observable<AnalyticsData> {
    if (filters) {
      this.filters.set(filters);
    }

    this.isLoading.set(true);

    return this.getAnalyticsData(this.filters()).pipe(
      tap(() => this.isLoading.set(false)),
    );
  }

  refresh(): Observable<AnalyticsData> {
    return this.loadAnalytics();
  }

  private filterData(filters: AnalyticsFilters): AnalyticsData {
    const cutoff = this.getCutoffDate(filters.dateRange);
    const end = filters.dateRange.end ?? new Date();
    const dataType = filters.dataType;

    const matchesType = (type: Exclude<AnalyticsDataType, 'all'>): boolean =>
      dataType === 'all' || dataType === type;

    const matchesDate = (timestamp: string): boolean => {
      const date = new Date(timestamp);
      return date >= cutoff && date <= end;
    };

    const chartSeries = this.allChartSeries
      .filter((series) => matchesType(series.dataType))
      .map((series) => ({
        ...series,
        points: series.points.filter((point) => matchesDate(point.timestamp)),
      }))
      .filter((series) => series.points.length > 0);

    const activities = this.allActivities.filter(
      (activity) => matchesType(activity.type) && matchesDate(activity.timestamp),
    );

    const metrics = this.allMetrics.filter((metric) => {
      if (!matchesType(metric.dataType)) {
        return false;
      }

      const hasSeriesData = chartSeries.some((series) => series.dataType === metric.dataType);
      const hasActivityData = activities.some((activity) => activity.type === metric.dataType);
      return hasSeriesData || hasActivityData;
    });

    if (metrics.length === 0 && chartSeries.length === 0 && activities.length === 0) {
      return { metrics: [], chartSeries: [], activities: [] };
    }

    return { metrics, chartSeries, activities };
  }

  private getCutoffDate(dateRange: AnalyticsDateRange): Date {
    if (dateRange.start) {
      return dateRange.start;
    }

    const presetDays: Record<AnalyticsDateRangePreset, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };

    const days = presetDays[dateRange.preset];
    return new Date(Date.now() - days * DAY_MS);
  }
}
