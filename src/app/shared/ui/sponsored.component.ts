import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AD_PRESETS } from '../config/ads.config';
import { IconComponent } from './icon.component';

// Clearly labelled partner offer. Kept out of the calculator and result areas on purpose.
@Component({
  selector: 'app-sponsored',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ad(); as a) {
      <aside class="sponsored" aria-label="Sponsored">
        <span class="sponsored__label">Sponsored · Partner offer</span>
        <span class="sponsored__icon"><app-icon [name]="a.icon" /></span>
        <div>
          <div class="sponsored__title">{{ a.headline }}</div>
          <div class="sponsored__body" [innerHTML]="a.body"></div>
        </div>
        <a class="btn btn--sm" [href]="a.link" target="_blank" rel="sponsored nofollow noopener">
          {{ a.actionText }} <app-icon name="external" [size]="14" />
        </a>
      </aside>
    }
  `,
})
export class SponsoredComponent {
  type = input<keyof typeof AD_PRESETS>('cashSpace');
  readonly ad = computed(() => AD_PRESETS[this.type()]);
}
