import { explainContributions, explainWithholding } from './explain';

describe('explain', () => {
  it('describes each contribution with the numbers it used', () => {
    const e = explainContributions(30_000);
    expect(e.msc).toBe(30_000);
    expect(e.sss).toBe('5% × ₱20,000 (regular SS credit; your MSC is ₱30,000)');
    expect(e.mpf).toBe('5% × (₱30,000 − ₱20,000) = 5% × ₱10,000');
    expect(e.philhealth).toContain('5% × ₱30,000 ÷ 2');
    expect(e.pagibig).toBe('2% × ₱10,000 (fund salary is capped at ₱10,000)');
  });

  it('says so when there is no MPF/WISP', () => {
    expect(explainContributions(15_000).mpf).toContain('nothing goes to MPF/WISP');
  });

  it('uses the lower rate and base for very low salaries', () => {
    expect(explainContributions(1_200).pagibig).toContain('1% × ₱1,200');
  });

  it('shows the bracket formula for withholding tax', () => {
    expect(explainWithholding(27_550)).toBe('₱0.00 + 15% × (₱27,550.00 − ₱20,833)');
    expect(explainWithholding(50_000)).toBe('₱1,875.00 + 20% × (₱50,000.00 − ₱33,333)');
  });

  it('explains the exempt band', () => {
    expect(explainWithholding(18_000)).toContain('no tax is withheld');
    expect(explainWithholding(9_000, 'semi-monthly')).toContain('semi-monthly');
  });
});
