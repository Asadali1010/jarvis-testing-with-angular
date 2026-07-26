import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AnalyticsDataType,
  AnalyticsDateRangePreset,
  AnalyticsFilters,
} from '../../../analytics/analytics.models';

@Component({
  selector: 'app-analytics-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics-filters.component.html',
})
export class AnalyticsFiltersComponent {
  @Input() filters: AnalyticsFilters = {
    dateRange: { preset: '30d' },
    dataType: 'all',
  };
  @Input() disabled = false;

  @Output() filtersChange = new EventEmitter<AnalyticsFilters>();

  readonly dateRangeOptions: { value: AnalyticsDateRangePreset; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
  ];

  readonly dataTypeOptions: { value: AnalyticsDataType; label: string }[] = [
    { value: 'all', label: 'All metrics' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'users', label: 'Users' },
    { value: 'traffic', label: 'Traffic' },
    { value: 'conversions', label: 'Conversions' },
  ];

  onDateRangeChange(preset: AnalyticsDateRangePreset): void {
    if (this.disabled) {
      return;
    }

    this.filtersChange.emit({
      ...this.filters,
      dateRange: { preset },
    });
  }

  onDataTypeChange(dataType: AnalyticsDataType): void {
    if (this.disabled) {
      return;
    }

    this.filtersChange.emit({
      ...this.filters,
      dataType,
    });
  }
}
