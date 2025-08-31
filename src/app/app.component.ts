import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { trigger, transition, style, query, group, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({ position: 'absolute', inset: 0 })
        ], { optional: true }),
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(8px)' })
        ], { optional: true }),
        group([
          query(':leave', [
            animate('150ms ease', style({ opacity: 0, transform: 'translateY(-6px)' }))
          ], { optional: true }),
          query(':enter', [
            animate('220ms 60ms ease-out', style({ opacity: 1, transform: 'none' }))
          ], { optional: true })
        ])
      ])
    ])
  ]
})
export class AppComponent {
  title = 'PH Salary & Loan Calculators';
  prepareRoute(outlet: RouterOutlet | null) {
    if (!outlet || !('isActivated' in outlet) || !outlet.isActivated) {
      return undefined;
    }
    return outlet.activatedRoute.snapshot.routeConfig?.path ?? undefined;
  }

  showDisclaimer = true;

  constructor() {
    try {
      this.showDisclaimer = localStorage.getItem('hideDisclaimer') !== '1';
    } catch {}
  }

  dismissDisclaimer() {
    this.showDisclaimer = false;
    try { localStorage.setItem('hideDisclaimer', '1'); } catch {}
  }
}
