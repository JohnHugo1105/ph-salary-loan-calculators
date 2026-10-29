import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatPeso, formatPercent } from '../../format';
import { SeriesSlot } from './chart-utils';

export interface SplitPart {
  label: string;
  value: number;
  slot: SeriesSlot;
}

// Part-to-whole as one thin horizontal stacked bar. Values live in the legend beneath it,
// so nothing depends on color or hover.
@Component({
  selector: 'app-split-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block;min-width:0' },
  template: `
    <figure style="margin:0">
      <figcaption class="chart-frame__title" style="margin-bottom:var(--space-3)">{{ title() }}</figcaption>
      <div class="split-bar" role="img" [attr.aria-label]="summary()">
        @for (p of shares(); track p.label) {
          <div class="split-bar__seg" [class]="'split-bar__seg split-bar__seg--' + p.slot" [style.flex-grow]="p.value" [title]="p.label + ': ' + money(p.value)"></div>
        }
      </div>
      <ul class="legend" style="list-style:none;padding:0;margin-top:var(--space-3);gap:var(--space-2) var(--space-5)">
        @for (p of shares(); track p.label) {
          <li class="legend__item">
            <i class="legend__swatch" [class]="'legend__swatch legend__swatch--' + p.slot"></i>
            <span>{{ p.label }}</span>
            <strong style="color:var(--text)">{{ money(p.value) }}</strong>
            <span>({{ p.pct }})</span>
          </li>
        }
      </ul>
    </figure>
  `,
})
export class SplitBarComponent {
  title = input.required<string>();
  parts = input.required<SplitPart[]>();

  readonly shares = computed(() => {
    const total = this.parts().reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
    return this.parts().map((p) => ({ ...p, pct: formatPercent((Math.max(0, p.value) / total) * 100, 1) }));
  });
  readonly summary = computed(() => `${this.title()}: ` + this.shares().map((p) => `${p.label} ${formatPeso(p.value)} (${p.pct})`).join(', '));
  money = (v: number) => formatPeso(v);
}
