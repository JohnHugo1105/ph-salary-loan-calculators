import { ChangeDetectionStrategy, Component, ElementRef, PLATFORM_ID, inject, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SeoService } from './core/services/seo.service';
import { ConsentComponent } from './layout/consent.component';
import { SearchPaletteComponent } from './layout/search-palette.component';
import { SearchService } from './layout/search.service';
import { SiteFooterComponent } from './layout/site-footer.component';
import { SiteHeaderComponent } from './layout/site-header.component';
import { ToastComponent } from './layout/toast.component';
import { IconSpriteComponent } from './shared/ui/icon-sprite.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent, ConsentComponent, ToastComponent, SearchPaletteComponent, IconSpriteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)' },
  template: `
    <app-icon-sprite />
    <a class="skip-link" href="#main" (click)="skip($event)">Skip to content</a>
    <app-site-header />
    <main #main id="main" class="page" tabindex="-1">
      <router-outlet />
    </main>
    <app-site-footer />
    <app-consent />
    <app-toast />
    <app-search-palette />
  `,
})
export class AppComponent {
  title = 'PH Salary & Loan Calculators';

  private readonly search = inject(SearchService);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private firstNavigation = true;

  constructor(_seo: SeoService, router: Router) {
    // After a route change, move focus to the new page so keyboard and screen reader users start there.
    router.events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed()).subscribe(() => {
      if (!this.isBrowser) return;
      if (this.firstNavigation) {
        this.firstNavigation = false;
        return;
      }
      this.main().nativeElement.focus({ preventScroll: true });
    });
  }

  skip(event: Event) {
    event.preventDefault();
    this.main().nativeElement.focus();
  }

  onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    const typing = !!target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
    const cmdK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
    if (cmdK || (event.key === '/' && !typing)) {
      event.preventDefault();
      this.search.open();
    }
  }
}
