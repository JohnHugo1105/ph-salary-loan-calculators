// Single source of truth for Philippine government rates used by the calculators.
// Every block records where the figures come from so they can be re-verified when a new
// circular is released. Guides and calculators should read from here instead of hardcoding.

export const PH_RULES_LAST_REVIEWED = '2026-10-29';

export type TaxBracket = { over: number; base: number; rate: number };

export const PH_RULES = {
  // SSS contribution schedule under RA 11199 — final 15% step, effective January 2025.
  sss: {
    effective: '2025-01',
    source: 'https://www.sss.gov.ph/pay-contribution',
    totalRate: 0.15,
    employeeRate: 0.05,
    employerRate: 0.10,
    mscMin: 5_000,
    mscMax: 35_000,
    mscStep: 500,
    // MSC up to this amount is the regular SS program; the excess goes to MPF/WISP.
    regularMscMax: 20_000,
    // Employees' Compensation (employer-only): 10 below ₱15,000 MSC, otherwise 30.
    ecMscThreshold: 15_000,
    ecLow: 10,
    ecHigh: 30,
  },

  // PhilHealth Universal Health Care premium, shared 50/50 by employer and employee.
  philhealth: {
    effective: '2024-01',
    source: 'https://www.philhealth.gov.ph/uhc/',
    rate: 0.05,
    floor: 10_000,
    ceiling: 100_000,
  },

  // Pag-IBIG (HDMF) Circular No. 460: maximum monthly fund salary raised to ₱10,000.
  pagibig: {
    effective: '2024-02',
    source: 'https://naro.law.upd.edu.ph/issuances/3217',
    maxFundSalary: 10_000,
    employeeRate: 0.02,
    employeeRateLow: 0.01,
    lowSalaryThreshold: 1_500,
    employerRate: 0.02,
  },

  // BIR withholding tax on compensation, RR 11-2018 Annex E (rates effective 2023 onwards).
  // A bracket applies when taxable income is at or above `over`.
  withholdingTax: {
    effective: '2023-01',
    source: 'https://bir-cdn.bir.gov.ph/local/pdf/Annex%20E%20RR%2011-2018.pdf',
    monthly: [
      { over: 666_667, base: 183_541.67, rate: 0.35 },
      { over: 166_667, base: 33_541.67, rate: 0.30 },
      { over: 66_667, base: 8_541.67, rate: 0.25 },
      { over: 33_333, base: 1_875, rate: 0.20 },
      { over: 20_833, base: 0, rate: 0.15 },
      { over: 0, base: 0, rate: 0 },
    ] as TaxBracket[],
    semiMonthly: [
      { over: 333_333, base: 91_770.83, rate: 0.35 },
      { over: 83_333, base: 16_770.83, rate: 0.30 },
      { over: 33_333, base: 4_270.83, rate: 0.25 },
      { over: 16_667, base: 937.5, rate: 0.20 },
      { over: 10_417, base: 0, rate: 0.15 },
      { over: 0, base: 0, rate: 0 },
    ] as TaxBracket[],
  },

  // 13th month pay and other benefits exempt from income tax (TRAIN law).
  thirteenthMonthExemption: 90_000,

  // De minimis benefit ceilings under BIR RR 29-2025.
  deMinimis: {
    source: 'https://www.bir.gov.ph/2025-Revenue-Regulations',
    riceSubsidyMonthly: 2_500,
    clothingAllowanceAnnual: 8_000,
    medicalCashDependentsPerSemester: 2_000,
    laundryAllowanceMonthly: 400,
    monetizedVacationLeaveDays: 12,
  },

  // Pag-IBIG housing loan: interest rate by repricing period (years fixed). These are the rates the
  // calculator uses; Pag-IBIG revises them, so confirm the current schedule before applying.
  housingLoan: {
    source: 'https://www.pagibigfund.gov.ph/',
    maxLoan: 10_000_000,
    maxIncomeShare: 0.35,
    ratesByRepricingYears: { 1: 5.75, 3: 6.25, 5: 6.5, 10: 7.125, 15: 7.75, 20: 8.5, 25: 9.125, 30: 9.75 } as Record<number, number>,
  },

  // Pag-IBIG MP2 savings: latest declared annual dividend. Future rates are not guaranteed.
  mp2: {
    source: 'https://www.pagibigfund.gov.ph/',
    latestDeclared: { year: 2025, ratePct: 7.12 },
  },

  // SSS maternity benefit (RA 11210). Only the regular SS portion of the MSC counts.
  maternity: {
    source: 'https://www.sss.gov.ph/maternity-benefit/',
    mscCap: 20_000,
    mscCount: 6,
    divisorDays: 180,
    days: { live: 105, soloParent: 120, miscarriage: 60 },
  },

  // SSS short-term member loans. Peso limits and the emergency-loan terms were taken from
  // secondary sources and should be checked against the SSS circulars before relying on them.
  sssLoans: {
    source: 'https://www.sss.gov.ph/salary-loan/',
    salaryLoan: {
      annualRate: 8,
      // 10% applies to renewals within five years of a penalty condonation (Circular 2025-004).
      annualRateAfterCondonation: 10,
      serviceFeeRate: 0.01,
      termMonths: 24,
      regularMscCap: 20_000,
      mscStep: 500,
    },
    emergencyLoan: {
      annualRate: 7,
      serviceFeeRate: 0,
      moratoriumMonths: 6,
      termMonths: 24,
      regularMscCap: 20_000,
      roundUpTo: 1_000,
    },
  },
};
