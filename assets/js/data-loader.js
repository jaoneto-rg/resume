// Busca projetos e experiências publicados direto do Supabase (client-side,
// com a anon key — a RLS no banco garante que só o que está published=true
// é retornado) e renderiza dentro das seções que já existem no index.html.
//
// Importante: isso roda ANTES do hero-section.js montar o carrossel, porque
// initProjectsCarousel() clona os cards que já estiverem no DOM nesse
// momento para criar o loop infinito.

(function () {
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  function matchProjectKey(project, index) {
    if (project.i18n_key) return project.i18n_key;
    const title = (project.title || "").toLowerCase();
    const desc = (project.description || "").toLowerCase();

    if (title.normalize("NFD").replace(/\p{Diacritic}/gu, "") === "joao mauricio escultor") {
      return "projects.sculptor";
    }
    if (title.includes("pokedex") || desc.includes("pokeapi") || desc.includes("pokemon") || desc.includes("pokédex")) {
      return "projects.pokedex";
    }
    if (title.includes("visio") || desc.includes("óculos") || desc.includes("sunglass")) {
      return "projects.visio";
    }
    if (title.includes("daily") || desc.includes("produtividade") || desc.includes("expo")) {
      return "projects.daily";
    }
    if (title.includes("projeto 2")) return "projects.placeholder.name2";
    if (title.includes("projeto 3")) return "projects.placeholder.name3";
    if (title.includes("projeto 4")) return "projects.placeholder.name4";
    if (title.includes("projeto 5")) return "projects.placeholder.name5";
    if (title.includes("em breve")) return "projects.placeholder";

    return null;
  }

  function matchExperienceKey(exp, index) {
    if (exp.i18n_key) return exp.i18n_key;
    const title = (exp.title || "").toLowerCase();
    const body = (exp.body || "").toLowerCase();

    if (title.includes("visio") || body.includes("óculos") || body.includes("sunglass")) {
      return "journey.visio";
    }
    if (title.includes("daily") || body.includes("produtividade") || body.includes("expo")) {
      return "journey.daily";
    }
    if (title.includes("agill") || body.includes("agill") || body.includes("vue.js")) {
      return "journey.agill";
    }
    if (title.includes("freelance") || body.includes("freelancer")) {
      return "journey.freelance";
    }
    if (title.includes("defesa") || body.includes("defesa civil")) {
      return "journey.defesa";
    }

    const FALLBACK_KEYS = ["journey.visio", "journey.daily", "journey.agill", "journey.freelance", "journey.defesa"];
    return FALLBACK_KEYS[index] || null;
  }

  // Retorna o texto localizado com base no lang atual do <html>
  function t(ptText, enText) {
    const lang = document.documentElement.dataset.lang || "pt";
    return lang === "en" && enText ? enText : ptText;
  }

  // Busca texto do dict i18n global (exposto pelo hero-section.js como window._i18n)
  function td(key, lang) {
    const dict = window._i18n && window._i18n[lang || document.documentElement.dataset.lang || "pt"];
    return dict && dict[key] ? dict[key] : null;
  }

  function buildProjectCard(project, sortIndex) {
    const article = document.createElement("article");
    article.className = "carousel-card";

    // Guarda a chave i18n identificada por título/descrição
    const i18nKey = matchProjectKey(project, sortIndex);
    if (i18nKey) article.dataset.i18nKey = i18nKey;

    // Guarda texto do banco
    article.dataset.ptTitle = project.title || "";
    article.dataset.ptBody  = project.description || "";
    article.dataset.enTitle = project.title_en || "";
    article.dataset.enBody  = project.description_en || "";
    article.dataset.dynamicCard = "project";

    const mediaHtml = project.image_url
      ? `<a class="carousel-media" href="${escapeHtml(project.live_url || "#")}" target="_blank" rel="noreferrer">
           <img src="${escapeHtml(project.image_url)}" alt="${escapeHtml(project.title)} project preview">
         </a>`
      : "";

    const techsHtml = (project.techs || [])
      .map((tech) => `<span class="tech-pill">${escapeHtml(tech)}</span>`)
      .join("");

    const lang = document.documentElement.dataset.lang || "pt";
    const liveLabel = (i18nKey && td(i18nKey + ".live", lang)) || (lang === "en" ? "Access Project" : "Acessar Projeto");
    const linksHtml = [
      project.live_url
        ? `<a class="project-link" href="${escapeHtml(project.live_url)}" target="_blank" rel="noreferrer"${i18nKey ? ` data-i18n="${i18nKey}.live"` : ""}>${liveLabel}</a>`
        : "",
      project.github_url
        ? `<a class="project-link project-link--github" href="${escapeHtml(project.github_url)}" target="_blank" rel="noreferrer">GITHUB</a>`
        : "",
    ].join("");

    const title = (i18nKey && td(i18nKey + ".title", lang)) || (lang === "en" && project.title_en) || project.title || "";
    const body  = (lang === "en" && project.description_en?.trim()) || (i18nKey && td(i18nKey + ".body", lang)) || project.description || "";

    article.innerHTML = `
      ${mediaHtml}
      <div class="carousel-tech">${techsHtml}</div>
      <div class="carousel-body">
        <h3${i18nKey && td(i18nKey + ".title", "pt") ? ` data-i18n="${i18nKey}.title"` : ""}>${escapeHtml(title)}</h3>
        <p class="section-text"${i18nKey ? ` data-i18n="${i18nKey}.body"` : ""}>${escapeHtml(body)}</p>
        <div class="project-links">${linksHtml}</div>
      </div>
    `;
    return article;
  }

  function buildExperienceItem(exp, sortIndex) {
    const article = document.createElement("article");
    article.className = "timeline-item";

    // Identifica a chave i18n
    const i18nKey = matchExperienceKey(exp, sortIndex);
    if (i18nKey) article.dataset.i18nKey = i18nKey;

    // Guarda texto do banco
    article.dataset.ptTitle = exp.title || "";
    article.dataset.ptMeta  = exp.meta  || "";
    article.dataset.ptBody  = exp.body  || "";
    article.dataset.enTitle = exp.title_en || "";
    article.dataset.enMeta  = exp.meta_en  || "";
    article.dataset.enBody  = exp.body_en  || "";
    article.dataset.dynamicCard = "experience";

    const lang  = document.documentElement.dataset.lang || "pt";
    const title = (i18nKey && td(i18nKey + ".title", lang)) || (lang === "en" && exp.title_en) || exp.title || "";
    const meta  = (i18nKey && td(i18nKey + ".meta",  lang)) || (lang === "en" && exp.meta_en)  || exp.meta  || "";
    const body  = (i18nKey && td(i18nKey + ".body",  lang)) || (lang === "en" && exp.body_en)  || exp.body  || "";

    article.innerHTML = `
      <div class="timeline-card">
        <h3${i18nKey ? ` data-i18n="${i18nKey}.title"` : ""}>${escapeHtml(title)}</h3>
        <p class="timeline-meta"${i18nKey ? ` data-i18n="${i18nKey}.meta"` : ""}>${escapeHtml(meta)}</p>
        <p class="section-text"${i18nKey ? ` data-i18n="${i18nKey}.body"` : ""}>${escapeHtml(body)}</p>
      </div>
    `;
    return article;
  }

  // Retraduz os cards dinâmicos quando o idioma muda
  function retranslateDynamicCards() {
    const lang = document.documentElement.dataset.lang || "pt";

    document.querySelectorAll("[data-dynamic-card='project']").forEach((card) => {
      const key   = card.dataset.i18nKey;
      const title = (key && td(key + ".title", lang)) || (lang === "en" && card.dataset.enTitle ? card.dataset.enTitle : card.dataset.ptTitle) || "";
      const body  = (lang === "en" && card.dataset.enBody.trim()) || (key && td(key + ".body", lang)) || card.dataset.ptBody || "";
      const liveLabel = (key && td(key + ".live", lang)) || (lang === "en" ? "Access Project" : "Acessar Projeto");

      const h3 = card.querySelector("h3");
      const p  = card.querySelector(".section-text");
      const liveLink = card.querySelector(".project-link:not(.project-link--github)");

      if (h3) h3.textContent = title;
      if (p && body) p.textContent = body;
      if (liveLink) liveLink.textContent = liveLabel;
    });

    document.querySelectorAll("[data-dynamic-card='experience']").forEach((card) => {
      const key   = card.dataset.i18nKey;
      const title = (key && td(key + ".title", lang)) || (lang === "en" && card.dataset.enTitle ? card.dataset.enTitle : card.dataset.ptTitle) || "";
      const meta  = (key && td(key + ".meta",  lang)) || (lang === "en" && card.dataset.enMeta ? card.dataset.enMeta : card.dataset.ptMeta)   || "";
      const body  = (key && td(key + ".body",  lang)) || (lang === "en" && card.dataset.enBody ? card.dataset.enBody : card.dataset.ptBody)   || "";

      const h3     = card.querySelector("h3");
      const metaEl = card.querySelector(".timeline-meta");
      const p      = card.querySelector(".section-text");

      if (h3 && title)         h3.textContent     = title;
      if (metaEl && meta)      metaEl.textContent = meta;
      if (p && body)           p.textContent      = body;
    });
  }

  // Expõe para o hero-section.js chamar após trocar o idioma
  window.retranslateDynamicCards = retranslateDynamicCards;

  async function fetchPublished(table, orderCol) {
    if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      console.warn("[data-loader] Supabase não configurado, mantendo conteúdo estático.");
      return null;
    }
    try {
      const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
      const { data, error } = await client
        .from(table)
        .select("*")
        .eq(table === "projects" ? "published" : "published", true)
        .order(orderCol, { ascending: true });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`[data-loader] Falha ao buscar ${table}:`, err);
      return null;
    }
  }

  async function renderExperiences() {
    const timeline = document.querySelector("#trajetoria .timeline");
    if (!timeline) return;

    const experiences = await fetchPublished("experiences", "sort_order");
    if (!experiences || !experiences.length) return; // mantém os cards estáticos existentes como fallback

    timeline.innerHTML = "";
    experiences.forEach((exp, idx) => timeline.appendChild(buildExperienceItem(exp, idx)));

    // Após renderizar, retraduz caso o idioma já seja EN
    if (typeof window.retranslateDynamicCards === "function") {
      window.retranslateDynamicCards();
    }
  }

  async function renderProjects() {
    const track = document.querySelector(".projects-carousel .carousel-track");
    if (!track) return;

    const projects = await fetchPublished("projects", "sort_order");
    if (!projects || !projects.length) return; // mantém os cards estáticos existentes como fallback

    track.innerHTML = "";
    projects.forEach((project, idx) => track.appendChild(buildProjectCard(project, idx)));

    if (typeof window.retranslateDynamicCards === "function") {
      window.retranslateDynamicCards();
    }
  }

  // Exposto globalmente pra ser aguardado pelo bootstrap no index.html
  // antes de montar a hero section / carrossel.
  window.loadDynamicContent = async function loadDynamicContent() {
    await Promise.all([renderProjects(), renderExperiences()]);
  };
})();
