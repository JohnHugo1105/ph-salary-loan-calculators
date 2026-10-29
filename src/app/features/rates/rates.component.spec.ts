import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PH_RULES } from '../../shared/utils/ph-rules';
import { RatesComponent } from './rates.component';

describe('RatesComponent', () => {
  let fixture: ComponentFixture<RatesComponent>;
  let component: RatesComponent;
  const text = () => fixture.nativeElement.textContent as string;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RatesComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(RatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('lists every rule set with an effective date and a source', () => {
    expect(component.groups.length).toBeGreaterThanOrEqual(10);
    for (const g of component.groups) {
      expect(g.effective).toBeTruthy();
      expect(g.sources.length).toBeGreaterThan(0);
      expect(g.rows.length).toBeGreaterThan(0);
    }
  });

  it('is generated from the rules the calculators use', () => {
    expect(text()).toContain('15% of the monthly salary credit');
    expect(text()).toContain('₱100,000');
    expect(text()).toContain(`${PH_RULES.mp2.latestDeclared.ratePct}% a year`);
    expect(text()).toContain('183,541.67');
    expect(text()).toContain('91,770.83');
  });

  it('is honest about the rules that need confirming', () => {
    const confirm = component.groups.filter((g) => g.status === 'confirm').map((g) => g.id);
    expect(confirm).toEqual(['sssloans', 'housing']);
    expect(text()).toContain('Confirm with agency');
  });

  it('shows when the rates were last reviewed', () => {
    expect(text()).toMatch(/Last reviewed \d{1,2} [A-Z][a-z]{2} \d{4}/);
  });

  it('opens official sources safely in a new tab', () => {
    const links = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a[target=_blank]'));
    expect(links.length).toBeGreaterThan(5);
    expect(links.every((a) => a.rel.includes('noopener'))).toBeTrue();
  });
});
