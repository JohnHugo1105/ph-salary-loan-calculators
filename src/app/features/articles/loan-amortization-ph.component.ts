import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  selector: 'app-article-loan-amortization-ph',
  imports: [RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loan-amortization-ph.component.html',
})
export class LoanAmortizationPhArticleComponent {}
