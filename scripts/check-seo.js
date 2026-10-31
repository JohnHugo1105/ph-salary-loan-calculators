#!/usr/bin/env node
// Checks the prerendered pages for the basics search engines read: title, description, canonical, robots,
// social tags, one h1, valid JSON-LD, sitemap coverage and internal links.
// Usage: npm run build && node scripts/check-seo.js [dist/ph-calculators/browser]
// Exits 1 if any page has an error; warnings are printed but do not fail.
const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://www.phcalculators.com';
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist', 'ph-calculators', 'browser'));
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error(`No build found at ${root}. Run "npm run build" first.`);
  process.exit(1);
}

function pages(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...pages(path.join(dir, entry.name), `${base}/${entry.name}`));
    else if (entry.name === 'index.html') out.push({ route: base || '/', file: path.join(dir, entry.name) });
  }
  return out;
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const attr = (tag, name) => decode(tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1] ?? '');
const meta = (html, key, val) => {
  const tag = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]).find((t) => attr(t, key) === val);
  return tag ? attr(tag, 'content') : null;
};
const count = (html, re) => (html.match(re) || []).length;

const all = pages(root);
const routes = new Set(all.map((p) => p.route));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
const seenTitles = new Map();
const seenDescriptions = new Map();
let errors = 0;
let warnings = 0;

for (const { route, file } of all.sort((a, b) => a.route.localeCompare(b.route))) {
  const html = fs.readFileSync(file, 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  const problems = [];
  const err = (m) => problems.push(['ERROR', m]);
  const warn = (m) => problems.push(['warn ', m]);

  const title = decode(head.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  const description = meta(head, 'name', 'description') ?? '';
  const robots = meta(head, 'name', 'robots') ?? '';
  const noindex = /noindex/.test(robots);
  const canonical = attr(head.match(/<link\b[^>]*rel="canonical"[^>]*>/i)?.[0] ?? '', 'href');
  const expected = `${ORIGIN}${route === '/' ? '/' : route}`;

  if (!title) err('missing <title>');
  else if (title.length > 65) warn(`title is ${title.length} chars (aim for 60 or fewer): "${title}"`);
  if (!description) err('missing meta description');
  else if (!noindex && (description.length > 165 || description.length < 70)) warn(`description is ${description.length} chars (aim for 70-160)`);
  if (canonical !== expected) err(`canonical is "${canonical}", expected "${expected}"`);
  if (meta(head, 'property', 'og:url') !== expected) err(`og:url is "${meta(head, 'property', 'og:url')}"`);
  if (meta(head, 'property', 'og:title') !== title) err('og:title does not match <title>');
  for (const [k, v] of [['property', 'og:image'], ['name', 'twitter:image']]) {
    const img = meta(head, k, v) ?? '';
    if (!img.startsWith(`${ORIGIN}/`)) err(`${v} must be an absolute ${ORIGIN} URL, got "${img}"`);
    else if (!fs.existsSync(path.join(root, img.slice(ORIGIN.length)))) err(`${v} file not found: ${img}`);
  }

  const h1s = count(html, /<h1\b/gi);
  if (h1s !== 1) err(`${h1s} <h1> elements (expected 1)`);

  const types = [];
  for (const m of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = [data].flat().flatMap((d) => d['@graph'] ?? [d]);
      types.push(...nodes.map((n) => n['@type']));
    } catch (e) {
      err(`invalid JSON-LD: ${e.message}`);
    }
  }
  if (!types.includes('WebSite')) err('WebSite JSON-LD missing');
  if (route !== '/' && !noindex && !types.includes('BreadcrumbList')) warn('no BreadcrumbList JSON-LD');

  for (const m of html.matchAll(/<img\b[^>]*>/gi)) if (!/\salt(=|\s|\/?>)/.test(m[0])) err(`<img> without alt: ${m[0].slice(0, 80)}`);

  for (const m of html.matchAll(/<a\b[^>]*\shref="(\/[^"#?]*)/gi)) {
    let target = m[1].replace(/\/$/, '') || '/';
    if (/\.[a-z0-9]+$/i.test(target)) continue;
    if (!routes.has(target)) err(`internal link to unknown page ${target}`);
  }

  if (noindex) {
    if (sitemapUrls.has(expected)) err('noindex page is listed in sitemap.xml');
  } else {
    if (!sitemapUrls.has(expected)) err('indexable page missing from sitemap.xml');
    for (const [seen, value, label] of [[seenTitles, title, 'title'], [seenDescriptions, description, 'description']]) {
      if (seen.has(value)) err(`duplicate ${label} (also on ${seen.get(value)})`);
      else seen.set(value, route);
    }
  }

  const words = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  console.log(`${route.padEnd(40)} ${noindex ? 'noindex ' : ''}${title.length}t ${description.length}d ~${words}w  [${types.join(', ')}]`);
  for (const [level, m] of problems) {
    console.log(`  ${level} ${m}`);
    level === 'ERROR' ? errors++ : warnings++;
  }
}

for (const url of sitemapUrls) {
  const route = url.slice(ORIGIN.length).replace(/\/$/, '') || '/';
  if (!url.startsWith(ORIGIN) || !routes.has(route)) {
    console.log(`sitemap.xml lists ${url}, which was not prerendered`);
    errors++;
  }
}

console.log(`\n${all.length} pages, ${errors} errors, ${warnings} warnings`);
process.exit(errors ? 1 : 0);
