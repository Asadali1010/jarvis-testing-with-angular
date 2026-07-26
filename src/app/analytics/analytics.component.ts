import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsData,
  AnalyticsFilters,
  ChartSeries,
  ChartSeriesPoint,
} from './analytics.models';
import { ThemeService } from '../theme.service';
import { AnalyticsFiltersComponent } from '../components/ui/analytics-filters/analytics-filters.component';
import { MetricCardComponent } from '../components/ui/metric-card/metric-card.component';
import {
  AnalyticsChartComponent,
  AnalyticsChartType,
} from '../components/ui/analytics-chart/analytics-chart.component';
import { RecentActivityComponent } from '../components/ui/recent-activity/recent-activity.component';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    AnalyticsFiltersComponent,
    MetricCardComponent,
    AnalyticsChartComponent,
    RecentActivityComponent,
  ],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private readonly analyticsService = inject(AnalyticsService);
  readonly themeService = inject(ThemeService);

  data: AnalyticsData = { metrics: [], chartSeries: [], activities: [] };
  readonly filters = this.analyticsService.filters;
  readonly isLoading = this.analyticsService.isLoading;

  primaryChartType: AnalyticsChartType = 'bar';
  secondaryChartType: AnalyticsChartType = 'line';
  selectedPointLabel: string | null = null;

  private readonly subscriptions = new Subscription();

  get isEmpty(): boolean {
    return (
      !this.isLoading() &&
      this.data.metrics.length === 0 &&
      this.data.chartSeries.length === 0 &&
      this.data.activities.length === 0
    );
  }

  get primaryChartSeries(): ChartSeries[] {
    const first = this.data.chartSeries[0];
    return first ? [first] : [];
  }

  get secondaryChartSeries(): ChartSeries[] {
    const second = this.data.chartSeries[1];
    return second ? [second] : [];
  }

  get overviewChartSeries(): ChartSeries[] {
    return this.data.chartSeries.slice(0, 3);
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadData(): void {
    this.subscriptions.add(
      this.analyticsService.loadAnalytics().subscribe((data) => {
        this.data = data;
      }),
    );
  }

  onFiltersChange(filters: AnalyticsFilters): void {
    this.selectedPointLabel = null;
    this.subscriptions.add(
      this.analyticsService.loadAnalytics(filters).subscribe((data) => {
        this.data = data;
      }),
    );
  }

  onRefresh(): void {
    this.selectedPointLabel = null;
    this.loadData();
  }

  onResetFilters(): void {
    this.analyticsService.resetFilters();
    this.onFiltersChange(this.analyticsService.filters());
  }

  onPrimaryChartTypeChange(type: AnalyticsChartType): void {
    this.primaryChartType = type;
  }

  onSecondaryChartTypeChange(type: AnalyticsChartType): void {
    this.secondaryChartType = type;
  }

  onPointSelect(point: ChartSeriesPoint): void {
    this.selectedPointLabel = point.label;
  }
}
