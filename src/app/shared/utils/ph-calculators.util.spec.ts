import {
  computeAmortization,
  computeContributions,
  computeGrossFromNet,
  computeMaternityBenefit,
  computeMPF,
  computePagIbig,
  computePhilHealth,
  computeSSS,
  computeSssEmergencyLoan,
  computeSssMsc,
  computeSssSalaryLoan,
  computeWithholdingTax,
  round2,
  split13thMonthTaxability,
} from './ph-calculators.util';
import { PH_RULES } from './ph-rules';

describe('ph-calculators.util', () => {
  describe('SSS monthly salary credit', () => {
    it('clamps to the 5,000 - 35,000 schedule', () => {
      expect(computeSssMsc(1_000)).toBe(5_000);
      expect(computeSssMsc(5_249.99)).toBe(5_000);
      expect(computeSssMsc(100_000)).toBe(35_000);
    });

    it('rounds to the nearest 500 with the bracket starting 250 below the MSC', () => {
      expect(computeSssMsc(5_250)).toBe(5_500);
      expect(computeSssMsc(24_749.99)).toBe(24_500);
      expect(computeSssMsc(24_750)).toBe(25_000);
      expect(computeSssMsc(25_249.99)).toBe(25_000);
      expect(computeSssMsc(34_749.99)).toBe(34_500);
      expect(computeSssMsc(34_750)).toBe(35_000);
    });
  });

  describe('SSS and MPF/WISP (15% schedule)', () => {
    it('charges 5% employee and 10% employer on the regular MSC up to 20,000', () => {
      const sss = computeSSS(20_000, false);
      expect(sss.employee).toBe(1_000);
      expect(sss.employer).toBe(2_000);
      expect(sss.total).toBe(3_000);
      expect(computeMPF(20_000).total).toBe(0);
    });

    it('puts only the MSC above 20,000 in MPF/WISP', () => {
      const sss = computeSSS(30_000, false);
      const mpf = computeMPF(30_000);
      expect(sss.employee).toBe(1_000);
      expect(sss.employer).toBe(2_000);
      expect(mpf.employee).toBe(500);
      expect(mpf.employer).toBe(1_000);
      expect(mpf.total).toBe(1_500);
    });

    it('reaches 1,750 employee / 3,500 employer at the 35,000 MSC ceiling', () => {
      const c = computeContributions(80_000, { includeSSSEC: false });
      expect(round2(c.sss.employee + c.mpf.employee)).toBe(1_750);
      expect(round2(c.sss.employer + c.mpf.employer)).toBe(3_500);
    });

    it('never counts the same MSC twice: SSS + MPF always equals 5% / 10% of the MSC', () => {
      for (let salary = 1_000; salary <= 60_000; salary += 250) {
        const msc = computeSssMsc(salary);
        const sss = computeSSS(salary, false);
        const mpf = computeMPF(salary);
        expect(round2(sss.employee + mpf.employee)).toBeCloseTo(msc * 0.05, 2);
        expect(round2(sss.employer + mpf.employer)).toBeCloseTo(msc * 0.10, 2);
      }
    });

    it('adds the employer-only EC of 10 below a 15,000 MSC and 30 from 15,000', () => {
      expect(computeSSS(14_000, true).employer - computeSSS(14_000, false).employer).toBe(10);
      expect(computeSSS(15_000, true).employer - computeSSS(15_000, false).employer).toBe(30);
      expect(computeSSS(14_800, true).employer - computeSSS(14_800, false).employer).toBe(30); // MSC 15,000
      expect(computeSSS(30_000, true).employee).toBe(computeSSS(30_000, false).employee);
    });
  });

  describe('PhilHealth', () => {
    it('applies the 5% rate split 50/50', () => {
      const p = computePhilHealth(30_000);
      expect(p.total).toBe(1_500);
      expect(p.employee).toBe(750);
      expect(p.employer).toBe(750);
    });

    it('applies the 10,000 floor and the 100,000 ceiling', () => {
      expect(computePhilHealth(5_000).total).toBe(500);
      expect(computePhilHealth(10_000).total).toBe(500);
      expect(computePhilHealth(100_000).total).toBe(5_000);
      expect(computePhilHealth(150_000).total).toBe(5_000);
      expect(computePhilHealth(95_000).total).toBe(4_750);
    });
  });

  describe('Pag-IBIG', () => {
    it('uses 1% employee up to 1,500 and 2% above, with 2% employer', () => {
      expect(computePagIbig(1_000)).toEqual({ employee: 10, employer: 20, total: 30 });
      expect(computePagIbig(1_500).employee).toBe(15);
      expect(computePagIbig(1_501).employee).toBe(30.02);
    });

    it('caps the fund salary at 10,000 so the maximum is 200 each', () => {
      expect(computePagIbig(5_000).employee).toBe(100);
      expect(computePagIbig(10_000)).toEqual({ employee: 200, employer: 200, total: 400 });
      expect(computePagIbig(80_000)).toEqual({ employee: 200, employer: 200, total: 400 });
    });
  });

  describe('BIR withholding tax (2023 onwards)', () => {
    it('monthly: exempt up to 20,833', () => {
      expect(computeWithholdingTax(0)).toBe(0);
      expect(computeWithholdingTax(20_833)).toBe(0);
      expect(computeWithholdingTax(20_834)).toBe(0.15);
    });

    it('monthly: matches the official bracket base amounts', () => {
      expect(computeWithholdingTax(27_550)).toBe(1_007.55);
      expect(computeWithholdingTax(33_333)).toBe(1_875);
      expect(computeWithholdingTax(50_000)).toBe(5_208.4);
      expect(computeWithholdingTax(66_667)).toBe(8_541.67);
      expect(computeWithholdingTax(100_000)).toBe(16_874.92);
      expect(computeWithholdingTax(166_667)).toBe(33_541.67);
      expect(computeWithholdingTax(300_000)).toBe(73_541.57);
      expect(computeWithholdingTax(666_667)).toBe(183_541.67);
      expect(computeWithholdingTax(700_000)).toBe(195_208.22);
    });

    it('semi-monthly: matches the official bracket base amounts', () => {
      expect(computeWithholdingTax(10_417, 'semi-monthly')).toBe(0);
      expect(computeWithholdingTax(15_000, 'semi-monthly')).toBe(687.45);
      expect(computeWithholdingTax(16_667, 'semi-monthly')).toBe(937.5);
      expect(computeWithholdingTax(33_333, 'semi-monthly')).toBe(4_270.83);
      expect(computeWithholdingTax(83_333, 'semi-monthly')).toBe(16_770.83);
      expect(computeWithholdingTax(333_333, 'semi-monthly')).toBe(91_770.83);
    });

    it('brackets are continuous: each base equals the tax accumulated by the bracket below', () => {
      for (const table of [PH_RULES.withholdingTax.monthly, PH_RULES.withholdingTax.semiMonthly]) {
        const ascending = [...table].reverse();
        for (let i = 1; i < ascending.length; i++) {
          const lower = ascending[i - 1];
          const upper = ascending[i];
          const accumulated = lower.base + (upper.over - lower.over) * lower.rate;
          // The published tables carry a few centavos of rounding.
          expect(Math.abs(accumulated - upper.base)).toBeLessThan(0.25);
        }
      }
    });

    it('semi-monthly tax is about half the monthly tax on the same income', () => {
      for (const monthly of [25_000, 27_550, 45_000, 80_000, 150_000, 400_000]) {
        const semi = computeWithholdingTax(monthly / 2, 'semi-monthly') * 2;
        expect(Math.abs(semi - computeWithholdingTax(monthly))).toBeLessThan(1);
      }
    });
  });

  describe('net pay worked example (P30,000 monthly salary)', () => {
    it('gives 26,542.45, not the 26,329.95 produced by double-counted MPF and old rates', () => {
      const c = computeContributions(30_000);
      expect(c.totals.employee).toBe(2_450); // 1,000 SSS + 500 MPF/WISP + 750 PhilHealth + 200 Pag-IBIG
      const taxable = 30_000 - c.totals.employee;
      const tax = computeWithholdingTax(taxable);
      expect(tax).toBe(1_007.55);
      expect(round2(30_000 - c.totals.employee - tax)).toBe(26_542.45);
    });
  });

  describe('invalid salaries', () => {
    it('return zero contributions and tax instead of charging the minimums', () => {
      for (const bad of [0, -100, NaN]) {
        expect(computeContributions(bad).totals.total).toBe(0);
        expect(computeWithholdingTax(bad)).toBe(0);
      }
    });
  });

  describe('reverse salary (net to gross)', () => {
    it('finds a gross whose forward net pay matches the target', () => {
      const r = computeGrossFromNet(26_542.45);
      expect(Math.abs(r.monthlyBasic - 30_000)).toBeLessThan(150);
      expect(Math.abs(r.netPay - 26_542.45)).toBeLessThan(1);
    });
  });

  describe('SSS maternity benefit', () => {
    it('caps each MSC at 20,000, so the maximum is 70,000 for 105 days', () => {
      const r = computeMaternityBenefit(120_000, 105);
      expect(r.adsc).toBe(666.67);
      expect(r.benefit).toBe(70_000);
      expect(r.capped).toBeFalse();
    });

    it('does not pay on a total above 6 x 20,000 (the old 180,000 default gave 105,000)', () => {
      const r = computeMaternityBenefit(180_000, 105);
      expect(r.capped).toBeTrue();
      expect(r.countedTotal).toBe(120_000);
      expect(r.benefit).toBe(70_000);
    });

    it('scales with the leave days', () => {
      expect(computeMaternityBenefit(120_000, 120).benefit).toBe(80_000);
      expect(computeMaternityBenefit(120_000, 60).benefit).toBe(40_000);
      expect(computeMaternityBenefit(60_000, 105).benefit).toBe(35_000);
    });

    it('returns zero for missing input', () => {
      expect(computeMaternityBenefit(NaN, 105).benefit).toBe(0);
      expect(computeMaternityBenefit(-5, 105).benefit).toBe(0);
    });
  });

  describe('SSS salary loan', () => {
    it('defaults to 8% and deducts the 1% service fee and one month of interest', () => {
      const r = computeSssSalaryLoan(20_000, 1);
      expect(r.annualRatePct).toBe(8);
      expect(r.loanableAmount).toBe(20_000);
      expect(r.serviceFee).toBe(200);
      expect(r.advanceInterest).toBe(133.33);
      expect(r.netProceeds).toBe(19_666.67);
      expect(r.monthlyAmortization).toBe(computeAmortization(20_000, 8, 24).payment);
    });

    it('doubles the loan for the 2-month type and charges more at the 10% rate', () => {
      const eight = computeSssSalaryLoan(20_000, 2, 8);
      const ten = computeSssSalaryLoan(20_000, 2, 10);
      expect(eight.loanableAmount).toBe(40_000);
      expect(ten.monthlyAmortization).toBeGreaterThan(eight.monthlyAmortization);
    });

    it('rounds the average MSC up to the next MSC and never exceeds the 20,000 regular MSC', () => {
      expect(computeSssSalaryLoan(12_300, 1).loanableAmount).toBe(12_500);
      expect(computeSssSalaryLoan(30_000, 1).loanableAmount).toBe(20_000);
      expect(computeSssSalaryLoan(30_000, 2).loanableAmount).toBe(40_000);
    });

    it('returns zeros for missing input', () => {
      const r = computeSssSalaryLoan(0, 1);
      expect(r.loanableAmount).toBe(0);
      expect(r.monthlyAmortization).toBe(0);
    });
  });

  describe('SSS emergency loan', () => {
    it('has no service fee or advance interest and a 6-month moratorium at 7%', () => {
      const r = computeSssEmergencyLoan(20_000, 1);
      expect(r.loanableAmount).toBe(20_000);
      expect(r.serviceFee).toBe(0);
      expect(r.advanceInterest).toBe(0);
      expect(r.netProceeds).toBe(20_000);
      expect(r.moratoriumMonths).toBe(6);
      expect(r.termMonths).toBe(24);
      expect(r.annualRatePct).toBe(7);
    });

    it('accrues interest during the moratorium before amortizing (documented assumption)', () => {
      const r = computeSssEmergencyLoan(20_000, 1);
      const accrued = 20_000 * (Math.pow(1 + 0.07 / 12, 6) - 1);
      expect(r.interestDuringMoratorium).toBeCloseTo(accrued, 2);
      expect(r.monthlyAmortization).toBeGreaterThan(computeAmortization(20_000, 7, 24).payment);
    });

    it('supports a 50% share, rounded up to the nearest 1,000, capped at 20,000', () => {
      expect(computeSssEmergencyLoan(15_300, 0.5).loanableAmount).toBe(8_000);
      expect(computeSssEmergencyLoan(40_000, 1).loanableAmount).toBe(20_000);
    });
  });

  describe('13th month tax-exempt limit', () => {
    it('exempts the first 90,000 of 13th month pay and other benefits', () => {
      expect(split13thMonthTaxability(100_000)).toEqual({ nonTaxable: 90_000, taxable: 10_000 });
      expect(split13thMonthTaxability(50_000)).toEqual({ nonTaxable: 50_000, taxable: 0 });
    });

    it('uses a smaller cap when other benefits already used part of the limit', () => {
      expect(split13thMonthTaxability(100_000, 30_000)).toEqual({ nonTaxable: 30_000, taxable: 70_000 });
      expect(split13thMonthTaxability(40_000, 0)).toEqual({ nonTaxable: 0, taxable: 40_000 });
      expect(split13thMonthTaxability(40_000, -5_000)).toEqual({ nonTaxable: 0, taxable: 40_000 });
    });
  });
});
