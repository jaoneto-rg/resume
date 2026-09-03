(function () {
  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  const loginView = document.getElementById("loginView");
  const dashboardView = document.getElementById("dashboardView");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const logoutBtn = document.getElementById("logoutBtn");

  const projectsList = document.getElementById("projectsList");
  const experiencesList = document.getElementById("experiencesList");

  const projectDialog = document.getElementById("projectDialog");
  const projectForm = document.getElementById("projectForm");
  const projectFormError = document.getElementById("projectFormError");

  const experienceDialog = document.getElementById("experienceDialog");
  const experienceForm = document.getElementById("experienceForm");
  const experienceFormError = document.getElementById("experienceFormError");

  let currentSession = null;

  // ---------- helpers ----------

  async function authedFetch(url, options = {}) {
    const token = currentSession?.access_token;
    const headers = Object.assign({}, options.headers, {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    });
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let message = `Erro ${res.status}`;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch (_) {}
      throw new Error(message);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  function badge(published) {
    return published
      ? '<span class="admin-badge admin-badge--published">Publicado</span>'
      : '<span class="admin-badge admin-badge--draft">Rascunho</span>';
  }

  // ---------- auth ----------

  async function refreshSessionAndBoot() {
    const { data } = await supabase.auth.getSession();
    currentSession = data?.session || null;
    if (currentSession) {
      loginView.hidden = true;
      dashboardView.hidden = false;
      await Promise.all([loadProjects(), loadExperiences()]);
    } else {
      loginView.hidden = false;
      dashboardView.hidden = true;
    }
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.textContent = "";
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      loginError.textContent = "Login inválido: " + error.message;
      return;
    }
    currentSession = data.session;
    loginForm.reset();
    await refreshSessionAndBoot();
  });

  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    currentSession = null;
    await refreshSessionAndBoot();
  });

  // ---------- projects ----------

  async function loadProjects() {
    projectsList.innerHTML = "Carregando...";
    try {
      const projects = await authedFetch("/api/projects?all=1");
      projectsList.innerHTML = "";
      if (!projects.length) {
        projectsList.innerHTML = '<p class="admin-hint">Nenhum projeto ainda.</p>';
        return;
      }
      projects.forEach((project) => projectsList.appendChild(renderProjectItem(project)));
    } catch (err) {
      projectsList.innerHTML = `<p class="admin-error">${err.message}</p>`;
    }
  }

  function renderProjectItem(project) {
    const row = document.createElement("div");
    row.className = "admin-list-item";
    row.innerHTML = `
      <div class="admin-list-item-info">
        <strong>${project.title} ${badge(project.published)}</strong>
        <span>${(project.techs || []).join(", ") || "sem techs"}</span>
      </div>
      <div class="admin-list-item-actions">
        <button class="admin-btn" data-edit>Editar</button>
        <button class="admin-btn admin-btn--danger" data-delete>Excluir</button>
      </div>
    `;
    row.querySelector("[data-edit]").addEventListener("click", () => openProjectDialog(project));
    row.querySelector("[data-delete]").addEventListener("click", () => deleteProject(project));
    return row;
  }

  function openProjectDialog(project) {
    projectFormError.textContent = "";
    document.getElementById("projectDialogTitle").textContent = project ? "Editar projeto" : "Novo projeto";
    document.getElementById("projectId").value = project?.id || "";
    document.getElementById("projectTitle").value = project?.title || "";
    document.getElementById("projectDescription").value = project?.description || "";
    document.getElementById("projectImageFile").value = "";
    document.getElementById("projectImageUrl").value = project?.image_url || "";
    document.getElementById("projectTechs").value = (project?.techs || []).join(", ");
    document.getElementById("projectLiveUrl").value = project?.live_url || "";
    document.getElementById("projectGithubUrl").value = project?.github_url || "";
    document.getElementById("projectOrder").value = project?.sort_order ?? 0;
    document.getElementById("projectPublished").checked = !!project?.published;
    projectDialog.showModal();
  }

  document.getElementById("newProjectBtn").addEventListener("click", () => openProjectDialog(null));

  projectDialog.querySelectorAll("[data-close]").forEach((btn) =>
    btn.addEventListener("click", () => projectDialog.close())
  );

  async function uploadImageIfNeeded(fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    const file = fileInput.files?.[0];
    if (!file) return null;

    const path = `projects/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("landing-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw new Error("Falha no upload da imagem: " + error.message);

    const { data } = supabase.storage.from("landing-media").getPublicUrl(path);
    return data.publicUrl;
  }

  projectForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    projectFormError.textContent = "";
    try {
      const uploadedUrl = await uploadImageIfNeeded("projectImageFile");
      const id = document.getElementById("projectId").value;
      const payload = {
        title: document.getElementById("projectTitle").value.trim(),
        description: document.getElementById("projectDescription").value.trim(),
        image_url: uploadedUrl || document.getElementById("projectImageUrl").value.trim() || null,
        techs: document
          .getElementById("projectTechs")
          .value.split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        live_url: document.getElementById("projectLiveUrl").value.trim() || null,
        github_url: document.getElementById("projectGithubUrl").value.trim() || null,
        sort_order: Number(document.getElementById("projectOrder").value) || 0,
        published: document.getElementById("projectPublished").checked,
      };

      if (id) {
        await authedFetch(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await authedFetch("/api/projects", { method: "POST", body: JSON.stringify(payload) });
      }

      projectDialog.close();
      await loadProjects();
    } catch (err) {
      projectFormError.textContent = err.message;
    }
  });

  async function deleteProject(project) {
    if (!confirm(`Excluir o projeto "${project.title}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await authedFetch(`/api/projects/${project.id}`, { method: "DELETE" });
      await loadProjects();
    } catch (err) {
      alert(err.message);
    }
  }

  // ---------- experiences ----------

  async function loadExperiences() {
    experiencesList.innerHTML = "Carregando...";
    try {
      const experiences = await authedFetch("/api/experiences?all=1");
      experiencesList.innerHTML = "";
      if (!experiences.length) {
        experiencesList.innerHTML = '<p class="admin-hint">Nenhuma experiência ainda.</p>';
        return;
      }
      experiences.forEach((exp) => experiencesList.appendChild(renderExperienceItem(exp)));
    } catch (err) {
      experiencesList.innerHTML = `<p class="admin-error">${err.message}</p>`;
    }
  }

  function renderExperienceItem(exp) {
    const row = document.createElement("div");
    row.className = "admin-list-item";
    row.innerHTML = `
      <div class="admin-list-item-info">
        <strong>${exp.title} ${badge(exp.published)}</strong>
        <span>${exp.meta}</span>
      </div>
      <div class="admin-list-item-actions">
        <button class="admin-btn" data-edit>Editar</button>
        <button class="admin-btn admin-btn--danger" data-delete>Excluir</button>
      </div>
    `;
    row.querySelector("[data-edit]").addEventListener("click", () => openExperienceDialog(exp));
    row.querySelector("[data-delete]").addEventListener("click", () => deleteExperience(exp));
    return row;
  }

  function openExperienceDialog(exp) {
    experienceFormError.textContent = "";
    document.getElementById("experienceDialogTitle").textContent = exp ? "Editar experiência" : "Nova experiência";
    document.getElementById("experienceId").value = exp?.id || "";
    document.getElementById("experienceTitle").value = exp?.title || "";
    document.getElementById("experienceMeta").value = exp?.meta || "";
    document.getElementById("experienceBody").value = exp?.body || "";
    document.getElementById("experienceOrder").value = exp?.sort_order ?? 0;
    document.getElementById("experiencePublished").checked = exp ? !!exp.published : true;
    experienceDialog.showModal();
  }

  document.getElementById("newExperienceBtn").addEventListener("click", () => openExperienceDialog(null));

  experienceDialog.querySelectorAll("[data-close]").forEach((btn) =>
    btn.addEventListener("click", () => experienceDialog.close())
  );

  experienceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    experienceFormError.textContent = "";
    try {
      const id = document.getElementById("experienceId").value;
      const payload = {
        title: document.getElementById("experienceTitle").value.trim(),
        meta: document.getElementById("experienceMeta").value.trim(),
        body: document.getElementById("experienceBody").value.trim(),
        sort_order: Number(document.getElementById("experienceOrder").value) || 0,
        published: document.getElementById("experiencePublished").checked,
      };

      if (id) {
        await authedFetch(`/api/experiences/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await authedFetch("/api/experiences", { method: "POST", body: JSON.stringify(payload) });
      }

      experienceDialog.close();
      await loadExperiences();
    } catch (err) {
      experienceFormError.textContent = err.message;
    }
  });

  async function deleteExperience(exp) {
    if (!confirm(`Excluir a experiência "${exp.title}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await authedFetch(`/api/experiences/${exp.id}`, { method: "DELETE" });
      await loadExperiences();
    } catch (err) {
      alert(err.message);
    }
  }

  // ---------- boot ----------
  refreshSessionAndBoot();
})();
