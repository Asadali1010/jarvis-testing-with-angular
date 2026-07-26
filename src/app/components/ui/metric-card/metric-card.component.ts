import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metric-card.component.html',
})
export class MetricCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() change = '';
  @Input() isPositive = true;
  @Input() icon = 'bi-graph-up';
  @Input() color = 'text-indigo-600 bg-indigo-100';
  @Input() loading = false;

  @Output() cardClick = new EventEmitter<void>();

  onCardClick(): void {
    this.cardClick.emit();
  }
}
