# Landing Page — Suminagashi Hero

Este projeto é uma landing page pessoal com foco em uma hero section interativa inspirada em Suminagashi (tinta flutuante). A hero é renderizada em WebGL com shaders e reage ao movimento do mouse/toque. Além disso, há tema claro/escuro e suporte a PT/EN.

## Estrutura principal

```
index.html
sections/hero-section.html
assets/css/hero-section.css
assets/js/hero-section.js
```

- `index.html`: páginas e seções (About, Journey, Formação, Projetos, Contato, Footer).
- `sections/hero-section.html`: **hero section isolada** (markup + shaders).
- `assets/css/hero-section.css`: estilos globais + estilos da hero e das seções.
- `assets/js/hero-section.js`: WebGL, interação e i18n.

## Hero Section — Parte a Parte

### 1) Carregamento via `fetch`
A hero fica em `sections/hero-section.html` e é injetada no `index.html`:
- Isso permite editar a hero separadamente sem “poluir” o arquivo principal.
- No `index.html` usamos `fetch(...)` para montar o HTML e inicializar o JS.

### 2) Canvas WebGL (Suminagashi)
A arte é desenhada com Three.js e shaders:
- **`vertexShader`**: passa UVs e define o plano 2D.
- **`fragmentShader`**: gera as ondas com ruído e camadas de “tinta”.
- A interação acontece alterando o `uMousePosition`.

Arquivos:
- Shader dentro de `sections/hero-section.html`
- Inicialização em `assets/js/hero-section.js`

### 3) Interação com mouse/toque
No `hero-section.js`:
- Capturamos `mousemove` e `touchmove`.
- Normalizamos a posição no viewport da hero.
- Atualizamos uniformes (`uMousePosition`).

### 4) Tema Claro/Escuro
- O tema é controlado via `data-theme` no `<html>`.
- CSS usa variáveis (`:root` e `html[data-theme="dark"]`).
- Botão no topo troca o tema e grava em `localStorage`.

### 4.1) Padrões de ondas (moods)
- Botão **“Ondas”** alterna variações do shader.
- Os presets ficam no array `atmospheres` dentro de `assets/js/hero-section.js`.

### 5) Texto com efeito de digitação (duas linhas)
- O título “I’m Frontend Developer” e “& Designer UI/UX” são digitados em sequência.
- O JS controla o cursor ativo por linha.

### 6) Idioma PT/EN
- Dicionário de textos fica em `assets/js/hero-section.js`.
- Todos elementos com `data-i18n` são atualizados ao trocar idioma.
- O botão “PT/EN” fica na topbar.

### 7) Idade automática
- A idade é calculada com a data de nascimento (30/10/1998).
- Atualiza automaticamente ano a ano, sem precisar editar manualmente.

## Seções da Página

- **About**: foto + dados pessoais + descrição.
- **Journey**: experiências alternadas esquerda/direita.
- **Formação**: graduação, idiomas e certificados.
- **Projetos**: carrossel infinito com destaque no card principal.
- **Contato**: cards simples (localização, telefone, email, links).

## Projetos — Carrossel de Cards (roleta horizontal)

O carrossel de projetos foi criado para destacar o card central e manter os demais “atrás”, com efeito de profundidade.

### Estrutura do HTML
No `index.html`:
- A lista de cards fica em `.projects-carousel > .carousel-track`.
- Cada card usa `.carousel-card` com imagem, techs e CTA.
- Cards placeholders usam `.is-placeholder`.

### Estilo do carrossel
No `assets/css/hero-section.css`:
- `.carousel-card.is-center` aumenta o card principal.
- `.is-left`, `.is-right` e `.is-far` reduzem escala e opacidade.
- O layout cria a sensação de camadas, como uma roleta.

### Lógica de interação
No `assets/js/hero-section.js`:
- `initProjectsCarousel()` cria o carrossel.
- Clona os cards antes/depois para simular **loop infinito**.
- Arraste com mouse/toque move o carrossel.
- Clique em um card lateral coloca ele no centro.
- O card principal por padrão é o **POKEDEX**.

Se quiser trocar o card principal inicial, basta alterar o título ou adicionar um identificador e ajustar no JS.

## Personalização rápida

- **Textos**: `index.html` (seções) e `assets/js/hero-section.js` (i18n).
- **Estilos**: `assets/css/hero-section.css`.
- **Hero/Shaders**: `sections/hero-section.html` + `assets/js/hero-section.js`.

---
