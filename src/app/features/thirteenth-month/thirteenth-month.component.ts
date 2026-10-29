import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '../../core/services/seo.service';
import { formatPeso } from '../../shared/format';
import { SaveShareService } from '../../shared/services/save-share.service';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { BreakdownComponent, BreakdownRow } from '../../shared/ui/breakdown.component';
import { CalloutComponent } from '../../shared/ui/callout.component';
import { FieldComponent } from '../../shared/ui/field.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { ResultActionsComponent } from '../../shared/ui/result-actions.component';
import { ResultBarComponent } from '../../shared/ui/result-bar.component';
import { SegmentedComponent } from '../../shared/ui/segmented.component';
import { SponsoredComponent } from '../../shared/ui/sponsored.component';
import { compute13thMonthProRated, round2, split13thMonthTaxability } from '../../shared/utils/ph-calculators.util';
import { PH_RULES } from '../../shared/utils/ph-rules';

@Component({
  selector: 'app-thirteenth-month',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DecimalPipe, RouterLink, ThousandsSeparatorDirective, FieldComponent, SegmentedComponent,
    BreakdownComponent, CalloutComponent, PageHeaderComponent, ResultActionsComponent, ResultBarComponent, SponsoredComponent,
  ],
  templateUrl: './thirteenth-month.component.html',
})
export class ThirteenthMonthComponent {
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(SeoService);
  private readonly share = inject(SaveShareService);

  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  readonly modes = [
    { value: 'simple', label: 'Full year' },
    { value: 'detailed', label: 'Month by month' },
  ];

  form = this.fb.group({
    mode: ['simple'], // 'simple' or 'detailed'
    monthlyBasic: [30000, [Validators.min(0)]], // For simple mode
    history: this.fb.array(this.months.map(() => this.fb.control(0, [Validators.min(0)]))), // For detailed mode
    otherBenefits: [0, [Validators.min(0)]], // Other bonuses/benefits already received this year
    taxRate: [20, [Validators.min(0), Validators.max(35)]], // Default 20%
  });

  readonly exemptionCap = PH_RULES.thirteenthMonthExemption;
  readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly result = computed(() => {
    const val = this.formValue();
    const toNum = (n: unknown) => {
      const num = typeof n === 'string' ? Number(n.replace(/,/g, '')) : Number(n);
      return Number.isFinite(num) ? num : 0;
    };
    const gross13th =
      val.mode === 'simple' ? Math.max(0, toNum(val.monthlyBasic)) : compute13thMonthProRated(((val.history as unknown[]) ?? []).map(toNum));

    // The tax-exempt limit covers 13th month pay and other benefits combined, so benefits
    // already received this year use up part of it.
    const otherBenefits = Math.max(0, toNum(val.otherBenefits));
    const exemptionLeft = Math.max(0, this.exemptionCap - otherBenefits);
    const taxSplit = split13thMonthTaxability(gross13th, exemptionLeft);
    const taxRate = Math.min(35, Math.max(0, toNum(val.taxRate)));
    const taxDue = taxSplit.taxable > 0 ? round2(taxSplit.taxable * (taxRate / 100)) : 0;
    const net13th = round2(gross13th - taxDue);

    const rows: BreakdownRow[] = [
      {
        label: '13th month pay',
        amount: round2(gross13th),
        formula: val.mode === 'simple' ? `${formatPeso(toNum(val.monthlyBasic))} × 12 months ÷ 12` : 'Total basic pay earned in the year ÷ 12',
      },
      { label: 'Tax-free limit left', amount: round2(exemptionLeft), kind: 'sub', formula: `${formatPeso(this.exemptionCap, 0)} limit − ${formatPeso(otherBenefits)} other benefits` },
      { label: 'Tax-exempt part', amount: taxSplit.nonTaxable, kind: 'sub' },
      { label: 'Taxable excess', amount: taxSplit.taxable, kind: 'sub' },
      { label: `Estimated tax at ${taxRate}%`, amount: taxDue, kind: 'neg', formula: `${formatPeso(taxSplit.taxable)} × ${taxRate}%` },
      { label: 'You receive', amount: net13th, kind: 'total' },
    ];

    return {
      gross13th: round2(gross13th),
      exemptionLeft: round2(exemptionLeft),
      nonTaxable: taxSplit.nonTaxable,
      taxable: taxSplit.taxable,
      taxRate,
      taxDue,
      net13th,
      rows,
    };
  });

  readonly shareData = computed(() => ({ ...this.formValue() }) as Record<string, unknown>);
  readonly summary = computed(() => {
    const r = this.result();
    return [
      '13th month pay estimate',
      `13th month pay: ${formatPeso(r.gross13th)}`,
      `Tax-exempt: ${formatPeso(r.nonTaxable)}`,
      `Taxable excess: ${formatPeso(r.taxable)} (estimated tax ${formatPeso(r.taxDue)})`,
      `You receive: ${formatPeso(r.net13th)}`,
      'Computed at phcalculators.com/13th-month-pay',
    ].join('\n');
  });

  constructor() {
    this.share.restoreInto(this.form, inject(ActivatedRoute).snapshot.queryParamMap.get('data'));
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
    return this.form.controls.history;
  }
}
