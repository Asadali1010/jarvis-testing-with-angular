import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="app-footer">
      <div class="app-footer__inner">
        <div class="app-footer__brand">
          <span class="app-footer__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path
                fill="currentColor"
                d="M12 2L2 7l10 5 10-5-10-5zm0 8.5L4.5 7.5 12 4l7.5 3.5L12 10.5z"
              />
            </svg>
          </span>
          <span class="app-footer__name">Jarvis Enterprise</span>
        </div>

        <nav class="app-footer__nav" aria-label="Footer">
          <a routerLink="/dashboard" class="app-footer__link">Dashboard</a>
          <a routerLink="/settings" class="app-footer__link">Settings</a>
          <a routerLink="/profile" class="app-footer__link">Profile</a>
        </nav>

        <p class="app-footer__copy">
          &copy; {{ year }} Jarvis Enterprise. All rights reserved.
        </p>
      </div>
    </footer>
  `,
  styles: [
    `
      .app-footer {
        flex-shrink: 0;
        padding: var(--space-4) var(--space-6);
        border-top: 1px solid var(--glass-border);
        box-shadow: var(--shadow-sm);
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }

      @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        .app-footer {
          background: var(--glass-background);
          backdrop-filter: blur(var(--glass-blur)) saturate(1.25);
          -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.25);
        }
      }

      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        .app-footer {
          background: var(--color-bg-elevated);
        }
      }

      .app-footer__inner {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3) var(--space-6);
        max-width: 88rem;
        margin-inline: auto;
      }

      .app-footer__brand {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .app-footer__mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.625rem;
        height: 1.625rem;
        border-radius: var(--radius-md);
        background: color-mix(in srgb, var(--color-primary) 16%, var(--color-bg-muted));
        color: var(--color-primary);
      }

      .app-footer__name {
        font-family: var(--font-display);
        font-size: var(--text-sm);
        font-weight: 700;
        letter-spacing: var(--tracking-tight);
        color: var(--color-text);
      }

      .app-footer__nav {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-4);
      }

      .app-footer__link {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        font-weight: 500;
        text-decoration: none;
        transition: color var(--duration-fast) var(--ease-out);
      }

      .app-footer__link:hover {
        color: var(--color-primary);
      }

      .app-footer__link:focus-visible {
        outline: 2px solid var(--color-focus-ring);
        outline-offset: 2px;
        border-radius: var(--radius-sm);
      }

      .app-footer__copy {
        margin: 0;
        width: 100%;
        text-align: center;
        font-size: var(--text-xs);
        color: var(--color-text-muted);
      }

      @media (min-width: 768px) {
        .app-footer__copy {
          width: auto;
          margin-left: auto;
          text-align: right;
        }
      }
    `,
  ],
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
