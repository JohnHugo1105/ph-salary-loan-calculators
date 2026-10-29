import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SaveShareService } from '../../shared/services/save-share.service';
import { IconComponent } from '../../shared/ui/icon.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

// Maps each saved calculation key to the calculator that can reopen it.
const CALCULATORS: Record<string, { title: string; route: string }> = {
  'net-pay': { title: 'Net pay', route: '/net-pay' },
  contributions: { title: 'Contributions', route: '/contributions' },
  '13th-month': { title: '13th month pay', route: '/13th-month-pay' },
  'sss-maternity': { title: 'SSS maternity benefit', route: '/sss-maternity-benefit' },
  'sss-loan': { title: 'SSS salary & emergency loan', route: '/sss-salary-loan' },
  'pagibig-housing': { title: 'Pag-IBIG housing loan', route: '/pagibig-housing-loan' },
  mp2: { title: 'Pag-IBIG MP2 savings', route: '/mp2-calculator' },
  amortization: { title: 'Loan amortization', route: '/amortization' },
};

interface SavedItem {
  key: string;
  index: number;
  title: string;
  route: string;
  savedAt: string;
  summary: string;
  link: string;
}

@Component({
  selector: 'app-saved',
  imports: [RouterLink, DatePipe, PageHeaderComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './saved.component.html',
})
export class SavedComponent {
  private readonly share = inject(SaveShareService);

  // Saved calculations live in this browser, so they are read after the first browser render.
  readonly loaded = signal(false);
  private readonly raw = signal<Record<string, any[]>>({});

  readonly items = computed<SavedItem[]>(() => {
    const out: SavedItem[] = [];
    for (const [key, list] of Object.entries(this.raw())) {
      const meta = CALCULATORS[key] ?? { title: key, route: '/' };
      list.forEach((entry, index) => {
        const { savedAt, summary, type: _type, ...inputs } = entry ?? {};
        out.push({
          key,
          index,
          title: meta.title,
          route: meta.route,
          savedAt: savedAt ?? '',
          summary: typeof summary === 'string' ? summary : '',
          link: this.share.encode(inputs),
        });
      });
    }
    return out.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  });

  constructor() {
    afterNextRender(() => {
      this.raw.set(this.share.getAll());
      this.loaded.set(true);
    });
  }

  remove(item: SavedItem) {
    this.share.deleteCalculation(item.key, item.index);
    this.raw.set(this.share.getAll());
  }
}
