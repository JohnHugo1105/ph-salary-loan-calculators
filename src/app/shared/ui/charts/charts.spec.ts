import { ComponentFixture, TestBed } from '@angular/core/testing';
import { compactPeso, niceTicks, roundedTop } from './chart-utils';
import { LineAreaChartComponent } from './line-area-chart.component';
import { SplitBarComponent } from './split-bar.component';
import { StackedColumnsComponent } from './stacked-columns.component';

describe('chart utils', () => {
  it('rounds axis ticks to clean values', () => {
    expect(niceTicks(37_000)).toEqual([0, 10_000, 20_000, 30_000, 40_000]);
    expect(niceTicks(0)).toEqual([0, 1]);
    const t = niceTicks(1_007_456);
    expect(t[0]).toBe(0);
    expect(t[t.length - 1]).toBeGreaterThanOrEqual(1_007_456);
  });

  it('compacts peso labels', () => {
    expect(compactPeso(0)).toBe('₱0');
    expect(compactPeso(500)).toBe('₱500');
    expect(compactPeso(1_500)).toBe('₱1.5K');
    expect(compactPeso(2_000_000)).toBe('₱2M');
  });

  it('draws a column with a rounded top and a square baseline', () => {
    const d = roundedTop(10, 20, 24, 100, 4);
    expect(d).toContain('Q');
    expect(d.startsWith('M10,120')).toBeTrue();
    // never rounds more than the mark can take
    expect(roundedTop(0, 0, 4, 2, 4)).toContain('Q0,0 2,0');
  });
});

describe('StackedColumnsComponent', () => {
  let fixture: ComponentFixture<StackedColumnsComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StackedColumnsComponent] }).compileComponents();
    fixture = TestBed.createComponent(StackedColumnsComponent);
    fixture.componentRef.setInput('title', 'Savings by year');
    fixture.componentRef.setInput('series', [{ name: 'Savings', slot: 1 }, { name: 'Dividends', slot: 2 }]);
    fixture.componentRef.setInput('data', [
      { label: '1', values: [6000, 200] },
      { label: '2', values: [12000, 800] },
      { label: '3', values: [18000, 0] },
    ]);
    fixture.detectChanges();
  });

  it('draws a stack per column and skips empty segments', () => {
    const paths = el().querySelectorAll('svg g path');
    expect(paths.length).toBe(5); // 2 + 2 + 1
  });

  it('shows a legend for two series, using each series slot colour', () => {
    expect(el().querySelectorAll('.legend__item').length).toBe(2);
    expect(el().querySelector('svg path')?.getAttribute('fill')).toBe('var(--series-1)');
  });

  it('always includes a table twin with every value', () => {
    const rows = el().querySelectorAll('table tbody tr');
    expect(rows.length).toBe(3);
    expect(el().querySelector('.table-wrap')?.classList).toContain('sr-only');
    expect(rows[1].textContent).toContain('₱12,000.00');
    expect(rows[1].textContent).toContain('₱12,800.00'); // total
  });

  it('reveals the table on request and hides the chart', () => {
    (el().querySelector('.link-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el().querySelector('svg')).toBeNull();
    expect(el().querySelector('.table-wrap')?.classList).not.toContain('sr-only');
  });

  it('steps through points with the keyboard and announces the value', () => {
    const group = el().querySelector('[role=group]') as HTMLElement;
    group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(el().querySelector('.chart-tip')?.textContent).toContain('₱6,200.00');
    group.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(el().querySelector('[aria-live]')?.textContent).toContain('3: Savings ₱18,000.00');
    group.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(el().querySelector('.chart-tip')).toBeNull();
  });
});

describe('LineAreaChartComponent', () => {
  let fixture: ComponentFixture<LineAreaChartComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LineAreaChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(LineAreaChartComponent);
    fixture.componentRef.setInput('title', 'Balance');
    fixture.componentRef.setInput('seriesName', 'Balance');
    fixture.componentRef.setInput('data', [{ label: '0', value: 1000 }, { label: '1', value: 600 }, { label: '2', value: 0 }]);
    fixture.detectChanges();
  });

  it('draws a 2px line and a 10% area wash', () => {
    const paths = el().querySelectorAll('svg path');
    expect(paths[0].getAttribute('fill-opacity')).toBe('0.1');
    expect(paths[1].getAttribute('stroke-width')).toBe('2');
  });

  it('marks the final point and reads values with the keyboard', () => {
    expect(el().querySelectorAll('svg circle').length).toBe(2); // ring + dot
    (el().querySelector('[role=group]') as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(el().querySelector('.chart-tip')?.textContent).toContain('₱1,000.00');
  });

  it('has a table twin', () => {
    expect(el().querySelectorAll('table tbody tr').length).toBe(3);
  });

  it('labels the first and the last point on the x axis', () => {
    const labels = Array.from(el().querySelectorAll('svg text.chart__axis[text-anchor=middle]')).map((t) => t.textContent);
    expect(labels[0]).toBe('0');
    expect(labels[labels.length - 1]).toBe('2');
  });

  it('does not draw a legend for a single series', () => {
    expect(el().querySelector('.legend')).toBeNull();
  });
});

describe('SplitBarComponent', () => {
  it('shows each part with its value and share, and sizes segments by value', () => {
    const fixture = TestBed.createComponent(SplitBarComponent);
    fixture.componentRef.setInput('title', 'Where your payments go');
    fixture.componentRef.setInput('parts', [{ label: 'Principal', value: 750, slot: 1 }, { label: 'Interest', value: 250, slot: 2 }]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.split-bar__seg').length).toBe(2);
    expect(el.textContent).toContain('₱750.00');
    expect(el.textContent).toContain('(75%)');
    expect(el.querySelector('[role=img]')?.getAttribute('aria-label')).toContain('Interest ₱250.00 (25%)');
  });
});
