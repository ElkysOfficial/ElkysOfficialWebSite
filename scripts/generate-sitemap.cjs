const fs = require("fs");
const path = require("path");
const { SITE_URL, getRoutes } = require("./routes-seo.cjs");

const DIST_DIR = path.join(__dirname, "../dist");
const PUBLIC_DIR = path.join(__dirname, "../public");

function generateSitemap() {
  const today = new Date().toISOString().split("T")[0];
  const routes = getRoutes();

  const urlsXml = routes
    .map(
      (route) => `
  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    )
    .join("");

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>
`;

  const publicPath = path.join(PUBLIC_DIR, "sitemap.xml");
  fs.writeFileSync(publicPath, sitemapContent, "utf8");
  console.log("✅ Sitemap gerado em:", publicPath);

  if (fs.existsSync(DIST_DIR)) {
    const distPath = path.join(DIST_DIR, "sitemap.xml");
    fs.writeFileSync(distPath, sitemapContent, "utf8");
    console.log("✅ Sitemap copiado para dist:", distPath);
  }
}

try {
  generateSitemap();
  console.log("🎉 Sitemap gerado com sucesso!");
} catch (error) {
  console.error("❌ Erro ao gerar sitemap:", error);
  process.exit(1);
}
