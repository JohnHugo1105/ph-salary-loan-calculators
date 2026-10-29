import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { TaxTablesComponent } from './tax-tables.component';

describe('TaxTablesComponent', () => {
  let fixture: ComponentFixture<TaxTablesComponent>;
  let component: TaxTablesComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxTablesComponent],
      providers: [provideRouter([]), provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(TaxTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('generates SSS rows where regular + WISP always equals 5% of the MSC', () => {
    for (const row of component.sssRows) {
      expect(row.total).toBeCloseTo(row.msc * 0.05, 2);
    }
    const top = component.sssRows[component.sssRows.length - 1];
    expect(top.msc).toBe(35_000);
    expect(top.total).toBe(1_750);
  });

  it('generates the monthly withholding table from the engine rules', () => {
    expect(component.monthlyTaxRows.map(r => r.rate)).toEqual([0, 15, 20, 25, 30, 35]);
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('1,875.00');
    expect(text).toContain('8,541.67');
    expect(text).toContain('183,541.67');
    expect(text).toMatch(/rate\s+is now\s+15%/);
    expect(text).not.toContain('14%');
  });
});
