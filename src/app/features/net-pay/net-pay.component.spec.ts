import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { NetPayComponent } from './net-pay.component';

describe('NetPayComponent', () => {
  let fixture: ComponentFixture<NetPayComponent>;
  let component: NetPayComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetPayComponent],
      providers: [provideRouter([]), provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(NetPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('computes the corrected net pay for a P30,000 salary', () => {
    expect(component.view().netPay).toBeCloseTo(26_542.45, 2);
    expect(component.view().tax).toBe(1_007.55);
    expect(component.view().contribPeriod).toBe(2_450);
  });

  it('lists every deduction line so the lines add up to the total', () => {
    const v = component.view();
    const lines = v.periodContributions;
    expect(lines.mpf).toBe(500);
    expect(lines.sss + lines.mpf + lines.philhealth + lines.pagibig).toBe(v.contribPeriod);
    expect(fixture.nativeElement.textContent).toContain('MPF / WISP');
  });

  it('shows per-period deduction lines that add up for semi-monthly pay', () => {
    component.form.patchValue({ payFrequency: 'semi-monthly' });
    const v = component.view();
    const lines = v.periodContributions;
    expect(lines.sss + lines.mpf + lines.philhealth + lines.pagibig).toBeCloseTo(v.contribPeriod, 2);
    expect(v.contribPeriod).toBe(1_225);
  });

  it('generates the guide example from the engine and uses current de minimis ceilings', () => {
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(component.example.net).toBeCloseTo(26_542.45, 2);
    expect(text).toContain('26,542.45');
    expect(text).toContain('Up to ₱2,500 per month');
    expect(text).toContain('Up to ₱8,000 per year');
    expect(text).toContain('Up to ₱400 per month');
    expect(text).toContain('Up to 12 days');
  });
});
