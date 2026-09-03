-- ============================================================
-- Schema para a Landing Page full-stack do João
-- Rode isso inteiro no SQL Editor do painel do Supabase
-- (Project > SQL Editor > New query > colar > Run)
-- ============================================================

-- Extensão pra gerar UUID
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PROJECTS — seus projetos de portfólio (ex: Pokedex, VisioSunGlass)
-- ------------------------------------------------------------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text,
  techs text[] default '{}',
  live_url text,
  github_url text,
  sort_order int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- EXPERIENCES — sua trajetória profissional (hoje hardcoded no HTML)
-- ------------------------------------------------------------
create table if not exists experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,          -- ex: "Agill — Desenvolvedor Front-end"
  meta text not null,           -- ex: "Ago/2024 - Nov/2025 · Presencial · Maceió/AL"
  body text not null,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- COMMENTS — livro de visitas (próxima etapa, já deixando pronto)
-- ------------------------------------------------------------
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  avatar_url text,
  role text,                    -- ex: "Colega de trabalho", "Professor"
  message text not null,
  approved boolean not null default false,
  created_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- COFFEE_PAYMENTS — histórico de "cafés" pagos (próxima etapa)
-- ------------------------------------------------------------
create table if not exists coffee_payments (
  id uuid primary key default gen_random_uuid(),
  amount_cents int not null,
  status text not null default 'pending', -- pending | approved | rejected
  provider text not null default 'mercadopago',
  provider_payment_id text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Público só LÊ o que está published/approved.
-- Escrita só passa pelas nossas Serverless Functions (service role),
-- que verificam o login de admin antes — então aqui negamos
-- explicitamente qualquer INSERT/UPDATE/DELETE vindo do anon key.
-- ============================================================

alter table projects enable row level security;
alter table experiences enable row level security;
alter table comments enable row level security;
alter table coffee_payments enable row level security;

-- Projects: leitura pública só do que está publicado
create policy "projects_public_read" on projects
  for select using (published = true);

-- Experiences: leitura pública só do que está publicado
create policy "experiences_public_read" on experiences
  for select using (published = true);

-- Comments: leitura pública só do que está aprovado
create policy "comments_public_read" on comments
  for select using (approved = true);

-- Nenhuma policy de insert/update/delete é criada para o anon key —
-- ou seja, todo write tem que passar pelas rotas /api/* usando a
-- service role key, que ignora RLS.

-- ============================================================
-- STORAGE — bucket público para fotos (avatares de comentário,
-- imagens de projeto)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('landing-media', 'landing-media', true)
on conflict (id) do nothing;

-- Leitura pública do bucket
create policy "landing_media_public_read" on storage.objects
  for select using (bucket_id = 'landing-media');

-- Upload/edição/exclusão de arquivos SÓ pra você, logado como admin.
-- TROQUE o e-mail abaixo pelo e-mail exato que você vai usar pra logar
-- no painel admin (o mesmo que vai em ADMIN_EMAIL na Vercel).
create policy "landing_media_admin_write" on storage.objects
  for all
  using (
    bucket_id = 'landing-media'
    and auth.role() = 'authenticated'
    and auth.uid() = (select id from auth.users where email = 'SEU_EMAIL_ADMIN_AQUI@exemplo.com')
  )
  with check (
    bucket_id = 'landing-media'
    and auth.role() = 'authenticated'
    and auth.uid() = (select id from auth.users where email = 'SEU_EMAIL_ADMIN_AQUI@exemplo.com')
  );

-- ============================================================
-- SEED opcional — migra o Pokedex que já existe no HTML pro banco
-- ============================================================
insert into projects (title, description, image_url, techs, live_url, github_url, sort_order, published)
values (
  'POKEDEX',
  'Projeto de Pokedex simples para praticar consumo de API externa e manipulação do DOM. A aplicação busca dados na PokeAPI e exibe nome, número e sprite do Pokémon, além de permitir navegar entre os registros.',
  null, -- suba a imagem pokedex.jpeg pelo painel admin depois de criar o bucket
  array['HTML','CSS','JavaScript','PokeAPI'],
  'https://jaoneto-rg.github.io/POKEDEX/',
  'https://github.com/jaoneto-rg/POKEDEX',
  0,
  true
) on conflict do nothing;

insert into experiences (title, meta, body, sort_order, published) values
  ('Agill — Desenvolvedor Front-end', 'Ago/2024 - Nov/2025 · Presencial · Maceió/AL',
   'Desenvolvimento, evolução e manutenção de interfaces web com Vue.js, JavaScript e TypeScript. Decisões técnicas de arquitetura de componentes, modernização de sistemas internos, melhoria de performance e UX. Integração com APIs RESTful e trabalho em ambiente ágil (Scrum) com designers e back-end.', 0, true),
  ('Daily Grind — Mobile Full Stack Project (Projeto Próprio)', 'Dez/2025 - Jan/2026 · Remoto · Maceió/AL',
   'Idealização e desenvolvimento de app mobile de produtividade com React Native. Definição de arquitetura, criação de interfaces e funcionalidades. Prototipação no Figma, princípios de UX/UI, integração com serviços back-end e versionamento com Git.', 1, true),
  ('Freelancer — Desenvolvedor Front-end', 'Abr/2023 - Jun/2023 · Remoto · Maceió/AL',
   'Interfaces responsivas com HTML5, CSS3 e JavaScript. Definição visual e organização de layouts. Integração com Laravel via APIs RESTful e boas práticas de acessibilidade e compatibilidade cross-browser.', 2, true),
  ('Defesa Civil de Maceió — Desenvolvedor Full-stack', 'Mar/2021 - Nov/2021 · Presencial · Maceió/AL',
   'Desenvolvimento e manutenção de sistemas internos com Laravel, atuando no front-end e em ajustes de usabilidade e layout. Correção de funcionalidades e melhoria da experiência dos usuários internos.', 3, true)
on conflict do nothing;
