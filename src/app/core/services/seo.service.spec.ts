import { canonicalPath, withBrand } from './seo.service';

describe('SeoService helpers', () => {
  it('adds the brand only when the title stays within 60 characters', () => {
    expect(withBrand('Net pay calculator')).toBe('Net pay calculator | PH Calculators');
    const long = 'SSS, PhilHealth & Pag-IBIG Contribution Calculator 2026';
    expect(withBrand(long)).toBe(long);
    expect(withBrand('About PH Calculators')).toBe('About PH Calculators');
  });

  it('drops query strings, fragments and trailing slashes from the canonical path', () => {
    expect(canonicalPath('/net-pay?data=abc')).toBe('/net-pay');
    expect(canonicalPath('/?q=tax')).toBe('/');
    expect(canonicalPath('/articles/pagibig-vs-mpf/#faq')).toBe('/articles/pagibig-vs-mpf');
    expect(canonicalPath('')).toBe('/');
  });
});
