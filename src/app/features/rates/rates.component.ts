import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { formatDate, formatPeso, formatPercent } from '../../shared/format';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PH_RULES, PH_RULES_LAST_REVIEWED } from '../../shared/utils/ph-rules';

interface RateGroup {
  id: string;
  title: string;
  status: 'checked' | 'confirm';
  effective: string;
  rows: { label: string; value: string }[];
  sources: { label: string; url?: string }[];
  note?: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function monthYear(iso: string): string {
  const [y, m] = iso.split('-');
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y;
}
const peso = (n: number) => formatPeso(n, 0);
const pct = (n: number) => formatPercent(n * 100);

const r = PH_RULES;
const GROUPS: RateGroup[] = [
  {
    id: 'sss',
    title: 'SSS contributions',
    status: 'checked',
    effective: `${monthYear(r.sss.effective)} (final step of RA 11199)`,
    rows: [
      { label: 'Total contribution rate', value: `${pct(r.sss.totalRate)} of the monthly salary credit (MSC)` },
      { label: 'Employee / employer share', value: `${pct(r.sss.employeeRate)} / ${pct(r.sss.employerRate)}` },
      { label: 'MSC range', value: `${peso(r.sss.mscMin)} to ${peso(r.sss.mscMax)}, in steps of ${peso(r.sss.mscStep)}` },
      { label: 'MPF / WISP', value: `The part of the MSC above ${peso(r.sss.regularMscMax)} (part of the same contribution)` },
      { label: 'Employees’ Compensation (employer)', value: `${peso(r.sss.ecLow)} if MSC is below ${peso(r.sss.ecMscThreshold)}, otherwise ${peso(r.sss.ecHigh)}` },
    ],
    sources: [{ label: 'SSS contribution schedule', url: r.sss.source }],
  },
  {
    id: 'philhealth',
    title: 'PhilHealth premium',
    status: 'checked',
    effective: monthYear(r.philhealth.effective),
    rows: [
      { label: 'Premium rate', value: `${pct(r.philhealth.rate)} of monthly basic salary, shared equally with the employer` },
      { label: 'Income floor / ceiling', value: `${peso(r.philhealth.floor)} / ${peso(r.philhealth.ceiling)}` },
      { label: 'Monthly premium range', value: `${peso(r.philhealth.floor * r.philhealth.rate)} to ${peso(r.philhealth.ceiling * r.philhealth.rate)}` },
    ],
    sources: [{ label: 'PhilHealth UHC contribution rates', url: r.philhealth.source }],
  },
  {
    id: 'pagibig',
    title: 'Pag-IBIG (HDMF) savings contribution',
    status: 'checked',
    effective: `${monthYear(r.pagibig.effective)} (Circular No. 460)`,
    rows: [
      { label: 'Employee rate', value: `${pct(r.pagibig.employeeRateLow)} if salary is ${peso(r.pagibig.lowSalaryThreshold)} or less, otherwise ${pct(r.pagibig.employeeRate)}` },
      { label: 'Employer rate', value: pct(r.pagibig.employerRate) },
      { label: 'Maximum monthly fund salary', value: `${peso(r.pagibig.maxFundSalary)} (so at most ${peso(r.pagibig.maxFundSalary * r.pagibig.employeeRate)} each)` },
    ],
    sources: [{ label: 'Pag-IBIG Circular No. 460', url: r.pagibig.source }],
  },
  {
    id: 'bir',
    title: 'BIR withholding tax on compensation',
    status: 'checked',
    effective: `${monthYear(r.withholdingTax.effective)} onwards (RR 11-2018, Annex E)`,
    rows: [
      { label: 'Exempt amount', value: `${peso(20_833)} a month (${peso(250_000)} a year)` },
      { label: 'Top rate', value: '35% on the excess over ₱666,667 a month' },
    ],
    sources: [{ label: 'BIR RR 11-2018, Annex E', url: r.withholdingTax.source }],
    note: 'Withholding is computed on taxable pay: gross pay less mandatory contributions. The full monthly and semi-monthly tables follow.',
  },
  {
    id: 'thirteenth',
    title: '13th month pay and other benefits',
    status: 'checked',
    effective: 'TRAIN law (RA 10963)',
    rows: [{ label: 'Tax-exempt limit', value: `${peso(r.thirteenthMonthExemption)} for 13th month pay and other benefits combined` }],
    sources: [{ label: 'RA 10963 (TRAIN law)' }],
  },
  {
    id: 'deminimis',
    title: 'De minimis benefits',
    status: 'checked',
    effective: 'BIR Revenue Regulations No. 29-2025',
    rows: [
      { label: 'Rice subsidy', value: `${peso(r.deMinimis.riceSubsidyMonthly)} a month` },
      { label: 'Uniform and clothing allowance', value: `${peso(r.deMinimis.clothingAllowanceAnnual)} a year` },
      { label: 'Medical cash allowance (dependents)', value: `${peso(r.deMinimis.medicalCashDependentsPerSemester)} per semester` },
      { label: 'Laundry allowance', value: `${peso(r.deMinimis.laundryAllowanceMonthly)} a month` },
      { label: 'Monetized unused vacation leave (private sector)', value: `${r.deMinimis.monetizedVacationLeaveDays} days` },
    ],
    sources: [{ label: 'BIR 2025 Revenue Regulations', url: r.deMinimis.source }],
  },
  {
    id: 'maternity',
    title: 'SSS maternity benefit',
    status: 'checked',
    effective: 'RA 11210 (Expanded Maternity Leave Law)',
    rows: [
      { label: 'Salary credit counted', value: `Each of the 6 highest MSCs, up to ${peso(r.maternity.mscCap)}` },
      { label: 'Daily allowance', value: `Total of the six MSCs ÷ ${r.maternity.divisorDays}` },
      { label: 'Days of leave', value: `${r.maternity.days.live} (live birth), ${r.maternity.days.soloParent} (solo parent), ${r.maternity.days.miscarriage} (miscarriage)` },
      { label: 'Largest regular benefit', value: `${peso((r.maternity.mscCap * r.maternity.mscCount * r.maternity.days.live) / r.maternity.divisorDays)} for ${r.maternity.days.live} days` },
    ],
    sources: [{ label: 'SSS maternity benefit', url: r.maternity.source }],
  },
  {
    id: 'sssloans',
    title: 'SSS salary and emergency loans',
    status: 'confirm',
    effective: 'Salary loan: Circular 2025-004. Emergency loan: per SSS guidelines as reported',
    rows: [
      { label: 'Salary loan rate', value: `${r.sssLoans.salaryLoan.annualRate}% a year; ${r.sssLoans.salaryLoan.annualRateAfterCondonation}% for renewals within 5 years of a penalty condonation` },
      { label: 'Salary loan fee and term', value: `${pct(r.sssLoans.salaryLoan.serviceFeeRate)} service fee, ${r.sssLoans.salaryLoan.termMonths} monthly payments` },
      { label: 'Salary loan limit used', value: `Average regular MSC up to ${peso(r.sssLoans.salaryLoan.regularMscCap)}, times 1 or 2 months` },
      { label: 'Emergency loan', value: `${r.sssLoans.emergencyLoan.annualRate}% a year, no service fee, ${r.sssLoans.emergencyLoan.moratoriumMonths}-month moratorium, then ${r.sssLoans.emergencyLoan.termMonths} payments` },
    ],
    sources: [{ label: 'SSS salary loan', url: r.sssLoans.source }],
    note: 'Loan limits and the emergency loan terms come from secondary sources and change by circular. Confirm them with SSS.',
  },
  {
    id: 'housing',
    title: 'Pag-IBIG housing loan',
    status: 'confirm',
    effective: 'Repricing rates as used by this calculator',
    rows: [
      { label: 'Loan limit', value: peso(r.housingLoan.maxLoan) },
      { label: 'Income test', value: `Monthly amortization at most ${pct(r.housingLoan.maxIncomeShare)} of gross income` },
      ...Object.entries(r.housingLoan.ratesByRepricingYears).map(([y, rate]) => ({ label: `${y}-year repricing`, value: `${rate}% a year` })),
    ],
    sources: [{ label: 'Pag-IBIG Fund', url: r.housingLoan.source }],
    note: 'Pag-IBIG revises these rates. Confirm the current schedule with Pag-IBIG before you apply.',
  },
  {
    id: 'mp2',
    title: 'Pag-IBIG MP2 savings dividend',
    status: 'checked',
    effective: `Declared for ${r.mp2.latestDeclared.year}`,
    rows: [{ label: 'Latest declared dividend rate', value: `${r.mp2.latestDeclared.ratePct}% a year` }],
    sources: [{ label: 'Pag-IBIG Fund', url: r.mp2.source }],
    note: 'Dividend rates are declared each year and future rates are not guaranteed. Projections hold the rate constant.',
  },
];

@Component({
  selector: 'app-rates',
  imports: [DecimalPipe, RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rates.component.html',
})
export class RatesComponent {
  readonly groups = GROUPS;
  readonly reviewed = formatDate(PH_RULES_LAST_REVIEWED);
  readonly monthlyTax = [...r.withholdingTax.monthly].reverse();
  readonly semiMonthlyTax = [...r.withholdingTax.semiMonthly].reverse();

  upper(rows: { over: number }[], i: number): number | null {
    return rows[i + 1]?.over ?? null;
  }
}
