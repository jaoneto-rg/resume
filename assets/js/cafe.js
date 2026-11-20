/**
 * Módulo: Me pague um café ☕
 * Gerencia o botão flutuante, a modal nativa (<dialog>),
 * a busca e cache da energia do dev e a criação de checkout via Mercado Pago.
 */
(function () {
  const CACHE_TTL_MS = 30000; // 30 segundos de cache para a energia
  const MAX_ANIMATION_DURATION_MS = 10000; // Limite máximo de 10 segundos
  let cachedEnergy = null;
  let lastFetchTime = 0;
  let isFetchingEnergy = false;
  let animationFrameId = null;
  let energyUnavailable = false;
  let checkoutButton = null;
  let checkoutFailed = false;
  let paymentStatus = null;

  const copy = {
    pt: {
      close: "Fechar",
      energyBar: "Barra de energia do Dev",
      paymentNote: "Pagamento processado pelo Mercado Pago (cartão ou Pix).",
      lastCommit: "Último commit",
      noCommits: "Sem commits recentes",
      justNow: "agora há pouco",
      loadingCheckout: "Aguarde…",
      checkoutError: "Não foi possível iniciar o pagamento. Tente novamente.",
      playful: {
        title: "Energia: Player Dev",
        loading: "Consultando medidor de pixels...",
        description: "O termômetro de produtividade de todas as minhas criações! Sobe a cada commit entregue no mapa e a cada café que os viajantes deixam na taverna. Sem cafeína ou código, o indicador esvazia. Ajude a manter o inventário cheio!",
        headlines: ["Dev nível 99: Energia máxima atingida! ⚡", "Codando em ritmo lendário! 🎮", "Energia caindo... hora do drop de café! ☕", "Game Over iminente: café urgente! 🪫"],
        options: ["Gole Rápido", "Café Especial", "Power-Up"],
        energyError: "Não foi possível carregar o nível de energia agora. Você ainda pode apoiar com um café! 🙂",
        success: "🎉 +100 DE AMIZADE! Muito obrigado pelo café! O Dev ganhou um boost de velocidade.",
        pending: "⏳ Aguardando confirmação do item... Assim que compensar, a barra sobe!",
        failure: "❌ O drop falhou! Se quiser tentar novamente, escolha uma das opções abaixo.",
      },
      professional: {
        title: "Apoie o desenvolvimento",
        loading: "Consultando a atividade recente…",
        description: "Acompanhe a atividade dos meus projetos. O indicador considera os commits recentes e o apoio recebido. Se quiser contribuir para a continuidade do meu trabalho, escolha um dos valores abaixo.",
        headlines: ["Nível de atividade alto", "Projetos em desenvolvimento ativo", "Nível de atividade moderado", "Nível de atividade baixo"],
        option: "Contribuir",
        energyError: "Não foi possível consultar a atividade recente. As opções de apoio continuam disponíveis.",
        success: "Pagamento confirmado. Obrigado por apoiar meu trabalho!",
        pending: "Aguardando a confirmação do pagamento.",
        failure: "O pagamento não foi concluído. Você pode escolher uma opção abaixo para tentar novamente.",
      },
    },
    en: {
      close: "Close",
      energyBar: "Developer energy bar",
      paymentNote: "Payments processed by Mercado Pago (card or Pix).",
      lastCommit: "Last commit",
      noCommits: "No recent commits",
      justNow: "just now",
      loadingCheckout: "Please wait…",
      checkoutError: "Could not start checkout. Please try again.",
      playful: {
        title: "Energy: Player Dev",
        loading: "Checking the pixel meter...",
        description: "The productivity meter for everything I build! It goes up with each commit on the map and each coffee travelers leave at the tavern. Without caffeine or code, it runs down. Help keep the inventory stocked!",
        headlines: ["Level 99 dev: Maximum energy reached! ⚡", "Coding at a legendary pace! 🎮", "Energy is dropping... time for a coffee drop! ☕", "Game over is close: coffee needed! 🪫"],
        options: ["Quick Sip", "Specialty Coffee", "Power-Up"],
        energyError: "Couldn't load the energy level right now. You can still support me with a coffee! 🙂",
        success: "🎉 +100 FRIENDSHIP! Thanks for the coffee! The dev got a speed boost.",
        pending: "⏳ Waiting for your item to clear. Once it does, the energy bar goes up!",
        failure: "❌ The drop failed! Choose an option below if you'd like to try again.",
      },
      professional: {
        title: "Support my development work",
        loading: "Checking recent activity…",
        description: "Follow activity across my projects. The indicator reflects recent commits and contributions. If you'd like to support my ongoing work, choose an amount below.",
        headlines: ["High activity level", "Projects in active development", "Moderate activity level", "Low activity level"],
        option: "Contribute",
        energyError: "Recent activity is unavailable. You can still make a contribution.",
        success: "Payment confirmed. Thank you for supporting my work!",
        pending: "Waiting for payment confirmation.",
        failure: "The payment was not completed. Choose an option below to try again.",
      },
    },
  };

  function formatRelativeTime(dateIso, labels, locale) {
    if (!dateIso) return labels.noCommits;
    const date = new Date(dateIso);
    if (isNaN(date.getTime())) return labels.noCommits;

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
    let time = labels.justNow;
    if (diffDays >= 30) time = date.toLocaleDateString(locale);
    else if (diffDays >= 1) time = relative.format(-diffDays, "day");
    else if (diffHours >= 1) time = relative.format(-diffHours, "hour");
    else if (diffMinutes >= 5) time = relative.format(-diffMinutes, "minute");
    return `${labels.lastCommit}: ${time}`;
  }

  function getEnergyHeadline(energy, headlines) {
    if (energy >= 85) return headlines[0];
    if (energy >= 55) return headlines[1];
    if (energy >= 25) return headlines[2];
    return headlines[3];
  }

  function energyPercent(stats) {
    return Math.max(0, Math.min(100, Math.round(stats.energy || 0)));
  }

  function renderCafeCopy() {
    const modal = document.getElementById("cafeModal");
    if (!modal) return;

    const { dataset } = document.documentElement;
    const lang = dataset.lang === "en" ? "en" : "pt";
    const labels = copy[lang];
    const mode = dataset.displayStyle === "pixel" ? labels.professional : labels.playful;
    const trigger = document.getElementById("openCafeModalBtn");
    if (trigger) {
      trigger.title = mode.title;
      trigger.setAttribute("aria-label", mode.title);
    }

    modal.querySelector(".transition-badge").textContent = mode.title;
    modal.querySelector("[data-close]").setAttribute("aria-label", labels.close);
    modal.querySelector(".energy-bar-wrap").setAttribute("aria-label", labels.energyBar);
    modal.querySelector("#cafeHeadline").textContent = cachedEnergy
      ? getEnergyHeadline(energyPercent(cachedEnergy), mode.headlines)
      : energyUnavailable ? mode.title : mode.loading;
    modal.querySelector("#cafeSubtext").textContent = mode.description;
    modal.querySelector("#energyLastCommit").textContent = cachedEnergy
      ? formatRelativeTime(cachedEnergy.lastCommitAt, labels, lang === "en" ? "en" : "pt-BR")
      : "";
    modal.querySelector(".cafe-fineprint").textContent = labels.paymentNote;
    modal.querySelector("#cafeError").textContent = checkoutFailed ? labels.checkoutError : energyUnavailable ? mode.energyError : "";

    const banner = modal.querySelector("#cafeStatusBanner");
    banner.hidden = !paymentStatus;
    banner.textContent = paymentStatus ? mode[paymentStatus] : "";

    modal.querySelectorAll(".cafe-coffee-btn").forEach((button, index) => {
      const title = mode.options?.[index] || mode.option;
      const price = button.querySelector(".cafe-coffee-price").textContent;
      const boost = button.querySelector(".cafe-coffee-boost").textContent;
      const text = button === checkoutButton ? labels.loadingCheckout : title;
      button.querySelector(".cafe-coffee-title").textContent = text;
      button.setAttribute("aria-label", button === checkoutButton ? text : `${title} · ${price} (${boost})`);
    });
  }

  function resetEnergyDisplay() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    const fillEl = document.getElementById("energyBarFill");
    const percentEl = document.getElementById("energyPercent");
    if (fillEl) fillEl.style.width = "0%";
    if (percentEl) percentEl.textContent = "0%";
  }

  function animateEnergyTo(targetEnergy, onComplete) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    const fillEl = document.getElementById("energyBarFill");
    const percentEl = document.getElementById("energyPercent");
    if (!fillEl && !percentEl) return;

    if (targetEnergy <= 0) {
      if (fillEl) fillEl.style.width = "0%";
      if (percentEl) percentEl.textContent = "0%";
      if (onComplete) onComplete();
      return;
    }

    // Se o usuário prefere redução de movimento, vai direto
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (fillEl) fillEl.style.width = `${targetEnergy}%`;
      if (percentEl) percentEl.textContent = `${targetEnergy}%`;
      if (onComplete) onComplete();
      return;
    }

    // Garante que começa rigorosamente em 0
    if (fillEl) fillEl.style.width = "0%";
    if (percentEl) percentEl.textContent = "0%";

    // Duração dinâmica proporcional à porcentagem:
    // Ex: 5% = ~5 segundos, aumentando conforme a porcentagem sobe,
    // com teto de até 10 segundos para não cansar o usuário.
    const durationMs = Math.min(Math.max(targetEnergy * 1000, 1000), MAX_ANIMATION_DURATION_MS);

    const startTime = performance.now();

    function easeOutQuad(x) {
      return 1 - (1 - x) * (1 - x);
    }

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Desaceleração suave (ease-out) para que a subida vá desacelerando conforme chega perto do final
      const easedProgress = easeOutQuad(progress);

      const currentVal = Math.min(targetEnergy, Math.floor(easedProgress * targetEnergy));

      if (fillEl) fillEl.style.width = `${(easedProgress * targetEnergy).toFixed(2)}%`;
      if (percentEl) percentEl.textContent = `${currentVal}%`;

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        if (fillEl) fillEl.style.width = `${targetEnergy}%`;
        if (percentEl) percentEl.textContent = `${targetEnergy}%`;
        animationFrameId = null;
        if (onComplete) onComplete();
      }
    }

    animationFrameId = requestAnimationFrame(tick);
  }

  async function loadEnergy(forceReload = false) {
    const isCacheValid = cachedEnergy && Date.now() - lastFetchTime < CACHE_TTL_MS;
    if (!forceReload && isCacheValid) {
      animateEnergyTo(energyPercent(cachedEnergy));
      return;
    }

    if (isFetchingEnergy) return;
    isFetchingEnergy = true;
    energyUnavailable = false;
    renderCafeCopy();

    try {
      const res = await fetch("/api/energy/stats");
      if (!res.ok) {
        throw new Error("Não foi possível carregar os dados de energia.");
      }
      const data = await res.json();
      cachedEnergy = data;
      lastFetchTime = Date.now();
      animateEnergyTo(energyPercent(data));
    } catch (err) {
      console.warn("[cafe] Erro ao carregar energia:", err.message);
      energyUnavailable = true;
    } finally {
      isFetchingEnergy = false;
      renderCafeCopy();
    }
  }

  function showStatusBanner(status) {
    const banner = document.getElementById("cafeStatusBanner");
    if (!banner) return;

    paymentStatus = status;
    banner.classList.add(`is-${status}`);
    renderCafeCopy();
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

    const coffeeButtons = modal.querySelectorAll(".cafe-coffee-btn");
    window.addEventListener("site-language-change", renderCafeCopy);
    window.addEventListener("site-style-change", renderCafeCopy);
    renderCafeCopy();

    function openModal() {
      checkoutFailed = false;
      renderCafeCopy();
      resetEnergyDisplay();
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
      resetEnergyDisplay();
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

        checkoutFailed = false;
        checkoutButton = btn;
        coffeeButtons.forEach((b) => (b.disabled = true));
        renderCafeCopy();

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
          console.warn("[cafe] Erro ao iniciar pagamento:", err.message);
          checkoutFailed = true;
          checkoutButton = null;
          coffeeButtons.forEach((b) => (b.disabled = false));
          renderCafeCopy();
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
