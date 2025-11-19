import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '../public');

// Configurações de otimização
const QUALITY = 80;
const TEAM_SIZES = [400, 800]; // Tamanhos responsivos para fotos de equipe
const CASE_SIZES = [640, 1024, 1920]; // Tamanhos para cases
const LOGO_MAX_WIDTH = 200;

async function optimizeImage(inputPath, outputPath, width = null, quality = QUALITY) {
  const image = sharp(inputPath);

  if (width) {
    image.resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside'
    });
  }

  await image
    .webp({ quality, effort: 6 })
    .toFile(outputPath);

  const stats = await stat(outputPath);
  return stats.size;
}

async function processTeamImages() {
  console.log('\n🎨 Otimizando imagens da equipe...');
  const teamDir = join(publicDir, 'imgs/team');

  for (let i = 1; i <= 8; i++) {
    const filename = `member-${i}`;
    const jpgPath = join(teamDir, `${filename}.jpg`);
    const webpPath = join(teamDir, `${filename}.webp`);

    try {
      // Versão WebP otimizada (padrão)
      const size = await optimizeImage(jpgPath, webpPath, 800, QUALITY);
      console.log(`  ✓ ${filename}.webp - ${(size / 1024).toFixed(2)} KB`);

      // Versões responsivas
      for (const width of TEAM_SIZES) {
        const responsivePath = join(teamDir, `${filename}-${width}w.webp`);
        const responsiveSize = await optimizeImage(jpgPath, responsivePath, width, QUALITY);
        console.log(`    └─ ${filename}-${width}w.webp - ${(responsiveSize / 1024).toFixed(2)} KB`);
      }
    } catch (error) {
      console.error(`  ✗ Erro em ${filename}: ${error.message}`);
    }
  }
}

async function processCaseImages() {
  console.log('\n📸 Otimizando imagens de cases...');
  const casesDir = join(publicDir, 'imgs/cases');

  // case-3.jpg é a única imagem de case existente
  const caseFile = 'case-3';
  const jpgPath = join(casesDir, `${caseFile}.jpg`);
  const webpPath = join(casesDir, `${caseFile}.webp`);

  try {
    // Versão WebP otimizada (padrão - 1920px)
    const size = await optimizeImage(jpgPath, webpPath, 1920, QUALITY);
    console.log(`  ✓ ${caseFile}.webp - ${(size / 1024).toFixed(2)} KB`);

    // Versões responsivas
    for (const width of CASE_SIZES) {
      const responsivePath = join(casesDir, `${caseFile}-${width}w.webp`);
      const responsiveSize = await optimizeImage(jpgPath, responsivePath, width, QUALITY);
      console.log(`    └─ ${caseFile}-${width}w.webp - ${(responsiveSize / 1024).toFixed(2)} KB`);
    }
  } catch (error) {
    console.error(`  ✗ Erro em ${caseFile}: ${error.message}`);
  }
}

async function createOGImages() {
  console.log('\n🎴 Criando imagens para Open Graph...');
  const iconsDir = join(publicDir, 'imgs/icons');
  const logoPath = join(iconsDir, 'lettering_elys_purple.png');

  try {
    // Preparar logo redimensionada
    const logoBuffer = await sharp(logoPath)
      .resize(700, 300, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    // OG Image (1200x630) - Criar um fundo com logo centralizada
    const ogImagePath = join(publicDir, 'og-image.jpg');

    await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 4,
        background: { r: 124, g: 58, b: 237, alpha: 1 } // Primary purple
      }
    })
    .composite([
      {
        input: logoBuffer,
        gravity: 'center'
      }
    ])
    .jpeg({ quality: 90 })
    .toFile(ogImagePath);

    const ogStats = await stat(ogImagePath);
    console.log(`  ✓ og-image.jpg - ${(ogStats.size / 1024).toFixed(2)} KB`);

    // Twitter Card (1200x630 - mesmo formato)
    const twitterCardPath = join(publicDir, 'twitter-card.jpg');

    await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 4,
        background: { r: 124, g: 58, b: 237, alpha: 1 }
      }
    })
    .composite([
      {
        input: logoBuffer,
        gravity: 'center'
      }
    ])
    .jpeg({ quality: 90 })
    .toFile(twitterCardPath);

    const twitterStats = await stat(twitterCardPath);
    console.log(`  ✓ twitter-card.jpg - ${(twitterStats.size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error(`  ✗ Erro ao criar OG images: ${error.message}`);
  }
}

async function optimizeLogoImages() {
  console.log('\n🏢 Otimizando logos de clientes...');
  const logoDir = join(publicDir, 'imgs/logo');
  const files = await readdir(logoDir);

  for (const file of files) {
    if (file === 'logos.json') continue;

    const ext = extname(file).toLowerCase();
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') continue;

    const inputPath = join(logoDir, file);
    const outputPath = join(logoDir, basename(file, ext) + '.webp');

    try {
      const size = await optimizeImage(inputPath, outputPath, LOGO_MAX_WIDTH, 85);
      console.log(`  ✓ ${basename(file, ext)}.webp - ${(size / 1024).toFixed(2)} KB`);
    } catch (error) {
      console.error(`  ✗ Erro em ${file}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando otimização de imagens...\n');
  console.log('📋 Configurações:');
  console.log(`   Qualidade WebP: ${QUALITY}`);
  console.log(`   Tamanhos equipe: ${TEAM_SIZES.join(', ')}px`);
  console.log(`   Tamanhos cases: ${CASE_SIZES.join(', ')}px`);

  await processTeamImages();
  await processCaseImages();
  await createOGImages();
  await optimizeLogoImages();

  console.log('\n✅ Otimização concluída!\n');
}

main().catch(console.error);
