import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { ContributionsComponent } from './features/contributions/contributions.component';
import { NetPayComponent } from './features/net-pay/net-pay.component';
import { AmortizationComponent } from './features/amortization/amortization.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full', title: 'PH Salary & Loan Calculators', data: { description: 'Free Philippines calculators for SSS, Pag-IBIG, PhilHealth, MPF contributions, salary net pay, tax, 13th month, and loan amortization.' } },
  { path: 'contributions', component: ContributionsComponent, title: 'SSS, Pag-IBIG, PhilHealth, MPF', data: { description: 'Compute SSS, PhilHealth, Pag-IBIG, and MPF contributions with employee and employer shares.' } },
  { path: 'net-pay', component: NetPayComponent, title: 'Salary Net Pay Calculators', data: { description: 'Estimate take-home pay with contributions, withholding tax, 13th month, overtime, and optional holiday pays.' } },
  { path: 'amortization', component: AmortizationComponent, title: 'Loan Amortization Calculators', data: { description: 'Calculate monthly payments and schedules for housing, car, and salary loans.' } },
  { path: '**', redirectTo: '' }
];
