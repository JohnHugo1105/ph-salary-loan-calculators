import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { computeContributions } from '../../shared/ph-calculators.util';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { SeoService } from '../../shared/seo.service';
import { trigger, transition, style, query, stagger, animate } from '@angular/animations';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-contributions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatCardModule, MatButtonModule, MatIconModule, ThousandsSeparatorDirective, RouterModule],
  templateUrl: './contributions.component.html',
  styleUrl: './contributions.component.scss',
  animations: [
    trigger('cardsIn', [
      transition(':enter', [
        query('.card', [
          style({ opacity: 0, transform: 'translateY(6px)' }),
          stagger(60, animate('200ms ease-out', style({ opacity: 1, transform: 'none' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class ContributionsComponent {
  form = this.fb.group({
    monthlySalary: [30000, [Validators.required, Validators.min(0)]],
    includeSSSEC: [true]
  });

  result = computeContributions(30000, { includeSSSEC: true });

  constructor(private fb: FormBuilder, private seo: SeoService) {
    this.form.valueChanges.subscribe(v => {
      const salary = Number(v.monthlySalary) || 0;
      const includeEC = !!v.includeSSSEC;
      this.result = computeContributions(salary, { includeSSSEC: includeEC });
    });

    this.seo.setSchema([
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'SSS, PhilHealth, Pag-IBIG Contributions Calculator',
        'operatingSystem': 'Web',
        'applicationCategory': 'FinanceApplication',
        'url': 'https://www.phcalculators.com/contributions',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'PHP'
        },
        'featureList': 'Compute SSS, PhilHealth, Pag-IBIG, and MPF shares'
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'What is WISP in SSS?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'The Worker\'s Investment and Savings Program (WISP) is a mandatory provident fund managed by SSS. It serves as an additional retirement savings program on top of the regular SSS pension for members whose Monthly Salary Credit (MSC) exceeds ₱20,000.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Did PhilHealth rates increase in 2025?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes, as mandated by the Universal Health Care (UHC) Law, the PhilHealth premium rate was scheduled to increase to 5.0% of the basic monthly income, with the income ceiling adjusting to ₱90,000-₱100,000 depending on the final BIR/PhilHealth circular releases for the year.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Can I voluntarily pay more than the mandatory ₱100 Pag-IBIG contribution?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes, you can opt to increase your monthly Pag-IBIG Regular Savings contribution beyond the mandatory ₱100 to save more. However, many Filipinos choose to enroll in the separate voluntary Modified Pag-IBIG II (MP2) program instead, as it traditionally yields higher dividends.'
            }
          }
        ]
      }
    ]);
  }
}
