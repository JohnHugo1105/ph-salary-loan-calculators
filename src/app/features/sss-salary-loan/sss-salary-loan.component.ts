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
import { computeSssEmergencyLoan, computeSssSalaryLoan, round2 } from '../../shared/utils/ph-calculators.util';
import { PH_RULES, PH_RULES_LAST_REVIEWED } from '../../shared/utils/ph-rules';

@Component({
  selector: 'app-sss-salary-loan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DecimalPipe, RouterLink, ThousandsSeparatorDirective, FieldComponent, SegmentedComponent,
    BreakdownComponent, CalloutComponent, PageHeaderComponent, ResultActionsComponent, ResultBarComponent, RelatedComponent,
  ],
  templateUrl: './sss-salary-loan.component.html',
})
export class SssSalaryLoanComponent {
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(SeoService);
  private readonly share = inject(SaveShareService);

  readonly rules = PH_RULES.sssLoans;
  readonly reviewed = formatDate(PH_RULES_LAST_REVIEWED);
  readonly loanTypes = [
    { value: 1, label: '1-month' },
    { value: 2, label: '2-month' },
    { value: 3, label: 'Emergency' },
  ];
  readonly eligibility: Record<number, string> = {
    1: 'Circular No. 2025-004: 36 posted monthly contributions, 6 of them in the last 12 months.',
    2: 'Circular No. 2025-004: 72 posted monthly contributions, 6 of them in the last 12 months.',
    3: 'Circular No. 2026-003: 18 posted monthly contributions, 6 of them in the last 12 months.',
  };

  private withTotals<T extends { loanableAmount: number; monthlyAmortization: number; termMonths: number }>(r: T) {
    const totalRepaid = round2(r.monthlyAmortization * r.termMonths);
    return { ...r, totalRepaid, totalInterest: round2(totalRepaid - r.loanableAmount) };
  }

  // Worked examples are the loan functions' output. Advance interest is one month, not the circular's day count.
  readonly exOne = this.withTotals(computeSssSalaryLoan(15_000, 1, 8));
  readonly exTwo = this.withTotals(computeSssSalaryLoan(18_300, 2, 8));
  readonly exEight = this.withTotals(computeSssSalaryLoan(20_000, 2, 8));
  readonly exTen = this.withTotals(computeSssSalaryLoan(20_000, 2, PH_RULES.sssLoans.salaryLoan.annualRateAfterCondonation));
  readonly exEmergency = this.withTotals(computeSssEmergencyLoan(20_000, 1));
  readonly exEmergencyHalf = this.withTotals(computeSssEmergencyLoan(12_000, 0.5));

  readonly faq = [
    {
      q: 'Why is the cash lower than one or two months of my salary credit?',
      a: `SSS deducts a 1% service fee and the interest from the release date until the month before the first payment. This calculator estimates that advance interest as one month: loan amount × annual rate ÷ 12. On a ${formatPeso(15_000, 0)} one-month loan at 8% that is a ${formatPeso(this.exOne.serviceFee)} fee and ${formatPeso(this.exOne.advanceInterest)} of interest, so you receive ${formatPeso(this.exOne.netProceeds)}. Circular No. 2025-004 prorates the interest by the actual number of days divided by 365, and it also deducts any earlier short-term loan this page does not know about. The disclosure in My.SSS is the figure that will be released.`,
    },
    {
      q: 'When is the salary-loan rate 10% instead of 8%?',
      a: `Circular No. 2025-004 charges 8% a year on a diminishing balance for a first salary loan, and for a renewal if you have not used a penalty condonation in the past five years. A renewal inside those five years is 10%. On a two-month loan at the ${formatPeso(20_000, 0)} credit, this calculator's 8% case receives ${formatPeso(this.exEight.netProceeds)} and amortizes ${formatPeso(this.exEight.monthlyAmortization)}; the 10% case receives ${formatPeso(this.exTen.netProceeds)} and amortizes ${formatPeso(this.exTen.monthlyAmortization)}. The condonation program those five years refer to is the Consolidated Loan Program in Circular No. 2022-022.`,
    },
    {
      q: 'How is the emergency loan different in this calculator?',
      a: `Circular No. 2026-003 is a separate program: 7% a year, or 10% if you used a penalty condonation in the past five years, no service fee, a six-month moratorium, then 24 payments, and a maximum of ${formatPeso(20_000, 0)}. This calculator's emergency switch uses 7% only. It also compounds the moratorium interest onto the balance before amortizing. The circular says the interest that builds during the moratorium is spread across the 24 payments and does not itself earn interest. For a ${formatPeso(20_000, 0)} loan the calculator's compounded path adds ${formatPeso(this.exEmergency.interestDuringMoratorium)} and then asks for ${formatPeso(this.exEmergency.monthlyAmortization)} a month. Treat that payment as this site's assumption and read the disclosure in My.SSS.`,
    },
  ];

  form = this.fb.group({
    averageMsc: [20000, [Validators.required, Validators.min(1000), Validators.max(PH_RULES.sssLoans.salaryLoan.regularMscCap)]],
    loanType: [1, [Validators.required]], // 1 or 2 months salary loan, 3 = emergency loan
    salaryLoanRate: [PH_RULES.sssLoans.salaryLoan.annualRate, [Validators.required]], // 8 or 10 (%)
    emergencyShare: [1, [Validators.required]], // 1 or 0.5 of the average MSC
  });

  readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  get isEmergency(): boolean {
    return Number(this.form.value.loanType) === 3;
  }

  readonly results = computed(() => {
    const v = this.formValue();
    const avgMsc = Number(v.averageMsc) || 0;
    const typeValue = Number(v.loanType) || 1;
    const rules = PH_RULES.sssLoans;

    if (typeValue === 3) {
      const share = Number(v.emergencyShare) === 0.5 ? 0.5 : 1;
      return this.decorate({ isEmergency: true, ...computeSssEmergencyLoan(avgMsc, share) });
    }
    const rate = Number(v.salaryLoanRate) === rules.salaryLoan.annualRateAfterCondonation ? rules.salaryLoan.annualRateAfterCondonation : rules.salaryLoan.annualRate;
    return this.decorate({ isEmergency: false, interestDuringMoratorium: 0, ...computeSssSalaryLoan(avgMsc, typeValue === 2 ? 2 : 1, rate) });
  });

  private decorate<T extends { loanableAmount: number; monthlyAmortization: number; termMonths: number; serviceFee: number; advanceInterest: number; netProceeds: number; isEmergency: boolean; moratoriumMonths: number; interestDuringMoratorium: number; annualRatePct: number }>(r: T) {
    const totalRepaid = r.monthlyAmortization * r.termMonths;
    const rows: BreakdownRow[] = [
      { label: 'Loan amount', amount: r.loanableAmount },
    ];
    if (r.isEmergency) {
      rows.push({ label: 'Service fee and advance interest', amount: 'None' });
    } else {
      rows.push(
        { label: 'Service fee', amount: r.serviceFee, kind: 'neg', formula: `1% × ${formatPeso(r.loanableAmount)}` },
        { label: 'Advance interest (estimate)', amount: r.advanceInterest, kind: 'neg', formula: `${formatPeso(r.loanableAmount)} × ${r.annualRatePct}% ÷ 12 (one month)` },
      );
    }
    rows.push({ label: 'You receive', amount: r.netProceeds, kind: 'subtotal' });
    if (r.isEmergency) {
      rows.push(
        { label: 'Payment moratorium', amount: `${r.moratoriumMonths} months` },
        { label: 'Interest accrued meanwhile (assumed)', amount: r.interestDuringMoratorium, note: 'We assume interest accrues during the moratorium and is added to the balance. SSS may treat it differently.' },
      );
    }
    rows.push(
      { label: `Monthly payment for ${r.termMonths} months`, amount: r.monthlyAmortization, kind: 'total', formula: `Diminishing balance at ${r.annualRatePct}% a year over ${r.termMonths} months` },
    );
    return { ...r, totalRepaid, totalInterest: totalRepaid - r.loanableAmount, rows };
  }

  readonly shareData = computed(() => ({ ...this.formValue() }) as Record<string, unknown>);
  readonly summary = computed(() => {
    const r = this.results();
    return [
      r.isEmergency ? 'SSS emergency loan estimate' : 'SSS salary loan estimate',
      `Loan amount: ${formatPeso(r.loanableAmount)}`,
      `You receive: ${formatPeso(r.netProceeds)}`,
      `Monthly payment (${r.termMonths} months at ${r.annualRatePct}%): ${formatPeso(r.monthlyAmortization)}`,
      'Computed at phcalculators.com/sss-salary-loan',
    ].join('\n');
  });

  constructor() {
    this.share.restoreInto(this.form, inject(ActivatedRoute).snapshot.queryParamMap.get('data'));
    this.seo.setSchema([
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'SSS Salary Loan Calculator Philippines',
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
