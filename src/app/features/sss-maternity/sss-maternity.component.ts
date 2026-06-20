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
import { SeoService } from '../../shared/seo.service';

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
  form = this.fb.group({
    totalMsc: [180000, [Validators.required, Validators.min(6000), Validators.max(180000)]],
    deliveryType: [105, [Validators.required]] // 105, 120, or 60 days
  });

  results = {
    adsc: 0,
    totalBenefit: 0
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
    const days = Number(this.form.value.deliveryType) || 105;

    // Average Daily Salary Credit (ADSC)
    const adsc = totalMsc / 180;
    
    // Total Benefit
    const totalBenefit = adsc * days;

    this.results = {
      adsc: adsc,
      totalBenefit: totalBenefit
    };
  }
}
