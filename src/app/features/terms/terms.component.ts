import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  selector: 'app-terms',
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './terms.component.html',
})
export class TermsComponent {
  year = new Date().getFullYear();
}
