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
import { RelatedComponent } from '../../shared/ui/related.component';
import { ResultActionsComponent } from '../../shared/ui/result-actions.component';
import { ResultBarComponent } from '../../shared/ui/result-bar.component';
import { SegmentedComponent } from '../../shared/ui/segmented.component';
import { SponsoredComponent } from '../../shared/ui/sponsored.component';
import { computeSssEmergencyLoan, computeSssSalaryLoan } from '../../shared/utils/ph-calculators.util';
import { PH_RULES } from '../../shared/utils/ph-rules';

@Component({
  selector: 'app-sss-salary-loan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DecimalPipe, RouterLink, ThousandsSeparatorDirective, FieldComponent, SegmentedComponent,
    BreakdownComponent, CalloutComponent, PageHeaderComponent, ResultActionsComponent, ResultBarComponent, SponsoredComponent, RelatedComponent,
  ],
  templateUrl: './sss-salary-loan.component.html',
})
export class SssSalaryLoanComponent {
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(SeoService);
  private readonly share = inject(SaveShareService);

  readonly rules = PH_RULES.sssLoans;
  readonly loanTypes = [
    { value: 1, label: '1-month' },
    { value: 2, label: '2-month' },
    { value: 3, label: 'Emergency' },
  ];
  readonly eligibility: Record<number, string> = {
    1: 'Usually needs at least 36 posted monthly contributions.',
    2: 'Usually needs at least 72 posted monthly contributions.',
    3: 'Usually needs at least 18 posted monthly contributions, 6 of them in the last 12 months.',
  };

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
    this.seo.setSchema([{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          'name': 'SSS Salary Loan Calculator Philippines',
          'operatingSystem': 'Web',
          'applicationCategory': 'FinanceApplication'
        }]);
  }
}
