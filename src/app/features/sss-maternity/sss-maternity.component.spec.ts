import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SssMaternityComponent } from './sss-maternity.component';

describe('SssMaternityComponent', () => {
  let fixture: ComponentFixture<SssMaternityComponent>;
  let component: SssMaternityComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SssMaternityComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(SssMaternityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults to the 70,000 maximum for 105 days, not 105,000', () => {
    expect(component.results().benefit).toBe(70_000);
    expect(component.results().adsc).toBe(666.67);
    expect(fixture.nativeElement.textContent).toContain('70,000.00');
  });

  it('caps a total above 6 x 20,000 and says so, without blocking the calculation', () => {
    component.form.patchValue({ entry: 'total', totalMsc: 180_000 });
    fixture.detectChanges();
    expect(component.form.valid).toBeTrue();
    expect(component.results().capped).toBeTrue();
    expect(component.results().benefit).toBe(70_000);
    expect(fixture.nativeElement.textContent).toContain('counts each MSC only up to');
  });

  it('accepts one MSC for all six months and counts it up to 20,000', () => {
    component.form.patchValue({ entry: 'single', monthlyMsc: 15_000 });
    expect(component.results().countedTotal).toBe(90_000);
    expect(component.results().benefit).toBe(52_500);
    component.form.patchValue({ monthlyMsc: 25_000 });
    expect(component.results().capped).toBeTrue();
    expect(component.results().benefit).toBe(70_000);
  });

  it('pays 120 days for solo parents and 60 for miscarriage', () => {
    component.form.patchValue({ deliveryType: 120 });
    expect(component.results().benefit).toBe(80_000);
    component.form.patchValue({ deliveryType: 60 });
    expect(component.results().benefit).toBe(40_000);
  });
});
