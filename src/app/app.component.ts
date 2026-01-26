import { Component } from '@angular/core';
import { SeoService } from './shared/seo.service';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { CookieConsentComponent } from './shared/components/cookie-consent/cookie-consent.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatSlideToggleModule, CookieConsentComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: []
})
export class AppComponent {
  title = 'PH Salary & Loan Calculators';
  showMobileNav = false;
  isLight = false;
  prepareRoute(outlet: RouterOutlet | null) {
    if (!outlet || !('isActivated' in outlet) || !outlet.isActivated) {
      return undefined;
    }
    return outlet.activatedRoute.snapshot.routeConfig?.path ?? undefined;
  }

  showDisclaimer = true;

  constructor(private _seo: SeoService) {
    try {
      this.showDisclaimer = localStorage.getItem('hideDisclaimer') !== '1';
    } catch { }

    // Initialize theme (dark default)
    this.initTheme();
  }

  dismissDisclaimer() {
    this.showDisclaimer = false;
    try { localStorage.setItem('hideDisclaimer', '1'); } catch { }
  }

  toggleMobileNav() {
    this.showMobileNav = !this.showMobileNav;
  }

  closeMobileNav() {
    this.showMobileNav = false;
  }

  private initTheme() {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') {
        this.applyTheme(saved === 'light');
        return;
      }
    } catch { }
    this.applyTheme(false); // default dark
  }

  onToggleTheme(checked: boolean) {
    this.applyTheme(checked);
    try { localStorage.setItem('theme', checked ? 'light' : 'dark'); } catch { }
  }

  private applyTheme(light: boolean) {
    this.isLight = light;
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('light-theme', light);
    }
  }
}
