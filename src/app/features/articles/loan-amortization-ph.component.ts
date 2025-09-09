import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-article-loan-amortization-ph',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './loan-amortization-ph.component.html',
  styleUrl: './loan-amortization-ph.component.scss'
})
export class LoanAmortizationPhArticleComponent {}
