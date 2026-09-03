# Setup do backend (Supabase + Vercel)

## 1. Criar o projeto no Supabase
1. Vá em https://supabase.com → New project.
2. Anote a **Project URL** e a **anon public key** (Project Settings → API).
3. Anote também a **service_role key** (mesma tela — nunca exponha essa no front).

## 2. Rodar o schema
1. No painel do Supabase, abra **SQL Editor → New query**.
2. Antes de rodar, edite `sql/schema.sql`:
   - Troque `'SEU_EMAIL_ADMIN_AQUI@exemplo.com'` pelo e-mail que você vai usar pra logar como admin.
3. Cole o arquivo inteiro e clique em **Run**.
   - Isso cria as tabelas `projects`, `experiences`, `comments`, `coffee_payments`, as políticas de RLS, o bucket de storage `landing-media`, e já popula seu projeto POKEDEX + as 4 experiências que já estavam no site.

## 3. Criar seu usuário admin
1. No painel do Supabase: **Authentication → Users → Add user**.
2. Cadastre o **mesmo e-mail** que você colocou no schema.sql, com uma senha forte.
3. Marque "Auto Confirm User" pra não precisar de confirmação por e-mail.

## 4. Configurar as chaves públicas no front
Edite `assets/js/supabase-config.js`:
```js
window.SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
window.SUPABASE_ANON_KEY = "sua-anon-key-aqui";
```
(Essas duas são seguras de ficar públicas no código — a proteção real é a RLS.)

## 5. Configurar variáveis de ambiente na Vercel
No painel do projeto na Vercel → **Settings → Environment Variables**, adicione:

| Nome | Valor |
|---|---|
| `SUPABASE_URL` | mesma Project URL do passo 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | a service_role key (secreta!) |
| `ADMIN_EMAIL` | o e-mail que você cadastrou no passo 3 |

## 6. Deploy
1. Instale a CLI se quiser testar local: `npm i -g vercel`
2. `vercel` na raiz do projeto (ele detecta a pasta `/api` automaticamente).
3. Ou simplesmente conecte o repositório do GitHub direto no painel da Vercel — nenhuma configuração de build é necessária (é só HTML/CSS/JS estático + funções serverless).

## 7. Testar
- Site público: `/index.html` — projetos e experiências devem carregar do banco (se o banco estiver vazio, os cards estáticos que já existem no HTML continuam aparecendo como fallback).
- Painel admin: `/admin/admin.html` — logue com o e-mail/senha do passo 3, cadastre/edite projetos e experiências.

## Observações
- Rodando localmente sem a Vercel (ex: Live Server), as rotas `/api/*` não existem — então o admin consegue logar mas as chamadas de CRUD vão falhar. Pra testar o admin de verdade, rode com `vercel dev` ou faça deploy de uma preview branch.
- O carrossel de projetos e a timeline de experiências **caem de volta pro conteúdo estático do HTML** se o Supabase não estiver configurado ou o banco estiver vazio — então o site nunca fica quebrado.
