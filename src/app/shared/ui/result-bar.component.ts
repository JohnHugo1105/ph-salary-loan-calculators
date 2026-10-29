import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';

// Phone-only sticky summary at the end of the inputs; jumps to the full results.
@Component({
  selector: 'app-result-bar',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The anchor must be a direct child of the form for position: sticky to have room to move.
  host: { style: 'display:contents' },
  template: `
    <a class="result-bar no-print" [routerLink]="[]" fragment="results" queryParamsHandling="preserve">
      <span>
        <span class="result-bar__label">{{ label() }}</span>
        <strong class="result-bar__value">{{ value() }}</strong>
      </span>
      <span class="result-bar__go">Details <app-icon name="chevron-down" [size]="16" /></span>
    </a>
  `,
})
export class ResultBarComponent {
  label = input.required<string>();
  value = input.required<string>();
}
