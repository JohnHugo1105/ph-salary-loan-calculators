import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '../../core/services/seo.service';
import { formatDate, formatPeso } from '../../shared/format';
import { SaveShareService } from '../../shared/services/save-share.service';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { BreakdownComponent, BreakdownRow } from '../../shared/ui/breakdown.component';
import { CalloutComponent } from '../../shared/ui/callout.component';
import { FieldComponent } from '../../shared/ui/field.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { RelatedComponent } from '../../shared/ui/related.component';
import { ResultActionsComponent } from '../../shared/ui/result-actions.component';
import { ResultBarComponent } from '../../shared/ui/result-bar.component';
import { SegmentedComponent } from '../../shared/ui/segmented.component';
import { compute13thMonthProRated, estimate13thMonthPay, round2, split13thMonthTaxability } from '../../shared/utils/ph-calculators.util';
import { PH_RULES, PH_RULES_LAST_REVIEWED } from '../../shared/utils/ph-rules';

@Component({
  selector: 'app-thirteenth-month',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DecimalPipe, RouterLink, ThousandsSeparatorDirective, FieldComponent, SegmentedComponent,
    BreakdownComponent, CalloutComponent, PageHeaderComponent, ResultActionsComponent, ResultBarComponent, RelatedComponent,
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
  readonly reviewed = formatDate(PH_RULES_LAST_REVIEWED);

  readonly fullYear = (() => {
    const gross = estimate13thMonthPay(30_000, 12);
    return { basic: 30_000, months: 12, gross, ...split13thMonthTaxability(gross) };
  })();
  readonly hired = (() => {
    const gross = estimate13thMonthPay(25_000, 5);
    return { basic: 25_000, months: 5, gross, ...split13thMonthTaxability(gross) };
  })();
  readonly absence = (() => {
    const months = [...Array(11).fill(40_000), 20_000];
    const gross = compute13thMonthProRated(months);
    return { gross, earned: 40_000 * 11 + 20_000, ...split13thMonthTaxability(gross) };
  })();
  readonly sharedCap = (() => {
    const gross = 80_000;
    const other = 30_000;
    const left = Math.max(0, this.exemptionCap - other);
    const split = split13thMonthTaxability(gross, left);
    const tax = round2(split.taxable * 0.2);
    return { gross, other, left, tax, net: round2(gross - tax), rate: 20, ...split };
  })();
  readonly aboveCap = (() => {
    const gross = 120_000;
    const split = split13thMonthTaxability(gross);
    const tax = round2(split.taxable * 0.25);
    return { gross, tax, net: round2(gross - tax), rate: 25, ...split };
  })();

  readonly faq = [
    {
      q: 'Is 13th-month pay part of final pay when I resign?',
      a: `The pro-rated amount is part of what you earned. This calculator gets it by dividing basic pay actually earned by 12. Five months at ${formatPeso(this.hired.basic, 0)} is ${formatPeso(this.hired.gross)}, and that whole amount is inside the ${formatPeso(this.exemptionCap, 0)} exemption if no other benefits have used the cap. When the employer releases it — with final pay, or on the company’s December schedule — is a payroll practice to confirm with the employer. This page does not set a number of days.`,
    },
    {
      q: 'What happens when 13th-month pay and other benefits share the ₱90,000 cap?',
      a: `The cap is one bucket. Other benefits already received use it up before the 13th-month cheque is tested. ${formatPeso(this.sharedCap.other, 0)} of other benefits leaves ${formatPeso(this.sharedCap.left, 0)} of room. An ${formatPeso(this.sharedCap.gross, 0)} 13th-month payment then has ${formatPeso(this.sharedCap.nonTaxable, 0)} exempt and ${formatPeso(this.sharedCap.taxable, 0)} taxable. The tax box on this page is a rate you type, not a BIR assessment. At the 20% placeholder, tax is ${formatPeso(this.sharedCap.tax)} and you receive ${formatPeso(this.sharedCap.net)}.`,
    },
    {
      q: 'Why is the tax a percentage I type instead of a bracket?',
      a: `Withholding on the excess depends on your other taxable pay for the year. This form does not know that pay, so it applies the rate you enter to the amount above the cap and nothing else. A ${formatPeso(this.aboveCap.gross, 0)} 13th-month payment with no other benefits has ${formatPeso(this.aboveCap.taxable, 0)} taxable. At 25% that tax is ${formatPeso(this.aboveCap.tax)} and the cheque is ${formatPeso(this.aboveCap.net)}. A different rate is a different cheque. Your payroll’s annualized tax can differ from both.`,
    },
  ];
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
            mainEntity: this.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          }
        ]);
  }

  get history() {
    return this.form.controls.history;
  }
}
