import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { ResultActionsComponent } from '../../shared/ui/result-actions.component';
import { ResultBarComponent } from '../../shared/ui/result-bar.component';
import { SegmentedComponent } from '../../shared/ui/segmented.component';
import { SponsoredComponent } from '../../shared/ui/sponsored.component';
import { APP_CONSTANTS } from '../../core/config/app.constants';
import { calculateMP2, round2 } from '../../shared/utils/ph-calculators.util';
import { PH_RULES } from '../../shared/utils/ph-rules';

@Component({
  selector: 'app-mp2',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DecimalPipe, RouterLink, ThousandsSeparatorDirective, FieldComponent, SegmentedComponent, CalloutComponent,
    PageHeaderComponent, ResultActionsComponent, ResultBarComponent, SponsoredComponent, StackedColumnsComponent,
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

  // Worked example for the guide below, generated from the same engine as the calculator.
  readonly example = (() => {
    const run = (mode: 'compounded' | 'annual') => {
      const rows = calculateMP2(500, 7, mode);
      const contributed = rows[rows.length - 1].cumulativeContrib;
      const dividends = mode === 'compounded' ? round2(rows[rows.length - 1].totalAccumulated - contributed) : round2(rows.reduce((a, r) => a + r.annualDividend, 0));
      return { contributed, dividends };
    };
    return { compounded: run('compounded'), annual: run('annual') };
  })();

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
                  'text': 'Under Circular No. 487 (effective Feb 2026), the maximum limit for total aggregated MP2 principal savings is ₱20,000,000. Any excess beyond this is refunded. For one-time remittances exceeding ₱500,000, you are still legally required by Pag-IBIG to present proof of your income source.'
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
}
