const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://elkys.com.br';
const DIST_DIR = path.join(__dirname, '../dist');
const PUBLIC_DIR = path.join(__dirname, '../public');

// Routes configuration
const routes = [
  {
    path: '/',
    changefreq: 'weekly',
    priority: 1.0,
  },
  {
    path: '/terms-of-service',
    changefreq: 'yearly',
    priority: 0.3,
  },
  {
    path: '/privacy-policy',
    changefreq: 'yearly',
    priority: 0.3,
  },
  {
    path: '/cookie-policy',
    changefreq: 'yearly',
    priority: 0.3,
  },
];

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];

  const urlsXml = routes
    .map(
      (route) => `
  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    )
    .join('');

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>
`;

  // Write to public directory (for development)
  const publicPath = path.join(PUBLIC_DIR, 'sitemap.xml');
  fs.writeFileSync(publicPath, sitemapContent, 'utf8');
  console.log('✅ Sitemap gerado em:', publicPath);

  // Write to dist directory (for production)
  if (fs.existsSync(DIST_DIR)) {
    const distPath = path.join(DIST_DIR, 'sitemap.xml');
    fs.writeFileSync(distPath, sitemapContent, 'utf8');
    console.log('✅ Sitemap copiado para dist:', distPath);
  }
}

// Execute
try {
  generateSitemap();
  console.log('🎉 Sitemap gerado com sucesso!');
} catch (error) {
  console.error('❌ Erro ao gerar sitemap:', error);
  process.exit(1);
}
