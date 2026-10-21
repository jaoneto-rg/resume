/**
 * Módulo: Me pague um café ☕
 * Gerencia o botão flutuante, a modal nativa (<dialog>),
 * a busca e cache da energia do dev e a criação de checkout via Mercado Pago.
 */
(function () {
  const CACHE_TTL_MS = 30000; // 30 segundos de cache para a energia
  let cachedEnergy = null;
  let lastFetchTime = 0;
  let isFetchingEnergy = false;

  function formatRelativeTime(dateIso) {
    if (!dateIso) return "Sem commits recentes";
    const date = new Date(dateIso);
    if (isNaN(date.getTime())) return "Sem commits recentes";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 5) return "Último commit agora há pouco";
    if (diffMinutes < 60) return `Último commit há ${diffMinutes} min`;
    if (diffHours < 24) return `Último commit há ${diffHours}h`;
    if (diffDays === 1) return "Último commit ontem";
    if (diffDays < 30) return `Último commit há ${diffDays} dias`;
    return `Último commit em ${date.toLocaleDateString("pt-BR")}`;
  }

  function getEnergyHeadline(energy) {
    if (energy >= 85) return "O Dev está a todo vapor! ⚡";
    if (energy >= 55) return "O Dev está trabalhando em bom ritmo! 💻";
    if (energy >= 25) return "O Dev precisa de uma pausa para o café... ☕";
    return "O Dev está quase sem bateria! 🪫";
  }

  function applyEnergyStats(stats) {
    const fillEl = document.getElementById("energyBarFill");
    const percentEl = document.getElementById("energyPercent");
    const lastCommitEl = document.getElementById("energyLastCommit");
    const headlineEl = document.getElementById("cafeHeadline");

    const energy = Math.max(0, Math.min(100, Math.round(stats.energy || 0)));

    if (fillEl) fillEl.style.width = `${energy}%`;
    if (percentEl) percentEl.textContent = `${energy}%`;
    if (headlineEl) headlineEl.textContent = getEnergyHeadline(energy);
    if (lastCommitEl) lastCommitEl.textContent = formatRelativeTime(stats.lastCommitAt);
  }

  async function loadEnergy(forceReload = false) {
    const errorEl = document.getElementById("cafeError");
    const headlineEl = document.getElementById("cafeHeadline");
    const percentEl = document.getElementById("energyPercent");

    const isCacheValid = cachedEnergy && Date.now() - lastFetchTime < CACHE_TTL_MS;
    if (!forceReload && isCacheValid) {
      applyEnergyStats(cachedEnergy);
      return;
    }

    if (isFetchingEnergy) return;
    isFetchingEnergy = true;

    if (!cachedEnergy && percentEl && percentEl.textContent.trim() === "--%") {
      if (headlineEl) headlineEl.textContent = "Carregando energia do Dev...";
    }

    try {
      const res = await fetch("/api/energy/stats");
      if (!res.ok) {
        throw new Error("Não foi possível carregar os dados de energia.");
      }
      const data = await res.json();
      cachedEnergy = data;
      lastFetchTime = Date.now();
      applyEnergyStats(data);
    } catch (err) {
      console.warn("[cafe] Erro ao carregar energia:", err.message);
      if (errorEl) {
        errorEl.textContent = "Não foi possível carregar o nível de energia agora. Você ainda pode apoiar com um café! 🙂";
      }
      if (headlineEl && !cachedEnergy) {
        headlineEl.textContent = "Energia do Dev";
      }
    } finally {
      isFetchingEnergy = false;
    }
  }

  function showStatusBanner(status) {
    const banner = document.getElementById("cafeStatusBanner");
    if (!banner) return;

    banner.className = "cafe-status-banner";
    banner.hidden = false;

    if (status === "success") {
      banner.classList.add("is-success");
      banner.textContent = "☕ Muito obrigado pelo café! Sua ajuda mantém o projeto a todo vapor. Atualizando a energia...";
    } else if (status === "pending") {
      banner.classList.add("is-pending");
      banner.textContent = "⏳ Pagamento pendente. Assim que for compensado pelo Mercado Pago, a barra de energia será atualizada!";
    } else if (status === "failure") {
      banner.classList.add("is-failure");
      banner.textContent = "❌ O pagamento não foi concluído. Se quiser tentar novamente, escolha uma das opções abaixo.";
    } else {
      banner.hidden = true;
    }
  }

  function cleanReturnUrl() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("cafe");

      // Limpa possíveis parâmetros anexados pelo Mercado Pago
      const mpParams = [
        "collection_id",
        "collection_status",
        "payment_id",
        "status",
        "external_reference",
        "payment_type",
        "merchant_order_id",
        "preference_id",
        "site_id",
        "processing_mode",
        "merchant_account_id",
      ];
      mpParams.forEach((param) => url.searchParams.delete(param));

      const newSearch = url.searchParams.toString();
      const newUrl = url.pathname + (newSearch ? `?${newSearch}` : "") + url.hash;
      window.history.replaceState({}, document.title, newUrl);
    } catch (e) {
      // Falha silenciosa se o navegador restringir replaceState
    }
  }

  function initCafeModule() {
    const openBtn = document.getElementById("openCafeModalBtn");
    const modal = document.getElementById("cafeModal");
    if (!modal) return;

    const errorEl = document.getElementById("cafeError");
    const coffeeButtons = modal.querySelectorAll(".cafe-coffee-btn");

    function openModal() {
      if (errorEl) errorEl.textContent = "";
      document.body.classList.add("cafe-modal-open");
      if (typeof modal.showModal === "function") {
        modal.showModal();
      } else {
        modal.setAttribute("open", "");
      }

      // Foco para o botão de fechar para acessibilidade
      const closeBtn = modal.querySelector("[data-close]");
      if (closeBtn) closeBtn.focus();

      // Busca a energia somente ao abrir a modal
      loadEnergy();
    }

    function closeModal() {
      document.body.classList.remove("cafe-modal-open");
      if (typeof modal.close === "function" && modal.open) {
        modal.close();
      } else {
        modal.removeAttribute("open");
      }
      if (openBtn) openBtn.focus();
    }

    if (openBtn) {
      openBtn.addEventListener("click", openModal);
    }

    modal.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });

    // Fechar ao clicar no backdrop
    modal.addEventListener("click", (e) => {
      const rect = modal.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        closeModal();
      }
    });

    // Garante restauração caso feche nativamente (ex: tecla ESC)
    modal.addEventListener("close", () => {
      document.body.classList.remove("cafe-modal-open");
    });
    modal.addEventListener("cancel", () => {
      document.body.classList.remove("cafe-modal-open");
    });

    // Checkout ao clicar nas opções de café
    coffeeButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const amountCents = parseInt(btn.getAttribute("data-amount"), 10);
        if (!amountCents) return;

        if (errorEl) errorEl.textContent = "";
        coffeeButtons.forEach((b) => (b.disabled = true));
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<span>Aguarde...</span>`;

        try {
          const res = await fetch("/api/payments/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount_cents: amountCents }),
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.checkout_url) {
            throw new Error(data.error || "Não foi possível iniciar o checkout. Tente novamente.");
          }

          window.location.href = data.checkout_url;
        } catch (err) {
          if (errorEl) errorEl.textContent = err.message || "Erro ao conectar com o Mercado Pago.";
          coffeeButtons.forEach((b) => (b.disabled = false));
          btn.innerHTML = originalContent;
        }
      });
    });

    // Tratamento de retorno do Mercado Pago via querystring ?cafe=...
    const urlParams = new URLSearchParams(window.location.search);
    const cafeStatus = urlParams.get("cafe");

    if (cafeStatus && ["success", "failure", "pending"].includes(cafeStatus)) {
      openModal();
      showStatusBanner(cafeStatus);
      cleanReturnUrl();

      // No sucesso, aguarda ~4s para dar tempo do webhook processar e recarrega a energia
      if (cafeStatus === "success") {
        setTimeout(() => {
          loadEnergy(true);
        }, 4000);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCafeModule);
  } else {
    initCafeModule();
  }
})();
