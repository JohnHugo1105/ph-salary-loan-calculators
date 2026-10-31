import { GUIDES, REFERENCE_PAGES, TOOLS, TOOL_GROUPS, catalogItem, searchCatalog } from './tools';

describe('tool catalog', () => {
  it('puts every tool in a known group with a unique route', () => {
    const groups = new Set(TOOL_GROUPS.map((g) => g.id));
    expect(TOOLS.every((t) => groups.has(t.group))).toBeTrue();
    const routes = [...TOOLS, ...GUIDES, ...REFERENCE_PAGES].map((i) => i.route);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it('covers every calculator route', () => {
    const routes = TOOLS.map((t) => t.route);
    for (const r of ['/net-pay', '/13th-month-pay', '/contributions', '/amortization', '/sss-salary-loan', '/pagibig-housing-loan', '/sss-maternity-benefit', '/mp2-calculator', '/tax-tables']) {
      expect(routes).toContain(r);
    }
  });

  it('links related pages that exist, never the page itself', () => {
    for (const item of [...TOOLS, ...GUIDES]) {
      for (const r of item.related ?? []) {
        expect(catalogItem(r)).withContext(`${item.route} -> ${r}`).toBeDefined();
        expect(r).not.toBe(item.route);
      }
    }
  });

  it('dates every guide', () => {
    for (const g of GUIDES) {
      expect(g.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(g.updated >= g.published).withContext(g.route).toBeTrue();
    }
  });

  it('finds tools by title, keyword and description', () => {
    expect(searchCatalog('13th')[0].route).toBe('/13th-month-pay');
    expect(searchCatalog('payslip').map((h) => h.route)).toContain('/net-pay');
    expect(searchCatalog('sss loan')[0].route).toBe('/sss-salary-loan');
  });

  it('needs every word to match and ignores empty queries', () => {
    expect(searchCatalog('')).toEqual([]);
    expect(searchCatalog('   ')).toEqual([]);
    expect(searchCatalog('zzzz nothing')).toEqual([]);
    expect(searchCatalog('mp2 housing')).toEqual([]);
  });

  it('labels the kind of result', () => {
    expect(searchCatalog('amortization 101')[0].kind).toBe('Guide');
    expect(searchCatalog('rates sources')[0].kind).toBe('Reference');
  });
});
