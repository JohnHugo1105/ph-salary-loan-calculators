import { ChangeDetectionStrategy, Component, ElementRef, PLATFORM_ID, computed, effect, inject, signal, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SearchHit, TOOLS, searchCatalog } from '../core/config/tools';
import { IconComponent } from '../shared/ui/icon.component';
import { SearchService } from './search.service';

// Command-palette style search (Ctrl/Cmd+K or "/") over calculators, guides and references.
@Component({
  selector: 'app-search-palette',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dlg class="palette" aria-label="Search calculators and guides" (close)="onClosed()" (click)="onBackdrop($event)">
      <div class="palette__input">
        <app-icon name="search" />
        <input
          #field
          type="search"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          [attr.aria-activedescendant]="hits().length ? 'palette-opt-' + active() : null"
          placeholder="Search calculators, e.g. “13th month” or “loan”"
          autocomplete="off"
          [value]="query()"
          (input)="onInput($any($event.target).value)"
          (keydown)="onKey($event)"
        />
        <button type="button" class="btn btn--ghost btn--sm" (click)="search.close()">Esc</button>
      </div>
      @if (hits().length) {
        <ul class="palette__list" id="palette-list" role="listbox">
          @for (h of hits(); track h.route; let i = $index) {
            <li class="palette__item" role="option" [id]="'palette-opt-' + i" [attr.aria-selected]="i === active()" [class.palette__item--active]="i === active()">
              <a [href]="h.route" (click)="go($event, h)" (pointermove)="active.set(i)">
                <app-icon [name]="h.icon" />
                <span>
                  <strong>{{ h.title }}</strong>
                  <small>{{ h.kind }} · {{ h.description }}</small>
                </span>
              </a>
            </li>
          }
        </ul>
      } @else {
        <p class="palette__empty">No matches for “{{ query() }}”. Try “tax”, “loan” or “SSS”.</p>
      }
    </dialog>
  `,
})
export class SearchPaletteComponent {
  readonly search = inject(SearchService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  readonly query = signal('');
  readonly active = signal(0);

  private static readonly popular: SearchHit[] = TOOLS.filter((t) => t.popular).map((t) => ({ ...t, kind: 'Calculator' as const }));

  readonly hits = computed<SearchHit[]>(() => {
    const q = this.query().trim();
    return q ? searchCatalog(q) : SearchPaletteComponent.popular;
  });

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;
      const el = this.dlg().nativeElement;
      if (this.search.isOpen() && !el.open && typeof el.showModal === 'function') {
        this.query.set('');
        this.active.set(0);
        el.showModal();
        queueMicrotask(() => this.field().nativeElement.focus());
      } else if (!this.search.isOpen() && el.open) {
        el.close();
      }
    });
  }

  onInput(value: string) {
    this.query.set(value);
    this.active.set(0);
  }

  onKey(e: KeyboardEvent) {
    const n = this.hits().length;
    if (e.key === 'ArrowDown' && n) {
      e.preventDefault();
      this.active.set((this.active() + 1) % n);
    } else if (e.key === 'ArrowUp' && n) {
      e.preventDefault();
      this.active.set((this.active() - 1 + n) % n);
    } else if (e.key === 'Enter' && n) {
      e.preventDefault();
      this.navigate(this.hits()[this.active()]);
    }
  }

  go(event: MouseEvent, hit: SearchHit) {
    event.preventDefault();
    this.navigate(hit);
  }

  onBackdrop(event: MouseEvent) {
    if (event.target === this.dlg().nativeElement) this.search.close();
  }

  onClosed() {
    this.search.close();
  }

  private navigate(hit: SearchHit) {
    this.search.close();
    void this.router.navigateByUrl(hit.route);
  }
}
