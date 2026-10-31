import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const SITE = {
  name: 'PH Calculators',
  origin: 'https://www.phcalculators.com',
  defaultDescription:
    'Free Philippine calculators for net pay, withholding tax, SSS, PhilHealth and Pag-IBIG contributions, 13th month pay, MP2 and loan amortization.',
  defaultImage: '/assets/og/default.png',
};

// Search results show about 60 characters of a title, so the brand is added only when it fits.
const MAX_TITLE = 60;
const INDEXABLE = 'index, follow, max-image-preview:large, max-snippet:-1';

export interface PageArticle {
  published: string;
  modified: string;
}

// Route data read here: `description`, `robots` (e.g. 'noindex, follow'), `image` (path under the site root),
// `article` (dates for guides) and `crumb` (short breadcrumb name when the title is long).
// Registered as the router's TitleStrategy, so it runs once per navigation with the final snapshot,
// after the page component has been created.
@Injectable({ providedIn: 'root' })
export class SeoService extends TitleStrategy {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly doc = inject(DOCUMENT);
  // Set by the page being activated; written (or removed) when its navigation completes.
  private pageSchema: object | object[] | null = null;

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route: ActivatedRouteSnapshot = snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const data = route.data;

    const pageTitle = this.buildTitle(snapshot) ?? SITE.name;
    const fullTitle = withBrand(pageTitle);
    const description: string = data['description'] || SITE.defaultDescription;
    const path = canonicalPath(snapshot.url);
    const url = `${SITE.origin}${path}`;
    const image = `${SITE.origin}${data['image'] || SITE.defaultImage}`;
    const article: PageArticle | undefined = data['article'];

    this.title.setTitle(fullTitle);
    this.setTag('name', 'description', description);
    this.setTag('name', 'robots', data['robots'] || INDEXABLE);

    this.setTag('property', 'og:title', fullTitle);
    this.setTag('property', 'og:description', description);
    this.setTag('property', 'og:type', article ? 'article' : 'website');
    this.setTag('property', 'og:url', url);
    this.setTag('property', 'og:image', image);
    this.setTag('name', 'twitter:title', fullTitle);
    this.setTag('name', 'twitter:description', description);
    this.setTag('name', 'twitter:image', image);

    this.setCanonical(url);

    const crumbs = breadcrumbs(path, data['crumb'] || pageTitle);
    const graph: object[] = [];
    if (crumbs.length > 1) {
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${SITE.origin}${c.path}` })),
      });
    }
    if (article) {
      graph.push({
        '@type': 'Article',
        headline: pageTitle,
        description,
        image,
        datePublished: article.published,
        dateModified: article.modified,
        inLanguage: 'en-PH',
        mainEntityOfPage: url,
        author: { '@id': `${SITE.origin}/#organization` },
        publisher: { '@id': `${SITE.origin}/#organization` },
      });
    }
    this.setJsonLd('ld-route', graph.length ? { '@context': 'https://schema.org', '@graph': graph } : null);
    this.setJsonLd('ld-page', this.pageSchema);
    this.pageSchema = null;
  }

  /**
   * Page-specific JSON-LD (calculator, FAQ). Call it from the page component's constructor: the router creates the
   * component before the navigation completes, so the schema is written then and dropped on the next page unless set again.
   */
  setSchema(data: object | object[] | null) {
    this.pageSchema = data;
  }

  private setJsonLd(id: string, data: object | null) {
    let script = this.doc.getElementById(id) as HTMLScriptElement | null;
    if (!data) {
      script?.remove();
      return;
    }
    if (!script) {
      script = this.doc.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      this.doc.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  private setTag(key: 'name' | 'property', value: string, content: string) {
    this.meta.updateTag({ [key]: value, content });
  }

  private setCanonical(url: string) {
    let link = this.doc.head.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}

export function withBrand(title: string): string {
  if (title.includes(SITE.name)) return title;
  const branded = `${title} | ${SITE.name}`;
  return branded.length <= MAX_TITLE ? branded : title;
}

// Query strings (shared results, ?q= search) and fragments never change the canonical page.
export function canonicalPath(url: string): string {
  const path = url.split(/[?#]/)[0] || '/';
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

function breadcrumbs(path: string, name: string): { name: string; path: string }[] {
  if (path === '/') return [{ name: 'Home', path: '/' }];
  const crumbs = [{ name: 'Home', path: '/' }];
  if (path.startsWith('/articles/')) crumbs.push({ name: 'Guides', path: '/articles' });
  crumbs.push({ name, path });
  return crumbs;
}
