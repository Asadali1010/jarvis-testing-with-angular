import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="app-footer">
      <p>&copy; {{ year }} Jarvis Enterprise. All rights reserved.</p>
    </footer>
  `,
  styles: [
    `
      .app-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--color-border);
        background: var(--color-bg-elevated);
        color: var(--color-text-muted);
        font-size: 0.8125rem;
      }

      .app-footer p {
        margin: 0;
      }
    `,
  ],
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
