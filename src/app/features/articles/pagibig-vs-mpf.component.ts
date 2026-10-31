import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { guideFor } from '../../core/config/tools';
import { formatDate } from '../../shared/format';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { RelatedComponent } from '../../shared/ui/related.component';

@Component({
  selector: 'app-article-pagibig-vs-mpf',
  imports: [RouterLink, PageHeaderComponent, RelatedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagibig-vs-mpf.component.html',
})
export class PagibigVsMpfArticleComponent {
  readonly updated = formatDate(guideFor('/articles/pagibig-vs-mpf')!.updated);
}
