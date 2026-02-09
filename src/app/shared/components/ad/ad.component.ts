import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AD_PRESETS } from '../../config/ads.config';

@Component({
    selector: 'app-ad',
    standalone: true,
    imports: [CommonModule, MatIconModule],
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
