import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CatalogItem, catalogItem } from '../../core/config/tools';
import { ToolCardComponent } from './tool-card.component';

// "Keep going" links at the end of a calculator or guide, from the page's `related` list in the catalog.
@Component({
  selector: 'app-related',
  imports: [ToolCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length) {
      <section class="section" aria-labelledby="related-title">
        <h2 id="related-title">Related calculators &amp; guides</h2>
        <div class="grid grid--3">
          @for (item of items(); track item.route) {
            <app-tool-card [item]="item" [cta]="item.route.startsWith('/articles/') ? 'Read' : 'Open'" />
          }
        </div>
      </section>
    }
  `,
})
export class RelatedComponent {
  route = input.required<string>();
  readonly items = computed(() =>
    (catalogItem(this.route())?.related ?? []).map((r) => catalogItem(r)).filter((i): i is CatalogItem => !!i),
  );
}
