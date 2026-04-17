/**
 * Redimensiona imagens da landing/portal para o tamanho real usado,
 * reduzindo memory overhead de decoding e tamanho de transferencia.
 *
 * Executar manualmente quando precisar reotimizar (nao e parte do build).
 *
 *   node scripts/optimize-landing-images.cjs
 *
 * Git e o backup — se algo der errado, `git checkout -- public/imgs/icons/`
 * restaura os originais.
 *
 * Estrategia no Windows: leitura e feita via fs.readFileSync em Buffer
 * (sharp nao abre o arquivo de disco, so processa o buffer em memoria).
 * Escrita: delete-then-write quando o arquivo destino permite SHARE_DELETE
 * (Windows Defender/Search aceitam delete mas bloqueiam overwrite). Se o
 * delete falhar com EPERM/EBUSY, faz tmpfile + rename como fallback.
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const ICONS_DIR = path.join(__dirname, "../public/imgs/icons");

// Cada entrada: { file, width, height, quality }
// Tamanhos escolhidos com base no uso real em <img class="w-X"> nos componentes,
// com folga para 2x pixel density (retina).
const TARGETS = [
  // hexagonal: usado em Hero com w-[1600px] mas maioria dos usos e 80-240px.
  // 1024x1024 mantem qualidade aceitavel no Hero (scala 1.5x, imagem decorativa
  // blur/opacity baixa) e reduz memory overhead em todos os usos pequenos.
  { file: "hexagonal.webp", width: 1024, height: 1024, quality: 80 },

  // lettering_elkys: usado em Navigation w-16 (64px) e Footer.
  // 256x256 cobre 128px displayed @ 2x retina.
  { file: "lettering_elkys.webp", width: 256, height: 256, quality: 85 },
  { file: "lettering_elkys_purple.webp", width: 256, height: 256, quality: 85 },

  // lettering_*_login: usado em Login w-[100px]. Proporcao ~3:1 (original 669x222).
  // 400x133 mantem proporcao e cobre 200x67 @ 2x retina.
  { file: "lettering_elkys_login.webp", width: 400, height: 133, quality: 85 },
  { file: "lettering_elkys_purple_login.webp", width: 400, height: 133, quality: 85 },
];

function writeWithFallback(filePath, buffer) {
  // Caminho preferencial: unlink + writeFileSync. Funciona quando o arquivo
  // permite SHARE_DELETE (scan Defender tipico).
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    fs.writeFileSync(filePath, buffer);
    return;
  } catch (err) {
    if (err.code !== "EPERM" && err.code !== "EBUSY" && err.code !== "UNKNOWN") throw err;
  }

  // Fallback: tmpfile + rename com retry (alguns cenarios permitem rename
  // mesmo quando o arquivo destino tem lock parcial).
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, buffer);
  let renamed = false;
  for (let i = 0; i < 5; i++) {
    try {
      fs.renameSync(tmpPath, filePath);
      renamed = true;
      break;
    } catch {
      // Pequeno delay entre retries (cada iteracao sincrona e ~imediata,
      // o retry ajuda com lock transiente de scanner).
    }
  }
  if (!renamed) {
    // Limpa tmp e propaga erro claro
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
    throw new Error(
      `Nao foi possivel escrever ${path.basename(filePath)} — arquivo bloqueado por outro processo (Windows Defender? Explorer? IDE?). Feche visualizadores e tente novamente.`
    );
  }
}

async function optimize() {
  console.log("Otimizando imagens da landing/portal...\n");

  let totalBefore = 0;
  let totalAfter = 0;

  for (const { file, width, height, quality } of TARGETS) {
    const filePath = path.join(ICONS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  ${file}: arquivo nao encontrado — pulando`);
      continue;
    }

    // Ler em buffer PRIMEIRO (libera handle do arquivo original imediatamente;
    // sharp processa so o buffer em memoria, nao reabre o arquivo).
    const srcBuffer = fs.readFileSync(filePath);
    const beforeBytes = srcBuffer.length;
    const beforeMeta = await sharp(srcBuffer).metadata();

    // Sharp processa o buffer puro — nao mantem handle de disco em lugar nenhum.
    const optimized = await sharp(srcBuffer)
      .resize(width, height, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 6 })
      .toBuffer();

    const afterBytes = optimized.length;

    // Guard: so substituir se resultado realmente economizar bytes. Alguns
    // originais ja estao otimizados de forma que reencoding aumenta peso
    // (ex: WebP lossless pequeno reencoded em WebP lossy quality=80 pode
    // crescer). Nesses casos manter original e vitoria.
    if (afterBytes >= beforeBytes) {
      console.log(
        `↷ ${file}: original ja esta otimo ` +
          `(${(beforeBytes / 1024).toFixed(1)} KB) — mantido como estava`
      );
      totalBefore += beforeBytes;
      totalAfter += beforeBytes;
      continue;
    }

    writeWithFallback(filePath, optimized);
    const afterMeta = await sharp(optimized).metadata();

    totalBefore += beforeBytes;
    totalAfter += afterBytes;

    const reduction = (((beforeBytes - afterBytes) / beforeBytes) * 100).toFixed(1);
    console.log(
      `✓ ${file}:\n` +
        `    ${beforeMeta.width}x${beforeMeta.height} (${(beforeBytes / 1024).toFixed(1)} KB) → ` +
        `${afterMeta.width}x${afterMeta.height} (${(afterBytes / 1024).toFixed(1)} KB) ` +
        `(-${reduction}%)`
    );
  }

  const totalReduction = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1);
  console.log(
    `\n📊 Total: ${(totalBefore / 1024).toFixed(1)} KB → ${(totalAfter / 1024).toFixed(1)} KB ` +
      `(-${totalReduction}%)`
  );
  console.log("\n✅ Concluido. Revise visualmente antes de commitar.");
}

optimize().catch((err) => {
  console.error("❌ Falhou:", err.message);
  process.exit(1);
});
