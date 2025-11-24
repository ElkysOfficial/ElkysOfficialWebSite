# Elys - Website Oficial

Website institucional da Elys, especialista em desenvolvimento de software sob demanda para PMEs.

## 🚀 Quick Start

### Requisitos

- Node.js >= 18.16.1
- npm >= 9.5.1

### Instalação

```bash
# Clone o repositório
git clone <YOUR_GIT_URL>

# Navegue até o diretório do projeto
cd WebSiteOficial

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O servidor de desenvolvimento estará disponível em `http://localhost:8080`

## 📦 Build Commands

O projeto possui múltiplas configurações de build otimizadas:

### `npm run build`
Build padrão para produção usando esbuild (rápido e otimizado):
- Minificação básica de JavaScript e CSS
- Gera sourcemaps desabilitados
- Code splitting automático
- Ideal para builds rápidos de desenvolvimento/testes

### `npm run build:min`
Build minificado avançado usando Terser:
- **Minificação agressiva de JavaScript**: Terser com 2 passes
- **Remove logs**: console.log, console.info, console.debug, console.trace
- **Remove debuggers**: Todos os statements de debug
- **Minificação de CSS**: Otimizada e comprimida
- **Minificação de HTML**: Remove espaços, comentários e atributos redundantes
- **Remove comentários**: Código final sem comentários
- Ideal para produção e deploy final

### `npm run build:dev`
Build de desenvolvimento:
- Modo development ativo
- Inclui ferramentas de debug
- Ideal para testar builds localmente

**Comparação de tamanhos:**

| Arquivo | Build Normal | Build Minificado | Economia |
|---------|-------------|------------------|----------|
| index.html | 5.88 kB (gzip: 1.74 kB) | 4.91 kB (gzip: 1.45 kB) | ~17% |
| JavaScript | 529 kB (gzip: 139 kB) | 505 kB (gzip: 132 kB) | ~5% |
| **Total** | **535 kB** (gzip: **141 kB**) | **510 kB** (gzip: **133 kB**) | **~4.7% menor** |

*Nota: CSS permanece igual em ambos os builds*

Todos os builds incluem automaticamente:
- Geração do sitemap.xml
- Cópia do arquivo .htaccess para dist/

## 🛠️ Tecnologias

Este projeto foi desenvolvido com as seguintes tecnologias:

- **Vite** - Build tool e dev server de alta performance
- **TypeScript** - Superset JavaScript com tipagem estática
- **React 18** - Biblioteca para construção de interfaces
- **React Router** - Roteamento client-side
- **Tailwind CSS** - Framework CSS utility-first
- **Radix UI** - Componentes acessíveis e não estilizados
- **React Hook Form + Zod** - Gerenciamento e validação de formulários
- **EmailJS** - Serviço de envio de emails
- **Sharp** - Processamento de imagens

## 📁 Estrutura do Projeto

```
WebSiteOficial/
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   ├── pages/          # Páginas da aplicação
│   ├── lib/            # Utilitários e configurações
│   ├── hooks/          # Custom React hooks
│   └── integrations/   # Integrações externas
├── public/             # Arquivos estáticos
├── scripts/            # Scripts de build e automação
└── dist/               # Build de produção (gerado)
```

## 🚀 Deploy

O projeto está configurado para deploy na Hostinger. Os builds incluem automaticamente:

- Geração do `sitemap.xml`
- Cópia do arquivo `.htaccess` para configuração do servidor
- Otimização de assets e code splitting

### Processo de Deploy

1. Execute o build minificado:
   ```bash
   npm run build:min
   ```

2. Faça upload da pasta `dist/` para o servidor

3. Certifique-se de que o arquivo `.htaccess` está configurado corretamente para React Router

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build de produção padrão
- `npm run build:min` - Build minificado para produção
- `npm run build:dev` - Build de desenvolvimento
- `npm run preview` - Preview do build de produção
- `npm run generate-sitemap` - Gera sitemap.xml

## 🔧 Configuração

### Variáveis de Ambiente

Configure as seguintes variáveis para integração com EmailJS:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

## 📄 Licença

© 2024 Elys. Todos os direitos reservados.
