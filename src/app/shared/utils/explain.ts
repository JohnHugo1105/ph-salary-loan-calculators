import { formatPeso, formatPercent } from '../format';
import { computeSssMsc, getWithholdingBracket } from './ph-calculators.util';
import { PH_RULES } from './ph-rules';

// Plain-language formulas for each line of a result, built from the same rules as the engine so
// the explanation can never disagree with the number.

export function explainContributions(monthlySalary: number) {
  const r = PH_RULES;
  const msc = computeSssMsc(monthlySalary);
  const regular = Math.min(msc, r.sss.regularMscMax);
  const above = Math.max(0, msc - r.sss.regularMscMax);
  const phBase = Math.min(Math.max(monthlySalary, r.philhealth.floor), r.philhealth.ceiling);
  const pagibigBase = Math.min(monthlySalary, r.pagibig.maxFundSalary);
  const pagibigRate = monthlySalary <= r.pagibig.lowSalaryThreshold ? r.pagibig.employeeRateLow : r.pagibig.employeeRate;

  return {
    msc,
    sss: `${formatPercent(r.sss.employeeRate * 100)} × ${formatPeso(regular, 0)} (regular SS credit; your MSC is ${formatPeso(msc, 0)})`,
    mpf: above > 0
      ? `${formatPercent(r.sss.employeeRate * 100)} × (${formatPeso(msc, 0)} − ${formatPeso(r.sss.regularMscMax, 0)}) = ${formatPercent(r.sss.employeeRate * 100)} × ${formatPeso(above, 0)}`
      : `Your MSC (${formatPeso(msc, 0)}) is not above ${formatPeso(r.sss.regularMscMax, 0)}, so nothing goes to MPF/WISP`,
    philhealth: `${formatPercent(r.philhealth.rate * 100)} × ${formatPeso(phBase, 0)} ÷ 2 (salary counted between ${formatPeso(r.philhealth.floor, 0)} and ${formatPeso(r.philhealth.ceiling, 0)}; employer pays the other half)`,
    pagibig: `${formatPercent(pagibigRate * 100)} × ${formatPeso(pagibigBase, 0)} (fund salary is capped at ${formatPeso(r.pagibig.maxFundSalary, 0)})`,
  };
}

export function explainWithholding(taxable: number, period: 'monthly' | 'semi-monthly' = 'monthly'): string {
  const b = getWithholdingBracket(taxable, period);
  if (b.rate === 0) {
    const limit = (period === 'semi-monthly' ? PH_RULES.withholdingTax.semiMonthly : PH_RULES.withholdingTax.monthly).find((x) => x.rate === 0.15)?.over ?? 0;
    return `Taxable income is at or below ${formatPeso(limit, 0)} ${period === 'semi-monthly' ? 'per semi-monthly period' : 'a month'}, so no tax is withheld`;
  }
  return `${formatPeso(b.base)} + ${formatPercent(b.rate * 100)} × (${formatPeso(taxable)} − ${formatPeso(b.over, 0)})`;
}
