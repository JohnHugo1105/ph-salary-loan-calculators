const fs = require('fs');
let original = fs.readFileSync('src/app/app.routes.ts', 'utf8');

// We need a mapping of ComponentName to its path.
let importRegex = /import\s*\{\s*([A-Za-z0-9_]+)\s*\}\s*from\s*'(\.\/features\/[^']+)'/g;
let map = {};
let match;
while ((match = importRegex.exec(original)) !== null) {
  map[match[1]] = match[2];
}

let content = original.replace(/^import \{ [A-Za-z0-9_]+ \} from '\.\/features\/.*?';\r?\n/gm, '');

content = content.replace(/component:\s*([A-Za-z0-9_]+)/g, (fullMatch, compName) => {
  if (map[compName]) {
    return `loadComponent: () => import('${map[compName]}').then(m => m.${compName})`;
  }
  return fullMatch;
});

fs.writeFileSync('src/app/app.routes.ts', content);
console.log('Routes converted to lazy loading!');
