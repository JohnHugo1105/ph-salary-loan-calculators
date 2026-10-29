import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

const KEY = 'cookie_consent';

// Small corner notice instead of a full-width banner.
@Component({
  selector: 'app-consent',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <section class="consent no-print" aria-label="Cookie notice">
        <p>
          We use cookies to remember your settings and to show ads. By continuing you agree to this.
          <a routerLink="/privacy-policy">Privacy policy</a>
        </p>
        <button type="button" class="btn btn--primary btn--sm" (click)="accept()">Got it</button>
      </section>
    }
  `,
})
export class ConsentComponent {
  readonly visible = signal(false);

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    try {
      this.visible.set(!localStorage.getItem(KEY));
    } catch {
      this.visible.set(false);
    }
  }

  accept() {
    this.visible.set(false);
    try {
      localStorage.setItem(KEY, 'true');
    } catch { /* ignore */ }
  }
}
