#!/usr/bin/env node
// The AdSense loader lives in src/index.html, so prerender copies it onto every route.
// /saved is a noindex utility page and must not carry the loader. src/404.html is a separate
// file and must not gain one. Every other prerendered page keeps the loader.
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist', 'ph-calculators', 'browser'));
const loader = /[ \t]*<!-- AdSense loader[\s\S]*?-->\s*<script\b[^>]*src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-7889963514866733"[\s\S]*?<\/script>\s*/i;

function read(file) {
  if (!fs.existsSync(file)) {
    console.error(`strip-ads: missing ${file}`);
    process.exit(1);
  }
  return fs.readFileSync(file, 'utf8');
}

const savedPath = path.join(root, 'saved', 'index.html');
const saved = read(savedPath);
if (!saved.includes('adsbygoogle')) {
  console.log('strip-ads: /saved already has no AdSense loader');
} else {
  const next = saved.replace(loader, '\n');
  if (next === saved || next.includes('adsbygoogle') || next.includes('googlesyndication')) {
    console.error('strip-ads: failed to remove the AdSense loader from /saved');
    process.exit(1);
  }
  fs.writeFileSync(savedPath, next);
  console.log('strip-ads: removed the AdSense loader from /saved');
}

const notFound = read(path.join(root, '404.html'));
if (notFound.includes('adsbygoogle') || notFound.includes('googlesyndication')) {
  console.error('strip-ads: 404.html must not load ads');
  process.exit(1);
}

const home = read(path.join(root, 'index.html'));
if (!home.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7889963514866733')) {
  console.error('strip-ads: homepage is missing the AdSense loader');
  process.exit(1);
}
