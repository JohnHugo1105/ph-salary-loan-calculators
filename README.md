# PH Calculators

Free Philippine salary, tax, contribution and loan calculators (phcalculators.com). Built with Angular 21,
server-side prerendered and hosted on Azure Static Web Apps.

## Commands

| Command | What it does |
| --- | --- |
| `npm start` | Dev server on http://localhost:4200 |
| `npm run build` | Production build with prerendering into `dist/ph-calculators/browser` |
| `npm test` | Unit tests (Karma + Jasmine, needs Chrome) |
| `node scripts/check-contrast.js` | Checks the design tokens against WCAG contrast minimums |

## Where things live

```
src/styles/               Design system: tokens, base, layout, components, prose
src/app/core/config/      tools.ts: the catalog that drives the menu, homepage, footer and search
src/app/layout/           App shell: header, footer, search palette, cookie notice, toast
src/app/shared/ui/        Reusable UI: field, segmented control, breakdown, callout, charts, ...
src/app/shared/utils/     ph-rules.ts (all rates), ph-calculators.util.ts (formulas), explain.ts
src/app/features/         One folder per page
```

## Rates and rules

Every government rate and limit lives in **`src/app/shared/utils/ph-rules.ts`** with its effective date and
source. The calculators, the guides' worked examples, the tax tables and the **Rates & sources** page all read
from it, so they cannot disagree.

To update a rate:

1. Change the value (and `effective` / `source`) in `ph-rules.ts` and update `PH_RULES_LAST_REVIEWED`.
2. Update the expectations in `ph-calculators.util.spec.ts`. They are checked against official worked examples
   and bracket boundaries, so a wrong edit fails loudly.
3. If a rule rests on secondary sources, keep its `status: 'confirm'` on the Rates page
   (`features/rates/rates.component.ts`).

## Design system

- **Themes:** light by default; dark follows the OS unless the visitor picks one (`data-theme` on `<html>`,
  stored in `localStorage` as `theme`). All colours are CSS custom properties in `src/styles/_tokens.scss`.
  After changing a colour, run `node scripts/check-contrast.js`.
- **Layout:** every calculator uses the same shape: inputs on the left, results on the right (stacked on phones
  with a sticky result bar). Results show the working: use `app-breakdown` rows with a `formula`.
- **Forms:** use `app-field` around a native `<input>`/`<select>`. It wires up the label, hint, error and ARIA
  attributes. Use `app-segmented` for 2-4 mutually exclusive choices.
- **Charts:** small SVG components in `shared/ui/charts`. Series colours are `--series-1..3`, validated for
  colour-blind separation. Every chart has a table view and keyboard support.
- **Icons:** one inline SVG sprite (`shared/ui/icon-sprite.component.html`), used through `<app-icon name="...">`.
- **Sponsored content:** `app-sponsored`, always labelled, never placed between inputs and results.

## Adding a calculator

1. Put the formula in `shared/utils` (pure, with tests) and any rates in `ph-rules.ts`.
2. Create `features/<name>/` using `app-page-header`, the `.tool` layout, `app-field`, `app-breakdown`.
3. Add it to `TOOLS` in `core/config/tools.ts`, a route in `app.routes.ts`, and `src/sitemap.xml`.
4. Add its rules to `features/rates/rates.component.ts`.
5. Support sharing with `SaveShareService.restoreInto(form, ...)` and `app-result-actions`.

## Deployment notes

`src/404.html` is served with a real 404 status by `staticwebapp.config.json` (every real route is prerendered,
so there is no SPA fallback). Check `/does-not-exist` after deploying.
