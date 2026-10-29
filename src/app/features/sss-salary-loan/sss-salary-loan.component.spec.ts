import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SssSalaryLoanComponent } from './sss-salary-loan.component';

describe('SssSalaryLoanComponent', () => {
  let fixture: ComponentFixture<SssSalaryLoanComponent>;
  let component: SssSalaryLoanComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SssSalaryLoanComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(SssSalaryLoanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults to an 8% one-month salary loan with the 1% service fee', () => {
    const r = component.results();
    expect(r.isEmergency).toBeFalse();
    expect(r.annualRatePct).toBe(8);
    expect(r.loanableAmount).toBe(20_000);
    expect(r.serviceFee).toBe(200);
    expect(r.netProceeds).toBe(19_666.67);
  });

  it('reports total repaid and total interest', () => {
    const r = component.results();
    expect(r.totalRepaid).toBeCloseTo(r.monthlyAmortization * 24, 2);
    expect(r.totalInterest).toBeCloseTo(r.totalRepaid - r.loanableAmount, 2);
  });

  it('uses 10% for renewals within five years of a penalty condonation', () => {
    component.form.patchValue({ salaryLoanRate: 10 });
    expect(component.results().annualRatePct).toBe(10);
  });

  it('rejects an average MSC above the 20,000 regular salary credit', () => {
    component.form.patchValue({ averageMsc: 30_000 });
    expect(component.form.controls.averageMsc.valid).toBeFalse();
    expect(component.results().loanableAmount).toBe(20_000);
  });

  it('models the emergency loan separately: 7%, no fees, 6-month moratorium', () => {
    component.form.patchValue({ loanType: 3 });
    fixture.detectChanges();
    const r = component.results();
    expect(r.isEmergency).toBeTrue();
    expect(r.annualRatePct).toBe(7);
    expect(r.serviceFee).toBe(0);
    expect(r.moratoriumMonths).toBe(6);
    expect(fixture.nativeElement.textContent).toContain('Payment moratorium');
  });
});
