import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { computeAmortization } from '../../shared/utils/ph-calculators.util';

import { PagibigHousingLoanComponent } from './pagibig-housing-loan.component';

describe('PagibigHousingLoanComponent', () => {
  let fixture: ComponentFixture<PagibigHousingLoanComponent>;
  let component: PagibigHousingLoanComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PagibigHousingLoanComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(PagibigHousingLoanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('uses the rate for the chosen repricing period', () => {
    const r = component.results();
    expect(r.rate).toBe(6.25);
    expect(r.payment).toBe(computeAmortization(1_000_000, 6.25, 240).payment);
  });

  it('needs an income at least payment / 35%', () => {
    const r = component.results();
    expect(r.requiredIncome).toBeCloseTo(r.payment / 0.35, 2);
  });

  it('changes the payment with the repricing period', () => {
    const base = component.results().payment;
    component.form.patchValue({ repricingPeriod: 10 });
    expect(component.results().rate).toBe(7.125);
    expect(component.results().payment).toBeGreaterThan(base);
  });

  it('validates the loan range', () => {
    component.form.patchValue({ amount: 50_000 });
    expect(component.form.controls.amount.valid).toBeFalse();
    component.form.patchValue({ amount: 20_000_000 });
    expect(component.form.controls.amount.valid).toBeFalse();
  });
});
