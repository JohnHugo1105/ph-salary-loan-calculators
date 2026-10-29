import { ChangeDetectionStrategy, Component, ElementRef, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SegmentOption<T = string | number> {
  value: T;
  label: string;
}

// Radio-group style toggle for 2-4 mutually exclusive choices (arrow keys move the selection).
@Component({
  selector: 'app-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SegmentedComponent), multi: true }],
  template: `
    <div class="seg" role="radiogroup" [attr.aria-label]="label()">
      @for (o of options(); track o.value; let i = $index) {
        <button
          type="button"
          class="seg__btn"
          role="radio"
          [attr.aria-checked]="o.value === value()"
          [attr.tabindex]="isTabStop(o.value, i) ? 0 : -1"
          (click)="choose(o.value)"
          (keydown)="onKey($event, i)"
        >
          {{ o.label }}
        </button>
      }
    </div>
  `,
})
export class SegmentedComponent implements ControlValueAccessor {
  options = input.required<SegmentOption[]>();
  label = input.required<string>();

  readonly value = signal<string | number | null>(null);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private onChange: (v: string | number) => void = () => {};
  private onTouched: () => void = () => {};

  isTabStop(value: string | number, index: number): boolean {
    const current = this.value();
    return current === null ? index === 0 : current === value;
  }

  choose(value: string | number) {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }

  onKey(event: KeyboardEvent, index: number) {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const opts = this.options();
    const next = (index + delta + opts.length) % opts.length;
    this.choose(opts[next].value);
    queueMicrotask(() => this.host.nativeElement.querySelectorAll<HTMLElement>('[role=radio]')[next]?.focus());
  }

  writeValue(v: string | number | null) {
    this.value.set(v);
  }
  registerOnChange(fn: (v: string | number) => void) {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }
}
