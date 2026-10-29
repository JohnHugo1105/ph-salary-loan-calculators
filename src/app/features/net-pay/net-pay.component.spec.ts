import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NetPayComponent } from './net-pay.component';

describe('NetPayComponent', () => {
  let fixture: ComponentFixture<NetPayComponent>;
  let component: NetPayComponent;
  const text = () => fixture.nativeElement.textContent as string;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NetPayComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(NetPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('computes the corrected net pay for a P30,000 salary', () => {
    expect(component.view().netPay).toBeCloseTo(26_542.45, 2);
    expect(component.view().tax).toBe(1_007.55);
    expect(component.view().contribPeriod).toBe(2_450);
    expect(text()).toContain('26,542.45');
  });

  it('shows MPF/WISP as its own line and the lines add up to the total', () => {
    const v = component.view();
    const l = v.periodContributions;
    expect(l.mpf).toBe(500);
    expect(l.sss + l.mpf + l.philhealth + l.pagibig).toBe(v.contribPeriod);
    expect(text()).toContain('MPF / WISP');
  });

  it('keeps per-period lines consistent for semi-monthly pay', () => {
    component.form.patchValue({ payFrequency: 'semi-monthly' });
    const v = component.view();
    const l = v.periodContributions;
    expect(l.sss + l.mpf + l.philhealth + l.pagibig).toBeCloseTo(v.contribPeriod, 2);
    expect(v.contribPeriod).toBe(1_225);
  });

  it('works backwards from a target take-home pay', () => {
    component.form.patchValue({ mode: 'reverse', targetNet: 26_542.45 });
    fixture.detectChanges();
    const v = component.view();
    expect(v.reverse).toBeTrue();
    expect(Math.abs(v.monthlyBasic - 30_000)).toBeLessThan(150);
    expect(Math.abs(v.netPay - 26_542.45)).toBeLessThan(1);
    expect(text()).toContain('Reverse mode');
  });

  it('flags invalid input instead of silently calculating', () => {
    component.form.patchValue({ monthlyBasic: 0 });
    fixture.detectChanges();
    expect(component.form.invalid).toBeTrue();
    expect(text()).toContain('Some inputs need fixing');
  });

  it('adds overtime and holiday pay without halving them for semi-monthly pay', () => {
    component.form.patchValue({ overtimeHours: 10 });
    const monthly = component.view().grossPeriod;
    component.form.patchValue({ payFrequency: 'semi-monthly' });
    const semi = component.view().grossPeriod;
    const overtime = monthly - 30_000;
    expect(overtime).toBeGreaterThan(0);
    expect(semi).toBeCloseTo(15_000 + overtime, 2);
  });

  it('generates the guide example from the engine and uses current de minimis ceilings', () => {
    expect(component.example.net).toBeCloseTo(26_542.45, 2);
    expect(text()).toContain('Up to ₱2,500 per month');
    expect(text()).toContain('Up to ₱8,000 per year');
    expect(text()).toContain('Up to ₱400 per month');
    expect(text()).toContain('Up to 12 days');
  });
});
