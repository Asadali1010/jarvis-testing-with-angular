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
        border-top: 1px solid var(--glass-border);
        box-shadow: var(--glass-shadow);
        color: var(--color-text-muted);
        font-size: 0.8125rem;
      }

      @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        .app-footer {
          background: var(--glass-background);
          backdrop-filter: blur(var(--glass-blur)) saturate(1.15);
          -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.15);
        }
      }

      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        .app-footer {
          background: var(--color-bg-elevated);
        }
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
