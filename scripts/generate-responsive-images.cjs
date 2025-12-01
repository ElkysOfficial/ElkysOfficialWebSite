/**
 * Script para gerar versões responsivas das imagens
 *
 * Este script cria múltiplas versões de cada imagem em diferentes tamanhos
 * para otimizar o carregamento em diferentes dispositivos.
 *
 * USO:
 * npm run generate-images
 *
 * O script procura por imagens nas pastas:
 * - public/imgs/cases/
 * - public/imgs/icons/
 * - public/imgs/logo/
 *
 * E gera versões em:
 * - 640w (mobile)
 * - 768w (tablet)
 * - 1024w (desktop pequeno)
 * - 1280w (desktop médio)
 * - 1920w (desktop grande)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Tamanhos de breakpoint para gerar
const SIZES = [640, 768, 1024, 1280, 1920];

// Pastas para processar
const FOLDERS = [
  'public/imgs/cases',
  'public/imgs/icons',
  'public/imgs/logo'
];

// Extensões suportadas
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Processa uma imagem e gera versões responsivas
 */
async function processImage(imagePath) {
  const ext = path.extname(imagePath);
  const basename = path.basename(imagePath, ext);
  const dirname = path.dirname(imagePath);

  // Ignora arquivos que já são versões responsivas
  if (/-\d+w\.(jpg|jpeg|png|webp)$/i.test(basename)) {
    console.log(`⏭️  Pulando ${basename}${ext} (já é uma versão responsiva)`);
    return;
  }

  console.log(`📸 Processando: ${basename}${ext}`);

  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    for (const size of SIZES) {
      // Não gera se a imagem original é menor que o tamanho
      if (metadata.width && metadata.width < size) {
        console.log(`   ⚠️  Tamanho ${size}w ignorado (imagem original: ${metadata.width}px)`);
        continue;
      }

      const outputPath = path.join(dirname, `${basename}-${size}w${ext}`);

      // Verifica se já existe
      if (fs.existsSync(outputPath)) {
        console.log(`   ⏭️  ${size}w já existe`);
        continue;
      }

      await image
        .resize(size, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .toFile(outputPath);

      console.log(`   ✅ Gerado ${size}w`);
    }

    // Gera versão WebP se a imagem não for WebP
    if (ext.toLowerCase() !== '.webp') {
      const webpPath = path.join(dirname, `${basename}.webp`);

      if (!fs.existsSync(webpPath)) {
        await sharp(imagePath)
          .webp({ quality: 85 })
          .toFile(webpPath);
        console.log(`   ✅ Gerado WebP`);

        // Gera versões responsivas do WebP
        for (const size of SIZES) {
          if (metadata.width && metadata.width < size) continue;

          const webpSizePath = path.join(dirname, `${basename}-${size}w.webp`);

          if (!fs.existsSync(webpSizePath)) {
            await sharp(imagePath)
              .resize(size, null, {
                withoutEnlargement: true,
                fit: 'inside'
              })
              .webp({ quality: 85 })
              .toFile(webpSizePath);
            console.log(`   ✅ Gerado WebP ${size}w`);
          }
        }
      }
    }

    console.log(`✨ Concluído: ${basename}${ext}\n`);
  } catch (error) {
    console.error(`❌ Erro ao processar ${basename}${ext}:`, error.message);
  }
}

/**
 * Processa todas as imagens em uma pasta
 */
async function processFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    console.log(`⚠️  Pasta não encontrada: ${folderPath}`);
    return;
  }

  console.log(`\n📁 Processando pasta: ${folderPath}`);

  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      await processFolder(filePath);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        await processImage(filePath);
      }
    }
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando geração de imagens responsivas...\n');
  console.log(`📐 Tamanhos: ${SIZES.join('w, ')}w`);
  console.log(`📂 Pastas: ${FOLDERS.join(', ')}\n`);

  for (const folder of FOLDERS) {
    await processFolder(folder);
  }

  console.log('\n✅ Processo concluído!');
  console.log('\n💡 Dicas:');
  console.log('   - Commit as novas imagens geradas');
  console.log('   - As imagens originais foram mantidas');
  console.log('   - Versões WebP foram criadas para melhor compressão');
}

// Executa
main().catch(console.error);
