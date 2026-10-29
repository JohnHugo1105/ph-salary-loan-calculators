import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  selector: 'app-disclaimer',
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './disclaimer.component.html',
})
export class DisclaimerComponent {}
