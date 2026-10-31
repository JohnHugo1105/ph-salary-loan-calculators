import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { SponsoredComponent } from '../../shared/ui/sponsored.component';
import { APP_CONSTANTS } from '../../core/config/app.constants';
import { MP2Row, calculateMP2, round2 } from '../../shared/utils/ph-calculators.util';
import { PH_RULES } from '../../shared/utils/ph-rules';

@Component({
  selector: 'app-mp2',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DecimalPipe, RouterLink, ThousandsSeparatorDirective, FieldComponent, SegmentedComponent, CalloutComponent,
    PageHeaderComponent, ResultActionsComponent, ResultBarComponent, SponsoredComponent, StackedColumnsComponent, RelatedComponent,
  ],
  templateUrl: './mp2.component.html',
})
export class Mp2Component {
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(SeoService);
  private readonly share = inject(SaveShareService);

  readonly latestDeclared = PH_RULES.mp2.latestDeclared;
  readonly maxMonthly = APP_CONSTANTS.MP2_MAX_MONTHLY_CONTRIBUTION;
  readonly modes = [
    { value: 'compounded', label: 'Reinvest dividends' },
    { value: 'annual', label: 'Take dividends yearly' },
  ];
  readonly series = [
    { name: 'Your savings', slot: 1 as const },
    { name: 'Dividends', slot: 2 as const },
  ];

  form = this.fb.group({
    monthlyContribution: [500, [Validators.required, Validators.min(500), Validators.max(APP_CONSTANTS.MP2_MAX_MONTHLY_CONTRIBUTION)]],
    rate: [PH_RULES.mp2.latestDeclared.ratePct, [Validators.required, Validators.min(0), Validators.max(25)]],
    mode: ['compounded'], // 'compounded' | 'annual'
    rollover: [false],
  });

  readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly model = computed(() => {
    const val = this.formValue();
    const monthly = Number(val.monthlyContribution) || 0;
    const rate = Number(val.rate) || 0;
    const mode = (val.mode as 'compounded' | 'annual') || 'compounded';
    const rollover = !!val.rollover;

    const rows = calculateMP2(monthly, rate, mode, rollover);
    let cumulativeDividends = 0;
    const columns = rows.map((r) => {
      cumulativeDividends += r.annualDividend;
      return { label: String(r.year), values: [r.cumulativeContrib, round2(cumulativeDividends)] };
    });
    const last = rows[rows.length - 1];
    const contributed = last?.cumulativeContrib ?? 0;
    const dividends = round2(cumulativeDividends);
    const accumulated = round2(contributed + dividends);
    return {
      years: rows.length,
      rows,
      columns,
      contributed,
      dividends,
      accumulated,
      growth: contributed > 0 ? formatPercent((dividends / contributed) * 100, 1) : '0%',
    };
  });

  readonly shareData = computed(() => ({ ...this.formValue() }) as Record<string, unknown>);
  readonly summary = computed(() => {
    const m = this.model();
    const v = this.formValue();
    return [
      `Pag-IBIG MP2 projection: ${formatPeso(Number(v.monthlyContribution) || 0)} a month at ${v.rate}% for ${m.years} years`,
      `Savings: ${formatPeso(m.contributed)}`,
      `Dividends: ${formatPeso(m.dividends)} (${v.mode === 'annual' ? 'taken yearly' : 'reinvested'})`,
      `Total value: ${formatPeso(m.accumulated)}`,
      'Projection only. Computed at phcalculators.com/mp2-calculator',
    ].join('\n');
  });

  // Figures for the guide below, from the same engine and declared rate as the calculator.
  readonly rate = formatPercent(this.latestDeclared.ratePct);
  readonly nextYear = this.latestDeclared.year + 1;
  readonly announced = formatDate(this.latestDeclared.announced);
  readonly fiveYears = [500, 1_000, 2_000, 5_000, 10_000].map((monthly) => {
    const sum = (rows: MP2Row[]) => round2(rows.reduce((a, r) => a + r.annualDividend, 0));
    const reinvested = calculateMP2(monthly, this.latestDeclared.ratePct, 'compounded');
    const saved = reinvested[reinvested.length - 1].cumulativeContrib;
    return {
      monthly: formatPeso(monthly, 0),
      saved: formatPeso(saved, 0),
      reinvested: formatPeso(sum(reinvested)),
      maturity: formatPeso(saved + sum(reinvested)),
      yearly: formatPeso(sum(calculateMP2(monthly, this.latestDeclared.ratePct, 'annual'))),
    };
  });
  // Walk-through of the first two years at ₱1,000 a month, dividends reinvested.
  readonly walk = (() => {
    const monthly = 1_000;
    const rows = calculateMP2(monthly, this.latestDeclared.ratePct, 'compounded');
    const carried = rows[0].totalAccumulated;
    return {
      monthly: formatPeso(monthly, 0),
      yearSaved: formatPeso(monthly * 12, 0),
      average: formatPeso(monthly * 6, 0),
      year1: formatPeso(rows[0].annualDividend),
      carried: formatPeso(carried),
      carriedDividend: formatPeso(round2((carried * this.latestDeclared.ratePct) / 100)),
      year2: formatPeso(rows[1].annualDividend),
    };
  })();

  readonly faq = [
    {
      q: `When will the ${this.nextYear} MP2 dividend rate be announced?`,
      a: `Pag-IBIG declares each year’s MP2 rate early the following year. The ${this.latestDeclared.year} rate of ${this.rate} was announced on ${this.announced}, so expect the ${this.nextYear} rate around February or March ${this.nextYear + 1}. Until then, the calculator uses ${this.rate}; you can change the rate to try others.`,
    },
    {
      q: 'How much will I earn if I save ₱1,000 a month in MP2?',
      a: `At the ${this.latestDeclared.year} rate of ${this.rate}, saving ₱1,000 a month for 5 years puts in ${this.fiveYears[1].saved} and earns about ${this.fiveYears[1].reinvested} in dividends if you reinvest them, for ${this.fiveYears[1].maturity} at maturity. Taking the dividends every year earns about ${this.fiveYears[1].yearly} instead. Actual dividends depend on the rates Pag-IBIG declares.`,
    },
    {
      q: 'Can OFWs save in MP2?',
      a: 'Yes. MP2 is open to Pag-IBIG members, including OFWs. You can enroll online through Virtual Pag-IBIG and pay your savings online, so you can keep saving while you work abroad.',
    },
    {
      q: 'Can I withdraw my MP2 savings before 5 years?',
      a: 'Yes. Early withdrawal is allowed without penalty for specific reasons, such as total disability or insanity, separation from work for health reasons, retirement, or permanent departure from the Philippines. If you withdraw early for any other reason, you receive only 50% of the dividends you have earned.',
    },
    {
      q: 'Is there a limit to how much I can save in MP2?',
      a: 'Under Circular No. 487 (effective February 2026), your total MP2 savings are capped at ₱20,000,000, and any excess is refunded. A one-time payment above ₱500,000 also needs proof of where the money came from, under the Anti-Money Laundering Act. At maturity you can choose a one-time automatic rollover into a new 5-year term.',
    },
    {
      q: 'Can I open more than one MP2 account?',
      a: 'Yes. You can keep several MP2 accounts at once, which helps if you want to set money aside for different goals, such as one account for a car down payment and another for a child’s tuition.',
    },
  ];

  constructor() {
    this.share.restoreInto(this.form, inject(ActivatedRoute).snapshot.queryParamMap.get('data'));
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
        mainEntity: this.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ]);
  }
}
