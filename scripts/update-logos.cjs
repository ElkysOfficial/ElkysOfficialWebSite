const fs = require('fs');
const path = require('path');

const LOGOS_DIR = path.join(__dirname, '../public/imgs/logo');
const TS_PATH = path.join(__dirname, '../src/data/clientLogos.ts');

const logoFiles = fs.readdirSync(LOGOS_DIR)
  .filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.svg', '.jpg', '.jpeg', '.webp'].includes(ext) &&
           file !== 'README.md' &&
           file !== 'logos.json';
  })
  .sort();

console.log('📂 Found logos:', logoFiles);

const tsContent = `/**
 * Paths dos logos de clientes exibidos no carrossel da landing.
 * Mantido como modulo TS (em vez de fetch em /imgs/logo/logos.json)
 * pra eliminar 1 request + re-render apos o JSON carregar.
 * Atualizado via scripts/update-logos.cjs.
 */
export const clientLogos: readonly string[] = [
${logoFiles.map((f) => `  "/imgs/logo/${f}",`).join('\n')}
];
`;

fs.writeFileSync(TS_PATH, tsContent, 'utf8');

console.log('✅ clientLogos.ts updated successfully!');
console.log(`📊 Total logos: ${logoFiles.length}`);
console.log('\n🎉 Run npm run build to bundle the new logos.');
