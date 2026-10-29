import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ContributionsComponent } from './contributions.component';

describe('ContributionsComponent', () => {
  let fixture: ComponentFixture<ContributionsComponent>;
  let component: ContributionsComponent;
  const text = () => fixture.nativeElement.textContent as string;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ContributionsComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(ContributionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('splits SSS and MPF/WISP without double counting for a P30,000 salary', () => {
    const { sss, mpf, totals } = component.result();
    expect(sss.employee + mpf.employee).toBe(1_500); // 5% of the 30,000 MSC
    expect(totals.employee).toBe(2_450);
    expect(component.msc()).toBe(30_000);
  });

  it('recomputes when the salary or EC option changes', () => {
    component.form.patchValue({ monthlySalary: 15_000, includeSSSEC: false });
    expect(component.msc()).toBe(15_000);
    expect(component.result().mpf.total).toBe(0);
    expect(component.result().sss.employer).toBe(1_500);
  });

  it('explains each share with its formula', () => {
    expect(component.why().sss).toContain('5%');
    expect(component.why().mpf).toContain('₱20,000');
    expect(component.why().philhealth).toContain('÷ 2');
    expect(component.why().pagibig).toContain('₱10,000');
  });

  it('renders the result and a Maria example generated from the engine', () => {
    expect(component.example.total).toBe(2_075); // 1,000 + 250 + 625 + 200
    expect(text()).toContain('₱2,450.00');
    expect(text()).toContain('₱2,075.00');
    expect(text()).toContain('15%');
    expect(text()).not.toContain('14%');
  });

  it('flags an invalid salary', () => {
    component.form.patchValue({ monthlySalary: 0 });
    fixture.detectChanges();
    expect(text()).toContain('Enter a salary above');
  });
});
