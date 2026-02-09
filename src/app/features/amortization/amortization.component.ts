import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { computeAmortization } from '../../shared/ph-calculators.util';
import { trigger, transition, style, query, stagger, animate } from '@angular/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { SeoService } from '../../shared/seo.service';
import { AdComponent } from '../../shared/components/ad/ad.component';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-amortization',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCardModule, MatButtonModule, MatSelectModule, MatIconModule, ThousandsSeparatorDirective, RouterModule, AdComponent],
  templateUrl: './amortization.component.html',
  styleUrl: './amortization.component.scss',
  animations: [
    trigger('tableIn', [
      transition(':enter', [
        query('tbody tr', [
          style({ opacity: 0, transform: 'translateY(6px)' }),
          stagger(20, animate('160ms ease-out', style({ opacity: 1, transform: 'none' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class AmortizationComponent {
  form = this.fb.group({
    amount: [1000000, [Validators.required, Validators.min(0)]],
    annualRate: [8, [Validators.required, Validators.min(0)]],
    months: [240, [Validators.required, Validators.min(1)]]
  });

  schedule = computeAmortization(1_000_000, 8, 240);
  pageSize = 24;
  page = 0;

  constructor(private fb: FormBuilder, private seo: SeoService) {
    this.form.valueChanges.subscribe(v => {
      const amount = Number(v.amount) || 0;
      const rate = Number(v.annualRate) || 0;
      const months = Number(v.months) || 1;
      this.schedule = computeAmortization(amount, rate, months);
      this.page = 0;
    });

    this.seo.setSchema({
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
    });
  }

  get totalRows() { return this.schedule.schedule.length; }
  get startIndex() { return this.page * this.pageSize; }
  get endIndex() { return Math.min(this.startIndex + this.pageSize, this.totalRows); }
  get pagedRows() { return this.schedule.schedule.slice(this.startIndex, this.endIndex); }
  get totalPages() { return Math.max(1, Math.ceil(this.totalRows / this.pageSize)); }
  canPrev() { return this.page > 0; }
  canNext() { return this.page < this.totalPages - 1; }
  first() { this.page = 0; }
  prev() { if (this.canPrev()) this.page--; }
  next() { if (this.canNext()) this.page++; }
  last() { this.page = this.totalPages - 1; }
  setPageSize(size: number) { this.pageSize = size; this.page = 0; }
}
