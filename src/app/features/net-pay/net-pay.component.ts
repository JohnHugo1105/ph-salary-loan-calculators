import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { computeContributions, computeOvertimePay, deriveHourlyRate, computeWithholdingTax, monthlyToSemiMonthly, computeHolidayPays } from '../../shared/ph-calculators.util';
import { trigger, transition, style, query, stagger, animate } from '@angular/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { SeoService } from '../../shared/seo.service';
import { AdComponent } from '../../shared/components/ad/ad.component';

@Component({
  selector: 'app-net-pay',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    ThousandsSeparatorDirective,
    AdComponent,
  ],
  templateUrl: './net-pay.component.html',
  styleUrl: './net-pay.component.scss',
  animations: [
    trigger('cardsIn', [
      transition(':enter', [
        query('.card', [
          style({ opacity: 0, transform: 'translateY(6px)' }),
          stagger(60, animate('200ms ease-out', style({ opacity: 1, transform: 'none' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class NetPayComponent {
  form = this.fb.group({
    payFrequency: ['monthly'], // 'monthly' | 'semi-monthly'
    monthlyBasic: [30000, [Validators.required, Validators.min(0)]],
    allowances: [0, [Validators.min(0)]],
    overtimeHours: [0, [Validators.min(0)]],
    overtimeMultiplier: [1.25, [Validators.min(1)]],
    daysPerMonth: [21.5, [Validators.min(1)]],
    hoursPerDay: [8, [Validators.min(1)]],
    includeHolidayPays: [false],
    regHolUnworkedDays: [0, [Validators.min(0)]],
    regHolWorkedDays: [0, [Validators.min(0)]],
    regHolRestWorkedDays: [0, [Validators.min(0)]],
    specHolUnworkedDays: [0, [Validators.min(0)]],
    specHolWorkedDays: [0, [Validators.min(0)]],
    specHolRestWorkedDays: [0, [Validators.min(0)]]
  });

  view = this.compute();

  constructor(private fb: FormBuilder, private seo: SeoService) {
    this.form.valueChanges.subscribe(() => this.view = this.compute());

    this.seo.setSchema({
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
    });
  }

  private compute() {
    const v = this.form.getRawValue();
    const monthlyBasic = Number(v.monthlyBasic) || 0;
    const allowances = Number(v.allowances) || 0;
    const overtimeHours = Number(v.overtimeHours) || 0;
    const overtimeMultiplier = Number(v.overtimeMultiplier) || 1.25;
    const daysPerMonth = Number(v.daysPerMonth) || 21.5;
    const hoursPerDay = Number(v.hoursPerDay) || 8;

    const hourlyRate = deriveHourlyRate(monthlyBasic, daysPerMonth, hoursPerDay);
    const dailyWage = monthlyBasic / daysPerMonth || 0;
    const overtimePay = computeOvertimePay(overtimeHours, hourlyRate, overtimeMultiplier);
    // Holiday pays (incremental add-ons)
    const includeHoliday = !!v.includeHolidayPays;
    const holidayPays = includeHoliday
      ? computeHolidayPays(dailyWage, {
        regular: {
          unworkedDays: Number(v.regHolUnworkedDays) || 0,
          workedDays: Number(v.regHolWorkedDays) || 0,
          restWorkedDays: Number(v.regHolRestWorkedDays) || 0,
        },
        special: {
          unworkedDays: Number(v.specHolUnworkedDays) || 0,
          workedDays: Number(v.specHolWorkedDays) || 0,
          restWorkedDays: Number(v.specHolRestWorkedDays) || 0,
        }
      })
      : { regular: { unworked: 0, worked: 0, restWorked: 0, total: 0 }, special: { unworked: 0, worked: 0, restWorked: 0, total: 0 }, total: 0 };

    // Base fixed compensation vs variable add-ons
    const baseMonthly = monthlyBasic + allowances;
    const variableAdds = overtimePay + (includeHoliday ? holidayPays.total : 0);
    const grossMonthly = baseMonthly + variableAdds;

    const contr = computeContributions(monthlyBasic);
    const isSemi = v.payFrequency === 'semi-monthly';
    const employeeDeductionsMonthly = contr.totals.employee;
    // For semi-monthly, split only base compensation; add-ons (OT, holidays) are not halved
    const basePeriod = isSemi ? monthlyToSemiMonthly(baseMonthly) : baseMonthly;
    const grossPeriod = basePeriod + variableAdds;
    const contribPeriod = isSemi ? monthlyToSemiMonthly(employeeDeductionsMonthly) : employeeDeductionsMonthly;
    const taxablePeriod = Math.max(grossPeriod - contribPeriod, 0);
    const tax = computeWithholdingTax(taxablePeriod, isSemi ? 'semi-monthly' : 'monthly');
    const netPay = grossPeriod - contribPeriod - tax;

    return {
      hourlyRate,
      overtimePay,
      grossMonthly,
      dailyWage,
      holidayPays,
      contributions: contr,
      grossPeriod,
      contribPeriod,
      taxablePeriod,
      tax,
      payFrequency: v.payFrequency,
      netPay,
      includeHolidayPays: includeHoliday,
    };
  }
}
