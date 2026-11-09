import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '../../core/services/seo.service';
import { formatDate, formatPeso, formatPercent } from '../../shared/format';
import { SaveShareService } from '../../shared/services/save-share.service';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { CalloutComponent } from '../../shared/ui/callout.component';
import { LineAreaChartComponent } from '../../shared/ui/charts/line-area-chart.component';
import { SplitBarComponent } from '../../shared/ui/charts/split-bar.component';
import { StackedColumnsComponent } from '../../shared/ui/charts/stacked-columns.component';
import { FieldComponent } from '../../shared/ui/field.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { RelatedComponent } from '../../shared/ui/related.component';
import { ResultActionsComponent } from '../../shared/ui/result-actions.component';
import { ResultBarComponent } from '../../shared/ui/result-bar.component';
import { SegmentedComponent } from '../../shared/ui/segmented.component';
import { computeAmortization, round2 } from '../../shared/utils/ph-calculators.util';
import { PH_RULES, PH_RULES_LAST_REVIEWED } from '../../shared/utils/ph-rules';

interface YearRow { year: number; payments: number; interest: number; principal: number; balance: number }

// Lifetime totals use the exact (unrounded) payment so they do not drift by cents; the displayed
// monthly payment is that figure rounded to the centavo.
function summarize(amount: number, annualRatePct: number, months: number) {
  const { payment, schedule } = computeAmortization(amount, annualRatePct, months);
  const r = annualRatePct / 100 / 12;
  const exact = r === 0 ? amount / months : (amount * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1);
  const totalPaid = round2(exact * months);
  return { payment, schedule, totalPaid, totalInterest: round2(totalPaid - amount) };
}

// Add-on interest is charged on the original principal for the whole term, then split into equal payments.
// It is not a second mode of the calculator. The guide uses it only as a contrast.
function addOn(amount: number, annualRatePct: number, years: number) {
  const interest = amount * (annualRatePct / 100) * years;
  const months = years * 12;
  const total = amount + interest;
  return { interest, total, months, payment: round2(total / months) };
}

@Component({
  selector: 'app-amortization',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DecimalPipe, RouterLink, ThousandsSeparatorDirective, FieldComponent, SegmentedComponent, CalloutComponent,
    PageHeaderComponent, ResultActionsComponent, ResultBarComponent, LineAreaChartComponent, SplitBarComponent, RelatedComponent,
  ],
  templateUrl: './amortization.component.html',
})
export class AmortizationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(SeoService);
  private readonly share = inject(SaveShareService);

  readonly termPresets = [5, 10, 15, 20, 25, 30];
  readonly views = [
    { value: 'yearly', label: 'By year' },
    { value: 'monthly', label: 'By month' },
  ];
  readonly pageSizes = [12, 24, 60];

  form = this.fb.group({
    amount: [1000000, [Validators.required, Validators.min(1), Validators.max(10_000_000_000)]],
    annualRate: [8, [Validators.required, Validators.min(0), Validators.max(100)]],
    months: [240, [Validators.required, Validators.min(1), Validators.max(480)]],
  });

  readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly viewControl = new FormControl<'yearly' | 'monthly'>('yearly', { nonNullable: true });
  readonly view = toSignal(this.viewControl.valueChanges, { initialValue: 'yearly' as 'yearly' | 'monthly' });
  readonly pageSize = signal(12);
  readonly page = signal(0);

  readonly model = computed(() => {
    const v = this.formValue();
    const amount = Math.max(0, Number(v.amount) || 0);
    const rate = Math.max(0, Number(v.annualRate) || 0);
    const months = Math.min(480, Math.max(1, Math.round(Number(v.months) || 1)));
    const s = summarize(amount, rate, months);

    const years: YearRow[] = [];
    for (const r of s.schedule) {
      const y = Math.ceil(r.period / 12);
      const row = years[y - 1] ?? (years[y - 1] = { year: y, payments: 0, interest: 0, principal: 0, balance: 0 });
      row.payments = round2(row.payments + r.payment);
      row.interest = round2(row.interest + r.interest);
      row.principal = round2(row.principal + r.principal);
      row.balance = r.balance;
    }
    const balanceSeries = [{ label: '0', value: amount }, ...years.map((y) => ({ label: String(y.year), value: y.balance }))];
    return { amount, rate, months, ...s, years, balanceSeries, interestShare: amount > 0 ? formatPercent((s.totalInterest / amount) * 100, 1) : '0%' };
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.model().schedule.length / this.pageSize())));
  readonly pagedRows = computed(() => {
    const start = this.page() * this.pageSize();
    return this.model().schedule.slice(start, start + this.pageSize());
  });

  readonly shareData = computed(() => ({ ...this.formValue() }) as Record<string, unknown>);
  readonly summary = computed(() => {
    const m = this.model();
    return [
      `Loan: ${formatPeso(m.amount)} at ${m.rate}% a year for ${m.months} months`,
      `Monthly payment: ${formatPeso(m.payment)}`,
      `Total interest: ${formatPeso(m.totalInterest)}`,
      `Total paid: ${formatPeso(m.totalPaid)}`,
      'Computed at phcalculators.com/amortization',
    ].join('\n');
  });

  readonly reviewed = formatDate(PH_RULES_LAST_REVIEWED);
  // 6.5% is the 5-year figure stored for the Pag-IBIG calculator. The guide uses it as arithmetic, not as a bank quote.
  readonly illustrationRate = PH_RULES.housingLoan.ratesByRepricingYears[5];
  readonly dim5 = summarize(1_000_000, this.illustrationRate, 60);
  readonly dim20 = summarize(1_000_000, this.illustrationRate, 240);
  readonly add5 = addOn(1_000_000, this.illustrationRate, 5);
  readonly add20 = addOn(1_000_000, this.illustrationRate, 20);

  readonly faq = [
    {
      q: 'How is add-on interest different from a diminishing balance?',
      a: `Add-on interest multiplies the original principal by the annual rate and by the years, then splits principal plus that interest into equal payments. On ₱1,000,000 at ${this.illustrationRate}% for 5 years, that interest is ${formatPeso(this.add5.interest, 0)} and the payment is ${formatPeso(this.add5.payment)}. A diminishing balance, which is what this calculator computes, charges interest only on the amount still owed. The same inputs give a payment of ${formatPeso(this.dim5.payment)} and total interest of ${formatPeso(this.dim5.totalInterest)}. The ${this.illustrationRate}% figure is the 5-year rate stored for our Pag-IBIG calculator, used here so the two methods can be compared. It is not a commercial bank's published rate. Confirm the Pag-IBIG figure with the agency.`,
    },
    {
      q: 'Why is the first payment mostly interest?',
      a: `On a diminishing balance the interest for a month is the remaining principal times the monthly rate. Early on, the principal is still the full amount, so interest takes most of the payment. In the 20-year illustration at ${this.illustrationRate}%, the monthly payment is ${formatPeso(this.dim20.payment)} and the interest over 240 months is ${formatPeso(this.dim20.totalInterest)}. The same method over 5 years costs ${formatPeso(this.dim5.totalInterest)} of interest because the principal is gone sooner.`,
    },
    {
      q: 'Does this page use a bank\'s current rate?',
      a: `No. The form uses whatever annual rate you type. The worked comparison uses ${this.illustrationRate}% only because that number is already stored on this site for a 5-year Pag-IBIG fixing period, and even that stored rate is marked confirm-with-the-agency on the rates page. A fixing period is the time a lender promises not to change the rate. After it, the payment can be recomputed. This schedule does not model that reset.`,
    },
  ];

  constructor() {
    this.share.restoreInto(this.form, inject(ActivatedRoute).snapshot.queryParamMap.get('data'));
    this.seo.setSchema([
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            'name': 'Loan Amortization Calculator Philippines',
            'operatingSystem': 'Web',
            'applicationCategory': 'FinanceApplication',
            'url': 'https://www.phcalculators.com/amortization',
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'PHP'
            },
            'featureList': 'Compute monthly payments and generates amortization schedule'
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: this.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          }
        ]);
  }

  setTerm(years: number) {
    this.form.controls.months.setValue(years * 12);
    this.form.controls.months.markAsDirty();
  }
  isTerm(years: number): boolean {
    return Number(this.formValue().months) === years * 12;
  }
  setPageSize(size: number) {
    this.pageSize.set(size);
    this.page.set(0);
  }
  prev() { this.page.update((p) => Math.max(0, p - 1)); }
  next() { this.page.update((p) => Math.min(this.totalPages() - 1, p + 1)); }
}
