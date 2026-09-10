(function () {
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  function initials(name) {
    return (name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("");
  }

  function formatLinkedinUrl(url) {
    if (!url || typeof url !== "string") return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  function buildCommentCard(comment) {
    const article = document.createElement("article");
    article.className = "carousel-card comment-card";

    const linkedinUrl = formatLinkedinUrl(comment.linkedin_url);

    const avatarMedia = comment.avatar_url
      ? `<img class="comment-avatar" src="${escapeHtml(comment.avatar_url)}" alt="Foto de ${escapeHtml(comment.name)}">`
      : `<div class="comment-avatar-fallback">${escapeHtml(initials(comment.name))}</div>`;

    let avatarHtml = "";
    let nameHtml = "";

    if (linkedinUrl) {
      avatarHtml = `
        <a href="${escapeHtml(linkedinUrl)}" target="_blank" rel="noreferrer" class="comment-avatar-link" title="Ver perfil de ${escapeHtml(comment.name)} no LinkedIn">
          ${avatarMedia}
          <span class="comment-avatar-badge" aria-hidden="true">
            <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
            </svg>
          </span>
        </a>`;

      nameHtml = `
        <a href="${escapeHtml(linkedinUrl)}" target="_blank" rel="noreferrer" class="comment-name-link" title="Ver perfil de ${escapeHtml(comment.name)} no LinkedIn">
          <h4 class="comment-name">${escapeHtml(comment.name)}</h4>
        </a>`;
    } else {
      avatarHtml = `<div class="comment-avatar-wrap">${avatarMedia}</div>`;
      nameHtml = `<h4 class="comment-name">${escapeHtml(comment.name)}</h4>`;
    }

    article.innerHTML = `
      <div class="comment-header">
        ${avatarHtml}
        ${nameHtml}
        ${comment.role ? `<p class="comment-role">${escapeHtml(comment.role)}</p>` : ""}
      </div>
      <div class="comment-body">
        <p class="comment-message">${escapeHtml(comment.message)}</p>
      </div>
    `;
    return article;
  }

  async function loadApprovedComments() {
    const list = document.getElementById("commentsList");
    if (!list) return;

    if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      list.innerHTML = '<p class="comments-empty">Comentários indisponíveis no momento.</p>';
      return;
    }

    try {
      const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
      const { data, error } = await client
        .from("comments")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;

      list.innerHTML = "";
      if (!data || !data.length) {
        list.innerHTML = '<p class="comments-empty">Seja o primeiro a deixar um comentário!</p>';
        return;
      }

      data.forEach((comment) => list.appendChild(buildCommentCard(comment)));

      if (window.initInfiniteCarousel) {
        window.initInfiniteCarousel(".comments-carousel", {
          cardSelector: ".comment-card",
          trackSelector: ".carousel-track",
        });
      }
    } catch (err) {
      console.error("[comments] Falha ao carregar comentários:", err);
      list.innerHTML = '<p class="comments-empty">Comentários indisponíveis no momento.</p>';
    }
  }

  // Redimensiona/comprime a imagem no navegador antes de mandar como base64,
  // pra manter o payload pequeno (o servidor também recusa acima de 2MB).
  function compressImageToDataUrl(file, maxDimension) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = () => reject(new Error("Não foi possível processar a imagem."));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
      reader.readAsDataURL(file);
    });
  }

  function initCommentModal() {
    const openBtn = document.getElementById("openCommentModalBtn");
    const modal = document.getElementById("commentModal");
    if (!modal) return;

    if (openBtn) {
      openBtn.addEventListener("click", () => {
        const errorEl = document.getElementById("commentFormError");
        const successEl = document.getElementById("commentFormSuccess");
        if (errorEl) errorEl.textContent = "";
        if (successEl) successEl.textContent = "";
        modal.showModal();
      });
    }

    modal.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => modal.close());
    });

    modal.addEventListener("click", (e) => {
      const rect = modal.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        modal.close();
      }
    });
  }

  function initCommentForm() {
    const form = document.getElementById("commentForm");
    if (!form) return;

    const errorEl = document.getElementById("commentFormError");
    const successEl = document.getElementById("commentFormSuccess");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      errorEl.textContent = "";
      successEl.textContent = "";

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      try {
        const photoFile = document.getElementById("commentPhoto").files?.[0];
        let avatarDataUrl = null;
        if (photoFile) {
          avatarDataUrl = await compressImageToDataUrl(photoFile, 400);
        }

        const linkedinInput = document.getElementById("commentLinkedin");
        const linkedinVal = linkedinInput ? linkedinInput.value.trim() : "";

        const payload = {
          hp_field: form.querySelector(".comment-honeypot").value, // deve ficar vazio
          name: document.getElementById("commentName").value.trim(),
          email: document.getElementById("commentEmail").value.trim(),
          linkedin_url: linkedinVal || null,
          role: document.getElementById("commentRole").value.trim(),
          message: document.getElementById("commentMessage").value.trim(),
          avatar_data_url: avatarDataUrl,
        };

        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Não foi possível enviar o comentário.");
        }

        form.reset();
        successEl.textContent = "Comentário enviado! Ele vai aparecer aqui assim que eu aprovar. Obrigado 🙂";
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  window.initCommentsSection = function initCommentsSection() {
    loadApprovedComments();
    initCommentModal();
    initCommentForm();
  };
})();

