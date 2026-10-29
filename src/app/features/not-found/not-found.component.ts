import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TOOLS } from '../../core/config/tools';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { ToolCardComponent } from '../../shared/ui/tool-card.component';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {
  readonly popular = TOOLS.filter((t) => t.popular);
}
