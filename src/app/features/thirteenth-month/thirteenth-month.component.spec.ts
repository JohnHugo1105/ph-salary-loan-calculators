import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ThirteenthMonthComponent } from './thirteenth-month.component';

describe('ThirteenthMonthComponent', () => {
  let fixture: ComponentFixture<ThirteenthMonthComponent>;
  let component: ThirteenthMonthComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ThirteenthMonthComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(ThirteenthMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('gives one month of pay for a full year, fully tax-exempt under the limit', () => {
    const r = component.result();
    expect(r.gross13th).toBe(30_000);
    expect(r.taxable).toBe(0);
    expect(r.net13th).toBe(30_000);
  });

  it('pro-rates from the months actually worked', () => {
    component.form.patchValue({ mode: 'detailed' });
    component.history.patchValue([0, 0, 0, 0, 0, 0, 0, 25_000, 25_000, 25_000, 25_000, 25_000]);
    expect(component.result().gross13th).toBeCloseTo(10_416.67, 2);
  });

  it('taxes only the part above the exemption, and other benefits use up the limit', () => {
    component.form.patchValue({ monthlyBasic: 100_000, taxRate: 20 });
    expect(component.result().taxable).toBe(10_000);
    expect(component.result().taxDue).toBe(2_000);

    component.form.patchValue({ otherBenefits: 30_000 });
    const r = component.result();
    expect(r.exemptionLeft).toBe(60_000);
    expect(r.taxable).toBe(40_000);
    expect(r.net13th).toBe(92_000);
  });

  it('treats a missing value as zero', () => {
    component.form.patchValue({ monthlyBasic: null });
    expect(component.result().gross13th).toBe(0);
  });
});
