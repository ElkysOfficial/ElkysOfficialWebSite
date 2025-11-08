const fs = require('fs');
const path = require('path');

const LOGOS_DIR = path.join(__dirname, '../public/imgs/logo');
const JSON_PATH = path.join(__dirname, '../public/imgs/logo/logos.json');

const logoFiles = fs.readdirSync(LOGOS_DIR)
  .filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.svg', '.jpg', '.jpeg'].includes(ext) &&
           file !== 'README.md' &&
           file !== 'logos.json';
  })
  .sort();

console.log('📂 Found logos:', logoFiles);

const logosJson = {
  logos: logoFiles,
  lastUpdated: new Date().toISOString()
};

fs.writeFileSync(JSON_PATH, JSON.stringify(logosJson, null, 2), 'utf8');

console.log('✅ logos.json updated successfully!');
console.log(`📊 Total logos: ${logoFiles.length}`);
console.log('\n🎉 New logos will appear automatically when you refresh the page!');
