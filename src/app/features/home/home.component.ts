import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  tools = [
    {
      title: 'Net Pay Calculator',
      description: 'Compute take-home pay, tax, and deductions.',
      icon: 'monetization_on',
      route: '/net-pay',
      color: 'primary'
    },
    {
      title: 'Contributions',
      description: 'SSS, Pag-IBIG, PhilHealth, and MPF tables.',
      icon: 'table_chart',
      route: '/contributions',
      color: 'accent'
    },
    {
      title: '13th Month Pay',
      description: 'Estimate your pro-rated 13th-month bonus.',
      icon: 'event_available',
      route: '/13th-month-pay',
      color: 'primary'
    },
    {
      title: 'MP2 Calculator',
      description: 'Project your Pag-IBIG MP2 savings growth.',
      icon: 'savings',
      route: '/mp2-calculator',
      color: 'accent'
    },
    {
      title: 'Loan Amortization',
      description: 'Calculate monthly payments for housing/car loans.',
      icon: 'account_balance',
      route: '/amortization',
      color: 'warn'
    },
    {
      title: 'Articles & Guides',
      description: 'Learn about PH labor laws and finance.',
      icon: 'article',
      route: '/articles',
      color: 'primary'
    }
  ];
}
