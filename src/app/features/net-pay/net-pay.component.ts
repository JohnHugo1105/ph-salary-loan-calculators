import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '../../core/services/seo.service';
import { formatPeso, formatPercent } from '../../shared/format';
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
import { explainContributions, explainWithholding } from '../../shared/utils/explain';
import {
  computeContributions,
  computeGrossFromNet,
  computeHolidayPays,
  computeOvertimePay,
  computeWithholdingTax,
  deriveHourlyRate,
  monthlyToSemiMonthly,
  round2,
} from '../../shared/utils/ph-calculators.util';
import { PH_RULES } from '../../shared/utils/ph-rules';

@Component({
  selector: 'app-net-pay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DecimalPipe, RouterLink, ThousandsSeparatorDirective, FieldComponent, SegmentedComponent,
    BreakdownComponent, CalloutComponent, PageHeaderComponent, ResultActionsComponent, ResultBarComponent, SponsoredComponent,
  ],
  templateUrl: './net-pay.component.html',
})
export class NetPayComponent {
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(SeoService);
  private readonly share = inject(SaveShareService);

  readonly modes = [
    { value: 'forward', label: 'My gross salary' },
    { value: 'reverse', label: 'My take-home pay' },
  ];
  readonly frequencies = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'semi-monthly', label: 'Twice a month' },
  ];

  form = this.fb.group({
    mode: ['forward'], // 'forward': gross to net, 'reverse': net to gross
    payFrequency: ['monthly'], // 'monthly' | 'semi-monthly'
    monthlyBasic: [30000, [Validators.required, Validators.min(1)]],
    targetNet: [25000, [Validators.required, Validators.min(1)]],
    allowances: [0, [Validators.min(0)]],
    overtimeHours: [0, [Validators.min(0)]],
    overtimeMultiplier: [1.25, [Validators.min(1)]],
    daysPerMonth: [21.5, [Validators.min(1), Validators.max(31)]],
    hoursPerDay: [8, [Validators.min(1), Validators.max(24)]],
    includeHolidayPays: [false],
    regHolWorkedDays: [0, [Validators.min(0)]],
    regHolRestWorkedDays: [0, [Validators.min(0)]],
    specHolWorkedDays: [0, [Validators.min(0)]],
    specHolRestWorkedDays: [0, [Validators.min(0)]],
  });

  readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly view = computed(() => this.compute(this.formValue()));

  readonly deMinimis = PH_RULES.deMinimis;

  // Worked example for the guide below, generated from the same engine as the calculator.
  readonly example = (() => {
    const salary = 30_000;
    const c = computeContributions(salary);
    const sss = c.sss.employee;
    const mpf = c.mpf.employee;
    const philhealth = c.philhealth.employee;
    const pagibig = c.pagibig.employee;
    const govt = round2(sss + mpf + philhealth + pagibig);
    const taxable = salary - govt;
    const tax = computeWithholdingTax(taxable);
    return { salary, sss: round2(sss + mpf), philhealth, pagibig, govt, taxable, tax, net: round2(salary - govt - tax) };
  })();

  constructor() {
    this.share.restoreInto(this.form, inject(ActivatedRoute).snapshot.queryParamMap.get('data'));
    this.seo.setSchema([
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            'name': 'Philippine Salary Net Pay Calculator',
            'operatingSystem': 'Web',
            'applicationCategory': 'FinanceApplication',
            'url': 'https://www.phcalculators.com/net-pay',
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'PHP'
            },
            'featureList': 'Compute SSS, PhilHealth, Pag-IBIG, and Withholding Tax'
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': [
              {
                '@type': 'Question',
                'name': 'What is the difference between Gross Pay and Net Pay in the Philippines?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Gross pay is your total earnings before any deductions are made. Net pay (take-home pay) is the amount you actually receive after mandatory government contributions (SSS, PhilHealth, Pag-IBIG) and withholding taxes are deducted.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Are de minimis benefits taxable?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'No, de minimis benefits (like rice subsidy, clothing allowance, medical cash allowance) are reasonably small facilities or privileges furnished by an employer to its employees and are exempt from income tax.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Is holiday pay legally required in the Philippines?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Yes, the Labor Code mandates holiday pay. If you do not work on a regular holiday, you still get 100% of your daily wage. If you work on a regular holiday, you get 200%. For special non-working days, the "no work, no pay" principle applies, but if you work, you get an additional 30% premium.'
                }
              }
            ]
          }
        ]);
  }

  get isReverse(): boolean {
    return this.form.value.mode === 'reverse';
  }

  readonly shareData = computed(() => ({ ...this.formValue() }) as Record<string, unknown>);

  readonly summary = computed(() => {
    const v = this.view();
    const lines = v.rows.filter((r) => r.kind !== 'heading').map((r) => `${r.label}: ${typeof r.amount === 'number' ? formatPeso(r.amount) : r.amount}`);
    return [`Net pay estimate (${v.periodLabel})`, ...lines, 'Computed at phcalculators.com/net-pay'].join('\n');
  });

  private compute(v: Partial<ReturnType<typeof this.form.getRawValue>>) {
    const num = (x: unknown) => (Number.isFinite(Number(x)) ? Number(x) : 0);
    const isSemi = v.payFrequency === 'semi-monthly';
    const period: 'monthly' | 'semi-monthly' = isSemi ? 'semi-monthly' : 'monthly';
    const reverse = v.mode === 'reverse';

    // In reverse mode, solve for the basic salary whose take-home pay matches the target.
    const monthlyBasic = reverse ? computeGrossFromNet(num(v.targetNet), period).monthlyBasic : num(v.monthlyBasic);
    const allowances = reverse ? 0 : num(v.allowances);
    const overtimeHours = reverse ? 0 : num(v.overtimeHours);
    const daysPerMonth = num(v.daysPerMonth) || 21.5;
    const hoursPerDay = num(v.hoursPerDay) || 8;
    const multiplier = num(v.overtimeMultiplier) || 1.25;

    const hourlyRate = deriveHourlyRate(monthlyBasic, daysPerMonth, hoursPerDay);
    const dailyWage = monthlyBasic / daysPerMonth || 0;
    const overtimePay = computeOvertimePay(overtimeHours, hourlyRate, multiplier);
    const includeHoliday = !reverse && !!v.includeHolidayPays;
    const holiday = includeHoliday
      ? computeHolidayPays(dailyWage, {
          regular: { workedDays: num(v.regHolWorkedDays), restWorkedDays: num(v.regHolRestWorkedDays) },
          special: { workedDays: num(v.specHolWorkedDays), restWorkedDays: num(v.specHolRestWorkedDays) },
        }).total
      : 0;

    const contr = computeContributions(monthlyBasic);
    const half = (x: number) => (isSemi ? monthlyToSemiMonthly(x) : x);
    // Each line is rounded per pay period so the lines always add up to the total.
    const lines = {
      sss: round2(half(contr.sss.employee)),
      mpf: round2(half(contr.mpf.employee)),
      philhealth: round2(half(contr.philhealth.employee)),
      pagibig: round2(half(contr.pagibig.employee)),
    };
    const contribPeriod = round2(lines.sss + lines.mpf + lines.philhealth + lines.pagibig);

    // Add-ons (overtime, holiday pay) are paid in the period they are earned, not halved.
    const basePeriod = half(monthlyBasic);
    const allowancePeriod = half(allowances);
    const grossPeriod = basePeriod + allowancePeriod + overtimePay + holiday;
    const taxablePeriod = Math.max(grossPeriod - contribPeriod, 0);
    const tax = computeWithholdingTax(taxablePeriod, period);
    const netPay = grossPeriod - contribPeriod - tax;
    const deductions = contribPeriod + tax;

    const why = explainContributions(monthlyBasic);
    const periodLabel = isSemi ? 'per pay period, twice a month' : 'per month';
    const rows: BreakdownRow[] = [
      { label: 'Earnings', amount: '', kind: 'heading' },
      { label: 'Basic pay', amount: basePeriod, formula: isSemi ? `${formatPeso(monthlyBasic)} ÷ 2` : undefined },
    ];
    if (allowancePeriod > 0) rows.push({ label: 'Allowances', amount: allowancePeriod, note: 'Treated as taxable' });
    if (overtimePay > 0) {
      rows.push({ label: 'Overtime pay', amount: overtimePay, formula: `${overtimeHours} h × ${formatPeso(hourlyRate)} per hour × ${multiplier}` });
    }
    if (holiday > 0) rows.push({ label: 'Holiday pay premium', amount: holiday, note: 'Extra pay on top of your daily wage' });
    rows.push(
      { label: 'Gross pay', amount: grossPeriod, kind: 'subtotal' },
      { label: 'Deductions', amount: '', kind: 'heading' },
      { label: 'SSS', amount: lines.sss, kind: 'neg', formula: why.sss + (isSemi ? ', ÷ 2' : '') },
      { label: 'MPF / WISP (part of SSS)', amount: lines.mpf, kind: 'neg', formula: why.mpf + (isSemi ? ', ÷ 2' : '') },
      { label: 'PhilHealth', amount: lines.philhealth, kind: 'neg', formula: why.philhealth + (isSemi ? ', ÷ 2' : '') },
      { label: 'Pag-IBIG', amount: lines.pagibig, kind: 'neg', formula: why.pagibig + (isSemi ? ', ÷ 2' : '') },
      { label: 'Taxable income', amount: taxablePeriod, kind: 'subtotal', note: 'Gross pay less the contributions above' },
      { label: 'Withholding tax', amount: tax, kind: 'neg', formula: explainWithholding(taxablePeriod, period) },
      { label: 'Take-home pay', amount: netPay, kind: 'total' },
    );

    return {
      valid: this.form.valid,
      reverse,
      isSemi,
      periodLabel,
      monthlyBasic,
      grossPeriod,
      contribPeriod,
      periodContributions: lines,
      taxablePeriod,
      tax,
      deductions,
      deductionRate: grossPeriod > 0 ? formatPercent((deductions / grossPeriod) * 100, 1) : '0%',
      netPay,
      rows,
    };
  }
}
