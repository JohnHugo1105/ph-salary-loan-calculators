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
import { SeoService } from '../../shared/seo.service';
import { MatIconModule } from '@angular/material/icon';
import { APP_CONSTANTS } from '../../shared/app.constants';

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
  form = this.fb.group({
    averageMsc: [20000, [Validators.required, Validators.min(1000), Validators.max(30000)]],
    loanType: [1, [Validators.required]] // 1 or 2 months
  });

  results = {
    loanableAmount: 0,
    serviceFee: 0,
    advanceInterest: 0,
    netProceeds: 0,
    monthlyAmortization: 0
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

  compute() {
    const avgMsc = Number(this.form.value.averageMsc) || 0;
    const typeValue = Number(this.form.value.loanType) || 1;
    
    // Type 3 is Emergency Loan (1 month equivalent amount, but different rules)
    const multiplier = typeValue === 2 ? 2 : 1; 

    const loanableAmount = avgMsc * multiplier;
    const serviceFee = loanableAmount * 0.01;
    
    // Emergency Loan uses 7%, Regular uses 10%
    const annualRate = typeValue === 3 ? APP_CONSTANTS.SSS_EMERGENCY_LOAN_INTEREST_RATE : APP_CONSTANTS.SSS_REGULAR_SALARY_LOAN_INTEREST_RATE;
    const rateDecimal = annualRate / 100;

    // SSS deducts 1st month interest in advance
    const advanceInterest = loanableAmount * (rateDecimal / 12);
    
    const netProceeds = loanableAmount - serviceFee - advanceInterest;

    // Amortization (24 months, diminishing)
    const r = rateDecimal / 12;
    const n = 24;
    const pmt = loanableAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    this.results = {
      loanableAmount,
      serviceFee,
      advanceInterest,
      netProceeds,
      monthlyAmortization: pmt
    };
  }
}
