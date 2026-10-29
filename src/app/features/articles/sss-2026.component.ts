import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  selector: 'app-article-sss-2026',
  imports: [RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sss-2026.component.html',
})
export class Sss2026ArticleComponent {}
