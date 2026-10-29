import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconName } from './icon-names';

// Decorative icon from the inline sprite. Give the surrounding control its own accessible name.
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:inline-flex;flex:none;line-height:0' },
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <use [attr.href]="'#i-' + name()" />
    </svg>
  `,
})
export class IconComponent {
  name = input.required<IconName>();
  size = input(20);
}
