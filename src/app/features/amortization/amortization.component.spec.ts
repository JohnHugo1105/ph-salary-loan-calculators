import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AmortizationComponent } from './amortization.component';

describe('AmortizationComponent', () => {
  let fixture: ComponentFixture<AmortizationComponent>;
  let component: AmortizationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AmortizationComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(AmortizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('computes the payment, interest and totals for the default loan', () => {
    const m = component.model();
    expect(m.payment).toBe(8_364.4);
    expect(m.totalPaid).toBeCloseTo(m.payment * 240, 0);
    expect(m.totalInterest).toBeCloseTo(m.totalPaid - 1_000_000, 2);
    expect(m.years.length).toBe(20);
    expect(m.years[19].balance).toBe(0);
  });

  it('yearly rows add up to the loan', () => {
    const m = component.model();
    const principal = m.years.reduce((a, y) => a + y.principal, 0);
    expect(principal).toBeCloseTo(1_000_000, 0);
  });

  it('sets the term from a preset', () => {
    component.setTerm(5);
    expect(component.form.value.months).toBe(60);
    expect(component.isTerm(5)).toBeTrue();
    expect(component.model().payment).toBeGreaterThan(8_364.4);
  });

  it('generates the guide scenarios from the engine, not hardcoded text', () => {
    expect(component.scenarioA.payment).toBe(20_276.39);
    expect(component.scenarioA.totalInterest).toBe(216_583.66);
    expect(component.scenarioB.payment).toBe(8_364.4);
    expect(component.scenarioB.totalInterest).toBe(1_007_456.17);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('20,276.39');
    expect(text).toContain('216,583.66');
    expect(text).toContain('1,007,456.17');
    expect(text).not.toContain('216,583.74');
  });

  it('sums a zero-interest loan exactly', () => {
    component.form.patchValue({ annualRate: 0, amount: 120_000, months: 12 });
    expect(component.model().payment).toBe(10_000);
    expect(component.model().totalInterest).toBe(0);
  });

  it('pages through the monthly schedule', () => {
    component.viewControl.setValue('monthly');
    fixture.detectChanges();
    expect(component.pagedRows().length).toBe(12);
    component.next();
    expect(component.pagedRows()[0].period).toBe(13);
    component.setPageSize(60);
    expect(component.totalPages()).toBe(4);
  });

  it('flags an invalid term', () => {
    component.form.patchValue({ months: 0 });
    expect(component.form.controls.months.valid).toBeFalse();
  });
});
