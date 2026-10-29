import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { SeoService } from '../../core/services/seo.service';
import { computeMaternityBenefit } from '../../shared/utils/ph-calculators.util';
import { PH_RULES } from '../../shared/utils/ph-rules';

@Component({
    selector: 'app-sss-maternity',
    imports: [
        CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
        MatCardModule, MatSelectModule, MatButtonModule, ThousandsSeparatorDirective,
        RouterModule
    ],
    templateUrl: './sss-maternity.component.html',
    styleUrl: './sss-maternity.component.scss'
})
export class SssMaternityComponent {
  // SSS counts only the regular SS part of each MSC (max 20,000) for maternity benefits.
  readonly maxTotalMsc = PH_RULES.maternity.mscCap * PH_RULES.maternity.mscCount;
  readonly mscCap = PH_RULES.maternity.mscCap;

  form = this.fb.group({
    totalMsc: [this.maxTotalMsc, [Validators.required, Validators.min(1), Validators.max(this.maxTotalMsc)]],
    deliveryType: [PH_RULES.maternity.days.live, [Validators.required]] // 105, 120, or 60 days
  });

  results = {
    adsc: 0,
    totalBenefit: 0,
    countedTotal: 0,
    capped: false
  };

  constructor(private fb: FormBuilder, private seo: SeoService) {
    this.seo.setSchema([{
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'SSS Maternity Benefit Calculator',
      'operatingSystem': 'Web',
      'applicationCategory': 'FinanceApplication'
    }]);

    this.compute();
    this.form.valueChanges.subscribe(() => this.compute());
  }

  compute() {
    const totalMsc = Number(this.form.value.totalMsc) || 0;
    const days = Number(this.form.value.deliveryType) || PH_RULES.maternity.days.live;

    // ADSC = total of the six highest MSCs (each counted up to 20,000) / 180; benefit = ADSC x days
    const r = computeMaternityBenefit(totalMsc, days);

    this.results = {
      adsc: r.adsc,
      totalBenefit: r.benefit,
      countedTotal: r.countedTotal,
      capped: r.capped
    };
  }
}
