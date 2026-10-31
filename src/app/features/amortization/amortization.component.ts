import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '../../core/services/seo.service';
import { formatPeso, formatPercent } from '../../shared/format';
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
import { SponsoredComponent } from '../../shared/ui/sponsored.component';
import { computeAmortization, round2 } from '../../shared/utils/ph-calculators.util';

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

@Component({
  selector: 'app-amortization',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DecimalPipe, RouterLink, ThousandsSeparatorDirective, FieldComponent, SegmentedComponent, CalloutComponent,
    PageHeaderComponent, ResultActionsComponent, ResultBarComponent, SponsoredComponent, LineAreaChartComponent, SplitBarComponent, RelatedComponent,
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

  // Worked examples for the guide below, generated from the same engine as the calculator.
  readonly scenarioA = summarize(1_000_000, 8, 60);
  readonly scenarioB = summarize(1_000_000, 8, 240);

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
            'mainEntity': [
              {
                '@type': 'Question',
                'name': 'What is a diminishing balance interest rate?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'A diminishing balance interest rate means that the interest is calculated based on the remaining principal balance of the loan each month, not the original borrowed amount. As you pay off the principal, the interest portion of your monthly payment decreases.'
                }
              },
              {
                '@type': 'Question',
                'name': 'What is a repricing period for a housing loan?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'A repricing period (or fixing period) is the duration for which your interest rate is guaranteed to stay the same. After this period (e.g., 1 year, 3 years, 5 years), the bank will adjust or \'reprice\' your interest rate based on current market conditions, which can increase or decrease your monthly amortization.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Is it better to have a 5-year or 20-year loan term?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'It depends on your cash flow. A 5-year term will have significantly higher monthly payments, but you will pay drastically less total interest over the life of the loan. A 20-year term spreads the payments out to be much lower and more affordable month-to-month, but yields much higher total interest costs overall.'
                }
              }
            ]
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
