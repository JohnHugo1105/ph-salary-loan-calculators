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
import { SegmentedComponent } from '../../shared/ui/segmented.component';
import { SponsoredComponent } from '../../shared/ui/sponsored.component';
import { computeMaternityBenefit } from '../../shared/utils/ph-calculators.util';
import { PH_RULES } from '../../shared/utils/ph-rules';

@Component({
  selector: 'app-sss-maternity',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DecimalPipe, RouterLink, ThousandsSeparatorDirective, FieldComponent, SegmentedComponent,
    BreakdownComponent, CalloutComponent, PageHeaderComponent, ResultActionsComponent, ResultBarComponent, SponsoredComponent,
  ],
  templateUrl: './sss-maternity.component.html',
})
export class SssMaternityComponent {
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(SeoService);
  private readonly share = inject(SaveShareService);

  // SSS counts only the regular SS part of each MSC (max 20,000) for maternity benefits.
  readonly mscCap = PH_RULES.maternity.mscCap;
  readonly maxTotalMsc = PH_RULES.maternity.mscCap * PH_RULES.maternity.mscCount;
  readonly entries = [
    { value: 'single', label: 'One MSC for 6 months' },
    { value: 'total', label: 'Total of 6 MSCs' },
  ];
  readonly leaveTypes = [
    { value: PH_RULES.maternity.days.live, label: 'Live birth, normal or caesarean (105 days)' },
    { value: PH_RULES.maternity.days.soloParent, label: 'Live birth as a solo parent (120 days)' },
    { value: PH_RULES.maternity.days.miscarriage, label: 'Miscarriage or emergency termination (60 days)' },
  ];

  form = this.fb.group({
    entry: ['single'],
    monthlyMsc: [20000, [Validators.required, Validators.min(1)]],
    totalMsc: [this.maxTotalMsc, [Validators.required, Validators.min(1)]],
    deliveryType: [PH_RULES.maternity.days.live, [Validators.required]], // 105, 120, or 60 days
  });

  readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly results = computed(() => {
    const v = this.formValue();
    const days = Number(v.deliveryType) || PH_RULES.maternity.days.live;
    const entered = v.entry === 'single' ? (Number(v.monthlyMsc) || 0) * PH_RULES.maternity.mscCount : Number(v.totalMsc) || 0;
    // ADSC = total of the six highest MSCs (each counted up to 20,000) / 180; benefit = ADSC x days
    const r = computeMaternityBenefit(entered, days);
    const rows: BreakdownRow[] = [
      { label: 'MSC total counted', amount: r.countedTotal, formula: `Six highest MSCs, each counted up to ${formatPeso(this.mscCap, 0)} (maximum ${formatPeso(this.maxTotalMsc, 0)})` },
      { label: 'Average daily salary credit', amount: r.adsc, formula: `${formatPeso(r.countedTotal)} ÷ ${PH_RULES.maternity.divisorDays} days` },
      { label: 'Days of maternity leave', amount: `${days} days` },
      { label: 'Maternity benefit', amount: r.benefit, kind: 'total', formula: `${formatPeso(r.adsc)} × ${days} days` },
    ];
    return { ...r, days, rows, totalBenefit: r.benefit };
  });

  readonly shareData = computed(() => ({ ...this.formValue() }) as Record<string, unknown>);
  readonly summary = computed(() => {
    const r = this.results();
    return [
      'SSS maternity benefit estimate',
      `Daily salary credit: ${formatPeso(r.adsc)}`,
      `${r.days} days: ${formatPeso(r.benefit)}`,
      'Computed at phcalculators.com/sss-maternity-benefit',
    ].join('\n');
  });

  constructor() {
    this.share.restoreInto(this.form, inject(ActivatedRoute).snapshot.queryParamMap.get('data'));
    this.seo.setSchema([{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          'name': 'SSS Maternity Benefit Calculator',
          'operatingSystem': 'Web',
          'applicationCategory': 'FinanceApplication'
        }]);
  }
}
