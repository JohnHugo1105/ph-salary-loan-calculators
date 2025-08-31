import { Injectable, Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly siteName = 'PH Salary & Loan Calculators';
  private readonly defaultDescription = 'Free Philippines calculators for SSS, Pag-IBIG, PhilHealth, MPF contributions, salary net pay, tax, 13th month, and loan amortization.';
  private readonly image = 'assets/app-icon.png';

  constructor(private meta: Meta, private title: Title, private router: Router, private route: ActivatedRoute, @Inject(DOCUMENT) private doc: Document) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      const deepest = this.getDeepest(this.route);
      const data = deepest?.snapshot?.data || {};
      const pageTitle: string = data['title'] || this.title.getTitle() || this.siteName;
      const fullTitle = pageTitle.includes(this.siteName) ? pageTitle : `${pageTitle} • ${this.siteName}`;
      this.title.setTitle(fullTitle);

      const desc: string = data['description'] || this.defaultDescription;
      const url = this.doc?.location?.href || '/';

      this.setTag('name', 'description', desc);
      this.setTag('property', 'og:title', fullTitle);
      this.setTag('property', 'og:description', desc);
      this.setTag('property', 'og:type', 'website');
      this.setTag('property', 'og:url', url);
      this.setTag('property', 'og:image', this.image);

      this.setTag('name', 'twitter:card', 'summary_large_image');
      this.setTag('name', 'twitter:title', fullTitle);
      this.setTag('name', 'twitter:description', desc);
      this.setTag('name', 'twitter:image', this.image);

      this.updateCanonical(url);
    });
  }

  private getDeepest(route: ActivatedRoute): ActivatedRoute | null {
    let r: ActivatedRoute | null = route;
    while (r?.firstChild) r = r.firstChild;
    return r;
  }

  private setTag(selectorKey: 'name' | 'property', selectorVal: string, content: string) {
    const selector: any = {};
    selector[selectorKey] = selectorVal;
    this.meta.updateTag({ ...selector, content });
  }

  private updateCanonical(url: string) {
    let link: HTMLLinkElement | null = this.doc.querySelector("link[rel='canonical']");
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
