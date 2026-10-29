import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SegmentedComponent } from './segmented.component';

@Component({
  imports: [ReactiveFormsModule, SegmentedComponent],
  template: `<app-segmented label="Frequency" [options]="options" [formControl]="ctl" />`,
})
class HostComponent {
  options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Gamma' },
  ];
  ctl = new FormControl('a');
}

describe('SegmentedComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  const buttons = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('[role=radio]'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('is a labelled radio group reflecting the form value', () => {
    expect(fixture.nativeElement.querySelector('[role=radiogroup]').getAttribute('aria-label')).toBe('Frequency');
    expect(buttons().map((b) => b.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
  });

  it('only the selected option is a tab stop', () => {
    expect(buttons().map((b) => b.tabIndex)).toEqual([0, -1, -1]);
  });

  it('updates the form when an option is clicked', () => {
    buttons()[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.ctl.value).toBe('b');
    expect(buttons()[1].getAttribute('aria-checked')).toBe('true');
  });

  it('moves the selection with the arrow keys and wraps around', () => {
    buttons()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.ctl.value).toBe('c');
    buttons()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.ctl.value).toBe('a');
  });

  it('reflects values written from outside', () => {
    fixture.componentInstance.ctl.setValue('c');
    fixture.detectChanges();
    expect(buttons()[2].getAttribute('aria-checked')).toBe('true');
  });
});
