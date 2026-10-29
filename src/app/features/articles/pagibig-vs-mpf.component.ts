import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  selector: 'app-article-pagibig-vs-mpf',
  imports: [RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagibig-vs-mpf.component.html',
})
export class PagibigVsMpfArticleComponent {}
