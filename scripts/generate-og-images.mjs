/**
 * Generate OG Image (1200x630) and Twitter Card (1200x628)
 * Premium design: white background + purple brand accents
 *
 * Brand colors:
 *   Primary: #472680 (purple)
 *   Primary Light: #6B3FA0
 *   Accent: #0A9396 (cyan)
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "public");

const PRIMARY = "#472680";
const PRIMARY_LIGHT = "#6B3FA0";
const PRIMARY_SOFT = "#F0E6FF";
const ACCENT = "#0A9396";

/**
 * Rounded hexagon SVG path centered at (cx, cy) with radius r.
 */
function hexPath(cx, cy, r, rotation = 0) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2 + (rotation * Math.PI) / 180;
    points.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  const cr = r * 0.18;
  let d = "";
  for (let i = 0; i < 6; i++) {
    const curr = points[i];
    const next = points[(i + 1) % 6];
    const prev = points[(i + 5) % 6];
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const l1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const l2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    const p1x = curr.x - (dx1 / l1) * cr;
    const p1y = curr.y - (dy1 / l1) * cr;
    const p2x = curr.x + (dx2 / l2) * cr;
    const p2y = curr.y + (dy2 / l2) * cr;
    d += i === 0 ? `M ${p1x} ${p1y} ` : `L ${p1x} ${p1y} `;
    d += `Q ${curr.x} ${curr.y} ${p2x} ${p2y} `;
  }
  return d + "Z";
}

function generateSvg(width, height) {
  // Right-side purple panel
  const panelX = width * 0.58;

  // Decorative hexagons (white bg side - very subtle purple)
  const leftHexes = [
    { cx: 60, cy: 80, r: 45, opacity: 0.06, rotation: 10 },
    { cx: 180, cy: height - 60, r: 35, opacity: 0.05, rotation: -15 },
    { cx: width * 0.35, cy: 50, r: 25, opacity: 0.04, rotation: 20 },
    { cx: width * 0.45, cy: height - 40, r: 30, opacity: 0.05, rotation: -5 },
  ];

  const leftHexEls = leftHexes
    .map(
      (h) =>
        `<path d="${hexPath(h.cx, h.cy, h.r, h.rotation)}" fill="${PRIMARY}" opacity="${h.opacity}" />`
    )
    .join("\n    ");

  // Right panel hexagonal decorations (white on purple)
  const rightHexes = [
    { cx: width * 0.95, cy: 60, r: 90, opacity: 0.08, rotation: 15 },
    { cx: width * 0.65, cy: height * 0.85, r: 70, opacity: 0.06, rotation: -10 },
    { cx: width * 0.85, cy: height * 0.45, r: 120, opacity: 0.05, rotation: 5 },
    { cx: width * 0.72, cy: 40, r: 40, opacity: 0.08, rotation: -20 },
    { cx: width * 0.98, cy: height * 0.7, r: 55, opacity: 0.07, rotation: 25 },
  ];

  const rightHexEls = rightHexes
    .map(
      (h) =>
        `<path d="${hexPath(h.cx, h.cy, h.r, h.rotation)}" fill="white" opacity="${h.opacity}" />`
    )
    .join("\n    ");

  // Hex grid pattern on right panel
  const hexGrid = [];
  const gridStartX = width * 0.62;
  const gridStartY = height * 0.15;
  const gs = 22;
  const gsx = gs * 2.4;
  const gsy = gs * 2.1;
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      const ox = row % 2 === 0 ? 0 : gsx / 2;
      const cx = gridStartX + col * gsx + ox;
      const cy = gridStartY + row * gsy;
      if (cx < width + gs && cy < height + gs) {
        hexGrid.push(
          `<path d="${hexPath(cx, cy, gs, 0)}" fill="none" stroke="white" stroke-width="0.5" opacity="0.08" />`
        );
      }
    }
  }

  // Decorative hex badges on right panel (no text)
  const serviceBadges = [
    { cx: width * 0.68, cy: height * 0.35 },
    { cx: width * 0.82, cy: height * 0.25 },
    { cx: width * 0.75, cy: height * 0.55 },
    { cx: width * 0.9, cy: height * 0.48 },
  ];

  const badgeEls = serviceBadges
    .map(
      (b) => `
    <g>
      <path d="${hexPath(b.cx, b.cy, 28, 0)}" fill="white" opacity="0.12" />
      <path d="${hexPath(b.cx, b.cy, 28, 0)}" fill="none" stroke="white" stroke-width="0.8" opacity="0.25" />
    </g>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="purplePanel" x1="0%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="${PRIMARY}" />
      <stop offset="100%" stop-color="${PRIMARY_LIGHT}" />
    </linearGradient>
    <linearGradient id="accentBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${ACCENT}" />
      <stop offset="100%" stop-color="${PRIMARY}" />
    </linearGradient>
    <clipPath id="panelClip">
      <path d="M ${panelX + 40} 0 L ${width} 0 L ${width} ${height} L ${panelX - 40} ${height} Z" />
    </clipPath>
  </defs>

  <!-- White background -->
  <rect width="${width}" height="${height}" fill="white" />

  <!-- Subtle top border -->
  <rect x="0" y="0" width="${width}" height="4" fill="url(#accentBar)" />

  <!-- Left side hex decorations -->
  ${leftHexEls}

  <!-- Purple right panel (diagonal cut) -->
  <g clip-path="url(#panelClip)">
    <rect x="${panelX - 60}" y="0" width="${width - panelX + 80}" height="${height}" fill="url(#purplePanel)" />
    ${rightHexEls}
    ${hexGrid.join("\n    ")}
    ${badgeEls}
  </g>

  <!-- Diagonal edge accent line -->
  <line x1="${panelX + 40}" y1="0" x2="${panelX - 40}" y2="${height}" stroke="${ACCENT}" stroke-width="2" opacity="0.4" />

  <!-- Left content area -->

  <!-- Logo hex badge -->
  <g transform="translate(80, ${height * 0.18})">
    <path d="${hexPath(0, 0, 32, 0)}" fill="${PRIMARY}" />
  </g>

  <!-- Brand name -->
  <text x="125" y="${height * 0.205}"
        font-family="'Poppins', 'Segoe UI', 'Arial', sans-serif"
        font-size="36" font-weight="700" fill="${PRIMARY}" letter-spacing="-0.5">
    elkys<tspan fill="${ACCENT}">.</tspan>
  </text>

  <!-- Main headline -->
  <text x="80" y="${height * 0.42}"
        font-family="'Poppins', 'Segoe UI', 'Arial', sans-serif"
        font-size="36" font-weight="700" letter-spacing="-0.5">
    <tspan fill="#1A1A2E">Soluções</tspan><tspan fill="${PRIMARY}" dx="10">Inteligentes</tspan>
  </text>
  <text x="80" y="${height * 0.53}"
        font-family="'Poppins', 'Segoe UI', 'Arial', sans-serif"
        font-size="22" font-weight="400" fill="#666" letter-spacing="0">
    Software &amp; Automação B2B
  </text>

  <!-- Accent underline below headline -->
  <rect x="80" y="${height * 0.57}" width="60" height="3" rx="1.5" fill="${ACCENT}" />

  <!-- Service tags (2 rows x 2) -->
  <g transform="translate(80, ${height * 0.65})">
    <rect x="0" y="0" width="210" height="26" rx="13" fill="${PRIMARY_SOFT}" />
    <text x="105" y="17" font-family="'Poppins', sans-serif" font-size="10.5" font-weight="500" fill="${PRIMARY}" text-anchor="middle">Desenvolvimento Sob Demanda</text>

    <rect x="220" y="0" width="155" height="26" rx="13" fill="${PRIMARY_SOFT}" />
    <text x="297" y="17" font-family="'Poppins', sans-serif" font-size="10.5" font-weight="500" fill="${PRIMARY}" text-anchor="middle">Automação e RPA</text>

    <rect x="0" y="34" width="185" height="26" rx="13" fill="${PRIMARY_SOFT}" />
    <text x="92" y="51" font-family="'Poppins', sans-serif" font-size="10.5" font-weight="500" fill="${PRIMARY}" text-anchor="middle">Integração de Sistemas</text>

    <rect x="195" y="34" width="170" height="26" rx="13" fill="${PRIMARY_SOFT}" />
    <text x="280" y="51" font-family="'Poppins', sans-serif" font-size="10.5" font-weight="500" fill="${PRIMARY}" text-anchor="middle">Consultoria Técnica</text>
  </g>

  <!-- Domain -->
  <text x="80" y="${height * 0.93}"
        font-family="'Poppins', 'Segoe UI', 'Arial', sans-serif"
        font-size="14" font-weight="500" fill="${ACCENT}" letter-spacing="1">
    elkys.com.br
  </text>
</svg>`;
}

async function generate() {
  console.log("Generating OG images...\n");

  const ogSvg = generateSvg(1200, 630);
  await sharp(Buffer.from(ogSvg))
    .jpeg({ quality: 95, mozjpeg: true })
    .toFile(path.join(OUT_DIR, "og-image.jpg"));
  console.log("  og-image.jpg (1200x630)");

  const twitterSvg = generateSvg(1200, 628);
  await sharp(Buffer.from(twitterSvg))
    .jpeg({ quality: 95, mozjpeg: true })
    .toFile(path.join(OUT_DIR, "twitter-card.jpg"));
  console.log("  twitter-card.jpg (1200x628)");

  console.log("\nDone!");
}

generate().catch(console.error);
