import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GUIDES, TOOLS, TOOL_GROUPS, searchCatalog } from '../../core/config/tools';
import { BreakdownComponent, BreakdownRow } from '../../shared/ui/breakdown.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { SponsoredComponent } from '../../shared/ui/sponsored.component';
import { ToolCardComponent } from '../../shared/ui/tool-card.component';
import { computeContributions, computeWithholdingTax, round2 } from '../../shared/utils/ph-calculators.util';

@Component({
  selector: 'app-home',
  imports: [RouterLink, IconComponent, ToolCardComponent, SponsoredComponent, BreakdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly router = inject(Router);

  readonly groups = TOOL_GROUPS;
  readonly guides = GUIDES;
  readonly popular = TOOLS.filter((t) => t.popular);
  readonly query = signal('');

  // A worked example from the same engine the calculators use, so the homepage can never drift.
  readonly example = (() => {
    const salary = 30_000;
    const c = computeContributions(salary);
    const taxable = salary - c.totals.employee;
    const tax = computeWithholdingTax(taxable);
    const rows: BreakdownRow[] = [
      { label: 'Monthly salary', amount: salary },
      { label: 'SSS', amount: c.sss.employee, kind: 'neg' },
      { label: 'MPF / WISP', amount: c.mpf.employee, kind: 'neg' },
      { label: 'PhilHealth', amount: c.philhealth.employee, kind: 'neg' },
      { label: 'Pag-IBIG', amount: c.pagibig.employee, kind: 'neg' },
      { label: 'Withholding tax', amount: tax, kind: 'neg' },
      { label: 'Take-home pay', amount: round2(salary - c.totals.employee - tax), kind: 'total' },
    ];
    return { salary, rows };
  })();
  readonly results = computed(() => searchCatalog(this.query().trim(), 24));

  constructor() {
    inject(ActivatedRoute).queryParamMap.pipe(takeUntilDestroyed()).subscribe((p) => this.query.set(p.get('q') ?? ''));
  }

  toolsIn(group: string) {
    return TOOLS.filter((t) => t.group === group);
  }

  onSearch(value: string) {
    this.query.set(value);
    void this.router.navigate([], { queryParams: { q: value.trim() || null }, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
