import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RouterModule } from '@angular/router';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { SeoService } from '../../shared/seo.service';
import { compute13thMonthProRated, estimate13thMonthPay, split13thMonthTaxability, round2 } from '../../shared/ph-calculators.util';

@Component({
  selector: 'app-thirteenth-month',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    ThousandsSeparatorDirective,
    RouterModule
  ],
  templateUrl: './thirteenth-month.component.html',
  styleUrl: './thirteenth-month.component.scss'
})
export class ThirteenthMonthComponent implements OnInit {
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  form = this.fb.group({
    mode: ['simple'], // 'simple' or 'detailed'
    monthlyBasic: [30000, [Validators.min(0)]], // For simple mode
    history: this.fb.array(this.months.map(() => this.fb.control(0))), // For detailed mode
    taxRate: [20, [Validators.min(0), Validators.max(35)]] // Default 20%
  });

  result = {
    gross13th: 0,
    nonTaxable: 0,
    taxable: 0,
    taxDue: 0, // Assuming 20-30% rate on excess for estimation
    net13th: 0
  };

  constructor(private fb: FormBuilder, private seo: SeoService) {
    this.seo.setSchema({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': '13th Month Pay Calculator Philippines',
      'operatingSystem': 'Web',
      'applicationCategory': 'FinanceApplication',
      'url': 'https://www.phcalculators.com/13th-month-pay',
      'featureList': 'Compute pro-rated 13th month pay and tax exemption'
    });
  }

  ngOnInit() {
    this.compute();
    this.form.valueChanges.subscribe(() => this.compute());
  }

  get history() {
    return this.form.get('history') as FormArray;
  }

  compute() {
    const val = this.form.value;
    let gross13th = 0;

    if (val.mode === 'simple') {
      const raw = val.monthlyBasic as unknown;
      const basic = typeof raw === 'string' ? Number(raw.replace(/,/g, '')) : Number(raw);
      // Simple mode assumes full year (12 months) unless we add a months input. 
      // But standard "simple" usually implies "I worked the whole year".
      // Let's assume full year for simple, or we could add a "Months Worked" slider.
      // For now, let's treat "Simple" as "Full Year Basic / 12 * 12" -> Basic. 
      // Actually typically it's (Basic * Months) / 12.
      // Let's default to 12 months for simple mode to keep it synonymous with "Basic Pay".
      gross13th = isNaN(basic) ? 0 : basic;
    } else {
      const hist = (val.history as (number | string | null)[])?.map(n => {
        // Handle string inputs from thousands separator directive
        const num = typeof n === 'string' ? Number(n.replace(/,/g, '')) : Number(n);
        return isNaN(num) ? 0 : num;
      }) || [];
      gross13th = compute13thMonthProRated(hist);
    }

    const taxSplit = split13thMonthTaxability(gross13th);

    // Estimate tax on excess:
    // If they have excess 13th month, it adds to their annual taxable income.
    // The rate depends on their bracket. We can assume a safe 25% or display a range.
    // Let's just show the Taxable Amount and warn them.
    // We won't compute exact tax due because we don't know their total annual income here.

    const taxRate = Number(val.taxRate) || 0;
    const taxDue = taxSplit.taxable > 0 ? round2(taxSplit.taxable * (taxRate / 100)) : 0;
    const net13th = round2(gross13th - taxDue);

    this.result = {
      gross13th: round2(gross13th),
      nonTaxable: taxSplit.nonTaxable,
      taxable: taxSplit.taxable,
      taxDue,
      net13th
    };
  }
}
