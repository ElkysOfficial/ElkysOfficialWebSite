/**
 * Redimensiona assets apontados pelo Lighthouse/PSI como oversized.
 *
 * Contorna o bug EBUSY do Windows Defender com arquivos que tem espaco/
 * acento no nome (scan em-acesso trava unlink/rename) gravando sempre
 * em um NOME SANITIZADO diferente. O arquivo antigo fica no repo ate
 * o desenvolvedor remover via `git rm`. Isso tambem corrige um cheiro
 * de longa data (URLs com %20 e caracteres Unicode).
 *
 * Uso: `node scripts/resize-assets.cjs`
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");

function sanitize(name) {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  const slug = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "-") // tudo virou hifen
    .replace(/^-+|-+$/g, "");
  return slug + ext;
}

async function resizeAsset({ input, output, width, height, fit = "inside", quality = 85 }) {
  const sourceBuffer = fs.readFileSync(input);
  const meta = await sharp(sourceBuffer).metadata();

  const buffer = await sharp(sourceBuffer)
    .resize(width, height, { fit, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toBuffer();

  fs.writeFileSync(output, buffer);
  console.log(
    `✅ ${path.relative(ROOT, output)}: ${meta.width}x${meta.height} -> ${width || "auto"}x${height || "auto"} | ${sourceBuffer.length}B -> ${buffer.length}B`
  );
}

async function resizeLogo(originalName, maxH) {
  const originalPath = path.join(ROOT, "public/imgs/logo", originalName);
  if (!fs.existsSync(originalPath)) {
    console.log(`⚠  ${originalName}: nao encontrei`);
    return null;
  }

  const sourceBuffer = fs.readFileSync(originalPath);
  const meta = await sharp(sourceBuffer).metadata();
  if (meta.height <= maxH) {
    console.log(`⏭  ${originalName} ja tem altura ${meta.height} (<=${maxH})`);
    return null;
  }

  const newName = sanitize(originalName);
  const newPath = path.join(ROOT, "public/imgs/logo", newName);
  const newWidth = Math.round((meta.width * maxH) / meta.height);

  const buffer = await sharp(sourceBuffer)
    .resize(newWidth, maxH, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85, effort: 6 })
    .toBuffer();

  fs.writeFileSync(newPath, buffer);
  console.log(
    `✅ ${newName}: (era ${originalName}) ${meta.width}x${meta.height} -> ${newWidth}x${maxH} | ${sourceBuffer.length}B -> ${buffer.length}B`
  );
  return { originalName, newName };
}

async function main() {
  // 1. Hexagonal menor (256x256) para HexPattern, servida direto de
  // public/imgs/icons/ — sem fingerprint do Vite. Rollup estava deduplicando
  // com hexagonal.webp do Hero quando ambas viviam em src/assets/icons/,
  // e todos os consumidores do HexPattern acabavam referenciando a versao
  // 512x512 (4688B em vez de 2222B). Com o asset em /public, o Vite nao
  // entra no pipeline e o path e resolvido em runtime.
  await resizeAsset({
    input: path.join(ROOT, "src/assets/icons/hexagonal.webp"),
    output: path.join(ROOT, "public/imgs/icons/hex-pattern-sm.webp"),
    width: 256,
    height: 256,
    quality: 85,
  });

  // 2. Logos oversized. Nomes sanitizados de quebra (tira acentos/espacos
  // que causam %20 em URL e impedem resize in-place no Windows).
  const logoTargets = [
    { name: "Dps Celulares.webp", maxH: 160 },
    { name: "Antônio Oliveira Advogados.webp", maxH: 160 },
    { name: "God of Baber.webp", maxH: 160 },
    { name: "Logo Inline White.webp", maxH: 160 },
    { name: "Hapvida.webp", maxH: 160 },
    { name: "plansCoop.webp", maxH: 160 },
    { name: "1UmPrintComunicação.svg", maxH: null }, // SVG nao precisa resize
  ];

  const renames = [];
  for (const { name, maxH } of logoTargets) {
    if (!maxH) continue;
    const result = await resizeLogo(name, maxH);
    if (result) renames.push(result);
  }

  // 3. Arquivos SVG: so sanitiza nome (se tiver acento/espaco). Copia
  // bytes sem re-encode.
  const svgTargets = ["1UmPrintComunicação.svg"];
  for (const origName of svgTargets) {
    const origPath = path.join(ROOT, "public/imgs/logo", origName);
    if (!fs.existsSync(origPath)) continue;
    const newName = sanitize(origName);
    if (newName === origName) continue;
    const newPath = path.join(ROOT, "public/imgs/logo", newName);
    fs.copyFileSync(origPath, newPath);
    console.log(`✅ ${newName}: copiado de ${origName} (sanitizado)`);
    renames.push({ originalName: origName, newName });
  }

  if (renames.length) {
    console.log("\n📋 Arquivos antigos para `git rm` apos verificar:");
    renames.forEach((r) => console.log(`   git rm "public/imgs/logo/${r.originalName}"`));
    console.log("\n  Depois rode `node scripts/update-logos.cjs` pra atualizar clientLogos.ts.");
  }
}

main().catch((err) => {
  console.error("Erro no resize:", err);
  process.exit(1);
});
