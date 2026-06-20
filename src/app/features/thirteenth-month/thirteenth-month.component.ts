import { Component, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { SeoService } from '../../shared/seo.service';
import { AdComponent } from '../../shared/components/ad/ad.component';
import { compute13thMonthProRated, estimate13thMonthPay, split13thMonthTaxability, round2 } from '../../shared/ph-calculators.util';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-thirteenth-month',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatCardModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatIconModule,
        ThousandsSeparatorDirective,
        RouterModule,
        AdComponent
    ],
    templateUrl: './thirteenth-month.component.html',
    styleUrl: './thirteenth-month.component.scss'
})
export class ThirteenthMonthComponent {
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

  formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  result = computed(() => {
    const val = this.formValue();
    let gross13th = 0;

    if (val.mode === 'simple') {
      const raw = val.monthlyBasic as unknown;
      const basic = typeof raw === 'string' ? Number(raw.replace(/,/g, '')) : Number(raw);
      gross13th = isNaN(basic) ? 0 : basic;
    } else {
      const hist = (val.history as (number | string | null)[])?.map(n => {
        const num = typeof n === 'string' ? Number(n.replace(/,/g, '')) : Number(n);
        return isNaN(num) ? 0 : num;
      }) || [];
      gross13th = compute13thMonthProRated(hist);
    }

    const taxSplit = split13thMonthTaxability(gross13th);
    const taxRate = Number(val.taxRate) || 0;
    const taxDue = taxSplit.taxable > 0 ? round2(taxSplit.taxable * (taxRate / 100)) : 0;
    const net13th = round2(gross13th - taxDue);

    return {
      gross13th: round2(gross13th),
      nonTaxable: taxSplit.nonTaxable,
      taxable: taxSplit.taxable,
      taxDue,
      net13th
    };
  });

  constructor(private fb: FormBuilder, private seo: SeoService) {
    this.seo.setSchema([
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': '13th Month Pay Calculator Philippines',
        'operatingSystem': 'Web',
        'applicationCategory': 'FinanceApplication',
        'url': 'https://www.phcalculators.com/13th-month-pay',
        'featureList': 'Compute pro-rated 13th month pay and tax exemption'
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'Are managers or supervisory employees entitled to 13th-month pay?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Under Presidential Decree No. 851, only rank-and-file employees are legally entitled to 13th-month pay. However, many employers in the Philippines choose to grant it to managerial and supervisory employees as well, through established company policy or practice.'
            }
          },
          {
            '@type': 'Question',
            'name': 'What happens if my 13th-month pay exceeds ₱90,000?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Under the TRAIN Law, the 13th-month pay and other benefits are tax-exempt up to the ₱90,000 limit. Any amount exceeding this ₱90,000 threshold must be added to your regular gross income, making it subject to the standard graduated income tax rates.'
            }
          },
          {
            '@type': 'Question',
            'name': 'How is a pro-rated 13th-month pay calculated for new or resigned employees?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Pro-rated 13th-month pay is calculated by summing up your total basic salary earned during the calendar year and dividing it by 12. If you worked for 4 months and earned ₱20,000 per month, your pro-rated 13th month is (₱20,000 * 4) / 12 = ₱6,666.67.'
            }
          }
        ]
      }
    ]);
  }

  get history() {
    return this.form.get('history') as FormArray;
  }
}
