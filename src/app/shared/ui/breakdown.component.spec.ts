import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakdownComponent, BreakdownRow } from './breakdown.component';

describe('BreakdownComponent', () => {
  let fixture: ComponentFixture<BreakdownComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const rows: BreakdownRow[] = [
    { label: 'Earnings', amount: '', kind: 'heading' },
    { label: 'Basic pay', amount: 30000 },
    { label: 'SSS', amount: 1000, kind: 'neg', formula: '5% × ₱20,000' },
    { label: 'Term', amount: '20 years' },
    { label: 'Take-home pay', amount: 26542.45, kind: 'total' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BreakdownComponent] }).compileComponents();
    fixture = TestBed.createComponent(BreakdownComponent);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
  });

  it('formats amounts and marks deductions as negative', () => {
    const text = el().textContent ?? '';
    expect(text).toContain('₱30,000.00');
    expect(text).toContain('−₱1,000.00');
    expect(text).toContain('₱26,542.45');
    expect(text).toContain('20 years');
  });

  it('renders headings without an amount', () => {
    expect(el().querySelector('.breakdown__heading')?.textContent).toContain('Earnings');
    expect(el().querySelectorAll('.breakdown__row').length).toBe(4);
  });

  it('hides formulas until asked, then shows them', () => {
    expect(el().querySelector('.breakdown__formula')).toBeNull();
    const toggle = el().querySelector('button') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(el().querySelector('.breakdown__formula')?.textContent).toContain('5% × ₱20,000');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });

  it('offers no toggle when no row has a formula', () => {
    fixture.componentRef.setInput('rows', [{ label: 'A', amount: 1 }]);
    fixture.detectChanges();
    expect(el().querySelector('button')).toBeNull();
  });
});
