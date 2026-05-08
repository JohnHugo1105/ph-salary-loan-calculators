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

@Component({
  selector: 'app-pagibig-housing-loan',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, 
    MatCardModule, MatSelectModule, MatButtonModule, ThousandsSeparatorDirective, 
    RouterModule
  ],
  templateUrl: './pagibig-housing-loan.component.html',
  styleUrl: './pagibig-housing-loan.component.scss'
})
export class PagibigHousingLoanComponent {
  form = this.fb.group({
    amount: [1000000, [Validators.required, Validators.min(100000)]],
    termYears: [20, [Validators.required, Validators.min(1), Validators.max(30)]],
    repricingPeriod: [3, [Validators.required]]
  });

  rates: Record<number, number> = {
    1: 5.75,
    3: 6.25,
    5: 6.50,
    10: 7.125,
    15: 7.75,
    20: 8.50,
    25: 9.125,
    30: 9.75
  };

  results = {
    interestRate: 0,
    monthlyAmortization: 0,
    requiredIncome: 0
  };

  constructor(private fb: FormBuilder, private seo: SeoService) {
    this.seo.setSchema([{
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'Pag-IBIG Housing Loan Calculator 2026',
      'operatingSystem': 'Web',
      'applicationCategory': 'FinanceApplication'
    }]);

    this.compute();
    this.form.valueChanges.subscribe(() => this.compute());
  }

  compute() {
    const p = Number(this.form.value.amount) || 0;
    const y = Number(this.form.value.termYears) || 1;
    const rep = Number(this.form.value.repricingPeriod) || 3;

    // Use a fallback rate if repricing period > loan term
    // e.g. 10 year term but 15 year repricing selected? Just cap to nearest valid rate
    let effectiveRate = this.rates[rep] || 6.25;

    const r = (effectiveRate / 100) / 12;
    const n = y * 12;

    const pmt = p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    // Pag-IBIG requires that the monthly amortization should not exceed 35% of the gross monthly income
    const requiredIncome = pmt / 0.35;

    this.results = {
      interestRate: effectiveRate,
      monthlyAmortization: pmt,
      requiredIncome: requiredIncome
    };
  }
}
