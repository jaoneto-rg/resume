/**
 * Carrossel infinito reutilizável por arraste (drag) com clones e snap suave.
 * Reproduz o comportamento do carrossel de projetos, aplicando as classes
 * is-center, is-left, is-right, is-far e transições fluidas.
 */
(function () {
  function initInfiniteCarousel(carouselInput, options = {}) {
    const carousel =
      typeof carouselInput === "string"
        ? document.querySelector(carouselInput)
        : carouselInput;
    if (!carousel) return null;

    const track = carousel.querySelector(options.trackSelector || ".carousel-track");
    if (!track) return null;

    const cardSelector = options.cardSelector || ".carousel-card";
    const originals = Array.from(track.querySelectorAll(cardSelector));
    if (!originals.length) return null;

    // Se houver menos de 3 cards originais, duplicamos para que o loop infinito
    // tenha cartas suficientes para centro, esquerda e direita sem quebras.
    let baseItems = originals;
    if (baseItems.length === 1) {
      baseItems = [
        baseItems[0],
        baseItems[0].cloneNode(true),
        baseItems[0].cloneNode(true),
      ];
    } else if (baseItems.length === 2) {
      baseItems = [
        baseItems[0],
        baseItems[1],
        baseItems[0].cloneNode(true),
        baseItems[1].cloneNode(true),
      ];
    }

    track.innerHTML = "";
    baseItems.forEach((card, index) => {
      card.dataset.index = String(index);
      track.appendChild(card);
    });

    const clonesBefore = baseItems.map((card) => {
      const clone = card.cloneNode(true);
      clone.dataset.clone = "before";
      return clone;
    });
    const clonesAfter = baseItems.map((card) => {
      const clone = card.cloneNode(true);
      clone.dataset.clone = "after";
      return clone;
    });

    track.prepend(...clonesBefore);
    track.append(...clonesAfter);

    let cards = Array.from(track.querySelectorAll(cardSelector));
    const total = baseItems.length;

    let initialOffset = Math.floor(total / 2);
    if (typeof options.getInitialIndex === "function") {
      const customIdx = options.getInitialIndex(baseItems);
      if (customIdx >= 0) initialOffset = customIdx;
    }
    let currentIndex = total + initialOffset;

    let startX = 0;
    let startTranslate = 0;
    let currentTranslate = 0;
    let isDragging = false;
    let hasMoved = false;

    function updateCenter() {
      const containerCenter = carousel.clientWidth / 2;
      const activeCard = cards[currentIndex];
      if (!activeCard) return;
      const cardCenter = activeCard.offsetLeft + activeCard.offsetWidth / 2;
      currentTranslate = containerCenter - cardCenter;
      track.style.transform = `translateX(${currentTranslate}px)`;

      cards.forEach((card, index) => {
        const delta = index - currentIndex;
        card.classList.toggle("is-center", delta === 0);
        card.classList.toggle("is-left", delta === -1);
        card.classList.toggle("is-right", delta === 1);
        card.classList.toggle("is-far", Math.abs(delta) > 1);
      });
    }

    function snapToClosest() {
      const containerCenter = carousel.clientWidth / 2;
      let closestIndex = currentIndex;
      let closestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2 + currentTranslate;
        const distance = Math.abs(containerCenter - cardCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      currentIndex = closestIndex;
      track.style.transition = "transform 280ms ease";
      updateCenter();
    }

    function onPointerDown(event) {
      // Ignora links, botões e controles para permitir clique normal
      if (event.target.closest("a, button, input, textarea, select")) return;
      isDragging = true;
      hasMoved = false;
      startX = event.clientX ?? 0;
      startTranslate = currentTranslate;
    }

    function onPointerMove(event) {
      if (!isDragging) return;
      const delta = (event.clientX ?? 0) - startX;
      if (Math.abs(delta) > 6) {
        if (!hasMoved) {
          hasMoved = true;
          carousel.classList.add("is-dragging");
          track.style.transition = "none";
          try {
            carousel.setPointerCapture(event.pointerId);
          } catch (_) {}
        }
        currentTranslate = startTranslate + delta;
        track.style.transform = `translateX(${currentTranslate}px)`;
      }
    }

    function onPointerUp(event) {
      if (!isDragging) return;
      isDragging = false;
      carousel.classList.remove("is-dragging");
      try {
        carousel.releasePointerCapture(event.pointerId);
      } catch (_) {}

      if (hasMoved) {
        snapToClosest();
        setTimeout(() => {
          hasMoved = false;
        }, 60);
      }
    }

    carousel.addEventListener("pointerdown", onPointerDown);
    carousel.addEventListener("pointermove", onPointerMove);
    carousel.addEventListener("pointerup", onPointerUp);
    carousel.addEventListener("pointerleave", onPointerUp);

    cards.forEach((card, index) => {
      card.addEventListener("click", (e) => {
        if (hasMoved) return;
        if (e.target.closest("a, button, input, textarea, select")) return;
        if (index === currentIndex) return;

        currentIndex = index;
        track.style.transition = "transform 280ms ease";
        updateCenter();
      });
    });

    track.addEventListener("transitionend", () => {
      if (currentIndex < total) {
        currentIndex += total;
        track.style.transition = "none";
        updateCenter();
      } else if (currentIndex >= total * 2) {
        currentIndex -= total;
        track.style.transition = "none";
        updateCenter();
      }
    });

    const onResize = () => updateCenter();
    window.addEventListener("resize", onResize);

    updateCenter();

    return {
      updateCenter,
      snapToClosest,
      destroy() {
        carousel.removeEventListener("pointerdown", onPointerDown);
        carousel.removeEventListener("pointermove", onPointerMove);
        carousel.removeEventListener("pointerup", onPointerUp);
        carousel.removeEventListener("pointerleave", onPointerUp);
        window.removeEventListener("resize", onResize);
      },
    };
  }

  window.initInfiniteCarousel = initInfiniteCarousel;
})();
