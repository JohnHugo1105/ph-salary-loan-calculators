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
  },
  {
    id: 'tax-tables',
    group: 'salary',
    title: 'Tax & SSS tables',
    description: 'The BIR withholding brackets and SSS contribution schedule, with the working shown.',
    route: '/tax-tables',
    icon: 'table',
    keywords: 'bir train law brackets schedule reference income tax',
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
  },
  {
    id: 'maternity',
    group: 'benefits',
    title: 'SSS maternity benefit',
    description: 'Estimate your 105, 120 or 60-day maternity allowance.',
    route: '/sss-maternity-benefit',
    icon: 'heart',
    keywords: 'maternity leave allowance baby delivery miscarriage solo parent ra 11210',
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
  },
  {
    id: 'sss-loan',
    group: 'loans',
    title: 'SSS salary & emergency loan',
    description: 'Loanable amount, net proceeds and monthly payments.',
    route: '/sss-salary-loan',
    icon: 'landmark',
    keywords: 'sss salary loan emergency loan calamity net proceeds service fee',
  },
  {
    id: 'housing-loan',
    group: 'loans',
    title: 'Pag-IBIG housing loan',
    description: 'Monthly amortization and the income you need at each repricing period.',
    route: '/pagibig-housing-loan',
    icon: 'home',
    keywords: 'pag-ibig housing loan house mortgage repricing required income',
  },
  {
    id: 'mp2',
    group: 'savings',
    title: 'Pag-IBIG MP2 savings',
    description: 'Project five-year growth with compounding or annual payout.',
    route: '/mp2-calculator',
    icon: 'coins',
    keywords: 'mp2 modified pag-ibig 2 savings dividend investment',
  },
];

export const GUIDES: CatalogItem[] = [
  {
    title: 'How to compute your SSS contribution',
    description: 'Step-by-step guide to your SSS contribution under the current schedule.',
    route: '/articles/sss-contribution-2026',
    icon: 'file-text',
    keywords: 'sss msc contribution guide',
  },
  {
    title: 'Pag-IBIG vs MPF explained',
    description: 'How regular Pag-IBIG savings and the SSS MPF differ on your payslip.',
    route: '/articles/pagibig-vs-mpf',
    icon: 'file-text',
    keywords: 'pag-ibig mpf wisp comparison',
  },
  {
    title: 'Loan amortization 101',
    description: 'How amortization works in the Philippines, with worked examples.',
    route: '/articles/loan-amortization-ph',
    icon: 'file-text',
    keywords: 'loan amortization basics diminishing balance',
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
