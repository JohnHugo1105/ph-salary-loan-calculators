import { Component } from '@angular/core';
import { SeoService } from './shared/seo.service';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: []
})
export class AppComponent {
  title = 'PH Salary & Loan Calculators';
  showMobileNav = false;
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
    } catch {}
  }

  dismissDisclaimer() {
    this.showDisclaimer = false;
    try { localStorage.setItem('hideDisclaimer', '1'); } catch {}
  }

  toggleMobileNav() {
    this.showMobileNav = !this.showMobileNav;
  }

  closeMobileNav() {
    this.showMobileNav = false;
  }
}
