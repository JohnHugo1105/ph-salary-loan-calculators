import { Component, ElementRef, OnInit, Inject, PLATFORM_ID, ChangeDetectionStrategy, computed, effect, viewChild, signal, untracked } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { computeAmortization } from '../../shared/ph-calculators.util';
import { isPlatformBrowser } from '@angular/common';
import { trigger, transition, style, query, stagger, animate } from '@angular/animations';
import { SaveShareService } from '../../shared/services/save-share.service';
import { toSignal } from '@angular/core/rxjs-interop';
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
    changeDetection: ChangeDetectionStrategy.OnPush,
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
export class AmortizationComponent implements OnInit {
  chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  chart: any;
  shareUrl: string = '';
  saveSuccess: boolean = false;
  form = this.fb.group({
    amount: [1000000, [Validators.required, Validators.min(0)]],
    annualRate: [8, [Validators.required, Validators.min(0)]],
    months: [240, [Validators.required, Validators.min(1)]]
  });

  formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  schedule = computed(() => {
    const v = this.formValue();
    const amount = Number(v.amount) || 0;
    const rate = Number(v.annualRate) || 0;
    const months = Number(v.months) || 1;
    return computeAmortization(amount, rate, months);
  });

  pageSize = signal(24);
  page = signal(0);

  totalRows = computed(() => this.schedule().schedule.length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalRows() / this.pageSize())));
  startIndex = computed(() => this.page() * this.pageSize());
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize(), this.totalRows()));
  pagedRows = computed(() => this.schedule().schedule.slice(this.startIndex(), this.endIndex()));

  canPrev = computed(() => this.page() > 0);
  canNext = computed(() => this.page() < this.totalPages() - 1);

  constructor(
    private fb: FormBuilder, 
    private seo: SeoService,
    private saveShare: SaveShareService,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.form.valueChanges.subscribe(() => {
      this.shareUrl = ''; // reset share link when input changes
      this.saveSuccess = false;
    });

    effect(() => {
      this.schedule();
      untracked(() => this.page.set(0));
    });

    effect(() => {
      const canvas = this.chartCanvas();
      if (canvas && !this.chart) {
        this.initChart(canvas.nativeElement);
      }
    });

    effect(() => {
      const s = this.schedule();
      if (this.chart) {
        this.updateChart(s);
      }
    });

    this.seo.setSchema([
      {
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
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'What is a diminishing balance interest rate?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'A diminishing balance interest rate means that the interest is calculated based on the remaining principal balance of the loan each month, not the original borrowed amount. As you pay off the principal, the interest portion of your monthly payment decreases.'
            }
          },
          {
            '@type': 'Question',
            'name': 'What is a repricing period for a housing loan?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'A repricing period (or fixing period) is the duration for which your interest rate is guaranteed to stay the same. After this period (e.g., 1 year, 3 years, 5 years), the bank will adjust or \'reprice\' your interest rate based on current market conditions, which can increase or decrease your monthly amortization.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Is it better to have a 5-year or 20-year loan term?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'It depends on your cash flow. A 5-year term will have significantly higher monthly payments, but you will pay drastically less total interest over the life of the loan. A 20-year term spreads the payments out to be much lower and more affordable month-to-month, but yields much higher total interest costs overall.'
            }
          }
        ]
      }
    ]);
  }

  first() { this.page.set(0); }
  prev() { if (this.canPrev()) this.page.update(p => p - 1); }
  next() { if (this.canNext()) this.page.update(p => p + 1); }
  last() { this.page.set(this.totalPages() - 1); }
  setPageSize(size: number) { this.pageSize.set(size); this.page.set(0); }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['data']) {
        const decoded = this.saveShare.decodeSharedData(params['data']);
        if (decoded) {
          this.form.patchValue({
            amount: decoded.amount,
            annualRate: decoded.annualRate,
            months: decoded.months
          });
        }
      }
    });
  }

  async initChart(canvasEl: HTMLCanvasElement) {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const { Chart } = await import('chart.js/auto');
    const s = this.schedule();
    const totalPrincipal = s.schedule.reduce((sum, row) => sum + row.principal, 0);
    const totalInterest = s.schedule.reduce((sum, row) => sum + row.interest, 0);

    this.chart = new Chart(canvasEl, {
      type: 'pie',
      data: {
        labels: ['Total Principal', 'Total Interest'],
        datasets: [{
          data: [totalPrincipal, totalInterest],
          backgroundColor: ['#4ade80', '#f87171'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  updateChart(s: any) {
    if (!this.chart || !isPlatformBrowser(this.platformId)) return;
    const totalPrincipal = s.schedule.reduce((sum: number, row: any) => sum + row.principal, 0);
    const totalInterest = s.schedule.reduce((sum: number, row: any) => sum + row.interest, 0);
    
    this.chart.data.datasets[0].data = [totalPrincipal, totalInterest];
    this.chart.update();
  }

  saveCalculation() {
    const data = {
      type: 'amortization',
      amount: this.form.value.amount,
      annualRate: this.form.value.annualRate,
      months: this.form.value.months,
      payment: this.schedule().payment
    };
    this.saveSuccess = this.saveShare.saveCalculation('amortization', data);
    setTimeout(() => this.saveSuccess = false, 3000);
  }

  generateShareLink() {
    const data = {
      amount: this.form.value.amount,
      annualRate: this.form.value.annualRate,
      months: this.form.value.months
    };
    this.shareUrl = this.saveShare.generateShareLink(data);
  }

  copyLink() {
    if (this.shareUrl) {
      navigator.clipboard.writeText(this.shareUrl);
      alert('Link copied to clipboard!');
    }
  }
}
