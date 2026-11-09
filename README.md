# Portfólio & Landing Page Interativa — Suminagashi Hero

Landing page e portfólio profissional desenvolvido com foco em performance, identidade visual única e alta interatividade. Conta com uma hero section imersiva em WebGL/Three.js inspirada na técnica tradicional japonesa **Suminagashi** (tinta flutuante reagindo ao toque e ao cursor), carrosséis 3D/infinitos, gerenciamento dinâmico de projetos/experiências/comentários via Supabase e a funcionalidade exclusiva de **"Energia do Dev"**.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5 semântico, CSS3 moderno (Custom Properties, Flexbox, CSS Grid), JavaScript vanilla (ES6+ modular).
- **Gráficos & Animações:** Three.js, WebGL (Vertex & Fragment Shaders em GLSL), Canvas API, `requestAnimationFrame`.
- **Backend & Serverless (Vercel):** Node.js Serverless Functions para APIs REST (`/api/projects`, `/api/experiences`, `/api/comments`, `/api/energy`, `/api/payments`).
- **Banco de Dados & Storage:** Supabase (PostgreSQL, Row Level Security, Auth e Storage).
- **Integrações:** Webhook do GitHub para monitoramento contínuo de commits, Mercado Pago API para doações/apoio.

---

## 📁 Estrutura do Projeto

```
resume/
├── index.html                     # Estrutura principal da página (About, Carrossel, Formação, Comentários, Modal de Energia)
├── sections/
│   └── hero-section.html          # Hero section isolada com Shaders GLSL e markup
├── assets/
│   ├── css/
│   │   ├── hero-section.css       # Estilos globais e tema base da hero/seções
│   │   ├── infinite-carousel.css  # Estilos dos carrosséis (projetos e comentários)
│   │   ├── comments.css           # Estilos da seção de depoimentos e modal
│   │   ├── admin-access.css       # Estilos da área administrativa
│   │   └── cafe.css               # Estilos do botão flutuante e modal "Energia do Dev"
│   └── js/
│       ├── hero-section.js        # WebGL, Suminagashi shader, tema claro/escuro e i18n
│       ├── infinite-carousel.js   # Lógica do carrossel infinito e interações 3D
│       ├── data-loader.js         # Carregamento dinâmico de projetos e experiências via Supabase
│       ├── comments.js            # Seção de depoimentos/comentários de visitantes
│       ├── admin-acess.js         # Painel e autenticação de administrador
│       └── cafe.js                # Lógica da modal de energia, animação fluida da barra e checkout
└── api/                           # Serverless Functions (Vercel)
    ├── energy/
    │   ├── stats.js               # Cálculo e retorno do nível atual de energia do dev
    │   └── github-webhook.js      # Webhook do GitHub para registrar novos commits
    ├── payments/
    │   ├── create-checkout.js     # Geração de preferências de checkout (Mercado Pago)
    │   └── webhook.js             # Webhook do Mercado Pago para confirmação de pagamentos
    ├── comments/                  # CRUD de comentários e moderação
    ├── projects/                  # CRUD de projetos do portfólio
    ├── experiences/               # CRUD de experiências profissionais
    └── _lib/                      # Utilitários compartilhados (Supabase admin, Mercado Pago client, etc.)
```

---

## ⚡ Funcionalidade: "Energia do Dev"

Uma forma divertida e transparente de mostrar aos visitantes o ritmo de atividade e produtividade do desenvolvedor em seus projetos e criações.

### 1. Como a Energia é Calculada
- **Commits via GitHub Webhook:** Cada commit enviado aos repositórios ativa o endpoint `/api/energy/github-webhook`, renovando o status com bônus de energia e registrando o timestamp mais recente.
- **Decaimento Natural:** Caso não ocorram commits recentes, a energia vai decaindo gradualmente com o passar dos dias através de uma curva matemática de decay em `api/_lib/energy.js`.
- **Apoio & Cafés (Em breve):** Mecanismo de bônus adicional onde apoiadores podem pagar um café via Mercado Pago (PIX/Cartão). Cada contribuição injetará um boost temporário de energia na barra.

### 2. Animação Fluida da Barra & Contador
- Ao abrir o modal, a barra e o indicador numérico sobem sincronizados de **`0%` até o valor real** retornado pela API (ex: `0% -> 1% -> 2% ... -> 5%`).
- **Tempo de espera adaptativo:** A duração da animação é proporcional à porcentagem de energia (1 segundo por 1%), com um limite de até **10 segundos** caso a porcentagem seja alta, acompanhada de curva `ease-out` para visualização agradável e confortável para o usuário.

---

## 🎨 Hero Section WebGL (Suminagashi)

1. **Injeção Dinâmica via `fetch`:** A seção é mantida em `sections/hero-section.html` e injetada no bootstrap, mantendo o código modular e isolado.
2. **Shaders Customizados:**
   - **`vertexShader`:** Projeta o plano 2D e mapeia as coordenadas UV.
   - **`fragmentShader`:** Gera padrões orgânicos de tinta usando funções matemáticas de ruído procedural e reage ao movimento do cursor (`uMousePosition`).
3. **Multi-temas & Presets de Ondas:** Suporte nativo a Dark/Light Mode e alternância entre diferentes padrões de "moods" no shader através do botão "Ondas".
4. **Efeito de Digitação & Internacionalização (i18n):** Tipografia animada simulando máquina de escrever com controle de cursor e chaveador de idioma PT/EN sem recarregar a página.

---

## 🎠 Carrossel Infinito de Projetos & Comentários

- **Efeito 3D e Profundidade:** Destaque dinâmico para o card central (`.is-center`), enquanto os cards laterais assumem escala e opacidade reduzidas.
- **Loop Infinito:** Clonagem inteligente de nós no DOM para permitir navegação contínua com toque (touch swipe) ou mouse drag.
- **Seção de Comentários Comunitária:** Visitantes podem deixar mensagens e feedbacks diretamente na página, integrados com Supabase e moderação.

---

## 💳 Sistema de Apoio / Pagamentos

> **Status:** *Em breve*

O sistema conta com integração preparada com o Mercado Pago para viabilizar apoios rápidos (Espresso, Gourmet e Enérgico) via PIX e cartão de crédito, com conciliação automática via webhooks para alimentar a barra de energia em tempo real.

---

## 🚀 Como Executar o Projeto Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/jaoneto-rg/resume.git
   cd resume
   ```

2. **Instale as dependências (para as Serverless Functions locais):**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   - Com o Vercel CLI (recomendado para testar frontend + rotas `/api`):
     ```bash
     vercel dev
     ```
   - Ou utilize a extensão **Live Server** no VS Code para abrir o `index.html`.
