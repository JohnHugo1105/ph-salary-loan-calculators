import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  selector: 'app-about',
  imports: [RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.component.html',
})
export class AboutComponent {}
