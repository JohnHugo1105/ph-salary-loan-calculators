import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

// Formats an input with thousands separators on blur, strips on focus.
// Keeps the underlying FormControl value as a number (or null if empty).
@Directive({
  selector: '[appThousandsSeparator]',
  standalone: true,
})
export class ThousandsSeparatorDirective implements OnInit {
  // Use a fixed locale for grouping (commas). Adjust if needed.
  @Input() appThousandsSeparatorLocale: string = 'en-US';

  constructor(private el: ElementRef<HTMLInputElement>, private control: NgControl) {}

  ngOnInit(): void {
    // Initial format if there's an initial value
    const n = this.getNumberFromControl();
    if (n !== null) this.setDisplayValue(this.formatNumber(n));
  }

  @HostListener('focus')
  onFocus() {
    const raw = this.getNumberFromControl();
    if (raw === null) {
      this.setDisplayValue('');
    } else {
      this.setDisplayValue(this.numberToPlainString(raw));
    }
  }

  @HostListener('blur')
  onBlur() {
    const cleaned = this.cleanString(this.el.nativeElement.value);
    const num = cleaned === '' ? null : Number(cleaned);
    this.setControlValue(num);
    if (num === null || isNaN(num)) {
      this.setDisplayValue('');
    } else {
      this.setDisplayValue(this.formatNumber(num));
    }
  }

  @HostListener('input', ['$event'])
  onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const cleaned = this.cleanString(input.value);
    // Update the visible value without grouping while typing
    this.setDisplayValue(cleaned);
    // Do NOT update the form control on each keystroke to avoid
    // Angular writing back the numeric value and eating the trailing '.'
  }

  private formatNumber(n: number): string {
    // Always show 2 decimal places for clarity
    return n.toLocaleString(this.appThousandsSeparatorLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    });
  }

  private numberToPlainString(n: number): string {
    // Avoid scientific notation for large/small numbers
    const s = String(n);
    return s;
  }

  private cleanString(s: string): string {
    // Normalize to dot as decimal separator, accept ',' or '.' from user input
    s = (s || '').trim().replace(/,/g, '.');
    // Remove invalid chars except digits and dot
    s = s.replace(/[^0-9.]/g, '');
    // Ensure at most one dot (keep the first)
    const firstDot = s.indexOf('.');
    if (firstDot !== -1) {
      const before = s.slice(0, firstDot + 1);
      const after = s.slice(firstDot + 1).replace(/\./g, '');
      s = before + after;
    }
    return s;
  }

  private getNumberFromControl(): number | null {
    const v = this.control?.control?.value;
    if (v === null || v === undefined || v === '') return null;
    const num = Number(v);
    return isNaN(num) ? null : num;
  }

  private setControlValue(num: number | null, emitEvent = true) {
    if (!this.control?.control) return;
    const current = this.control.control.value;
    const next = num === null ? null : Number(num);
    if (current !== next) {
      this.control.control.setValue(next, { emitEvent });
    }
  }

  private setDisplayValue(v: string) {
    this.el.nativeElement.value = v;
  }
}
