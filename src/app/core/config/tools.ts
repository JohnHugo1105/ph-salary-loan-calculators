import { IconName } from '../../shared/ui/icon-names';

// One catalog drives the header menu, homepage, footer and search.

export type ToolGroupId = 'salary' | 'benefits' | 'loans' | 'savings';

export interface ToolGroup {
  id: ToolGroupId;
  title: string;
  blurb: string;
}

export interface CatalogItem {
  title: string;
  description: string;
  route: string;
  icon: IconName;
  keywords: string;
  // Routes of the calculators and guides suggested at the end of this page.
  related?: string[];
}

export interface Guide extends CatalogItem {
  // ISO dates for the article's structured data and its "Updated" line.
  published: string;
  updated: string;
}

export interface Tool extends CatalogItem {
  id: string;
  group: ToolGroupId;
  popular?: boolean;
}

export const TOOL_GROUPS: ToolGroup[] = [
  { id: 'salary', title: 'Salary & tax', blurb: 'What lands in your account, and what the BIR takes.' },
  { id: 'benefits', title: 'Government benefits', blurb: 'SSS, PhilHealth and Pag-IBIG contributions and claims.' },
  { id: 'loans', title: 'Loans', blurb: 'Know the monthly cost before you borrow.' },
  { id: 'savings', title: 'Savings', blurb: 'Project what your Pag-IBIG savings can grow to.' },
];

export const TOOLS: Tool[] = [
  {
    id: 'net-pay',
    group: 'salary',
    title: 'Net pay calculator',
    description: 'Take-home pay after SSS, PhilHealth, Pag-IBIG and withholding tax. Works backwards from a target net, too.',
    route: '/net-pay',
    icon: 'banknote',
    keywords: 'salary take home pay tax withholding payslip gross net overtime holiday reverse',
    popular: true,
    related: ['/contributions', '/13th-month-pay', '/tax-tables', '/articles/sss-contribution-2026'],
  },
  {
    id: '13th-month',
    group: 'salary',
    title: '13th month pay',
    description: 'Your pro-rated 13th month pay and how much of it is tax-free.',
    route: '/13th-month-pay',
    icon: 'gift',
    keywords: 'bonus december pro-rated tax exempt 90000',
    popular: true,
    related: ['/net-pay', '/tax-tables', '/mp2-calculator'],
  },
  {
    id: 'tax-tables',
    group: 'salary',
    title: 'Tax & SSS tables',
    description: 'The BIR withholding brackets and SSS contribution schedule, with the working shown.',
    route: '/tax-tables',
    icon: 'table',
    keywords: 'bir train law brackets schedule reference income tax',
    related: ['/net-pay', '/contributions', '/13th-month-pay', '/articles/sss-contribution-2026'],
  },
  {
    id: 'contributions',
    group: 'benefits',
    title: 'SSS, PhilHealth & Pag-IBIG',
    description: 'Employee and employer shares for every mandatory contribution, including MPF/WISP.',
    route: '/contributions',
    icon: 'shield',
    keywords: 'sss philhealth pag-ibig hdmf mpf wisp msc employer share contributions',
    popular: true,
    related: ['/net-pay', '/sss-maternity-benefit', '/sss-salary-loan', '/articles/sss-contribution-2026', '/articles/pagibig-vs-mpf'],
  },
  {
    id: 'maternity',
    group: 'benefits',
    title: 'SSS maternity benefit',
    description: 'Estimate your 105, 120 or 60-day maternity allowance.',
    route: '/sss-maternity-benefit',
    icon: 'heart',
    keywords: 'maternity leave allowance baby delivery miscarriage solo parent ra 11210',
    related: ['/contributions', '/sss-salary-loan', '/net-pay', '/articles/sss-contribution-2026'],
  },
  {
    id: 'amortization',
    group: 'loans',
    title: 'Loan amortization',
    description: 'Monthly payment, total interest and a full payment schedule for any loan.',
    route: '/amortization',
    icon: 'calculator',
    keywords: 'loan car housing personal diminishing balance schedule monthly payment interest',
    popular: true,
    related: ['/pagibig-housing-loan', '/sss-salary-loan', '/mp2-calculator', '/articles/loan-amortization-ph'],
  },
  {
    id: 'sss-loan',
    group: 'loans',
    title: 'SSS salary & emergency loan',
    description: 'Loanable amount, net proceeds and monthly payments.',
    route: '/sss-salary-loan',
    icon: 'landmark',
    keywords: 'sss salary loan emergency loan calamity net proceeds service fee',
    related: ['/amortization', '/contributions', '/pagibig-housing-loan', '/articles/loan-amortization-ph'],
  },
  {
    id: 'housing-loan',
    group: 'loans',
    title: 'Pag-IBIG housing loan',
    description: 'Monthly amortization and the income you need at each repricing period.',
    route: '/pagibig-housing-loan',
    icon: 'home',
    keywords: 'pag-ibig housing loan house mortgage repricing required income',
    related: ['/amortization', '/mp2-calculator', '/sss-salary-loan', '/articles/loan-amortization-ph'],
  },
  {
    id: 'mp2',
    group: 'savings',
    title: 'Pag-IBIG MP2 savings',
    description: 'Project five-year growth with compounding or annual payout.',
    route: '/mp2-calculator',
    icon: 'coins',
    keywords: 'mp2 modified pag-ibig 2 savings dividend investment',
    related: ['/pagibig-housing-loan', '/contributions', '/13th-month-pay', '/articles/pagibig-vs-mpf'],
  },
];

export const GUIDES: Guide[] = [
  {
    title: 'How to compute your SSS contribution',
    description: 'Find your Monthly Salary Credit, apply the 15% rate and split it with your employer, with worked examples.',
    route: '/articles/sss-contribution-2026',
    icon: 'file-text',
    keywords: 'sss msc monthly salary credit contribution table guide employer share',
    published: '2026-05-30',
    updated: '2026-10-31',
    related: ['/contributions', '/net-pay', '/sss-maternity-benefit', '/sss-salary-loan'],
  },
  {
    title: 'What is MPF on your payslip?',
    description: 'What the SSS MPF deduction is, when it starts and how it differs from Pag-IBIG.',
    route: '/articles/pagibig-vs-mpf',
    icon: 'file-text',
    keywords: 'pag-ibig mpf wisp comparison payslip deduction meaning provident fund',
    published: '2025-09-10',
    updated: '2026-11-01',
    related: ['/contributions', '/mp2-calculator', '/pagibig-housing-loan'],
  },
  {
    title: 'Loan amortization 101',
    description: 'How amortization works in the Philippines, with worked examples.',
    route: '/articles/loan-amortization-ph',
    icon: 'file-text',
    keywords: 'loan amortization basics diminishing balance',
    published: '2025-09-10',
    updated: '2026-10-31',
    related: ['/amortization', '/pagibig-housing-loan', '/sss-salary-loan'],
  },
];

export const REFERENCE_PAGES: CatalogItem[] = [
  {
    title: 'Rates & sources',
    description: 'Every rate and limit these calculators use, with its effective date and official source.',
    route: '/rates',
    icon: 'clipboard-check',
    keywords: 'rates sources references effective date official verification',
  },
  {
    title: 'Saved calculations',
    description: 'Calculations you saved in this browser.',
    route: '/saved',
    icon: 'bookmark',
    keywords: 'saved history bookmarks calculations',
  },
];

export interface SearchHit extends CatalogItem {
  kind: 'Calculator' | 'Guide' | 'Reference';
}

const ALL: SearchHit[] = [
  ...TOOLS.map((t): SearchHit => ({ ...t, kind: t.id === 'tax-tables' ? 'Reference' : 'Calculator' })),
  ...GUIDES.map((g): SearchHit => ({ ...g, kind: 'Guide' })),
  ...REFERENCE_PAGES.map((r): SearchHit => ({ ...r, kind: 'Reference' })),
];

// Every word of the query must appear somewhere; title matches rank first.
export function searchCatalog(query: string, limit = 8): SearchHit[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return ALL.map((item) => {
    const title = item.title.toLowerCase();
    const haystack = `${title} ${item.description} ${item.keywords}`.toLowerCase();
    if (!words.every((w) => haystack.includes(w))) return { item, score: -1 };
    const score = words.reduce((s, w) => s + (title.startsWith(w) ? 4 : title.includes(w) ? 3 : 1), 0);
    return { item, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);
}

const BY_ROUTE = new Map<string, CatalogItem>([...TOOLS, ...GUIDES, ...REFERENCE_PAGES].map((i) => [i.route, i]));

export function catalogItem(route: string): CatalogItem | undefined {
  return BY_ROUTE.get(route);
}

export function guideFor(route: string): Guide | undefined {
  return GUIDES.find((g) => g.route === route);
}
