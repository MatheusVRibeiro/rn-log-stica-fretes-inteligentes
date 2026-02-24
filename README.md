# Caramello Logística — Sistema de Gestão de Fretes

Aplicação frontend para gestão de fretes, motoristas, caminhões, pagamentos e indicadores operacionais.

Este projeto contém páginas de cadastro, relatórios e geração de guias de pagamento em PDF.

URL de demonstração: https://caramello-logistica.com

**Principais funcionalidades**
- Gestão de fretes (criação, listagem, relatórios)
- Gestão de frota e motoristas
 - Gestão de custos operacionais e relatórios
 - Manutenção da frota e controle de manutenções
- Emissão de guias de pagamento (PDF)
- Dashboards e KPIs
- Upload e visualização de comprovantes

## Tecnologias

- Vite
- TypeScript
- React
- shadcn/ui + Radix UI
- Tailwind CSS
- jsPDF (geração de PDFs)

## Rodando localmente

Pré-requisitos: Node.js e npm (recomendado usar nvm para gerenciar versões)

Clone o repositório, instale dependências e rode em modo de desenvolvimento:

```bash
git clone <SUA_GIT_URL>
cd rn-log-stica-fretes-inteligentes
npm install
npm run dev
```

O servidor de desenvolvimento inicia o app (por padrão em http://localhost:5173 ou porta configurada pelo Vite).

## Scripts úteis

- `npm run dev` — inicia servidor de desenvolvimento
- `npm run build` — gera build de produção
- `npm run preview` — pré-visualiza o build
- `npm test` — executa testes com Vitest

## Deploy

O projeto é compatível com hospedagem estática (Vercel, Netlify, etc.). Gere o build e faça upload do conteúdo da pasta `dist`:

```bash
npm run build
```

## Como contribuir

- Fork e clone o repositório
- Crie uma branch para sua feature/fix
- Abra um PR descrevendo as alterações

## Observações técnicas

- O projeto já possui um backend real e o site está em produção (atualizações contínuas). A integração com a API é feita pelos clientes em `src/services` e pela configuração de `src/api/axios.ts`.
- Para desenvolvimento local, ajuste a variável de ambiente `VITE_API_URL` (ou edite `src/api/axios.ts`) apontando para a URL da API.
- Convenções: alias `@/` para imports, formulários com React Hook Form + Zod, estilo com Tailwind + `cn()` util.

## Contato

Projeto mantido pela equipe Caramello.
Para dúvidas ou contribuições, abra uma issue no repositório GitHub.

