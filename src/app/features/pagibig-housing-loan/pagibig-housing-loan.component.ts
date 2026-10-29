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
import { SponsoredComponent } from '../../shared/ui/sponsored.component';
import { computeAmortization, round2 } from '../../shared/utils/ph-calculators.util';
import { PH_RULES } from '../../shared/utils/ph-rules';

@Component({
  selector: 'app-pagibig-housing-loan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DecimalPipe, RouterLink, ThousandsSeparatorDirective, FieldComponent,
    BreakdownComponent, CalloutComponent, PageHeaderComponent, ResultActionsComponent, ResultBarComponent, SponsoredComponent,
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
    this.seo.setSchema([{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          'name': 'Pag-IBIG Housing Loan Calculator 2026',
          'operatingSystem': 'Web',
          'applicationCategory': 'FinanceApplication'
        }]);
  }
}
