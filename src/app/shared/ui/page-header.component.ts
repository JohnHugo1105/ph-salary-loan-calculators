import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      @if (section()) {
        <nav class="crumbs" aria-label="Breadcrumb">
          <a routerLink="/">Home</a> <span aria-hidden="true">/</span> {{ section() }}
        </nav>
      }
      <h1>
        @for (part of parts(); track $index) {
          @if (part === 'Pag-IBIG') { <span style="white-space: nowrap">Pag-IBIG</span> } @else { {{ part }} }
        }
      </h1>
      @if (lede()) {
        <p class="page-header__lede">{{ lede() }}</p>
      }
      <div class="page-header__eyebrow" style="margin:var(--space-4) 0 0"><ng-content /></div>
    </header>
  `,
})
export class PageHeaderComponent {
  title = input.required<string>();
  // Hyphenated names must not break across lines in the heading.
  readonly parts = computed(() => this.title().split(/(Pag-IBIG)/).filter(Boolean));
  lede = input<string>('');
  section = input<string>('');
}
