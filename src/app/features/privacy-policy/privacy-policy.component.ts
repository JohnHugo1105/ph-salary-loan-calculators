import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  selector: 'app-privacy-policy',
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy-policy.component.html',
})
export class PrivacyPolicyComponent {
  year = new Date().getFullYear();
}
