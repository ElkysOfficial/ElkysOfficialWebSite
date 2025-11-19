const fs = require('fs');
const path = require('path');

// Script para copiar .htaccess para dist/ após build
// Necessário para deploy na Hostinger

const source = path.join(__dirname, '..', '.htaccess');
const dest = path.join(__dirname, '..', 'dist', '.htaccess');

try {
  // Verifica se o arquivo fonte existe
  if (!fs.existsSync(source)) {
    console.error('❌ Arquivo .htaccess não encontrado na raiz do projeto');
    process.exit(1);
  }

  // Verifica se a pasta dist existe
  if (!fs.existsSync(path.dirname(dest))) {
    console.error('❌ Pasta dist/ não encontrada. Execute o build primeiro.');
    process.exit(1);
  }

  // Copia o arquivo
  fs.copyFileSync(source, dest);
  console.log('✅ .htaccess copiado para dist/ com sucesso!');
  console.log('📁 Pronto para deploy na Hostinger');
} catch (error) {
  console.error('❌ Erro ao copiar .htaccess:', error.message);
  process.exit(1);
}
