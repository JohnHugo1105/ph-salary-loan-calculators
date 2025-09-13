# UI & Color Improvement Recommendations

This guide outlines best-practice improvements for the PH Salary & Loan Calculators web app, focusing on **color system**, **contrast**, and **visual hierarchy**.

---

## 1. Color Contrast & Accessibility

- **Goal:** Achieve WCAG 2.2 AA/AAA compliance for dark theme readability.
- **Action:**
  - Ensure **minimum 4.5:1 contrast** for body text, **3:1 for large text**.
  - Use lighter text (`#E0E0E0` instead of muted gray).
  - Slightly brighten link blue for better visibility.

| Element | Current | Suggested |
|--------|---------|-----------|
| Background | `#0C0C0C` | `#121212` |
| Text (Primary) | `#D0D0D0` | `#E0E0E0` |
| Links | `#1565C0` | `#2979FF` |

Reference: [WCAG 2.2 Contrast Guidelines](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

---

## 2. Establish Primary & Secondary Color Hierarchy

- **Primary Color:** Use for header, active nav links, and CTAs.
- **Secondary/Accent:** Use for highlights, tags, and secondary actions.
- **Action:**
  - Pick a **primary blue** (`#2979FF`) and apply across key elements.
  - Use **accent orange/yellow** (`#FFB300`) for buttons like "Dismiss".

Reference: [Material Design Color System](https://m3.material.io/styles/color/overview)

---

## 3. Emphasize Key Data

- **Action:**
  - Use semantic colors for numbers:
    - Positive values → Green (`#4CAF50`)
    - Deductions → Red/Orange (`#F44336` / `#FF7043`)
    - Totals → Bold & slightly larger font
  - Group results into visually distinct cards with background shading.

---

## 4. Hover & Focus States

- **Action:**
  - Underline or brighten links on hover.
  - Add `:hover` background for cards.
  - Ensure keyboard `:focus` outlines are visible and accessible.

Reference: [WCAG 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)

---

## 5. Brand Consistency & Theming

- **Action:**
  - Define a theme palette with 3–5 key colors.
  - Document usage rules:
    - Primary: For main CTAs & header
    - Secondary: For highlights & navigation
    - Neutral shades: For cards/panels
    - Semantic colors: Success, Warning, Error

---

## 6. Spacing & Readability

- **Action:**
  - Increase `line-height` to `1.5–1.7` for better readability.
  - Add extra `margin` and `padding` between cards and sections.
  - Use grid or flex layout to balance white space.

---

## Example Palette

| Purpose | Color |
|--------|-------|
| Background | `#121212` |
| Card BG | `#1E1E1E` |
| Primary | `#2979FF` |
| Accent | `#FFB300` |
| Success | `#4CAF50` |
| Warning | `#FFC107` |
| Error | `#F44336` |

---

## Implementation Notes

- Use CSS variables for colors (`--primary`, `--accent`, `--bg`, etc.).
- Apply a consistent design system (Material Design or Tailwind).
- Validate with tools like:
  - [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
  - [Colorable](https://colorable.jxnblk.com/)

---

## Expected Outcome

- Better visual hierarchy
- Improved accessibility (WCAG AA/AAA compliant)
- Clearer brand identity
- Modernized dark theme look
- Higher user engagement and scannability
