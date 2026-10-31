#!/usr/bin/env node
// Renders the 1200x630 social preview images in src/assets/og/ with headless Chrome or Edge.
// One per calculator and guide (titles and descriptions come from src/app/core/config/tools.ts) plus default.png.
// Usage: node scripts/og-images.js        (set CHROME_PATH if the browser is not found)
// Re-run after renaming a tool or guide, then commit the PNGs.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'src', 'assets', 'og');
const catalog = fs.readFileSync(path.join(root, 'src', 'app', 'core', 'config', 'tools.ts'), 'utf8');
// The full logo with its descriptor line, built by scripts/brand-assets.js.
const logo = fs.readFileSync(path.join(root, 'src', 'assets', 'logo', 'ph-calculators-logo.png')).toString('base64');

const browser = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => p && fs.existsSync(p));
if (!browser) {
  console.error('Chrome or Edge not found. Set CHROME_PATH.');
  process.exit(1);
}

// Each catalog entry lists title, description and route in that order.
const unquote = (s) => s.replace(/\\'/g, "'");
const pages = [...catalog.matchAll(/title: '((?:[^'\\]|\\.)*)',\s*description: '((?:[^'\\]|\\.)*)',\s*route: '([^']+)'/g)]
  .filter((m) => m[3] !== '/rates' && m[3] !== '/saved')
  .map((m) => ({ slug: m[3].split('/').pop(), title: unquote(m[1]), text: unquote(m[2]), kind: m[3].startsWith('/articles/') ? 'Guide' : 'Calculator' }));
pages.push({
  slug: 'default',
  title: 'Philippine salary, tax & loan calculators',
  text: 'Net pay, withholding tax, SSS, PhilHealth and Pag-IBIG contributions, 13th month pay, MP2 and loans.',
  kind: 'Free calculators',
});

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = (p) => `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body { font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif; color: #0e1520;
    background: #f5f6f8; display: flex; flex-direction: column; padding: 56px 72px 0; position: relative; }
  body::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 14px;
    background: linear-gradient(90deg, #1b4dd6 0 70%, #f2c200 70% 85%, #d0312d 85%); }
  .brand { display: block; height: 96px; width: auto; align-self: flex-start; }
  .kind { margin-top: 40px; font-size: 26px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #435063; }
  h1 { margin-top: 12px; font-size: ${p.title.length > 34 ? 66 : 80}px; line-height: 1.08; letter-spacing: -.025em; max-width: 1000px; }
  p { margin-top: 24px; font-size: 32px; line-height: 1.35; color: #435063; max-width: 980px; }
  footer { margin-top: auto; height: 84px; display: flex; align-items: center; justify-content: space-between;
    border-top: 2px solid #e0e5ec; font-size: 26px; color: #435063; }
  footer strong { color: #0e1520; }
</style></head><body>
  <img class="brand" src="data:image/png;base64,${logo}" alt="PH Calculators">
  <div class="kind">${esc(p.kind)}</div>
  <h1>${esc(p.title)}</h1>
  <p>${esc(p.text)}</p>
  <footer><span><strong>phcalculators.com</strong></span><span>Free · Shows the working · Official rates</span></footer>
</body></html>`;

fs.mkdirSync(outDir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'));
for (const p of pages) {
  const file = path.join(tmp, `${p.slug}.html`);
  const out = path.join(outDir, `${p.slug}.png`);
  fs.writeFileSync(file, html(p));
  execFileSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1200,630', `--screenshot=${out}`, `file:///${file.replace(/\\/g, '/')}`], { stdio: 'ignore' });
  console.log(`${path.relative(root, out)}  ${p.title}`);
}
fs.rmSync(tmp, { recursive: true, force: true });
