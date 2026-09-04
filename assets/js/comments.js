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

  function buildCommentCard(comment) {
    const div = document.createElement("div");
    div.className = "comment-card";
    const avatar = comment.avatar_url
      ? `<img class="comment-avatar" src="${escapeHtml(comment.avatar_url)}" alt="Foto de ${escapeHtml(comment.name)}">`
      : `<div class="comment-avatar-fallback">${escapeHtml(initials(comment.name))}</div>`;

    div.innerHTML = `
      ${avatar}
      <div class="comment-body">
        <h4>${escapeHtml(comment.name)}</h4>
        ${comment.role ? `<p class="comment-role">${escapeHtml(comment.role)}</p>` : ""}
        <p class="comment-message">${escapeHtml(comment.message)}</p>
      </div>
    `;
    return div;
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
      if (!data.length) {
        list.innerHTML = '<p class="comments-empty">Seja o primeiro a deixar um comentário!</p>';
        return;
      }
      data.forEach((comment) => list.appendChild(buildCommentCard(comment)));
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

        const payload = {
          hp_field: form.querySelector(".comment-honeypot").value, // deve ficar vazio
          name: document.getElementById("commentName").value.trim(),
          email: document.getElementById("commentEmail").value.trim(),
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
    initCommentForm();
  };
})();
