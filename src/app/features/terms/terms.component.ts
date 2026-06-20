import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-terms',
    imports: [CommonModule],
    templateUrl: './terms.component.html',
    styleUrl: './terms.component.scss'
})
export class TermsComponent {
  year = new Date().getFullYear();
}
