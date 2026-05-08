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

@Component({
  selector: 'app-sss-salary-loan',
  standalone: true,
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
    const type = Number(this.form.value.loanType) || 1;

    const loanableAmount = avgMsc * type;
    const serviceFee = loanableAmount * 0.01;
    
    // SSS deducts 1st month interest in advance
    const advanceInterest = loanableAmount * (0.10 / 12);
    
    const netProceeds = loanableAmount - serviceFee - advanceInterest;

    // Amortization (24 months, 10% per annum diminishing)
    const r = 0.10 / 12;
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
