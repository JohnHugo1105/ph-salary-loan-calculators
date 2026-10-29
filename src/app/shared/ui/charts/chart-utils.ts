import { afterNextRender, DestroyRef, ElementRef, inject, signal, Signal } from '@angular/core';

// Round the top of a chart axis to clean tick values (0, 50K, 100K ...).
export function niceTicks(max: number, target = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const raw = max / target;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
  const ticks: number[] = [];
  for (let v = 0; v < max + step * 0.999; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

// Compact peso label for axes: ₱0, ₱500, ₱1.5K, ₱2M.
export function compactPeso(n: number): string {
  const trim = (v: number) => String(Math.round(v * 10) / 10);
  if (n >= 1_000_000) return `₱${trim(n / 1_000_000)}M`;
  if (n >= 1_000) return `₱${trim(n / 1_000)}K`;
  return `₱${trim(n)}`;
}

// Roof of a column: 4px rounded data-end, square at the baseline.
export function roundedTop(x: number, y: number, w: number, h: number, r = 4): string {
  const rr = Math.max(0, Math.min(r, h, w / 2));
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

// Tracks the host's pixel width so labels keep their real size (browser only; SSR uses the initial).
export function useContainerWidth(initial = 640): Signal<number> {
  const width = signal(initial);
  const host = inject<ElementRef<HTMLElement>>(ElementRef);
  const destroyRef = inject(DestroyRef);
  afterNextRender(() => {
    const el = host.nativeElement;
    const update = () => width.set(Math.max(280, Math.round(el.clientWidth)));
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    destroyRef.onDestroy(() => ro.disconnect());
  });
  return width;
}

export type SeriesSlot = 1 | 2 | 3;
export interface SeriesDef {
  name: string;
  slot: SeriesSlot;
}
