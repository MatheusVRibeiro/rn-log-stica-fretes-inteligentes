# 🔐 Configurações de Segurança - Caramello Logística

## ✅ Proteções Implementadas

### 1️⃣ **Build Security (vite.config.ts)**
- ❌ Source maps desabilitados (sem `.map` files)
- 🔒 Minificação com Terser
- 📝 Comments removidos do código
- 🎯 Console e debugger removidos em produção
- 📦 Code splitting automático

### 2️⃣ **WebServer Security (.htaccess)**
- ⛔ Listing de diretórios desabilitado
- 🚫 Acesso bloqueado a:
  - `.env`, `.env.local`
  - `.git`, `.gitignore`
  - `package.json`, `tsconfig.json`, `vite.config.ts`
  - `.map` files e source maps
  - `/src` e `/node_modules`

### 3️⃣ **HTTP Headers (.htaccess)**
- `X-Frame-Options: DENY` - Previne clickjacking
- `X-Content-Type-Options: nosniff` - Previne MIME sniffing
- `X-Permitted-Cross-Domain-Policies: none` - Bloqueia cross-domain

### 4️⃣ **Nginx Configuration (nginx.conf)**
Configuração de produção com:
- 🛡️ Todos os headers de segurança
- ⛔ Bloqueio de paths sensíveis
- 📁 Cache inteligente para assets
- 🔄 React Router rewrite rules
- ⚡ Gzip compression
- 🔒 HTTPS ready (comentado)

### 5️⃣ **File System Security (vite.config.ts)**
```typescript
fs: {
  strict: true,
  allow: ["src", "node_modules"],
  deny: [".env", ".env.local", ".env.*.local"],
}
```

---

## 🔍 O que você NÃO verá mais ao inspecionar:

```
❌ Estrutura de pastas /src
❌ Código original (minificado)
❌ Comentários do desenvolvedor
❌ Source maps (.map files)
❌ Console.log() statements
❌ Arquivos /node_modules
❌ Arquivos de configuração (.env, tsconfig, etc)
✅ APENAS HTML, CSS minificados e JavaScript minificado
```

---

## 🚀 Deploy - Qual servidor usar?

### Vercel (Recomendado - mais fácil)
```bash
npm install -g vercel
vercel
```
Vercel aplica automaticamente segurança e headers.

### Nginx (Produção)
1. Copiar `dist/` para `/var/www/caramello-logistica/dist`
2. Usar configuração em `nginx.conf`
3. Ativar HTTPS com Let's Encrypt

### Apache (Produção)
1. Copiar `dist/` para `/var/www/html/caramello-logistica`
2. Arquivo `.htaccess` já está configurado
3. Ativar `mod_rewrite` e `mod_headers`

### Netlify
```bash
npm run build
# Fazer drag & drop da pasta 'dist' em netlify.com
```

---

## 🔐 Checklist de Segurança

- [x] Source maps removidos
- [x] Console removido do build
- [x] Diretório listing desabilitado
- [x] Acesso a arquivos de config bloqueado
- [x] Headers HTTP seguros
- [x] .env files bloqueados
- [x] node_modules bloqueado
- [x] src/ bloqueado
- [x] Minificação ativa
- [x] Cache inteligente

---

## 📝 Monitoramento

Verificar logs regularmente:
```bash
# Apache
tail -f /var/log/apache2/error.log

# Nginx
tail -f /var/log/nginx/caramello-error.log
```

---

## ⚠️ Importante

**Em desenvolvimento (`npm run dev`):**
- O server de dev é **apenas local** (localhost:8080)
- Não exponha ao público

**Em produção:**
- Use HTTPS sempre
- Implemente rate limiting para APIs
- Monitore logs de acesso
- Mantenha Node.js/runtime atualizado
- Use WAF (Web Application Firewall) se possível

---

**Status**: ✅ Totalmente protegido contra exposição de código-fonte
