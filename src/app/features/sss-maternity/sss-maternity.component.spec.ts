import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { SssMaternityComponent } from './sss-maternity.component';

describe('SssMaternityComponent', () => {
  let fixture: ComponentFixture<SssMaternityComponent>;
  let component: SssMaternityComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SssMaternityComponent],
      providers: [provideRouter([]), provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(SssMaternityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults to the 70,000 maximum for 105 days, not 105,000', () => {
    expect(component.results.totalBenefit).toBe(70_000);
    expect(component.results.adsc).toBe(666.67);
    expect(fixture.nativeElement.textContent).toContain('70,000.00');
  });

  it('rejects a total above 6 x 20,000 and still computes on the capped amount', () => {
    component.form.patchValue({ totalMsc: 180_000 });
    expect(component.form.controls.totalMsc.valid).toBeFalse();
    expect(component.results.capped).toBeTrue();
    expect(component.results.totalBenefit).toBe(70_000);
  });

  it('pays 120 days for solo parents', () => {
    component.form.patchValue({ deliveryType: 120 });
    expect(component.results.totalBenefit).toBe(80_000);
  });
});
