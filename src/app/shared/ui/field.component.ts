import { AfterViewInit, Component, DoCheck, ElementRef, inject, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

let nextId = 0;

// Label + control + hint/error. Project a native <input>, <select> or <textarea>; this component
// wires up the id, aria-describedby and aria-invalid so the control stays accessible.
@Component({
  selector: 'app-field',
  host: { style: 'display:block;min-width:0' },
  template: `
    <div class="field">
      <label class="field__label" [attr.for]="id">
        <span>{{ label() }}</span>
        @if (optional()) {
          <span class="field__opt">Optional</span>
        }
      </label>
      <div class="field__control">
        @if (prefix()) {
          <span class="field__affix field__affix--pre" aria-hidden="true">{{ prefix() }}</span>
        }
        <ng-content />
        @if (suffix()) {
          <span class="field__affix field__affix--post" aria-hidden="true">{{ suffix() }}</span>
        }
      </div>
      @if (errorText(); as err) {
        <p class="field__error" [id]="id + '-msg'">{{ err }}</p>
      } @else if (hint()) {
        <p class="field__hint" [id]="id + '-msg'">{{ hint() }}</p>
      }
    </div>
  `,
})
export class FieldComponent implements AfterViewInit, DoCheck {
  label = input.required<string>();
  hint = input<string>('');
  prefix = input<string>('');
  suffix = input<string>('');
  optional = input(false);
  // Validation: show the first matching message once the control is touched or edited.
  control = input<AbstractControl | null>(null);
  errors = input<Record<string, string>>({});

  readonly id = `fld-${++nextId}`;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private el: HTMLElement | null = null;

  errorText(): string {
    const c = this.control();
    if (!c || !c.invalid || !(c.touched || c.dirty)) return '';
    const map = this.errors();
    for (const key of Object.keys(c.errors ?? {})) {
      if (map[key]) return map[key];
    }
    return 'Check this value';
  }

  ngAfterViewInit() {
    this.el = this.host.nativeElement.querySelector('input, select, textarea');
    // Always set it: a server-rendered id would otherwise survive hydration and no longer match label[for].
    if (this.el) this.el.id = this.id;
    this.sync();
  }

  ngDoCheck() {
    this.sync();
  }

  private sync() {
    const el = this.el;
    if (!el) return;
    const message = this.errorText() || this.hint();
    if (message) el.setAttribute('aria-describedby', `${this.id}-msg`);
    else el.removeAttribute('aria-describedby');
    if (this.errorText()) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }
}
