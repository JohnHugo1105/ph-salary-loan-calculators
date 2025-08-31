import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { computeContributions, computeOvertimePay, deriveHourlyRate, computeWithholdingTax, estimate13thMonthPay, monthlyToSemiMonthly, split13thMonthTaxability, estimateNet13thMonthPay } from '../../shared/ph-calculators.util';
import { trigger, transition, style, query, stagger, animate } from '@angular/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';

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
    ThousandsSeparatorDirective,
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
    daysPerMonth: [26, [Validators.min(1)]],
    hoursPerDay: [8, [Validators.min(1)]],
    monthsWorkedFor13th: [12, [Validators.min(0), Validators.max(12)]]
    , thirteenthTaxRatePct: [20, [Validators.min(0), Validators.max(50)]]
  });

  view = this.compute();

  constructor(private fb: FormBuilder) {
    this.form.valueChanges.subscribe(() => this.view = this.compute());
  }

  private compute() {
    const v = this.form.getRawValue();
    const monthlyBasic = Number(v.monthlyBasic) || 0;
    const allowances = Number(v.allowances) || 0;
    const overtimeHours = Number(v.overtimeHours) || 0;
    const overtimeMultiplier = Number(v.overtimeMultiplier) || 1.25;
    const daysPerMonth = Number(v.daysPerMonth) || 26;
    const hoursPerDay = Number(v.hoursPerDay) || 8;

    const hourlyRate = deriveHourlyRate(monthlyBasic, daysPerMonth, hoursPerDay);
    const overtimePay = computeOvertimePay(overtimeHours, hourlyRate, overtimeMultiplier);
    const grossMonthly = monthlyBasic + allowances + overtimePay;

    const contr = computeContributions(monthlyBasic);
    const isSemi = v.payFrequency === 'semi-monthly';
    const employeeDeductionsMonthly = contr.totals.employee;
    const grossPeriod = isSemi ? monthlyToSemiMonthly(grossMonthly) : grossMonthly;
    const contribPeriod = isSemi ? monthlyToSemiMonthly(employeeDeductionsMonthly) : employeeDeductionsMonthly;
    const taxablePeriod = Math.max(grossPeriod - contribPeriod, 0);
    const tax = computeWithholdingTax(taxablePeriod, isSemi ? 'semi-monthly' : 'monthly');
    const netPay = grossPeriod - contribPeriod - tax;

    const thirteenth = estimate13thMonthPay(monthlyBasic, Number(v.monthsWorkedFor13th) || 0);
    const thirteenthSplit = split13thMonthTaxability(thirteenth);
    const thirteenthRate = Number(v.thirteenthTaxRatePct) || 0;
    const thirteenthNet = estimateNet13thMonthPay(thirteenth, thirteenthRate);

    return {
      hourlyRate,
      overtimePay,
      grossMonthly,
      contributions: contr,
      grossPeriod,
      contribPeriod,
      taxablePeriod,
      tax,
      payFrequency: v.payFrequency,
      netPay,
      thirteenth,
      thirteenthSplit,
      thirteenthRate,
      thirteenthNet,
    };
  }
}
