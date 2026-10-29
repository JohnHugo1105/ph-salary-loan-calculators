import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { SssSalaryLoanComponent } from './sss-salary-loan.component';

describe('SssSalaryLoanComponent', () => {
  let fixture: ComponentFixture<SssSalaryLoanComponent>;
  let component: SssSalaryLoanComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SssSalaryLoanComponent],
      providers: [provideRouter([]), provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(SssSalaryLoanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults to an 8% one-month salary loan with the 1% service fee', () => {
    expect(component.results.isEmergency).toBeFalse();
    expect(component.results.annualRatePct).toBe(8);
    expect(component.results.loanableAmount).toBe(20_000);
    expect(component.results.serviceFee).toBe(200);
  });

  it('uses 10% for renewals within five years of a penalty condonation', () => {
    component.form.patchValue({ salaryLoanRate: 10 });
    expect(component.results.annualRatePct).toBe(10);
  });

  it('keeps average MSC within the 20,000 regular salary credit', () => {
    component.form.patchValue({ averageMsc: 30_000 });
    expect(component.form.controls.averageMsc.valid).toBeFalse();
    expect(component.results.loanableAmount).toBe(20_000);
  });

  it('models the emergency loan separately: 7%, no fees, 6-month moratorium', () => {
    component.form.patchValue({ loanType: 3 });
    fixture.detectChanges();
    expect(component.results.isEmergency).toBeTrue();
    expect(component.results.annualRatePct).toBe(7);
    expect(component.results.serviceFee).toBe(0);
    expect(component.results.advanceInterest).toBe(0);
    expect(component.results.moratoriumMonths).toBe(6);
    expect(fixture.nativeElement.textContent).toContain('Payment Moratorium');
  });
});
