import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div aria-live="polite" role="status">
      @if (toast.message(); as m) {
        <div class="toast no-print">{{ m }}</div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toast = inject(ToastService);
}
