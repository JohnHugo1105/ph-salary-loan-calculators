import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogItem } from '../../core/config/tools';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-tool-card',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block' },
  template: `
    <a class="tool-card" [routerLink]="item().route">
      <span class="tool-card__icon"><app-icon [name]="item().icon" [size]="22" /></span>
      <span class="tool-card__title">{{ item().title }}</span>
      <span class="tool-card__desc">{{ item().description }}</span>
      <span class="tool-card__go">{{ cta() }} <app-icon name="arrow-right" [size]="16" /></span>
    </a>
  `,
})
export class ToolCardComponent {
  item = input.required<CatalogItem>();
  cta = input('Open');
}
