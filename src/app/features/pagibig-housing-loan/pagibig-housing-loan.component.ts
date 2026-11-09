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
import { computeAmortization, round2 } from '../../shared/utils/ph-calculators.util';
import { PH_RULES, PH_RULES_LAST_REVIEWED } from '../../shared/utils/ph-rules';

@Component({
  selector: 'app-pagibig-housing-loan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DecimalPipe, RouterLink, ThousandsSeparatorDirective, FieldComponent,
    BreakdownComponent, CalloutComponent, PageHeaderComponent, ResultActionsComponent, ResultBarComponent, RelatedComponent,
  ],
  templateUrl: './pagibig-housing-loan.component.html',
})
export class PagibigHousingLoanComponent {
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(SeoService);
  private readonly share = inject(SaveShareService);

  readonly rules = PH_RULES.housingLoan;
  readonly rates = PH_RULES.housingLoan.ratesByRepricingYears;
  readonly repricingOptions = Object.keys(PH_RULES.housingLoan.ratesByRepricingYears).map(Number);
  readonly reviewed = formatDate(PH_RULES_LAST_REVIEWED);

  private housingExample(amount: number, years: number, repricing: number) {
    const rate = this.rates[repricing];
    const n = years * 12;
    const { payment, schedule } = computeAmortization(amount, rate, n);
    const totalPaid = payment * n;
    return {
      amount,
      years,
      repricing,
      rate,
      n,
      payment,
      totalPaid,
      totalInterest: totalPaid - amount,
      requiredIncome: payment / PH_RULES.housingLoan.maxIncomeShare,
      first: schedule[0],
      last: schedule[n - 1],
    };
  }

  // Same rate table and payment formula as the form. The rate is held for the full term.
  readonly exA = this.housingExample(1_000_000, 20, 3);
  readonly exB = this.housingExample(2_000_000, 30, 5);
  readonly exC = this.housingExample(500_000, 15, 1);

  readonly faq = [
    {
      q: 'Does the monthly payment stay the same for the whole term?',
      a: `Only during the repricing period you choose. This calculator keeps the starting rate for every month of the term, so you can see the principal-and-interest cost of that one rate. After the fixing period, Pag-IBIG resets the rate and the payment can change. A ${formatPeso(this.exA.amount, 0)} loan at ${this.exA.rate}% shows ${formatPeso(this.exA.payment)} a month here for all ${this.exA.years} years. That figure will not match a statement issued after the ${this.exA.repricing}-year fixing period ends.`,
    },
    {
      q: 'Why is the income figure 35% of the payment?',
      a: `The calculator divides the monthly amortization by ${PH_RULES.housingLoan.maxIncomeShare}. On the ${formatPeso(this.exA.amount, 0)} example that is ${formatPeso(this.exA.payment)} ÷ ${PH_RULES.housingLoan.maxIncomeShare} = ${formatPeso(this.exA.requiredIncome)}. It is a capacity check stored in this site's rules, not an approval. Mortgage redemption insurance, fire insurance, and other debts are not in the payment, so the income Pag-IBIG asks for can be higher.`,
    },
    {
      q: 'Are these Pag-IBIG\'s current interest rates?',
      a: `They are the rates this calculator stores: ${this.repricingOptions.map((y) => `${y} year${y === 1 ? '' : 's'} at ${this.rates[y]}%`).join(', ')}. When this page was reviewed on ${this.reviewed}, Pag-IBIG's own rate schedule could not be re-read from the fund's website. Treat every rate as something to confirm with Pag-IBIG. A Philstar report on 21 June 2026 described promotional rates fixed for three years, 4.5% and 5.75% depending on loan size, available for applications until 31 December 2026. Those promotional rates are not what this calculator applies.`,
    },
  ];

  form = this.fb.group({
    amount: [1000000, [Validators.required, Validators.min(100000), Validators.max(PH_RULES.housingLoan.maxLoan)]],
    termYears: [20, [Validators.required, Validators.min(1), Validators.max(30)]],
    repricingPeriod: [3, [Validators.required]],
  });

  readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly results = computed(() => {
    const v = this.formValue();
    const p = Number(v.amount) || 0;
    const years = Number(v.termYears) || 1;
    const repricing = Number(v.repricingPeriod) || 3;
    const rate = this.rates[repricing] ?? 6.25;
    const n = years * 12;
    const { payment } = computeAmortization(p, rate, n);
    const totalPaid = payment * n;
    const requiredIncome = payment / PH_RULES.housingLoan.maxIncomeShare;
    const rows: BreakdownRow[] = [
      { label: 'Loan amount', amount: p },
      { label: 'Interest rate', amount: `${rate}% a year`, note: `${repricing}-year repricing period` },
      { label: 'Term', amount: `${years} years (${n} payments)` },
      { label: 'Monthly amortization', amount: payment, kind: 'subtotal', formula: `Standard loan payment formula: ${rate}% a year over ${n} months` },
      { label: 'Total interest', amount: round2(totalPaid - p), kind: 'sub' },
      { label: 'Total you pay', amount: round2(totalPaid), kind: 'total' },
    ];
    return { rate, payment, totalPaid, totalInterest: totalPaid - p, requiredIncome, repricing, years, rows };
  });

  readonly shareData = computed(() => ({ ...this.formValue() }) as Record<string, unknown>);
  readonly summary = computed(() => {
    const r = this.results();
    return [
      'Pag-IBIG housing loan estimate',
      `Loan: ${formatPeso(Number(this.formValue().amount) || 0)} over ${r.years} years at ${r.rate}%`,
      `Monthly amortization: ${formatPeso(r.payment)}`,
      `Income needed: about ${formatPeso(r.requiredIncome)} a month`,
      'Computed at phcalculators.com/pagibig-housing-loan',
    ].join('\n');
  });

  constructor() {
    this.share.restoreInto(this.form, inject(ActivatedRoute).snapshot.queryParamMap.get('data'));
    this.seo.setSchema([
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'Pag-IBIG Housing Loan Calculator 2026',
        'operatingSystem': 'Web',
        'applicationCategory': 'FinanceApplication',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: this.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ]);
  }
}
