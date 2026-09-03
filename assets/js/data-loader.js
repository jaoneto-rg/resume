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

  function buildProjectCard(project) {
    const article = document.createElement("article");
    article.className = "carousel-card";

    const mediaHtml = project.image_url
      ? `<a class="carousel-media" href="${escapeHtml(project.live_url || "#")}" target="_blank" rel="noreferrer">
           <img src="${escapeHtml(project.image_url)}" alt="${escapeHtml(project.title)} project preview">
         </a>`
      : "";

    const techsHtml = (project.techs || [])
      .map((tech) => `<span class="tech-pill">${escapeHtml(tech)}</span>`)
      .join("");

    const linksHtml = [
      project.live_url
        ? `<a class="project-link" href="${escapeHtml(project.live_url)}" target="_blank" rel="noreferrer">Acessar Projeto</a>`
        : "",
      project.github_url
        ? `<a class="project-link project-link--github" href="${escapeHtml(project.github_url)}" target="_blank" rel="noreferrer">GITHUB</a>`
        : "",
    ].join("");

    article.innerHTML = `
      ${mediaHtml}
      <div class="carousel-tech">${techsHtml}</div>
      <div class="carousel-body">
        <h3>${escapeHtml(project.title)}</h3>
        <p class="section-text">${escapeHtml(project.description)}</p>
        <div class="project-links">${linksHtml}</div>
      </div>
    `;
    return article;
  }

  function buildExperienceItem(exp) {
    const article = document.createElement("article");
    article.className = "timeline-item";
    article.innerHTML = `
      <div class="timeline-card">
        <h3>${escapeHtml(exp.title)}</h3>
        <p class="timeline-meta">${escapeHtml(exp.meta)}</p>
        <p class="section-text">${escapeHtml(exp.body)}</p>
      </div>
    `;
    return article;
  }

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

  async function renderProjects() {
    const track = document.querySelector(".projects-carousel .carousel-track");
    if (!track) return;

    const projects = await fetchPublished("projects", "sort_order");
    if (!projects || !projects.length) return; // mantém os cards estáticos existentes como fallback

    track.innerHTML = "";
    projects.forEach((project) => track.appendChild(buildProjectCard(project)));
  }

  async function renderExperiences() {
    const timeline = document.querySelector("#trajetoria .timeline");
    if (!timeline) return;

    const experiences = await fetchPublished("experiences", "sort_order");
    if (!experiences || !experiences.length) return; // mantém os cards estáticos existentes como fallback

    timeline.innerHTML = "";
    experiences.forEach((exp) => timeline.appendChild(buildExperienceItem(exp)));
  }

  // Exposto globalmente pra ser aguardado pelo bootstrap no index.html
  // antes de montar a hero section / carrossel.
  window.loadDynamicContent = async function loadDynamicContent() {
    await Promise.all([renderProjects(), renderExperiences()]);
  };
})();
