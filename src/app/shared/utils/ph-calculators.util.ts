// Utility functions for PH-specific calculators. Rates live in ph-rules.ts.
import { PH_RULES } from './ph-rules';

export type Contributions = {
  sss: { employee: number; employer: number; total: number };
  philhealth: { employee: number; employer: number; total: number };
  pagibig: { employee: number; employer: number; total: number };
  mpf: { employee: number; employer: number; total: number };
  totals: { employee: number; employer: number; total: number };
};

// Round to 2 decimals
export function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

const ZERO_SHARE = { employee: 0, employer: 0, total: 0 };

function isPositive(v: number): boolean {
  return Number.isFinite(v) && v > 0;
}

// PhilHealth: 5% of monthly basic salary, shared 50/50; floor 10,000, ceiling 100,000.
export function computePhilHealth(
  monthlySalary: number,
  rate: number = PH_RULES.philhealth.rate,
  floor: number = PH_RULES.philhealth.floor,
  ceiling: number = PH_RULES.philhealth.ceiling
) {
  if (!isPositive(monthlySalary)) return { ...ZERO_SHARE };
  const base = Math.min(Math.max(monthlySalary, floor), ceiling);
  const total = base * rate;
  const employee = total / 2;
  const employer = total / 2;
  return { employee: round2(employee), employer: round2(employer), total: round2(total) };
}

// Pag-IBIG (HDMF) Circular 460: employee 1% if salary <= 1,500, else 2%; employer 2%.
// The monthly fund salary is capped at 10,000, so the maximum is 200 each.
export function computePagIbig(monthlySalary: number) {
  if (!isPositive(monthlySalary)) return { ...ZERO_SHARE };
  const r = PH_RULES.pagibig;
  const base = Math.min(monthlySalary, r.maxFundSalary);
  const employeeRate = monthlySalary <= r.lowSalaryThreshold ? r.employeeRateLow : r.employeeRate;
  const employee = base * employeeRate;
  const employer = base * r.employerRate;
  const total = employee + employer;
  return { employee: round2(employee), employer: round2(employer), total: round2(total) };
}

// SSS Monthly Salary Credit: salary rounded to the nearest 500 (each bracket spans
// MSC - 250 up to but excluding MSC + 250), clamped to the 5,000 - 35,000 schedule.
export function computeSssMsc(monthlySalary: number): number {
  const r = PH_RULES.sss;
  if (!isPositive(monthlySalary)) return 0;
  const rounded = Math.round(monthlySalary / r.mscStep) * r.mscStep;
  return Math.min(Math.max(rounded, r.mscMin), r.mscMax);
}

// SSS regular program: 15% of the MSC (5% employee, 10% employer), with the MSC counted
// only up to 20,000. The part of the MSC above 20,000 is the MPF/WISP — see computeMPF.
// EC is an employer-only premium (10 below 15,000 MSC, otherwise 30).
export function computeSSS(
  monthlySalary: number,
  includeEC = true
) {
  const r = PH_RULES.sss;
  const msc = computeSssMsc(monthlySalary);
  if (msc === 0) return { ...ZERO_SHARE };

  const regularMsc = Math.min(msc, r.regularMscMax);
  const employee = regularMsc * r.employeeRate;
  let employer = regularMsc * r.employerRate;
  if (includeEC) {
    employer += msc >= r.ecMscThreshold ? r.ecHigh : r.ecLow;
  }
  return {
    employee: round2(employee),
    employer: round2(employer),
    total: round2(employee + employer)
  };
}

// Mandatory Provident Fund (MPF/WISP): the same 5% / 10% rates applied to the part of the
// MSC above 20,000 (maximum MSC 35,000). It is part of the SSS contribution, shown separately.
export function computeMPF(monthlySalary: number) {
  const r = PH_RULES.sss;
  const msc = computeSssMsc(monthlySalary);
  const excess = Math.max(0, msc - r.regularMscMax);
  const employee = excess * r.employeeRate;
  const employer = excess * r.employerRate;
  return { employee: round2(employee), employer: round2(employer), total: round2(employee + employer) };
}

export function computeContributions(monthlySalary: number, options?: { includeSSSEC?: boolean }): Contributions {
  const sss = computeSSS(monthlySalary, options?.includeSSSEC ?? true);
  const philhealth = computePhilHealth(monthlySalary);
  const pagibig = computePagIbig(monthlySalary);
  const mpf = computeMPF(monthlySalary);
  const totals = {
    employee: round2(sss.employee + philhealth.employee + pagibig.employee + mpf.employee),
    employer: round2(sss.employer + philhealth.employer + pagibig.employer + mpf.employer),
    total: 0,
  };
  totals.total = round2(totals.employee + totals.employer);
  return { sss, philhealth, pagibig, mpf, totals };
}

// BIR withholding tax on compensation (RR 11-2018 Annex E, 2023 onwards).
// `taxable` is the taxable compensation for the pay period (gross less mandatory contributions).
export function computeWithholdingTax(
  taxable: number,
  period: 'monthly' | 'semi-monthly' = 'monthly'
): number {
  if (!isPositive(taxable)) return 0;
  const brackets = period === 'semi-monthly'
    ? PH_RULES.withholdingTax.semiMonthly
    : PH_RULES.withholdingTax.monthly;

  // Brackets are ordered highest first; a bracket applies from its lower bound upward.
  const b = brackets.find(br => taxable >= br.over) || brackets[brackets.length - 1];
  const tax = b.rate === 0 ? 0 : b.base + (taxable - b.over) * b.rate;
  return round2(Math.max(tax, 0));
}

export function monthlyToSemiMonthly(v: number): number { return v / 2; }

// 13th month pay estimate: base monthly * monthsWorked / 12
// Note: Non-taxable portion applies up to a threshold (90,000) for total 13th + benefits.
export function estimate13thMonthPay(monthlyBasic: number, monthsWorked: number) {
  return round2((monthlyBasic * monthsWorked) / 12);
}

export function split13thMonthTaxability(totalBenefits: number, nonTaxableCap = PH_RULES.thirteenthMonthExemption) {
  const nonTaxable = Math.min(totalBenefits, Math.max(0, nonTaxableCap));
  const taxable = Math.max(0, totalBenefits - nonTaxable);
  return { nonTaxable: round2(nonTaxable), taxable: round2(taxable) };
}

// Estimate net 13th month pay given a withholding rate applied to the taxable portion over the cap
// Net = Gross - (max(0, Gross - cap) * rate)
export function estimateNet13thMonthPay(gross: number, ratePct = 20, cap = PH_RULES.thirteenthMonthExemption) {
  const rate = Math.max(0, ratePct) / 100;
  const taxable = Math.max(0, gross - cap);
  const taxDue = taxable * rate;
  const net = gross - taxDue;
  return { taxable: round2(taxable), taxDue: round2(taxDue), net: round2(net) };
}

// Overtime: provide flexible calc from hourly rate and multiplier
export function computeOvertimePay(hours: number, hourlyRate: number, multiplier = 1.25) {
  return round2(hours * hourlyRate * multiplier);
}

// Convert monthly salary to hourly rate via daysPerMonth and hoursPerDay input
export function deriveHourlyRate(monthlyBasic: number, daysPerMonth = 26, hoursPerDay = 8) {
  return round2(monthlyBasic / daysPerMonth / hoursPerDay);
}

// Holiday pays (without explicit overtime hours handling)
export type HolidayInput = {
  regular: { unworkedDays?: number; workedDays?: number; restWorkedDays?: number };
  special: { unworkedDays?: number; workedDays?: number; restWorkedDays?: number };
};

export type HolidayPays = {
  regular: { unworked: number; worked: number; restWorked: number; total: number };
  special: { unworked: number; worked: number; restWorked: number; total: number };
  total: number;
};

// Holiday pay (incremental extras added to base pay for the period):
// Regular holiday: if worked, add +100% of daily wage per day (1 extra day). If unworked, add 0 here.
// Special non-working: if worked, add +30% of daily wage per day. If unworked, add 0 here.
export function computeHolidayPays(dailyWage: number, input: HolidayInput): HolidayPays {
  const rUn = Math.max(0, Number(input.regular.unworkedDays || 0));
  const rWk = Math.max(0, Number(input.regular.workedDays || 0));
  const rRw = Math.max(0, Number(input.regular.restWorkedDays || 0));

  const sUn = Math.max(0, Number(input.special.unworkedDays || 0));
  const sWk = Math.max(0, Number(input.special.workedDays || 0));
  const sRw = Math.max(0, Number(input.special.restWorkedDays || 0));

  // Incremental only: unworked contributes 0; worked/restWorked add +1.0× daily per day
  const reg = {
    unworked: 0,
    worked: round2(dailyWage * 1.0 * rWk),
    restWorked: round2(dailyWage * 1.0 * rRw),
    total: 0,
  };
  reg.total = round2(reg.unworked + reg.worked + reg.restWorked);

  // Special non-working incremental: worked/restWorked add +0.3× daily per day
  const spec = {
    unworked: 0,
    worked: round2(dailyWage * 0.3 * sWk),
    restWorked: round2(dailyWage * 0.3 * sRw),
    total: 0,
  };
  spec.total = round2(spec.unworked + spec.worked + spec.restWorked);

  const total = round2(reg.total + spec.total);
  return { regular: reg, special: spec, total };
}

// Loan amortization (fixed payment)
export type AmortizationRow = { period: number; payment: number; interest: number; principal: number; balance: number };

export function computeAmortization(amount: number, annualRatePct: number, months: number) {
  const r = (annualRatePct / 100) / 12; // monthly rate
  const n = months;
  const P = amount;
  const payment = r === 0 ? P / n : P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let balance = P;
  const rows: AmortizationRow[] = [];
  for (let i = 1; i <= n; i++) {
    const interest = balance * r;
    const principal = payment - interest;
    balance = balance - principal;
    rows.push({ period: i, payment: round2(payment), interest: round2(interest), principal: round2(principal), balance: round2(Math.max(balance, 0)) });
  }
  return { payment: round2(payment), schedule: rows };
}

// Reverse Calculator: Binary Search to find Gross Monthly from Target Net
// TargetNet is the desired "Take Home" for the specified frequency.
export function computeGrossFromNet(
  targetNet: number,
  frequency: 'monthly' | 'semi-monthly' = 'monthly'
) {
  // Bounds
  let min = targetNet; // Gross can't be less than net
  let max = targetNet * 2.5; // Heuristic upper bound

  // Refine max if needed (if deductions are huge, gross might be > 2.5x)
  // But for typical PH salaries, 2.5x is plenty safe.

  let iterations = 0;
  const maxIterations = 50; // Safety break
  let calculatedGross = 0;
  let bestResult = {
    gross: 0,
    net: 0,
    contributions: 0,
    tax: 0,
    diff: Infinity
  };

  while (iterations < maxIterations) {
    const mid = (min + max) / 2;
    calculatedGross = mid;

    // Simulate forward calculation
    const contr = computeContributions(calculatedGross);
    const totalContribs = contr.totals.employee;

    // Adjust for frequency
    let basePeriod = calculatedGross;
    let contribPeriod = totalContribs;

    if (frequency === 'semi-monthly') {
      basePeriod = calculatedGross / 2;
      contribPeriod = totalContribs / 2;
    }

    const taxable = Math.max(0, basePeriod - contribPeriod);
    const tax = computeWithholdingTax(taxable, frequency);
    const net = basePeriod - contribPeriod - tax;

    // Check difference
    const diff = net - targetNet;

    // Store if this is our closest match so far
    if (Math.abs(diff) < Math.abs(bestResult.diff)) {
      bestResult = {
        gross: calculatedGross,
        net: net,
        contributions: totalContribs, // always monthly total
        tax: tax, // tax per period
        diff: diff
      };
    }

    // Binary search logic
    if (Math.abs(diff) < 1) {
      break; // Within 1 peso is good enough
    }

    if (diff < 0) {
      // Net is too low -> Need higher Gross
      min = mid;
    } else {
      // Net is too high -> Need lower Gross
      max = mid;
    }

    iterations++;
  }

  return {
    monthlyBasic: round2(bestResult.gross),
    netPay: round2(bestResult.net),
    totalContributions: round2(bestResult.contributions),
    taxPerPeriod: round2(bestResult.tax),
    iterations
  };
}

// 13th Month Pay: Pro-rated (Sum of actual basic pay / 12)
export function compute13thMonthProRated(monthlyBasicHistory: number[]) {
  // Ensure we only sum up to 12 months, usually Jan-Dec
  const totalEarned = monthlyBasicHistory.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const thirteenthMonth = totalEarned / 12;
  return round2(thirteenthMonth);
}

// MP2 Calculator
// Mode: 'annual' (Payout yearly) vs 'compounded' (Maturity after 5 years)
export function computeMP2(monthlyContribution: number, ratePct: number, years = 5) {
  const annualRate = ratePct / 100;
  // MP2 dividends are based on Average Monthly Balance (AMB).
  // But for a fixed monthly contribution, the logic simplifies:
  // Year 1 Dividend = (Monthly * 12) * Rate / 2 (approx, or average balance approach)
  // Actually, standard MP2 formula for Year 1 (regular savings) is effectively:
  // Dividend = TotalContributions * Rate * (Factor depending on month)
  // Simplest correct approximation for full year contribution:
  // Average Balance = (Month1 + Month2... + Month12) / 12
  // For Month 1 deposit, it earns 12 months? No, dividends are usually declared annually.

  // Let's use the Effective Average Method:
  // Month 1 contribution is invested for 12 months.
  // Month 12 contribution is invested for 1 month.
  // Average Duration = 6.5 months. 
  // Dividend = (Monthly * 12) * Rate * (6.5/12)? 
  //
  // A more standard simplified projection used by Pag-IBIG marketing:
  // Dividend = (Accumulated Saving) * Rate.
  // But for the *current* year's fresh contributions, it's roughly half the rate effectively.

  // Let's iterate month by month for accuracy.

  let balance = 0;
  const rows: { year: number; contribution: number; dividend: number; total: number }[] = [];
  let totalContrib = 0;
  let totalDividend = 0;

  for (let y = 1; y <= years; y++) {
    // For each year, we add 12 contributions
    // And compute dividend at end of year

    // Previous balance earns full year interest
    const dividendFromPrev = balance * annualRate;

    // New contributions for this year:
    // Month 1: earns 12/12 rate? Pag-IBIG is pro-rated.
    // Let's assume uniform distribution: Average balance of new money is TotalNew/2.
    // So DividendNew = (Monthly * 12) * Rate / 2?
    // Pag-IBIG officially says: Dividend = AMB * Rate.
    // If you start Jan: AMB for new money is roughly Total/2.

    const yearlyContribution = monthlyContribution * 12;
    const dividendFromNew = (yearlyContribution / 2) * annualRate;
    // ^ Approximation: (BalanceStart + BalanceEnd)/2 * Rate

    const yearDividend = dividendFromPrev + dividendFromNew;

    // Update totals
    totalContrib += yearlyContribution;
    totalDividend += yearDividend;

    // Annual Payout Mode: Dividend is paid out, not added to balance.
    // Compounded Mode: Dividend is added to balance.

    // Note: We always add yearlyContribution to balance.
    balance += yearlyContribution;

    rows.push({
      year: y,
      contribution: round2(totalContrib),
      dividend: round2(yearDividend),
      total: round2(balance + (rows.length > 0 && rows[rows.length - 1].total ? 0 : 0)) // Placeholder
    });
  }

  // Re-calculate rows properly based on mode in the Component, or split logic here.
  // Actually, let's just return the "Compound" path as default base, 
  // and for "Annual", the balance resets or doesn't grow by dividend.

  return {
    rows // This needs to be handled carefully in UI
  };
}

// Improved MP2 Logic handling both modes
export type MP2Row = { year: number; cumulativeContrib: number; annualDividend: number; totalAccumulated: number };

export function calculateMP2(monthlyContribution: number, ratePct: number, mode: 'compounded' | 'annual', rollover: boolean = false): MP2Row[] {
  const rate = ratePct / 100;
  let currentBalance = 0;
  let cumulativeContrib = 0;
  const rows: MP2Row[] = [];
  const years = rollover ? 10 : 5;

  for (let y = 1; y <= years; y++) {
    const yearContrib = monthlyContribution * 12;
    cumulativeContrib += yearContrib;

    // Dividend for the "New Money" this year
    // Using the 0.5 factor approximation for regular monthly deposits (AMB of new money is half)
    const dividendNew = yearContrib * rate * 0.5;

    // Dividend for "Old Money" (Balance from previous year)
    // In Year 1, currentBalance is 0.
    const dividendOld = currentBalance * rate;

    const totalDividend = dividendNew + dividendOld;

    // Update Balance
    currentBalance += yearContrib; // Add principal

    if (mode === 'compounded') {
      currentBalance += totalDividend; // Re-invest dividend
    } else {
      // Annual payout: Dividend is NOT added to balance
      // Balance only grows by principal
    }

    rows.push({
      year: y,
      cumulativeContrib: round2(cumulativeContrib),
      annualDividend: round2(totalDividend),
      totalAccumulated: round2(currentBalance)
    });
  }

  return rows;
}

// SSS maternity benefit (RA 11210): ADSC = sum of the six highest MSCs / 180, paid for the
// number of leave days. Only the regular SS portion of each MSC counts, i.e. at most 20,000,
// so the six-MSC total is at most 120,000 (maximum 70,000 for 105 days).
export function computeMaternityBenefit(totalSixMsc: number, leaveDays: number) {
  const m = PH_RULES.maternity;
  const maxTotal = m.mscCap * m.mscCount;
  const entered = isPositive(totalSixMsc) ? totalSixMsc : 0;
  const countedTotal = Math.min(entered, maxTotal);
  const adsc = countedTotal / m.divisorDays;
  return {
    countedTotal: round2(countedTotal),
    maxTotal,
    capped: entered > maxTotal,
    adsc: round2(adsc),
    benefit: round2(adsc * Math.max(0, leaveDays)),
  };
}

// SSS Salary Loan: one- or two-month loan based on the average regular SS MSC, rounded up
// to the next MSC step. Service fee is deducted at release along with the first month's
// interest (an estimate of SSS's pro-rated interest); repaid over 24 months, diminishing.
export function computeSssSalaryLoan(
  averageMsc: number,
  months: 1 | 2,
  annualRatePct: number = PH_RULES.sssLoans.salaryLoan.annualRate
) {
  const rules = PH_RULES.sssLoans.salaryLoan;
  const avg = isPositive(averageMsc) ? Math.min(averageMsc, rules.regularMscCap) : 0;
  const msc = Math.ceil(avg / rules.mscStep) * rules.mscStep;
  const loanableAmount = Math.min(msc, rules.regularMscCap) * months;
  const serviceFee = loanableAmount * rules.serviceFeeRate;
  const advanceInterest = loanableAmount * (annualRatePct / 100 / 12);
  const monthlyAmortization = loanableAmount > 0
    ? computeAmortization(loanableAmount, annualRatePct, rules.termMonths).payment
    : 0;
  return {
    loanableAmount: round2(loanableAmount),
    serviceFee: round2(serviceFee),
    advanceInterest: round2(advanceInterest),
    netProceeds: round2(loanableAmount - serviceFee - advanceInterest),
    monthlyAmortization,
    termMonths: rules.termMonths,
    moratoriumMonths: 0,
    annualRatePct,
  };
}

// SSS Emergency Loan: a share (50% or 100%) of the average regular SS MSC, rounded up to the
// nearest 1,000. No service fee, a 6-month payment moratorium, then 24 monthly payments at 7%.
// ASSUMPTION: interest keeps accruing during the moratorium and is added to the balance before
// amortizing; the circulars reviewed do not state how it is treated.
export function computeSssEmergencyLoan(averageMsc: number, share: 0.5 | 1) {
  const rules = PH_RULES.sssLoans.emergencyLoan;
  const avg = isPositive(averageMsc) ? Math.min(averageMsc, rules.regularMscCap) : 0;
  const loanableAmount = Math.min(Math.ceil((avg * share) / rules.roundUpTo) * rules.roundUpTo, rules.regularMscCap);
  const r = rules.annualRate / 100 / 12;
  const balanceAfterMoratorium = loanableAmount * Math.pow(1 + r, rules.moratoriumMonths);
  const monthlyAmortization = loanableAmount > 0
    ? computeAmortization(balanceAfterMoratorium, rules.annualRate, rules.termMonths).payment
    : 0;
  return {
    loanableAmount: round2(loanableAmount),
    serviceFee: 0,
    advanceInterest: 0,
    netProceeds: round2(loanableAmount),
    interestDuringMoratorium: round2(balanceAfterMoratorium - loanableAmount),
    monthlyAmortization,
    termMonths: rules.termMonths,
    moratoriumMonths: rules.moratoriumMonths,
    annualRatePct: rules.annualRate,
  };
}
