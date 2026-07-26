import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartSeries, ChartSeriesPoint } from '../../../analytics/analytics.models';

export type AnalyticsChartType = 'bar' | 'line';

@Component({
  selector: 'app-analytics-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-chart.component.html',
})
export class AnalyticsChartComponent {
  @Input() title = '';
  @Input() chartType: AnalyticsChartType = 'bar';
  @Input() series: ChartSeries[] = [];
  @Input() loading = false;
  @Input() empty = false;

  @Output() chartTypeChange = new EventEmitter<AnalyticsChartType>();
  @Output() pointSelect = new EventEmitter<ChartSeriesPoint>();

  readonly viewWidth = 400;
  readonly viewHeight = 220;
  readonly padding = { top: 24, right: 16, bottom: 36, left: 48 };

  get chartWidth(): number {
    return this.viewWidth - this.padding.left - this.padding.right;
  }

  get chartHeight(): number {
    return this.viewHeight - this.padding.top - this.padding.bottom;
  }

  get maxValue(): number {
    const values = this.series.flatMap((item) => item.points.map((point) => point.value));
    return values.length ? Math.max(...values) * 1.1 : 1;
  }

  get primarySeries(): ChartSeries | null {
    return this.series[0] ?? null;
  }

  get gridLines(): number[] {
    return [0, 0.25, 0.5, 0.75, 1];
  }

  getBarX(index: number, total: number): number {
    const slotWidth = this.chartWidth / total;
    const barWidth = slotWidth * 0.6;
    return this.padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
  }

  getBarWidth(total: number): number {
    return (this.chartWidth / total) * 0.6;
  }

  getBarHeight(value: number): number {
    return (value / this.maxValue) * this.chartHeight;
  }

  getBarY(value: number): number {
    return this.padding.top + this.chartHeight - this.getBarHeight(value);
  }

  getLinePoints(item: ChartSeries): string {
    const total = item.points.length;
    if (total === 0) {
      return '';
    }

    return item.points
      .map((point, index) => {
        const x = this.padding.left + (index / Math.max(total - 1, 1)) * this.chartWidth;
        const y =
          this.padding.top + this.chartHeight - (point.value / this.maxValue) * this.chartHeight;
        return `${x},${y}`;
      })
      .join(' ');
  }

  getPointX(index: number, total: number): number {
    return this.padding.left + (index / Math.max(total - 1, 1)) * this.chartWidth;
  }

  getPointY(value: number): number {
    return this.padding.top + this.chartHeight - (value / this.maxValue) * this.chartHeight;
  }

  formatValue(value: number): string {
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(1) + 'M';
    }
    if (value >= 1_000) {
      return (value / 1_000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  setChartType(type: AnalyticsChartType): void {
    this.chartTypeChange.emit(type);
  }

  onPointSelect(point: ChartSeriesPoint): void {
    this.pointSelect.emit(point);
  }
}
