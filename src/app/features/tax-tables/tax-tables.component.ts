import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../shared/seo.service';
import { AdComponent } from '../../shared/components/ad/ad.component';

@Component({
    selector: 'app-tax-tables',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, RouterModule, AdComponent],
    templateUrl: './tax-tables.component.html',
    styleUrls: ['./tax-tables.component.scss']
})
export class TaxTablesComponent {
    constructor(private seo: SeoService) {
        this.seo.setSchema([
            {
                '@context': 'https://schema.org',
                '@type': 'Article',
                'headline': 'Philippine Tax Tables and SSS Contributions 2026',
                'description': 'Updated 2026 BIR Withholding Tax Tables and SSS Contribution Schedule.',
                'author': {
                    '@type': 'Organization',
                    'name': 'PH Calculators'
                }
            },
            {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                'mainEntity': [
                    {
                        '@type': 'Question',
                        'name': 'What is the TRAIN law tax exemption limit?',
                        'acceptedAnswer': {
                            '@type': 'Answer',
                            'text': 'Under the TRAIN Law (RA 10963), compensation income earners with an annual taxable income of ₱250,000 and below are completely exempt from paying personal income tax. This means if you earn roughly ₱20,833 or less per month, you pay zero income tax.'
                        }
                    },
                    {
                        '@type': 'Question',
                        'name': 'What happens if I have multiple employers?',
                        'acceptedAnswer': {
                            '@type': 'Answer',
                            'text': 'If you have multiple employers during the same calendar year, you are not eligible for Substituted Filing. You must consolidate your income and file your own Annual Income Tax Return (BIR Form 1700) directly with the BIR on or before April 15 of the following year.'
                        }
                    },
                    {
                        '@type': 'Question',
                        'name': 'Are my SSS and PhilHealth contributions taxable?',
                        'acceptedAnswer': {
                            '@type': 'Answer',
                            'text': 'No. Mandatory contributions to SSS, PhilHealth, and Pag-IBIG (up to the required limits) are strictly non-taxable. They must be deducted from your Gross Income first before your employer computes your Withholding Tax.'
                        }
                    }
                ]
            }
        ]);
    }
}
