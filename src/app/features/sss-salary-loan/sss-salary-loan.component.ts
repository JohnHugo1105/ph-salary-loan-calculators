import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { SeoService } from '../../core/services/seo.service';
import { MatIconModule } from '@angular/material/icon';
import { computeSssEmergencyLoan, computeSssSalaryLoan } from '../../shared/utils/ph-calculators.util';
import { PH_RULES } from '../../shared/utils/ph-rules';

@Component({
    selector: 'app-sss-salary-loan',
    imports: [
        CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
        MatCardModule, MatSelectModule, MatButtonModule, ThousandsSeparatorDirective,
        MatIconModule, RouterModule
    ],
    templateUrl: './sss-salary-loan.component.html',
    styleUrl: './sss-salary-loan.component.scss'
})
export class SssSalaryLoanComponent {
  readonly rules = PH_RULES.sssLoans;

  form = this.fb.group({
    averageMsc: [20000, [Validators.required, Validators.min(1000), Validators.max(PH_RULES.sssLoans.salaryLoan.regularMscCap)]],
    loanType: [1, [Validators.required]], // 1 or 2 months salary loan, 3 = emergency loan
    salaryLoanRate: [PH_RULES.sssLoans.salaryLoan.annualRate, [Validators.required]], // 8 or 10 (%)
    emergencyShare: [1, [Validators.required]] // 1 or 0.5 of the average MSC
  });

  results = {
    isEmergency: false,
    loanableAmount: 0,
    serviceFee: 0,
    advanceInterest: 0,
    netProceeds: 0,
    monthlyAmortization: 0,
    interestDuringMoratorium: 0,
    termMonths: 0,
    moratoriumMonths: 0,
    annualRatePct: 0
  };

  constructor(private fb: FormBuilder, private seo: SeoService) {
    this.seo.setSchema([{
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'SSS Salary Loan Calculator Philippines',
      'operatingSystem': 'Web',
      'applicationCategory': 'FinanceApplication'
    }]);

    this.compute();
    this.form.valueChanges.subscribe(() => this.compute());
  }

  get isEmergency(): boolean {
    return Number(this.form.value.loanType) === 3;
  }

  compute() {
    const avgMsc = Number(this.form.value.averageMsc) || 0;
    const typeValue = Number(this.form.value.loanType) || 1;

    if (typeValue === 3) {
      const share = Number(this.form.value.emergencyShare) === 0.5 ? 0.5 : 1;
      const r = computeSssEmergencyLoan(avgMsc, share);
      this.results = { isEmergency: true, ...r };
      return;
    }

    const rate = Number(this.form.value.salaryLoanRate) === PH_RULES.sssLoans.salaryLoan.annualRateAfterCondonation
      ? PH_RULES.sssLoans.salaryLoan.annualRateAfterCondonation
      : PH_RULES.sssLoans.salaryLoan.annualRate;
    const r = computeSssSalaryLoan(avgMsc, typeValue === 2 ? 2 : 1, rate);
    this.results = { isEmergency: false, interestDuringMoratorium: 0, ...r };
  }
}
