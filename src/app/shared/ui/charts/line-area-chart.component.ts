import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { formatPeso } from '../../format';
import { compactPeso, niceTicks, useContainerWidth } from './chart-utils';

export interface PointDatum {
  label: string;
  value: number;
}

// One series over time (e.g. remaining loan balance). 2px line, 10% area wash, end dot with a
// surface ring, crosshair tooltip that snaps to the nearest point, and a table twin.
@Component({
  selector: 'app-line-area-chart',
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
            <svg class="chart" [attr.viewBox]="'0 0 ' + width() + ' ' + height" [attr.width]="width()" [attr.height]="height" aria-hidden="true"
              (pointermove)="onMove($event)">
              @for (t of ticks(); track t) {
                <line class="chart__grid" [attr.x1]="left" [attr.x2]="width() - right" [attr.y1]="y(t)" [attr.y2]="y(t)" />
                <text class="chart__axis" [attr.x]="left - 8" [attr.y]="y(t) + 4" text-anchor="end">{{ compact(t) }}</text>
              }
              <path [attr.d]="areaPath()" fill="var(--series-1)" fill-opacity="0.1" />
              <path [attr.d]="linePath()" fill="none" stroke="var(--series-1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
              @for (i of labelIndexes(); track i) {
                <text class="chart__axis" [attr.x]="x(i)" [attr.y]="height - 8" text-anchor="middle">{{ data()[i].label }}</text>
              }
              @if (activePoint(); as p) {
                <line class="chart__grid" [attr.x1]="p.x" [attr.x2]="p.x" [attr.y1]="top" [attr.y2]="height - bottom" style="stroke:var(--border-strong)" />
                <circle [attr.cx]="p.x" [attr.cy]="p.y" r="6" fill="var(--surface)" />
                <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="var(--series-1)" />
              } @else if (endPoint(); as e) {
                <circle [attr.cx]="e.x" [attr.cy]="e.y" r="6" fill="var(--surface)" />
                <circle [attr.cx]="e.x" [attr.cy]="e.y" r="4" fill="var(--series-1)" />
              }
            </svg>
          </div>
          @if (activePoint(); as p) {
            <div class="chart-tip" [style.left.px]="tipLeft(p.x)" [style.top.px]="p.y">
              <div class="chart-tip__title">{{ p.label }}</div>
              <div class="chart-tip__row">
                <span><i class="chart-tip__key" style="background:var(--series-1)"></i>{{ seriesName() }}</span>
                <strong>{{ money(p.value) }}</strong>
              </div>
            </div>
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
              <th scope="col" class="num">{{ seriesName() }}</th>
            </tr>
          </thead>
          <tbody>
            @for (d of data(); track d.label) {
              <tr>
                <th scope="row">{{ d.label }}</th>
                <td class="num">{{ money(d.value) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <p class="sr-only" aria-live="polite">{{ liveText() }}</p>
    </figure>
  `,
})
export class LineAreaChartComponent {
  title = input.required<string>();
  seriesName = input.required<string>();
  rowHeader = input('Year');
  data = input.required<PointDatum[]>();

  readonly width = useContainerWidth();
  readonly height = 240;
  readonly top = 12;
  readonly bottom = 30;
  readonly left = 52;
  readonly right = 12;
  readonly showTable = signal(false);
  readonly active = signal<number | null>(null);

  readonly ticks = computed(() => niceTicks(Math.max(0, ...this.data().map((d) => d.value))));
  private readonly yMax = computed(() => this.ticks()[this.ticks().length - 1] || 1);

  readonly points = computed(() => this.data().map((d, i) => ({ x: this.x(i), y: this.y(d.value), label: d.label, value: d.value })));
  readonly linePath = computed(() => this.points().map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(''));
  readonly areaPath = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';
    const base = this.y(0);
    return `${this.linePath()}L${pts[pts.length - 1].x.toFixed(1)},${base}L${pts[0].x.toFixed(1)},${base}Z`;
  });
  readonly activePoint = computed(() => {
    const i = this.active();
    return i === null ? null : (this.points()[i] ?? null);
  });
  readonly endPoint = computed(() => this.points()[this.points().length - 1] ?? null);

  readonly labelIndexes = computed(() => {
    const n = this.data().length;
    const fit = Math.max(1, Math.floor((this.width() - this.left - this.right) / 56));
    const every = Math.ceil(n / fit);
    const idx: number[] = [];
    for (let i = 0; i < n; i += every) idx.push(i);
    // Always label the final point when it is not crowding the previous label.
    const last = n - 1;
    if (last > 0 && idx[idx.length - 1] !== last && last - idx[idx.length - 1] >= every / 2) idx.push(last);
    return idx;
  });

  readonly liveText = computed(() => {
    const p = this.activePoint();
    return p ? `${p.label}: ${this.seriesName()} ${formatPeso(p.value)}` : '';
  });

  x(i: number): number {
    const n = this.data().length;
    const w = this.width() - this.left - this.right;
    return this.left + (n <= 1 ? 0 : (w * i) / (n - 1));
  }
  y(v: number): number {
    const plotH = this.height - this.top - this.bottom;
    return this.top + plotH - (v / this.yMax()) * plotH;
  }
  compact = compactPeso;
  money = (v: number) => formatPeso(v);

  tipLeft(px: number): number {
    return Math.min(Math.max(px, 90), this.width() - 90);
  }

  onMove(e: PointerEvent) {
    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const n = this.data().length;
    if (!n) return;
    const w = this.width() - this.left - this.right;
    const i = Math.round(((px - this.left) / (w || 1)) * (n - 1));
    this.active.set(Math.min(n - 1, Math.max(0, i)));
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
