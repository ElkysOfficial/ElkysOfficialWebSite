# Guia de Deploy - Hostinger

## Configuração Automática via GitHub Actions

Este projeto está configurado para fazer deploy automático na Hostinger sempre que você fizer push para a branch `main`.

### Passo 1: Configurar Secrets no GitHub

Acesse: `https://github.com/ElysTech/WebSiteOficial/settings/secrets/actions`

Ou manualmente:
1. Vá até o repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral: **Secrets and variables** → **Actions**
4. Clique em **New repository secret**

### Passo 2: Adicionar os 3 Secrets

Baseado nas suas credenciais da Hostinger:

#### Secret 1: FTP_SERVER
- **Name:** `FTP_SERVER`
- **Value:** `147.79.84.178`

#### Secret 2: FTP_USERNAME
- **Name:** `FTP_USERNAME`
- **Value:** `u473202279.elys.com.br`

#### Secret 3: FTP_PASSWORD
- **Name:** `FTP_PASSWORD`
- **Value:** `[sua senha FTP]` (a que você usa para acessar o FTP)

### Passo 3: Fazer Deploy

Após configurar os secrets, basta fazer push:

```bash
git add .
git commit -m "chore: configurar deploy automático"
git push origin main
```

### Como Funciona

1. Quando você faz push para `main`, o GitHub Actions:
   - Instala as dependências (`npm ci`)
   - Faz o build do projeto (`npm run build`)
   - Envia a pasta `dist/` para `public_html/` via FTP

2. Você pode acompanhar o progresso em:
   - GitHub → Actions → Deploy to Hostinger

### Deploy Manual (Opcional)

Se precisar fazer deploy manual, você pode:
1. Ir em **Actions** no GitHub
2. Selecionar **Deploy to Hostinger**
3. Clicar em **Run workflow**

---

## Informações da Hostinger

- **IP do FTP:** ftp://147.79.84.178
- **Usuário:** u473202279.elys.com.br
- **Porta:** 21
- **Pasta de destino:** public_html
- **Clientes FTP recomendados:** SmartFTP ou FileZilla
