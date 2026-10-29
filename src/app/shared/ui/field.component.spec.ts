import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FieldComponent } from './field.component';

@Component({
  imports: [ReactiveFormsModule, FieldComponent],
  template: `
    <app-field label="Amount" hint="Whole pesos" prefix="₱" [control]="ctl" [errors]="{ min: 'Too small' }">
      <input type="number" [formControl]="ctl" />
    </app-field>
  `,
})
class HostComponent {
  ctl = new FormControl(50, [Validators.min(100)]);
}

describe('FieldComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const input = () => el().querySelector('input') as HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('links the label to the projected input', () => {
    const label = el().querySelector('label') as HTMLLabelElement;
    expect(input().id).toBeTruthy();
    expect(label.getAttribute('for')).toBe(input().id);
    expect(label.textContent).toContain('Amount');
  });

  it('shows the hint and describes the input with it', () => {
    expect(el().querySelector('.field__hint')?.textContent).toContain('Whole pesos');
    expect(input().getAttribute('aria-describedby')).toBe(el().querySelector('.field__hint')?.id ?? '');
    expect(input().hasAttribute('aria-invalid')).toBeFalse();
  });

  it('shows the prefix', () => {
    expect(el().querySelector('.field__affix--pre')?.textContent).toContain('₱');
  });

  it('waits until the control is touched before showing an error', () => {
    expect(el().querySelector('.field__error')).toBeNull();
    fixture.componentInstance.ctl.markAsTouched();
    fixture.detectChanges();
    const err = el().querySelector('.field__error');
    expect(err?.textContent).toContain('Too small');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().getAttribute('aria-describedby')).toBe(err?.id ?? '');
  });

  it('clears the error once the value is valid', () => {
    fixture.componentInstance.ctl.markAsTouched();
    fixture.componentInstance.ctl.setValue(500);
    fixture.detectChanges();
    expect(el().querySelector('.field__error')).toBeNull();
    expect(input().hasAttribute('aria-invalid')).toBeFalse();
  });
});
