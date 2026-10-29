import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { formatPeso } from '../format';

export interface BreakdownRow {
  label: string;
  // Numbers are formatted as pesos; strings are shown as-is (for rates, months, etc.).
  amount: number | string;
  kind?: 'normal' | 'sub' | 'neg' | 'subtotal' | 'total' | 'heading';
  note?: string;
  // How the amount was computed, shown when "Show how" is on.
  formula?: string;
}

// An itemised list where every figure can explain itself.
@Component({
  selector: 'app-breakdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hasFormulas()) {
      <div class="cluster" style="justify-content:flex-end;margin-bottom:0.25rem">
        <button type="button" class="link-btn" [attr.aria-pressed]="showFormulas()" (click)="showFormulas.set(!showFormulas())">
          {{ showFormulas() ? 'Hide how it’s computed' : 'Show how it’s computed' }}
        </button>
      </div>
    }
    <ul class="breakdown">
      @for (row of rows(); track row.label) {
        @if (row.kind === 'heading') {
          <li class="breakdown__heading">{{ row.label }}</li>
        } @else {
        <li class="breakdown__row" [class]="'breakdown__row--' + (row.kind ?? 'normal')">
          <span class="breakdown__label">{{ row.label }}</span>
          <span class="breakdown__amount">{{ display(row) }}</span>
          @if (row.note) {
            <span class="breakdown__note">{{ row.note }}</span>
          }
          @if (showFormulas() && row.formula) {
            <code class="breakdown__formula">{{ row.formula }}</code>
          }
        </li>
        }
      }
    </ul>
  `,
})
export class BreakdownComponent {
  rows = input.required<BreakdownRow[]>();
  readonly showFormulas = signal(false);
  readonly hasFormulas = computed(() => this.rows().some((r) => !!r.formula));

  display(row: BreakdownRow): string {
    if (typeof row.amount === 'string') return row.amount;
    // Deductions read as negatives so lines visibly subtract.
    return row.kind === 'neg' && row.amount > 0 ? `−${formatPeso(row.amount)}` : formatPeso(row.amount);
  }
}
