import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GUIDES, TOOLS } from '../../core/config/tools';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { ToolCardComponent } from '../../shared/ui/tool-card.component';

@Component({
  selector: 'app-articles-list',
  imports: [PageHeaderComponent, ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './articles-list.component.html',
})
export class ArticlesListComponent {
  readonly guides = GUIDES;
  readonly tools = TOOLS;
}
