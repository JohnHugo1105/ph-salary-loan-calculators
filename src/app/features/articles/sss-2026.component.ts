import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { guideFor } from '../../core/config/tools';
import { SeoService } from '../../core/services/seo.service';
import { formatDate, formatPeso, formatPercent } from '../../shared/format';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { RelatedComponent } from '../../shared/ui/related.component';
import { computeMPF, computeSSS, computeSssMsc, round2 } from '../../shared/utils/ph-calculators.util';
import { PH_RULES } from '../../shared/utils/ph-rules';

// Every figure in this guide comes from ph-rules.ts and the calculator engine, so it cannot drift from the calculators.
function example(salary: number) {
  const msc = computeSssMsc(salary);
  const sss = computeSSS(salary);
  const sssNoEc = computeSSS(salary, false);
  const mpf = computeMPF(salary);
  const ec = round2(sss.employer - sssNoEc.employer);
  return {
    salary: formatPeso(salary, 0),
    msc: formatPeso(msc, 0),
    regularMsc: formatPeso(Math.min(msc, PH_RULES.sss.regularMscMax), 0),
    mpfMsc: formatPeso(Math.max(0, msc - PH_RULES.sss.regularMscMax), 0),
    employeeSss: formatPeso(sss.employee),
    employeeMpf: formatPeso(mpf.employee),
    employee: formatPeso(sss.employee + mpf.employee),
    employerSss: formatPeso(sssNoEc.employer),
    employerMpf: formatPeso(mpf.employer),
    ec: formatPeso(ec),
    employer: formatPeso(sss.employer + mpf.employer),
    total: formatPeso(sss.total + mpf.total),
  };
}

@Component({
  selector: 'app-article-sss-2026',
  imports: [RouterLink, PageHeaderComponent, RelatedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sss-2026.component.html',
})
export class Sss2026ArticleComponent {
  readonly r = {
    total: formatPercent(PH_RULES.sss.totalRate * 100),
    employee: formatPercent(PH_RULES.sss.employeeRate * 100),
    employer: formatPercent(PH_RULES.sss.employerRate * 100),
    mscMin: formatPeso(PH_RULES.sss.mscMin, 0),
    mscMax: formatPeso(PH_RULES.sss.mscMax, 0),
    step: formatPeso(PH_RULES.sss.mscStep, 0),
    half: formatPeso(PH_RULES.sss.mscStep / 2, 0),
    regularMax: formatPeso(PH_RULES.sss.regularMscMax, 0),
    ecThreshold: formatPeso(PH_RULES.sss.ecMscThreshold, 0),
    ecLow: formatPeso(PH_RULES.sss.ecLow, 0),
    ecHigh: formatPeso(PH_RULES.sss.ecHigh, 0),
  };
  readonly updated = formatDate(guideFor('/articles/sss-contribution-2026')!.updated);

  // Walk-through salary, plus a spread for the table: below the EC threshold, below the MPF line, above it, and capped.
  readonly walk = example(18_300);
  readonly examples = [12_000, 18_300, 25_000, 40_000].map(example);
  readonly max = example(PH_RULES.sss.mscMax);

  readonly faq = [
    {
      q: 'What is the SSS contribution rate in 2026?',
      a: `${this.r.total} of your Monthly Salary Credit (MSC): ${this.r.employee} paid by the employee and ${this.r.employer} by the employer. The rate has been ${this.r.total} since January 2025 under RA 11199.`,
    },
    {
      q: 'What is the maximum SSS contribution in 2026?',
      a: `The MSC is capped at ${this.r.mscMax}. At the cap the employee pays ${this.max.employee} a month (${this.max.employeeSss} regular SSS plus ${this.max.employeeMpf} MPF) and the employer pays ${this.max.employer} including the EC premium, ${this.max.total} in total.`,
    },
    {
      q: 'Is the MPF deducted on top of my SSS contribution?',
      a: `No. The MPF (also called WISP) is the part of the same ${this.r.total} contribution that is computed on the MSC above ${this.r.regularMax}. Payslips often show it on a separate line, but it is not an extra charge.`,
    },
    {
      q: 'How much do self-employed and voluntary members pay?',
      a: `Self-employed and voluntary members pay both the employee and the employer share, so the full ${this.r.total} of the MSC they declare. There is no employer to share the cost.`,
    },
  ];

  constructor() {
    inject(SeoService).setSchema({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: this.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }
}
