import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { formatPeso } from '../../format';
import { compactPeso, niceTicks, roundedTop, SeriesDef, useContainerWidth } from './chart-utils';

export interface ColumnDatum {
  label: string;
  values: number[];
}

interface Segment {
  path: string;
  slot: number;
}
interface Column {
  label: string;
  cx: number;
  band: number;
  segments: Segment[];
  top: number;
  total: number;
}

// Stacked columns (e.g. contributions + dividends per year). Thin marks, 2px gaps between
// segments, tooltip on hover/focus, arrow keys to step, and a table twin for screen readers.
@Component({
  selector: 'app-stacked-columns',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block;min-width:0' },
  template: `
    <figure class="chart-frame" style="margin:0">
      <div class="chart-frame__head">
        <figcaption class="chart-frame__title">{{ title() }}</figcaption>
        <button type="button" class="link-btn no-print" [attr.aria-pressed]="showTable()" (click)="showTable.set(!showTable())">
          {{ showTable() ? 'Show chart' : 'Show as table' }}
        </button>
      </div>

      @if (!showTable()) {
        <div class="chart-frame__plot" (pointerleave)="active.set(null)">
          <div tabindex="0" role="group" [attr.aria-label]="title() + '. Use left and right arrow keys to read each point.'"
            (keydown)="onKey($event)" (blur)="active.set(null)" style="outline-offset:4px;border-radius:8px">
            <svg class="chart" [attr.viewBox]="'0 0 ' + width() + ' ' + height" [attr.width]="width()" [attr.height]="height" aria-hidden="true">
              @for (t of ticks(); track t) {
                <line class="chart__grid" [attr.x1]="left" [attr.x2]="width() - right" [attr.y1]="y(t)" [attr.y2]="y(t)" />
                <text class="chart__axis" [attr.x]="left - 8" [attr.y]="y(t) + 4" text-anchor="end">{{ compact(t) }}</text>
              }
              @for (c of columns(); track c.label; let i = $index) {
                <g [style.opacity]="active() === null || active() === i ? 1 : 0.45">
                  @for (s of c.segments; track $index) {
                    <path [attr.d]="s.path" [attr.fill]="'var(--series-' + s.slot + ')'" />
                  }
                </g>
                @if (showLabel(i)) {
                  <text class="chart__axis" [attr.x]="c.cx" [attr.y]="height - 8" text-anchor="middle">{{ c.label }}</text>
                }
                <rect [attr.x]="c.cx - c.band / 2" [attr.y]="top" [attr.width]="c.band" [attr.height]="height - top - bottom"
                  fill="transparent" (pointerenter)="active.set(i)" (pointermove)="active.set(i)" (click)="active.set(i)" />
              }
            </svg>
          </div>
          @if (activeColumn(); as a) {
            <div class="chart-tip" [style.left.px]="tipLeft(a.cx)" [style.top.px]="a.top">
              <div class="chart-tip__title">{{ a.label }}</div>
              @for (s of series(); track s.name; let k = $index) {
                <div class="chart-tip__row">
                  <span><i class="chart-tip__key" [style.background]="'var(--series-' + s.slot + ')'"></i>{{ s.name }}</span>
                  <strong>{{ money(data()[active()!].values[k]) }}</strong>
                </div>
              }
              @if (series().length > 1) {
                <div class="chart-tip__row chart-tip__total"><span>Total</span><strong>{{ money(a.total) }}</strong></div>
              }
            </div>
          }
        </div>
      }

      @if (series().length > 1 && !showTable()) {
        <div class="legend">
          @for (s of series(); track s.name) {
            <span class="legend__item"><i class="legend__swatch" [class]="'legend__swatch legend__swatch--' + s.slot"></i>{{ s.name }}</span>
          }
        </div>
      }

      <div class="table-wrap" [class.sr-only]="!showTable()" style="margin-top:var(--space-3)"
        [attr.tabindex]="showTable() ? 0 : null" [attr.role]="showTable() ? 'region' : null" [attr.aria-label]="showTable() ? title() + ' as a table' : null">
        <table class="table">
          <caption class="sr-only">{{ title() }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ rowHeader() }}</th>
              @for (s of series(); track s.name) {
                <th scope="col" class="num">{{ s.name }}</th>
              }
              @if (series().length > 1) {
                <th scope="col" class="num">Total</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (d of data(); track d.label) {
              <tr>
                <th scope="row">{{ d.label }}</th>
                @for (v of d.values; track $index) {
                  <td class="num">{{ money(v) }}</td>
                }
                @if (series().length > 1) {
                  <td class="num">{{ money(sum(d.values)) }}</td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
      <p class="sr-only" aria-live="polite">{{ liveText() }}</p>
    </figure>
  `,
})
export class StackedColumnsComponent {
  title = input.required<string>();
  rowHeader = input('Year');
  data = input.required<ColumnDatum[]>();
  series = input.required<SeriesDef[]>();

  readonly width = useContainerWidth();
  readonly height = 260;
  readonly top = 12;
  readonly bottom = 30;
  readonly left = 52;
  readonly right = 8;
  readonly showTable = signal(false);
  readonly active = signal<number | null>(null);

  readonly max = computed(() => Math.max(0, ...this.data().map((d) => this.sum(d.values))));
  readonly ticks = computed(() => niceTicks(this.max()));
  private readonly yMax = computed(() => this.ticks()[this.ticks().length - 1] || 1);

  readonly columns = computed<Column[]>(() => {
    const data = this.data();
    const n = Math.max(1, data.length);
    const innerW = this.width() - this.left - this.right;
    const band = innerW / n;
    const barW = Math.min(24, band * 0.6);
    return data.map((d, i) => {
      const cx = this.left + band * (i + 0.5);
      const lastNonZero = d.values.reduce((acc, v, k) => (v > 0 ? k : acc), -1);
      let acc = 0;
      const segments: Segment[] = [];
      d.values.forEach((v, k) => {
        if (v <= 0) return;
        const y1 = this.y(acc + v);
        const y0 = this.y(acc);
        // 2px surface gap where segments touch.
        const gapTop = k === lastNonZero ? 0 : 1;
        const gapBottom = acc === 0 ? 0 : 1;
        const yy = y1 + gapTop;
        const hh = Math.max(1, y0 - y1 - gapTop - gapBottom);
        const x = cx - barW / 2;
        segments.push({
          slot: this.series()[k]?.slot ?? 1,
          path: k === lastNonZero ? roundedTop(x, yy, barW, hh) : `M${x},${yy}h${barW}v${hh}h${-barW}Z`,
        });
        acc += v;
      });
      return { label: d.label, cx, band, segments, top: this.y(acc), total: acc };
    });
  });

  readonly activeColumn = computed(() => {
    const i = this.active();
    return i === null ? null : (this.columns()[i] ?? null);
  });

  readonly liveText = computed(() => {
    const i = this.active();
    if (i === null) return '';
    const d = this.data()[i];
    return `${d.label}: ` + this.series().map((s, k) => `${s.name} ${formatPeso(d.values[k])}`).join(', ');
  });

  y(v: number): number {
    const plotH = this.height - this.top - this.bottom;
    return this.top + plotH - (v / this.yMax()) * plotH;
  }
  compact = compactPeso;
  money = (v: number) => formatPeso(v);
  sum(values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
  }

  showLabel(i: number): boolean {
    const n = this.data().length;
    const fit = Math.max(1, Math.floor((this.width() - this.left - this.right) / 44));
    const every = Math.ceil(n / fit);
    return i % every === 0 || i === n - 1 && (n - 1) % every === 0;
  }

  tipLeft(cx: number): number {
    return Math.min(Math.max(cx, 90), this.width() - 90);
  }

  onKey(e: KeyboardEvent) {
    const n = this.data().length;
    if (!n) return;
    const cur = this.active();
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = cur === null ? 0 : Math.min(n - 1, cur + 1);
    else if (e.key === 'ArrowLeft') next = cur === null ? n - 1 : Math.max(0, cur - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else if (e.key === 'Escape') next = null;
    else return;
    e.preventDefault();
    this.active.set(next);
  }
}
