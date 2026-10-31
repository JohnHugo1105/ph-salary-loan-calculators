import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '../../core/services/seo.service';
import { formatPeso } from '../../shared/format';
import { SaveShareService } from '../../shared/services/save-share.service';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { CalloutComponent } from '../../shared/ui/callout.component';
import { FieldComponent } from '../../shared/ui/field.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { RelatedComponent } from '../../shared/ui/related.component';
import { ResultActionsComponent } from '../../shared/ui/result-actions.component';
import { ResultBarComponent } from '../../shared/ui/result-bar.component';
import { SponsoredComponent } from '../../shared/ui/sponsored.component';
import { explainContributions } from '../../shared/utils/explain';
import { computeContributions, computeSssMsc } from '../../shared/utils/ph-calculators.util';
import { PH_RULES } from '../../shared/utils/ph-rules';

@Component({
  selector: 'app-contributions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DecimalPipe, RouterLink, ThousandsSeparatorDirective, FieldComponent, CalloutComponent,
    PageHeaderComponent, ResultActionsComponent, ResultBarComponent, SponsoredComponent, RelatedComponent,
  ],
  templateUrl: './contributions.component.html',
})
export class ContributionsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(SeoService);
  private readonly share = inject(SaveShareService);

  form = this.fb.group({
    monthlySalary: [30000, [Validators.required, Validators.min(1)]],
    includeSSSEC: [true],
  });

  readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly salary = computed(() => Number(this.formValue().monthlySalary) || 0);
  readonly result = computed(() => computeContributions(this.salary(), { includeSSSEC: !!this.formValue().includeSSSEC }));
  readonly msc = computed(() => computeSssMsc(this.salary()));
  readonly why = computed(() => explainContributions(this.salary()));
  readonly regularCap = PH_RULES.sss.regularMscMax;

  readonly shareData = computed(() => ({ ...this.formValue() }) as Record<string, unknown>);
  readonly summary = computed(() => {
    const r = this.result();
    const row = (name: string, x: { employee: number; employer: number }) => `${name}: you ${formatPeso(x.employee)}, employer ${formatPeso(x.employer)}`;
    return [
      `Government contributions on ${formatPeso(this.salary())} a month`,
      row('SSS', r.sss), row('MPF/WISP', r.mpf), row('PhilHealth', r.philhealth), row('Pag-IBIG', r.pagibig),
      `Total: you ${formatPeso(r.totals.employee)}, employer ${formatPeso(r.totals.employer)}`,
      'Computed at phcalculators.com/contributions',
    ].join('\n');
  });

  // Worked example for the guide below, generated from the same engine as the calculator.
  readonly example = (() => {
    const salary = 25_000;
    const c = computeContributions(salary, { includeSSSEC: false });
    const regularMsc = Math.min(computeSssMsc(salary), PH_RULES.sss.regularMscMax);
    const wispBase = computeSssMsc(salary) - regularMsc;
    return {
      salary,
      msc: computeSssMsc(salary),
      regularMsc,
      wispBase,
      regularSss: c.sss.employee,
      wisp: c.mpf.employee,
      philhealthTotal: c.philhealth.total,
      philhealth: c.philhealth.employee,
      pagibig: c.pagibig.employee,
      total: c.totals.employee,
    };
  })();

  constructor() {
    this.share.restoreInto(this.form, inject(ActivatedRoute).snapshot.queryParamMap.get('data'));
    this.seo.setSchema([
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            'name': 'SSS, PhilHealth, Pag-IBIG Contributions Calculator',
            'operatingSystem': 'Web',
            'applicationCategory': 'FinanceApplication',
            'url': 'https://www.phcalculators.com/contributions',
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'PHP'
            },
            'featureList': 'Compute SSS, PhilHealth, Pag-IBIG, and MPF shares'
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': [
              {
                '@type': 'Question',
                'name': 'What is WISP in SSS?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'The Worker\'s Investment and Savings Program (WISP) is a mandatory provident fund managed by SSS. It serves as an additional retirement savings program on top of the regular SSS pension for members whose Monthly Salary Credit (MSC) exceeds ₱20,000.'
                }
              },
              {
                '@type': 'Question',
                'name': 'What is the PhilHealth premium rate and income ceiling?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Under the Universal Health Care (UHC) Law the PhilHealth premium is 5.0% of monthly basic salary, shared equally by employer and employee. The income floor is ₱10,000 and the ceiling is ₱100,000, so the total monthly premium ranges from ₱500 to ₱5,000.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Can I voluntarily pay more than the mandatory ₱200 Pag-IBIG contribution?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Yes, you can opt to increase your monthly Pag-IBIG Regular Savings contribution beyond the mandatory ₱200 (2% of the ₱10,000 maximum fund salary) to save more. However, many Filipinos choose to enroll in the separate voluntary Modified Pag-IBIG II (MP2) program instead, as it traditionally yields higher dividends.'
                }
              }
            ]
          }
        ]);
  }
}
