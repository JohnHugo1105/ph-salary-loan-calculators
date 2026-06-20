const fs = require('fs');
const path = require('path');
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}
walkDir('src/app', (filePath) => {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    content = content.replace(/shared\/seo\.service/g, 'core/services/seo.service');
    content = content.replace(/shared\/app\.constants/g, 'core/config/app.constants');
    content = content.replace(/shared\/ph-calculators\.util/g, 'shared/utils/ph-calculators.util');
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Updated ' + filePath);
    }
  }
});
