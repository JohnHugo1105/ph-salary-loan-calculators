import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { SeoService } from '../../shared/seo.service';
import { calculateMP2, MP2Row, round2 } from '../../shared/ph-calculators.util';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-mp2',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    ThousandsSeparatorDirective,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './mp2.component.html',
  styleUrl: './mp2.component.scss'
})
export class Mp2Component implements OnInit {
  form = this.fb.group({
    monthlyContribution: [500, [Validators.required, Validators.min(500)]],
    rate: [7.05, [Validators.required, Validators.min(0)]],
    mode: ['compounded'] // 'compounded' | 'annual'
  });

  results: MP2Row[] = [];
  totals = {
    contribution: 0,
    dividend: 0,
    accumulated: 0
  };

  chartMax = 0; // For scaling CSS bars

  constructor(private fb: FormBuilder, private seo: SeoService) {
    this.seo.setSchema([
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'Pag-IBIG MP2 Calculator Philippines',
        'operatingSystem': 'Web',
        'applicationCategory': 'FinanceApplication',
        'url': 'https://www.phcalculators.com/mp2-calculator',
        'featureList': 'Result projection with 5-year compounding or annual payout'
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'Can I withdraw my MP2 savings before 5 years?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes, but generally only for valid reasons (medical emergencies, total disability, unemployment) without penalty. If you apply for voluntary early withdrawal for non-critical reasons, you will only receive 50% of your total earned dividends.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Is there a limit to how much I can save in MP2?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'There is no maximum limit to how much you can invest in the MP2 program. However, for one-time remittances exceeding ₱500,000, you are legally required by Pag-IBIG to present proof of your income source (e.g., deed of sale, payslips) to comply with anti-money laundering regulations.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Can I open multiple MP2 accounts at the same time?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes! Pag-IBIG allows members to open and maintain multiple MP2 accounts simultaneously. This is highly useful if you want to earmark different accounts for different financial goals (e.g., one account for a car fund, another for a child\'s education).'
            }
          }
        ]
      }
    ]);
  }

  ngOnInit() {
    this.compute();
    this.form.valueChanges.subscribe(() => this.compute());
  }

  compute() {
    const val = this.form.value;
    const monthly = Number(val.monthlyContribution) || 0;
    const rate = Number(val.rate) || 0;
    const mode = (val.mode as 'compounded' | 'annual') || 'compounded';

    this.results = calculateMP2(monthly, rate, mode);

    if (this.results.length > 0) {
      const last = this.results[this.results.length - 1];
      this.totals = {
        contribution: last.cumulativeContrib,
        // For annual mode, total dividend is sum of annual dividends.
        // For compounded, it's baked into totalAccumulated - contributions.
        dividend: mode === 'compounded'
          ? round2(last.totalAccumulated - last.cumulativeContrib)
          : round2(this.results.reduce((acc, r) => acc + r.annualDividend, 0)),
        accumulated: last.totalAccumulated
      };

      // Find max value for chart scaling (either accumulated or a bit higher)
      this.chartMax = last.totalAccumulated * 1.1;
    }
  }

  // Helper for Chart CSS height
  getBarHeight(value: number) {
    if (this.chartMax === 0) return '0%';
    return Math.min(100, (value / this.chartMax) * 100) + '%';
  }
}
