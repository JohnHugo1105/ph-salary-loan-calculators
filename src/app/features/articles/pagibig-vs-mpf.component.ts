import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { guideFor } from '../../core/config/tools';
import { SeoService } from '../../core/services/seo.service';
import { formatDate, formatPeso, formatPercent } from '../../shared/format';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { RelatedComponent } from '../../shared/ui/related.component';
import { computeMPF, computePagIbig, computeSSS } from '../../shared/utils/ph-calculators.util';
import { PH_RULES } from '../../shared/utils/ph-rules';

// Payslip lines for one salary, from the same engine as the calculators.
function payslip(salary: number) {
  const sss = computeSSS(salary, false);
  const mpf = computeMPF(salary);
  return {
    salary: formatPeso(salary, 0),
    sss: formatPeso(sss.employee),
    mpf: formatPeso(mpf.employee),
    total: formatPeso(sss.employee + mpf.employee),
    pagibig: formatPeso(computePagIbig(salary).employee),
  };
}

@Component({
  selector: 'app-article-pagibig-vs-mpf',
  imports: [RouterLink, PageHeaderComponent, RelatedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagibig-vs-mpf.component.html',
})
export class PagibigVsMpfArticleComponent {
  readonly updated = formatDate(guideFor('/articles/pagibig-vs-mpf')!.updated);
  readonly r = {
    sssTotal: formatPercent(PH_RULES.sss.totalRate * 100),
    sssEmployee: formatPercent(PH_RULES.sss.employeeRate * 100),
    sssEmployer: formatPercent(PH_RULES.sss.employerRate * 100),
    regularMax: formatPeso(PH_RULES.sss.regularMscMax, 0),
    mscMax: formatPeso(PH_RULES.sss.mscMax, 0),
    // The MSC rounds to the nearest step, so the first salary with an MSC above the regular cap is half a step above it.
    mpfFrom: formatPeso(PH_RULES.sss.regularMscMax + PH_RULES.sss.mscStep / 2, 0),
    pagibigEmployee: formatPercent(PH_RULES.pagibig.employeeRate * 100),
    pagibigEmployer: formatPercent(PH_RULES.pagibig.employerRate * 100),
    pagibigCap: formatPeso(PH_RULES.pagibig.maxFundSalary, 0),
  };
  readonly example = payslip(25_000);
  readonly max = payslip(PH_RULES.sss.mscMax);
  readonly low = payslip(18_000);

  readonly faq = [
    {
      q: 'What does MPF mean on my payslip?',
      a: `MPF is the SSS Mandatory Provident Fund, also called the Workers’ Investment and Savings Program (WISP). The MPF line is the part of your SSS contribution computed on your Monthly Salary Credit above ${this.r.regularMax}. It goes into your own retirement savings account inside SSS.`,
    },
    {
      q: 'Is MPF an extra deduction on top of SSS?',
      a: `No. It is part of the same ${this.r.sssTotal} SSS contribution, shown on its own line. On a ${this.example.salary} salary you pay ${this.example.sss} regular SSS and ${this.example.mpf} MPF, ${this.example.total} in all, which is ${this.r.sssEmployee} of your Monthly Salary Credit.`,
    },
    {
      q: 'Why is there no MPF on my payslip?',
      a: `MPF only applies when your Monthly Salary Credit is above ${this.r.regularMax}, which starts at a monthly salary of about ${this.r.mpfFrom}. Below that, your whole SSS contribution goes to the regular SSS program and the MPF line is zero or missing.`,
    },
    {
      q: 'Is MPF the same as Pag-IBIG?',
      a: `No. MPF is part of SSS. Pag-IBIG (HDMF) is a separate fund with its own payslip line: ${this.r.pagibigEmployee} of your salary up to ${this.r.pagibigCap}, so at most ${this.max.pagibig} a month.`,
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
