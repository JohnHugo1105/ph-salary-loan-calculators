import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '../../core/services/seo.service';
import { formatDate, formatPeso } from '../../shared/format';
import { SaveShareService } from '../../shared/services/save-share.service';
import { ThousandsSeparatorDirective } from '../../shared/thousands-separator.directive';
import { CalloutComponent } from '../../shared/ui/callout.component';
import { FieldComponent } from '../../shared/ui/field.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { RelatedComponent } from '../../shared/ui/related.component';
import { ResultActionsComponent } from '../../shared/ui/result-actions.component';
import { ResultBarComponent } from '../../shared/ui/result-bar.component';
import { explainContributions } from '../../shared/utils/explain';
import { computeContributions, computeSssMsc } from '../../shared/utils/ph-calculators.util';
import { PH_RULES, PH_RULES_LAST_REVIEWED } from '../../shared/utils/ph-rules';

@Component({
  selector: 'app-contributions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DecimalPipe, RouterLink, ThousandsSeparatorDirective, FieldComponent, CalloutComponent,
    PageHeaderComponent, ResultActionsComponent, ResultBarComponent, RelatedComponent,
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
  readonly reviewed = formatDate(PH_RULES_LAST_REVIEWED);

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
    const c = computeContributions(salary);
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
      employer: c.totals.employer,
      both: c.totals.total,
      employerSss: c.sss.employer,
      employerMpf: c.mpf.employer,
      employerPhilhealth: c.philhealth.employer,
      employerPagibig: c.pagibig.employer,
    };
  })();

  readonly floor = (() => {
    const salary = 8_000;
    const c = computeContributions(salary);
    return {
      salary,
      msc: computeSssMsc(salary),
      you: c.totals.employee,
      employer: c.totals.employer,
      sss: c.sss.employee,
      philhealth: c.philhealth.employee,
      pagibig: c.pagibig.employee,
      philhealthTotal: c.philhealth.total,
    };
  })();

  readonly faq = [
    {
      q: 'Why is my deduction smaller than my employer’s?',
      a: `On a salary of ${formatPeso(this.example.salary, 0)} the employee side is ${formatPeso(this.example.total)} and the employer side is ${formatPeso(this.example.employer)}, including the EC premium. SSS is 5% against the employer’s 10% of the same salary credit, PhilHealth is split in half, and Pag-IBIG is 2% each up to the fund-salary cap. The employer’s larger SSS share never appears as a deduction on your payslip.`,
    },
    {
      q: 'What do I pay with no employer?',
      a: `Add the two columns. On ${formatPeso(this.example.salary, 0)} that sum is ${formatPeso(this.example.both)}, and it includes the EC premium this calculator treats as employer-only. Self-employed and voluntary members pay both the employee and employer shares of the salary credit they declare. Whether EC is part of your payment, and the minimum credit for your membership type, are points to confirm with SSS. PhilHealth without an employer is the full premium, not the half an employee sees deducted.`,
    },
    {
      q: 'Does the EC premium come out of my salary?',
      a: `Not in this calculator. Employees’ Compensation is an employer-only amount: ${formatPeso(PH_RULES.sss.ecLow, 0)} when the MSC is below ${formatPeso(PH_RULES.sss.ecMscThreshold, 0)}, otherwise ${formatPeso(PH_RULES.sss.ecHigh, 0)}. Uncheck “Include the employer’s EC premium” and your own column does not move. The employer column does.`,
    },
  ];

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
            mainEntity: this.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          }
        ]);
  }
}
