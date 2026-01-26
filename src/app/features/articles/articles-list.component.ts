import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-articles-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './articles-list.component.html',
  styleUrl: './articles-list.component.scss'
})
export class ArticlesListComponent {

  articles = [
    {
      title: 'SSS Contribution 2025',
      description: 'Step-by-step guide to compute your SSS contribution for the new year.',
      icon: 'calculate',
      route: '/articles/sss-contribution-2025',
      color: 'primary'
    },
    {
      title: 'Pag-IBIG vs MP2',
      description: 'Detailed comparison between regular Pag-IBIG savings and MP2.',
      icon: 'compare_arrows',
      route: '/articles/pagibig-vs-mpf',
      color: 'accent'
    },
    {
      title: 'Loan Amortization 101',
      description: 'How loan amortization works in the Philippines: basics and examples.',
      icon: 'school',
      route: '/articles/loan-amortization-ph',
      color: 'warn'
    }
  ];
}
