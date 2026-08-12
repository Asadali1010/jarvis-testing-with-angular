import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FAQ_DATA } from '../../core/models/faq.model';

@Component({
  selector: 'app-faq',
  imports: [RouterLink],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css',
})
export class FaqComponent {
  readonly categories = FAQ_DATA;
  readonly openItems = signal<Set<string>>(new Set());

  isOpen(itemId: string): boolean {
    return this.openItems().has(itemId);
  }

  toggleItem(itemId: string): void {
    this.openItems.update((open) => {
      const next = new Set(open);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  answerId(itemId: string): string {
    return `faq-answer-${itemId}`;
  }

  triggerId(itemId: string): string {
    return `faq-trigger-${itemId}`;
  }
}
