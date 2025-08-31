import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { ContributionsComponent } from './features/contributions/contributions.component';
import { NetPayComponent } from './features/net-pay/net-pay.component';
import { AmortizationComponent } from './features/amortization/amortization.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'contributions', component: ContributionsComponent, title: 'SSS, Pag-IBIG, PhilHealth, MPF' },
  { path: 'net-pay', component: NetPayComponent, title: 'Salary Net Pay Calculators' },
  { path: 'amortization', component: AmortizationComponent, title: 'Loan Amortization Calculators' },
  { path: '**', redirectTo: '' }
];
