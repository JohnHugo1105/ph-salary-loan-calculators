import { Component, Input, OnInit } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { AD_PRESETS } from '../../config/ads.config';

@Component({
    selector: 'app-ad',
    imports: [MatIconModule],
    templateUrl: './ad.component.html',
    styleUrls: ['./ad.component.scss']
})
export class AdComponent implements OnInit {
    @Input() type: keyof typeof AD_PRESETS = 'cashExpress';

    adContent: any;

    ngOnInit() {
        this.adContent = AD_PRESETS[this.type];
    }
}
