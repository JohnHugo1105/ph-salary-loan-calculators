import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DOCUMENT } from '@angular/core';
import { SaveShareService } from '../services/save-share.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from './icon.component';

// Copy / link / save / print for a calculation. The page supplies the plain-text summary and
// the (small) object that recreates the inputs from a shared link.
@Component({
  selector: 'app-result-actions',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cluster no-print" style="--gap:var(--space-2)">
      <button type="button" class="btn btn--sm" (click)="copySummary()"><app-icon name="copy" [size]="16" /> Copy summary</button>
      @if (shareData()) {
        <button type="button" class="btn btn--sm" (click)="copyLink()"><app-icon name="link" [size]="16" /> Copy link</button>
      }
      @if (saveKey()) {
        <button type="button" class="btn btn--sm" (click)="save()"><app-icon name="bookmark" [size]="16" /> Save</button>
      }
      <button type="button" class="btn btn--sm btn--ghost" (click)="print()"><app-icon name="printer" [size]="16" /> Print</button>
    </div>
  `,
})
export class ResultActionsComponent {
  summary = input.required<string>();
  shareData = input<Record<string, unknown> | null>(null);
  saveKey = input<string | null>(null);

  private readonly share = inject(SaveShareService);
  private readonly toast = inject(ToastService);
  private readonly doc = inject(DOCUMENT);

  async copySummary() {
    await this.copy(this.summary(), 'Summary copied');
  }

  async copyLink() {
    const data = this.shareData();
    const link = data ? this.share.generateShareLink(data) : '';
    if (link) await this.copy(link, 'Link copied');
  }

  save() {
    const key = this.saveKey();
    if (!key) return;
    const ok = this.share.saveCalculation(key, { ...(this.shareData() ?? {}), summary: this.summary() });
    this.toast.show(ok ? 'Saved in this browser' : 'Could not save');
  }

  print() {
    this.doc.defaultView?.print();
  }

  private async copy(text: string, message: string) {
    try {
      await this.doc.defaultView?.navigator.clipboard.writeText(text);
      this.toast.show(message);
    } catch {
      this.toast.show('Copy is not available here');
    }
  }
}
