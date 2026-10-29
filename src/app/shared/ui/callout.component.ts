import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from './icon.component';
import { IconName } from './icon-names';

@Component({
  selector: 'app-callout',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="callout" [class]="'callout--' + kind()" [attr.role]="kind() === 'neg' ? 'alert' : null">
      <app-icon [name]="icon()" [size]="18" />
      <div><ng-content /></div>
    </div>
  `,
})
export class CalloutComponent {
  kind = input<'note' | 'info' | 'warn' | 'neg'>('note');
  readonly icon = computed<IconName>(() => (this.kind() === 'warn' || this.kind() === 'neg' ? 'alert' : 'info'));
}
