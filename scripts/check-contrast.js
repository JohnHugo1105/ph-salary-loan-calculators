#!/usr/bin/env node
// Checks the design tokens against WCAG contrast minimums in both themes.
// Usage: node scripts/check-contrast.js [path/to/_tokens.scss]
// Text pairs need 4.5:1; chart series and control borders need 3:1. Exits 1 if any pair fails.
const fs = require('fs');
const src = fs.readFileSync(process.argv[2] || require("path").join(__dirname, "..", "src", "styles", "_tokens.scss"), 'utf8');
function grab(block) {
  const out = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1]] = m[2];
  return out;
}
const darkBlock = src.slice(src.indexOf('@mixin dark-tokens'), src.indexOf(':root {'));
const lightBlock = src.slice(src.indexOf(':root {'), src.indexOf('@media'));
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const pairs = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text-2', 'surface', 4.5], ['text-2', 'bg', 4.5], ['text-3', 'surface', 4.5], ['text-3', 'bg', 4.5], ['text-3', 'surface-2', 4.5],
  ['brand', 'surface', 4.5], ['brand', 'bg', 4.5], ['brand', 'brand-soft', 4.5], ['on-brand', 'brand-solid', 4.5], ['on-brand', 'brand-solid-hover', 4.5],
  ['pos', 'surface', 4.5], ['pos', 'pos-soft', 4.5], ['neg', 'surface', 4.5], ['neg', 'neg-soft', 4.5], ['warn', 'surface', 4.5], ['warn', 'warn-soft', 4.5],
  ['series-1', 'surface', 3], ['series-2', 'surface', 3], ['series-3', 'surface', 3], ['control-border', 'surface', 3], ['control-border', 'bg', 3], ['control-border', 'surface-2', 3], ['focus', 'surface', 3],
];
let bad = 0;
for (const [name, block] of [['light', lightBlock], ['dark', darkBlock]]) {
  const t = grab(block);
  for (const [fg, bg, min] of pairs) {
    if (!t[fg] || !t[bg]) { console.log(`${name}: missing ${fg}/${bg}`); bad++; continue; }
    const r = ratio(t[fg], t[bg]);
    const ok = r >= min;
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(5)} ${fg.padEnd(14)} on ${bg.padEnd(18)} ${r.toFixed(2)} (min ${min})`);
  }
}
console.log(bad ? `\n${bad} failing` : '\nall pairs pass');
process.exit(bad ? 1 : 0);
