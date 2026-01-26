import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { ContributionsComponent } from './features/contributions/contributions.component';
import { NetPayComponent } from './features/net-pay/net-pay.component';
import { AmortizationComponent } from './features/amortization/amortization.component';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';
import { PrivacyPolicyComponent } from './features/privacy-policy/privacy-policy.component';
import { TermsComponent } from './features/terms/terms.component';
import { DisclaimerComponent } from './features/disclaimer/disclaimer.component';
import { ArticlesListComponent } from './features/articles/articles-list.component';
import { Sss2025ArticleComponent } from './features/articles/sss-2025.component';
import { PagibigVsMpfArticleComponent } from './features/articles/pagibig-vs-mpf.component';
import { LoanAmortizationPhArticleComponent } from './features/articles/loan-amortization-ph.component';
import { ThirteenthMonthComponent } from './features/thirteenth-month/thirteenth-month.component';
import { Mp2Component } from './features/mp2/mp2.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full', title: 'PH Salary & Loan Calculators', data: { description: 'Free Philippines calculators for SSS, Pag-IBIG, PhilHealth, MPF contributions, salary net pay, tax, 13th month, and loan amortization.' } },
  { path: 'contributions', component: ContributionsComponent, title: 'SSS, Pag-IBIG, PhilHealth, MPF', data: { description: 'Compute SSS, PhilHealth, Pag-IBIG, and MPF contributions with employee and employer shares.' } },
  { path: 'net-pay', component: NetPayComponent, title: 'Salary Net Pay Calculators', data: { description: 'Estimate take-home pay with contributions, withholding tax, overtime, and optional holiday pays.' } },
  { path: '13th-month-pay', component: ThirteenthMonthComponent, title: '13th Month Pay Calculator Philippines', data: { description: 'Compute your 13th-month pay with pro-rated calculator for resigned employees or new hires.' } },
  { path: 'mp2-calculator', component: Mp2Component, title: 'Pag-IBIG MP2 Calculator', data: { description: 'Estimate your MP2 savings growth with annual payout or 5-year compounding options.' } },
  { path: 'amortization', component: AmortizationComponent, title: 'Loan Amortization Calculators', data: { description: 'Calculate monthly payments and schedules for housing, car, and salary loans.' } },
  { path: 'about', component: AboutComponent, title: 'About • PH Calculators', data: { description: 'About PH Calculators: mission, ownership, and transparency for AdSense compliance.' } },
  { path: 'contact', component: ContactComponent, title: 'Contact • PH Calculators', data: { description: 'Contact PH Calculators for inquiries, feedback, or corrections.' } },
  { path: 'privacy-policy', component: PrivacyPolicyComponent, title: 'Privacy Policy • PH Calculators', data: { description: 'Privacy Policy explaining how we handle data and cookies for PH Calculators.' } },
  { path: 'terms', component: TermsComponent, title: 'Terms of Service • PH Calculators', data: { description: 'Terms and conditions for using PH Calculators.' } },
  { path: 'disclaimer', component: DisclaimerComponent, title: 'Disclaimer • PH Calculators', data: { description: 'Financial disclaimer: informational purposes only, not financial or legal advice.' } },
  { path: 'articles', component: ArticlesListComponent, title: 'Articles • PH Calculators', data: { description: 'Guides on SSS, Pag-IBIG, MPF, taxes, and loans in the Philippines.' } },
  { path: 'articles/sss-contribution-2025', component: Sss2025ArticleComponent, title: 'How to compute your SSS contribution in 2025', data: { description: 'Step-by-step guide to estimate SSS contributions in 2025 with examples.' } },
  { path: 'articles/pagibig-vs-mpf', component: PagibigVsMpfArticleComponent, title: 'Pag-IBIG vs MPF explained', data: { description: 'Understand differences between Pag-IBIG and SSS MPF, with pros/cons.' } },
  { path: 'articles/loan-amortization-ph', component: LoanAmortizationPhArticleComponent, title: 'How loan amortization works in the Philippines', data: { description: 'Guide to amortization basics, interest, principal, and sample schedules.' } },
  { path: '**', component: NotFoundComponent, title: 'Page not found', data: { description: 'The page you’re looking for doesn’t exist.' } }
];
