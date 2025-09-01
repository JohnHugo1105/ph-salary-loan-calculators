// Utility functions for PH-specific calculators (approximate, common defaults)

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

// PhilHealth: default 2024 rate 5%, shared 50/50; floor 10,000, ceiling 90,000
export function computePhilHealth(
  monthlySalary: number,
  rate = 0.05,
  floor = 10_000,
  ceiling = 90_000
) {
  const base = Math.min(Math.max(monthlySalary, floor), ceiling);
  const total = base * rate;
  const employee = total / 2;
  const employer = total / 2;
  return { employee: round2(employee), employer: round2(employer), total: round2(total) };
}

// Pag-IBIG (HDMF): employee 1% if <= 1,500; else 2%. Employer 2%.
// Compensation base is capped at 5,000.
export function computePagIbig(monthlySalary: number) {
  const base = Math.min(monthlySalary, 5_000);
  const employeeRate = monthlySalary <= 1_500 ? 0.01 : 0.02;
  const employerRate = 0.02;
  const employee = base * employeeRate;
  const employer = base * employerRate;
  const total = employee + employer;
  return { employee: round2(employee), employer: round2(employer), total: round2(total) };
}

// Mandatory Provident Fund (MPF):
// Employee = (min(MSC, 35,000) - 20,000) * 15% * 1/3
// Employer = (min(MSC, 35,000) - 20,000) * 15% * 2/3
// Total = Employee + Employer
// If MSC <= 20,000 then all MPF values are 0. MSC here is the actual monthly salary capped at 35,000.
export function computeMPF(monthlySalary: number) {
  const msc = Math.min(monthlySalary, 35_000);
  const excess = Math.max(0, msc - 20_000);
  const total = excess * 0.15;
  const employee = total / 3; // one-third
  const employer = (total * 2) / 3; // two-thirds
  return { employee: round2(employee), employer: round2(employer), total: round2(total) };
}

// SSS: Simplified approximation using 14% of salary up to 30,000 MSC cap (2023+),
// split 4.5% employee, 9.5% employer. Optional EC (employer) 10 or 30.
export function computeSSS(
  monthlySalary: number,
  includeEC = true
) {
  // Use MSC (Monthly Salary Credit) rounding to nearest 500 within 4,000–30,000
  const mscMin = 4_000;
  const mscMax = 30_000;
  // Round to nearest 500 by dividing by 500, rounding, then * 500
  let msc = Math.round(Math.min(Math.max(monthlySalary, mscMin), mscMax) / 500) * 500;
  // Clamp again in case rounding stepped over bounds
  msc = Math.min(Math.max(msc, mscMin), mscMax);

  const total = msc * 0.14; // total contribution rate 14%
  const employee = msc * 0.045; // 4.5%
  const employer = msc * 0.095; // 9.5%
  let employerWithEC = employer;
  if (includeEC) {
    // Common EC premium levels based on risk class proxy: salary>=15k often 30, else 10
    const ec = monthlySalary >= 15_000 ? 30 : 10;
    employerWithEC += ec;
  }
  return {
    employee: round2(employee),
    employer: round2(employerWithEC),
    total: round2(employee + employerWithEC)
  };
}

export function computeContributions(monthlySalary: number, options?: { includeSSSEC?: boolean }) : Contributions {
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

// TRAIN/CREATE simplified withholding monthly table (commonly used guide)
// Brackets for MONTHLY taxable income
// 0 - 20,833: 0
// >20,833 - 33,333: 15% of excess over 20,833
// >33,333 - 66,666: 2,500 + 20% of excess over 33,333
// >66,666 - 166,666: 8,500 + 25% of excess over 66,666
// >166,666 - 666,666: 33,000 + 30% of excess over 166,666
// >666,666: 183,333.33 + 35% of excess over 666,666
export function computeWithholdingTax(
  taxable: number,
  period: 'monthly' | 'semi-monthly' = 'monthly'
): number {
  const t = taxable;
  type Bracket = { over: number; base: number; rate: number };
  let brackets: Bracket[];
  if (period === 'semi-monthly') {
    // Semi-monthly brackets derived from monthly TRAIN schedule
    brackets = [
      { over: 333_333, base: 91_666.67, rate: 0.35 },
      { over: 83_333, base: 16_500, rate: 0.30 },
      { over: 33_333, base: 4_250, rate: 0.25 },
      { over: 16_667, base: 1_250, rate: 0.20 },
      { over: 10_417, base: 0, rate: 0.15 },
      { over: 0, base: 0, rate: 0 }
    ];
  } else {
    // Monthly brackets
    brackets = [
      { over: 666_666, base: 183_333.33, rate: 0.35 },
      { over: 166_666, base: 33_000, rate: 0.30 },
      { over: 66_666, base: 8_500, rate: 0.25 },
      { over: 33_333, base: 2_500, rate: 0.20 },
      { over: 20_833, base: 0, rate: 0.15 },
      { over: 0, base: 0, rate: 0 }
    ];
  }

  // Find applicable bracket (largest 'over' less than t)
  const b = brackets.find(br => t > br.over) || brackets[brackets.length - 1];
  let tax = 0;
  if (b.rate === 0) tax = 0;
  else tax = b.base + (t - b.over) * b.rate;
  return round2(Math.max(tax, 0));
}

export function monthlyToSemiMonthly(v: number): number { return v / 2; }

// 13th month pay estimate: base monthly * monthsWorked / 12
// Note: Non-taxable portion applies up to a threshold (commonly 90,000) for total 13th + benefits.
export function estimate13thMonthPay(monthlyBasic: number, monthsWorked: number) {
  return round2((monthlyBasic * monthsWorked) / 12);
}

export function split13thMonthTaxability(totalBenefits: number, nonTaxableCap = 90_000) {
  const nonTaxable = Math.min(totalBenefits, nonTaxableCap);
  const taxable = Math.max(0, totalBenefits - nonTaxable);
  return { nonTaxable: round2(nonTaxable), taxable: round2(taxable) };
}

// Estimate net 13th month pay given a withholding rate applied to the taxable portion over the cap
// Net = Gross - (max(0, Gross - cap) * rate)
export function estimateNet13thMonthPay(gross: number, ratePct = 20, cap = 90_000) {
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
