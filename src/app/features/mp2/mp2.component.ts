import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { SeoService } from '../../shared/seo.service';
import { calculateMP2, MP2Row, round2 } from '../../shared/ph-calculators.util';
import { APP_CONSTANTS } from '../../shared/app.constants';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Chart } from 'chart.js/auto';
import { SaveShareService } from '../../shared/services/save-share.service';

@Component({
    selector: 'app-mp2',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatCardModule,
        MatSelectModule,
        MatButtonModule,
        MatTooltipModule,
        ThousandsSeparatorDirective,
        MatIconModule,
        MatCheckboxModule,
        RouterModule
    ],
    templateUrl: './mp2.component.html',
    styleUrl: './mp2.component.scss'
})
export class Mp2Component implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  chart: any;
  shareUrl: string = '';
  saveSuccess: boolean = false;

  form = this.fb.group({
    monthlyContribution: [500, [Validators.required, Validators.min(500), Validators.max(APP_CONSTANTS.MP2_MAX_MONTHLY_CONTRIBUTION)]],
    rate: [7.05, [Validators.required, Validators.min(0)]],
    mode: ['compounded'], // 'compounded' | 'annual'
    rollover: [false]
  });

  results: MP2Row[] = [];
  totals = {
    contribution: 0,
    dividend: 0,
    accumulated: 0
  };

  chartMax = 0; // For scaling CSS bars

  constructor(
    private fb: FormBuilder, 
    private seo: SeoService,
    private saveShare: SaveShareService,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
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

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['data']) {
        const decoded = this.saveShare.decodeSharedData(params['data']);
        if (decoded) {
          this.form.patchValue({
            monthlyContribution: decoded.monthlyContribution,
            rate: decoded.rate,
            mode: decoded.mode,
            rollover: decoded.rollover || false
          });
        }
      }
    });
    this.compute();
    this.form.valueChanges.subscribe(() => {
      this.compute();
      this.shareUrl = '';
      this.saveSuccess = false;
    });
  }

  ngAfterViewInit() {
    this.initChart();
  }

  compute() {
    const val = this.form.value;
    const monthly = Number(val.monthlyContribution) || 0;
    const rate = Number(val.rate) || 0;
    const mode = (val.mode as 'compounded' | 'annual') || 'compounded';
    const rollover = !!val.rollover;

    this.results = calculateMP2(monthly, rate, mode, rollover);

    if (this.results.length > 0) {
      const last = this.results[this.results.length - 1];
      this.totals = {
        contribution: last.cumulativeContrib,
        // For annual mode, total dividend is sum of annual dividends.
        // For compounded, it's baked into totalAccumulated - contributions.
        dividend: mode === 'compounded'
          ? round2(last.totalAccumulated - last.cumulativeContrib)
          : round2(this.results.reduce((acc, r) => acc + r.annualDividend, 0)),
        accumulated: last.totalAccumulated
      };

      // Find max value for chart scaling (either accumulated or a bit higher)
      this.chartMax = last.totalAccumulated * 1.1;
    }
    
    if (this.chart) {
      this.updateChart();
    }
  }

  initChart() {
    if (!this.chartCanvas || !isPlatformBrowser(this.platformId)) return;
    
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: this.results.map(r => `Year ${r.year}`),
        datasets: [{
          label: 'Total Value',
          data: this.results.map(r => r.totalAccumulated),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  updateChart() {
    if (!this.chart || !isPlatformBrowser(this.platformId)) return;
    this.chart.data.labels = this.results.map(r => `Year ${r.year}`);
    this.chart.data.datasets[0].data = this.results.map(r => r.totalAccumulated);
    this.chart.update();
  }

  saveCalculation() {
    const data = {
      type: 'mp2',
      monthlyContribution: this.form.value.monthlyContribution,
      rate: this.form.value.rate,
      mode: this.form.value.mode,
      rollover: this.form.value.rollover,
      accumulated: this.totals.accumulated
    };
    this.saveSuccess = this.saveShare.saveCalculation('mp2', data);
    setTimeout(() => this.saveSuccess = false, 3000);
  }

  generateShareLink() {
    const data = {
      monthlyContribution: this.form.value.monthlyContribution,
      rate: this.form.value.rate,
      mode: this.form.value.mode,
      rollover: this.form.value.rollover
    };
    this.shareUrl = this.saveShare.generateShareLink(data);
  }

  copyLink() {
    if (this.shareUrl) {
      navigator.clipboard.writeText(this.shareUrl);
      alert('Link copied to clipboard!');
    }
  }

  // Helper for Chart CSS height
  getBarHeight(value: number) {
    if (this.chartMax === 0) return '0%';
    return Math.min(100, (value / this.chartMax) * 100) + '%';
  }
}
