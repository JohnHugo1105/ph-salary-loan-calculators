import { Component } from '@angular/core';
import { SeoService } from './core/services/seo.service';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

import { CookieConsentComponent } from './shared/components/cookie-consent/cookie-consent.component';
import { AdComponent } from './shared/components/ad/ad.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatSlideToggleModule, MatMenuModule, MatExpansionModule, MatIconModule, CookieConsentComponent, AdComponent],
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
