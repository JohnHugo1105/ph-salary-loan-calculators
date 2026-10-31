#!/usr/bin/env node
// Builds every logo file the site serves from the two source logos in branding/, with headless Chrome or Edge:
// favicon.ico, the favicon and app-icon PNGs, the apple-touch icon, the header logo (light and dark) and the
// full logo used on the share images.
// Usage: node scripts/brand-assets.js        (set CHROME_PATH if the browser is not found)
// Re-run after replacing branding/ph-calculators-icon.png or branding/ph-calculators-logo.png, then commit the
// outputs and re-run scripts/og-images.js.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'src', 'assets');
const source = (file) => 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'branding', file)).toString('base64');

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

// Header logo height in CSS pixels (see .brand__logo); drawn at 3x so it stays sharp on phones.
const HEADER_H = 36;
// Dark-theme colours for the header lettering: --text and --brand from the dark tokens.
const DARK_TEXT = [234, 240, 248];
const DARK_BRAND = [138, 174, 255];

// Runs in the browser. Everything is drawn on canvases and returned as data URLs.
function build({ iconSrc, logoSrc, headerH, darkText, darkBrand }) {
  const load = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
  const pixels = (c) => c.getContext('2d').getImageData(0, 0, c.width, c.height);
  const fromImage = (img) => {
    const c = canvas(img.naturalWidth, img.naturalHeight);
    c.getContext('2d').drawImage(img, 0, 0);
    return c;
  };
  // Box around the pixels that are not (nearly) transparent, within columns x0..x1.
  const bbox = (c, x0 = 0, x1 = c.width) => {
    const { data, width, height } = pixels(c);
    let l = width, r = -1, t = height, b = -1;
    for (let y = 0; y < height; y++) {
      for (let x = x0; x < x1; x++) {
        if (data[(y * width + x) * 4 + 3] > 16) {
          l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y);
        }
      }
    }
    return { x: l, y: t, w: r - l + 1, h: b - t + 1 };
  };
  const crop = (c, { x, y, w, h }) => {
    const out = canvas(w, h);
    out.getContext('2d').drawImage(c, x, y, w, h, 0, 0, w, h);
    return out;
  };
  // Downscale in halving steps so the small sizes stay smooth.
  const scale = (c, w, h) => {
    let cur = c;
    while (cur.width / 2 >= w && cur.height / 2 >= h) {
      const next = canvas(Math.round(cur.width / 2), Math.round(cur.height / 2));
      const ctx = next.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(cur, 0, 0, next.width, next.height);
      cur = next;
    }
    const out = canvas(w, h);
    const ctx = out.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur, 0, 0, w, h);
    return out;
  };
  // The icon centred on a square of `size`, filling `inset` of it, over an optional background colour.
  const square = (icon, size, inset = 1, bg = null) => {
    const out = canvas(size, size);
    const ctx = out.getContext('2d');
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
    }
    const d = Math.round(size * inset);
    ctx.drawImage(scale(icon, d, d), Math.round((size - d) / 2), Math.round((size - d) / 2));
    return out;
  };
  const png = (c) => c.toDataURL('image/png');

  return Promise.all([load(iconSrc), load(logoSrc)]).then(([iconImg, logoImg]) => {
    // Icon: trim the transparent margin and pad to a square.
    const iconRaw = fromImage(iconImg);
    const ib = bbox(iconRaw);
    const side = Math.max(ib.w, ib.h);
    const icon = canvas(side, side);
    icon.getContext('2d').drawImage(iconRaw, ib.x, ib.y, ib.w, ib.h, Math.round((side - ib.w) / 2), Math.round((side - ib.h) / 2), ib.w, ib.h);
    // The calculator body colour, read from its left edge, fills behind the icons that must be opaque.
    const [r, g, b] = icon.getContext('2d').getImageData(Math.round(side * 0.03), Math.round(side / 2), 1, 1).data;
    const body = `rgb(${r} ${g} ${b})`;

    const out = { files: {}, info: {} };
    for (const s of [16, 32, 48, 96, 192, 512]) out.files[`favicon-${s}`] = png(square(icon, s));
    out.files['apple-touch-icon'] = png(square(icon, 180, 1, body));
    // Maskable: the launcher crops to a circle of 80% of the size, so the keypad sits well inside it.
    out.files['maskable-512'] = png(square(icon, 512, 0.7, body));

    // Logo: trim, then split it into the icon (left), the name and the descriptor line under the name.
    const logoRaw = fromImage(logoImg);
    const logo = crop(logoRaw, bbox(logoRaw));
    const { data, width, height } = pixels(logo);
    const opaque = (x, y) => data[(y * width + x) * 4 + 3] > 16;
    const colHas = (x) => { for (let y = 0; y < height; y++) if (opaque(x, y)) return true; return false; };
    let iconRight = 0;
    while (iconRight < width && colHas(iconRight)) iconRight++;
    let textLeft = iconRight;
    while (textLeft < width && !colHas(textLeft)) textLeft++;
    const rowHas = (y) => { for (let x = textLeft; x < width; x++) if (opaque(x, y)) return true; return false; };
    let nameTop = 0;
    while (nameTop < height && !rowHas(nameTop)) nameTop++;
    let nameBottom = nameTop;
    while (nameBottom < height && rowHas(nameBottom)) nameBottom++;

    // Header logo: icon + name without the descriptor (too small to read at header size), name centred on the icon.
    const iconBox = bbox(logo, 0, iconRight);
    const nameH = nameBottom - nameTop;
    const header = canvas(width, iconBox.h);
    const hctx = header.getContext('2d');
    hctx.drawImage(logo, 0, iconBox.y, iconRight, iconBox.h, 0, 0, iconRight, iconBox.h);
    hctx.drawImage(logo, textLeft, nameTop, width - textLeft, nameH, textLeft, Math.round((iconBox.h - nameH) / 2), width - textLeft, nameH);
    const headerTrim = crop(header, bbox(header));
    const hh = headerH * 3;
    const hw = Math.round((headerTrim.width * hh) / headerTrim.height);
    const light = scale(headerTrim, hw, hh);

    // Dark header logo: same shapes, lettering recoloured. Blue letters (PH) become the dark brand blue,
    // navy letters become the dark text colour. The icon keeps its colours.
    const dark = canvas(hw, hh);
    dark.getContext('2d').drawImage(light, 0, 0);
    const img = pixels(dark);
    const iconEnd = Math.ceil((iconRight * hh) / headerTrim.height);
    for (let y = 0; y < hh; y++) {
      for (let x = iconEnd; x < hw; x++) {
        const i = (y * hw + x) * 4;
        if (!img.data[i + 3]) continue;
        const [nr, ng, nb] = img.data[i + 2] - img.data[i] > 100 ? darkBrand : darkText;
        img.data[i] = nr; img.data[i + 1] = ng; img.data[i + 2] = nb;
      }
    }
    dark.getContext('2d').putImageData(img, 0, 0);
    out.files['logo-header'] = light.toDataURL('image/webp', 0.9);
    out.files['logo-header-dark'] = dark.toDataURL('image/webp', 0.9);
    out.info.header = { width: Math.round(hw / 3), height: headerH };

    // Full logo with the descriptor, for the share images.
    const fw = 1200;
    out.files['logo-full'] = png(scale(logo, fw, Math.round((logo.height * fw) / logo.width)));
    return out;
  });
}

const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><pre id="out"></pre><script>
  (${build.toString()})(${JSON.stringify({ iconSrc: source('ph-calculators-icon.png'), logoSrc: source('ph-calculators-logo.png'), headerH: HEADER_H, darkText: DARK_TEXT, darkBrand: DARK_BRAND })})
    .then((r) => { document.getElementById('out').textContent = JSON.stringify(r); })
    .catch((e) => { document.getElementById('out').textContent = JSON.stringify({ error: String(e) }); });
</script></body></html>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-'));
const page = path.join(tmp, 'build.html');
fs.writeFileSync(page, html);
const dom = execFileSync(browser, ['--headless=new', '--disable-gpu', '--virtual-time-budget=30000', '--dump-dom', `file:///${page.replace(/\\/g, '/')}`],
  { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(tmp, { recursive: true, force: true });

const json = dom.match(/<pre id="out">([^<]*)<\/pre>/);
if (!json || !json[1]) {
  console.error('The browser did not return any images.');
  process.exit(1);
}
const result = JSON.parse(json[1]);
if (result.error) {
  console.error(result.error);
  process.exit(1);
}
const bytes = (dataUrl) => Buffer.from(dataUrl.split(',')[1], 'base64');

// favicon.ico holding the 16, 32 and 48 px PNGs.
function ico(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size % 256, e);
    header.writeUInt8(size % 256, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((im) => im.data)]);
}

const f = result.files;
const outputs = {
  'src/favicon.ico': ico([16, 32, 48].map((size) => ({ size, data: bytes(f[`favicon-${size}`]) }))),
  'src/assets/favicon-48x48.png': bytes(f['favicon-48']),
  'src/assets/favicon-96x96.png': bytes(f['favicon-96']),
  'src/assets/favicon-192x192.png': bytes(f['favicon-192']),
  'src/assets/favicon-512x512.png': bytes(f['favicon-512']),
  'src/assets/favicon-maskable-512x512.png': bytes(f['maskable-512']),
  'src/assets/apple-touch-icon.png': bytes(f['apple-touch-icon']),
  'src/assets/logo/logo-header.webp': bytes(f['logo-header']),
  'src/assets/logo/logo-header-dark.webp': bytes(f['logo-header-dark']),
  'src/assets/logo/ph-calculators-logo.png': bytes(f['logo-full']),
};
fs.mkdirSync(path.join(assets, 'logo'), { recursive: true });
for (const [file, data] of Object.entries(outputs)) {
  fs.writeFileSync(path.join(root, file), data);
  console.log(`${file}  ${(data.length / 1024).toFixed(1)} KB`);
}
const { width, height } = result.info.header;
console.log(`Header logo: ${width}x${height} CSS px (set these as the width/height of the header <img>s).`);
