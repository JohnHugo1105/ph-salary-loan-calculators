import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Mp2Component } from './mp2.component';

describe('Mp2Component', () => {
  let fixture: ComponentFixture<Mp2Component>;
  let component: Mp2Component;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Mp2Component], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(Mp2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults to the latest declared rate', () => {
    expect(component.form.value.rate).toBe(7.12);
    expect(component.model().years).toBe(5);
    expect(component.model().contributed).toBe(30_000);
  });

  it('stacks savings and dividends so each year adds up to the total value', () => {
    const m = component.model();
    const last = m.columns[m.columns.length - 1];
    expect(last.values[0] + last.values[1]).toBeCloseTo(m.accumulated, 2);
  });

  it('projects 10 years when asked', () => {
    component.form.patchValue({ rollover: true });
    expect(component.model().years).toBe(10);
    expect(component.model().columns.length).toBe(10);
  });

  it('compounding beats taking dividends yearly', () => {
    const compounded = component.model().accumulated;
    component.form.patchValue({ mode: 'annual' });
    expect(component.model().accumulated).toBeLessThan(compounded);
  });

  it('generates the guide figures from the engine at the declared rate', () => {
    expect(component.walk.year1).toBe('₱427.20');
    expect(component.walk.carriedDividend).toBe('₱884.82');
    expect(component.walk.year2).toBe('₱1,312.02');
    const thousand = component.fiveYears[1];
    expect(thousand).toEqual({ monthly: '₱1,000', saved: '₱60,000', reinvested: '₱11,636.90', maturity: '₱71,636.90', yearly: '₱10,680.00' });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('₱71,636.90');
    expect(text).toContain('When will the 2026 MP2 dividend rate be announced?');
  });

  it('renders the chart with a table twin', () => {
    expect(fixture.nativeElement.querySelector('app-stacked-columns svg')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('app-stacked-columns table tbody tr').length).toBe(5);
  });
});
