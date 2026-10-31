import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GUIDES, REFERENCE_PAGES, TOOLS, TOOL_GROUPS } from '../core/config/tools';
import { ThemeService } from '../core/services/theme.service';
import { IconComponent } from '../shared/ui/icon.component';
import { IconName } from '../shared/ui/icon-names';
import { SearchService } from './search.service';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close()' },
  template: `
    <header class="site-header">
      <div class="container site-header__inner">
        <a class="brand" routerLink="/" (click)="close()">
          <img class="brand__logo brand__logo--light" src="/assets/logo/logo-header.webp" alt="PH Calculators" width="164" height="36" />
          <img class="brand__logo brand__logo--dark" src="/assets/logo/logo-header-dark.webp" alt="PH Calculators" width="164" height="36" />
        </a>

        <nav class="nav" aria-label="Main">
          <button type="button" class="nav__link" [attr.aria-expanded]="menuOpen()" aria-controls="mega" (click)="toggle()">
            Calculators <app-icon name="chevron-down" [size]="16" />
          </button>
          <a class="nav__link" routerLink="/articles" routerLinkActive="active">Guides</a>
          <a class="nav__link" routerLink="/rates" routerLinkActive="active">Rates &amp; sources</a>
        </nav>

        <button type="button" class="btn btn--ghost search-btn" aria-label="Search calculators" (click)="openSearch()">
          <app-icon name="search" />
          <span class="search-btn__text">Search</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button type="button" class="btn btn--ghost btn--icon" [attr.aria-label]="themeLabel()" (click)="theme.cycle()">
          <app-icon [name]="themeIcon()" />
        </button>
        <button type="button" class="btn btn--ghost btn--icon menu-btn" [attr.aria-expanded]="menuOpen()" aria-controls="mega"
          [attr.aria-label]="menuOpen() ? 'Close menu' : 'Open menu'" (click)="toggle()">
          <app-icon [name]="menuOpen() ? 'x' : 'menu'" />
        </button>
      </div>

      @if (menuOpen()) {
        <div class="mega-backdrop" (click)="close()"></div>
        <div class="mega" id="mega">
          <div class="container mega__inner">
            @for (g of groups; track g.id) {
              <section class="mega__group" [attr.aria-label]="g.title">
                <h2>{{ g.title }}</h2>
                @for (t of toolsIn(g.id); track t.id) {
                  <a class="mega__link" [routerLink]="t.route" routerLinkActive="active" (click)="close()">
                    <app-icon [name]="t.icon" /> {{ t.title }}
                  </a>
                }
              </section>
            }
            <section class="mega__group" aria-label="Learn">
              <h2>Learn</h2>
              <a class="mega__link" routerLink="/articles" routerLinkActive="active" (click)="close()"><app-icon name="file-text" /> All guides</a>
              @for (g of guides; track g.route) {
                <a class="mega__link" [routerLink]="g.route" routerLinkActive="active" (click)="close()"><app-icon [name]="g.icon" /> {{ g.title }}</a>
              }
              @for (r of reference; track r.route) {
                <a class="mega__link" [routerLink]="r.route" routerLinkActive="active" (click)="close()"><app-icon [name]="r.icon" /> {{ r.title }}</a>
              }
            </section>
          </div>
        </div>
      }
    </header>
  `,
})
export class SiteHeaderComponent {
  readonly theme = inject(ThemeService);
  private readonly search = inject(SearchService);
  readonly menuOpen = signal(false);
  readonly groups = TOOL_GROUPS;
  readonly guides = GUIDES;
  readonly reference = REFERENCE_PAGES;

  readonly themeIcon = computed<IconName>(() => ({ system: 'monitor', light: 'sun', dark: 'moon' } as const)[this.theme.mode()]);
  readonly themeLabel = computed(() => {
    const mode = this.theme.mode();
    const next = mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';
    return `Theme: ${mode}. Switch to ${next}`;
  });

  constructor() {
    inject(Router).events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.close());
  }

  toolsIn(group: string) {
    return TOOLS.filter((t) => t.group === group);
  }
  toggle() {
    this.menuOpen.update((v) => !v);
  }
  close() {
    this.menuOpen.set(false);
  }
  openSearch() {
    this.close();
    this.search.open();
  }
}
