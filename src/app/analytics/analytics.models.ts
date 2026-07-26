export type AnalyticsDataType = 'all' | 'revenue' | 'users' | 'traffic' | 'conversions';

export type AnalyticsDateRangePreset = '7d' | '30d' | '90d' | '1y';

export interface AnalyticsDateRange {
  preset: AnalyticsDateRangePreset;
  start?: Date;
  end?: Date;
}

export interface AnalyticsFilters {
  dateRange: AnalyticsDateRange;
  dataType: AnalyticsDataType;
}

export interface AnalyticsMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string;
  color: string;
  dataType: Exclude<AnalyticsDataType, 'all'>;
}

export interface ChartSeriesPoint {
  label: string;
  value: number;
  timestamp: string;
}

export interface ChartSeries {
  id: string;
  name: string;
  color: string;
  dataType: Exclude<AnalyticsDataType, 'all'>;
  points: ChartSeriesPoint[];
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: Exclude<AnalyticsDataType, 'all'>;
  icon: string;
}

export interface AnalyticsData {
  metrics: AnalyticsMetric[];
  chartSeries: ChartSeries[];
  activities: ActivityItem[];
}
