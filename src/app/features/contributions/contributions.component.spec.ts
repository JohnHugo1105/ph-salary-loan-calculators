import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ContributionsComponent } from './contributions.component';

describe('ContributionsComponent', () => {
  let fixture: ComponentFixture<ContributionsComponent>;
  let component: ContributionsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContributionsComponent],
      providers: [provideRouter([]), provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(ContributionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('splits SSS and MPF/WISP without double counting for a P30,000 salary', () => {
    const { sss, mpf, totals } = component.result;
    expect(sss.employee + mpf.employee).toBe(1_500); // 5% of the 30,000 MSC
    expect(totals.employee).toBe(2_450);
    expect(component.msc).toBe(30_000);
  });

  it('recomputes when the salary changes', () => {
    component.form.patchValue({ monthlySalary: 15_000, includeSSSEC: false });
    expect(component.msc).toBe(15_000);
    expect(component.result.mpf.total).toBe(0);
    expect(component.result.sss.employer).toBe(1_500);
  });

  it('generates the Maria example from the engine with the 15% rates and 200 Pag-IBIG', () => {
    expect(component.example.total).toBe(2_075); // 1,000 + 250 + 625 + 200
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('15%');
    expect(text).not.toContain('14%');
    expect(text).toContain('₱2,075.00');
    expect(text).toContain('₱200 per month');
  });
});
