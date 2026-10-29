import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SavedComponent } from './saved.component';

describe('SavedComponent', () => {
  let fixture: ComponentFixture<SavedComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  async function create(saved?: object) {
    if (saved) localStorage.setItem('phcalc_saved', JSON.stringify(saved));
    else localStorage.removeItem('phcalc_saved');
    await TestBed.configureTestingModule({ imports: [SavedComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(SavedComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => localStorage.removeItem('phcalc_saved'));

  it('says nothing is saved yet', async () => {
    await create();
    expect(el().textContent).toContain('Nothing saved yet');
  });

  it('lists saved calculations, newest first, with a link back to the calculator', async () => {
    await create({
      'net-pay': [{ monthlyBasic: 30000, summary: 'Net pay estimate\nTake-home: ₱26,542.45', savedAt: '2026-01-01T00:00:00Z' }],
      mp2: [{ monthlyContribution: 500, summary: 'MP2 projection', savedAt: '2026-06-01T00:00:00Z' }],
    });
    const titles = Array.from(el().querySelectorAll('.card__title')).map((t) => t.textContent?.trim());
    expect(titles).toEqual(['Pag-IBIG MP2 savings', 'Net pay']);
    expect(el().textContent).toContain('Take-home: ₱26,542.45');
    const open = el().querySelector('a.btn--primary') as HTMLAnchorElement;
    expect(open.getAttribute('href')).toContain('/mp2-calculator?data=');
  });

  it('deletes a saved calculation', async () => {
    await create({ 'net-pay': [{ monthlyBasic: 1, summary: 'x', savedAt: '2026-01-01T00:00:00Z' }] });
    expect(el().querySelectorAll('article.card').length).toBe(1);
    (Array.from(el().querySelectorAll('button')).find((b) => b.textContent?.includes('Delete')) as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el().textContent).toContain('Nothing saved yet');
    expect(JSON.parse(localStorage.getItem('phcalc_saved') ?? '{}')['net-pay']).toBeUndefined();
  });

  it('copes with a calculation saved by an earlier version', async () => {
    await create({ amortization: [{ type: 'amortization', amount: 1000000, annualRate: 8, months: 240, payment: 8364.4 }] });
    expect(el().textContent).toContain('earlier version');
    expect(el().querySelector('a.btn--primary')?.getAttribute('href')).toContain('/amortization?data=');
  });
});
