import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(__dirname, '../public/fonts');

// Fontes que realmente usamos
const usedFonts = [
  'Poppins-Light.ttf',
  'Poppins-Regular.ttf',
  'Poppins-Medium.ttf',
  'Poppins-SemiBold.ttf',
  'Poppins-Bold.ttf',
  'Poppins-Italic.ttf'
];

async function convertFont(fontPath) {
  const fontName = path.basename(fontPath, '.ttf');
  const outputPath = fontPath.replace('.ttf', '.woff2');

  try {
    // Usando pyftsubset (fonttools) para converter e otimizar
    // Se não tiver instalado: pip install fonttools brotli
    const command = `pyftsubset "${fontPath}" --flavor=woff2 --output-file="${outputPath}" --layout-features="*" --unicodes="U+0020-007E,U+00A0-00FF,U+0100-017F,U+0180-024F"`;

    console.log(`Converting ${fontName}...`);
    await execAsync(command);
    console.log(`✓ ${fontName}.woff2 created`);
  } catch (error) {
    console.error(`✗ Failed to convert ${fontName}:`, error.message);
    console.log(`  Try: npm install -g wawoff2 or use online converter`);
  }
}

async function main() {
  console.log('🔤 Converting TTF fonts to WOFF2...\n');

  try {
    const files = await readdir(fontsDir);
    const ttfFiles = files.filter(f => usedFonts.includes(f));

    console.log(`Found ${ttfFiles.length} fonts to convert:\n`);

    for (const file of ttfFiles) {
      const fontPath = path.join(fontsDir, file);
      await convertFont(fontPath);
    }

    console.log('\n✓ Font conversion complete!');
    console.log('\nNext steps:');
    console.log('1. Update src/Fonts.css to use .woff2 files');
    console.log('2. Test the website');
    console.log('3. Remove unused .ttf files');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
