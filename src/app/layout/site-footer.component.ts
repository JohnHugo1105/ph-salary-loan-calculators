import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GUIDES, TOOLS } from '../core/config/tools';
import { formatDate } from '../shared/format';
import { PH_RULES_LAST_REVIEWED } from '../shared/utils/ph-rules';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="site-footer">
      <div class="container">
        <div class="site-footer__grid">
          <section>
            <h2>Calculators</h2>
            <ul>
              @for (t of tools; track t.id) {
                <li><a [routerLink]="t.route">{{ t.title }}</a></li>
              }
            </ul>
          </section>
          <section>
            <h2>Learn</h2>
            <ul>
              @for (g of guides; track g.route) {
                <li><a [routerLink]="g.route">{{ g.title }}</a></li>
              }
              <li><a routerLink="/rates">Rates &amp; sources</a></li>
            </ul>
          </section>
          <section>
            <h2>Company</h2>
            <ul>
              <li><a routerLink="/about">About</a></li>
              <li><a routerLink="/contact">Contact</a></li>
              <li><a routerLink="/saved">Saved calculations</a></li>
            </ul>
          </section>
          <section>
            <h2>Legal</h2>
            <ul>
              <li><a routerLink="/privacy-policy">Privacy policy</a></li>
              <li><a routerLink="/terms">Terms of service</a></li>
              <li><a routerLink="/disclaimer">Disclaimer</a></li>
            </ul>
          </section>
        </div>
        <div class="site-footer__legal">
          <p>
            <strong>Estimates only.</strong> These calculators are for guidance. They are not financial, tax or legal advice
            and may differ from your payslip or an agency's own computation. Confirm important figures with your employer,
            SSS, PhilHealth, Pag-IBIG or the BIR. Rates last reviewed {{ reviewed }}.
          </p>
          <p>
            phcalculators.com may earn a commission if you apply for loans or services through sponsored links. Sponsored
            offers are labelled and are never part of a calculation.
          </p>
        </div>
      </div>
    </footer>
  `,
})
export class SiteFooterComponent {
  readonly tools = TOOLS;
  readonly guides = GUIDES;
  readonly reviewed = formatDate(PH_RULES_LAST_REVIEWED);
}
