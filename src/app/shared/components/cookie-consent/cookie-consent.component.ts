import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-cookie-consent',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, RouterLink],
    templateUrl: './cookie-consent.component.html',
    styleUrl: './cookie-consent.component.scss',
    animations: [
        trigger('slideUp', [
            transition(':enter', [
                style({ transform: 'translateY(100%)', opacity: 0 }),
                animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
            ])
        ])
    ]
})
export class CookieConsentComponent implements OnInit {
    isVisible = false;

    ngOnInit(): void {
        // Check if running in browser
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            const consent = localStorage.getItem('cookie_consent');
            if (!consent) {
                // Add a small delay so it doesn't pop up instantly on load
                setTimeout(() => {
                    this.isVisible = true;
                }, 1000);
            }
        }
    }

    accept() {
        this.isVisible = false;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('cookie_consent', 'true');
        }
    }
}
