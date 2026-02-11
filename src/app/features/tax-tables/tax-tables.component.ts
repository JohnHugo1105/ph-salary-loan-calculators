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
        this.seo.setSchema({
            '@context': 'https://schema.org',
            '@type': 'Article',
            'headline': 'Philippine Tax Tables and SSS Contributions 2026',
            'description': 'Updated 2026 BIR Withholding Tax Tables and SSS Contribution Schedule.',
            'author': {
                '@type': 'Organization',
                'name': 'PH Calculators'
            }
        });
    }
}
