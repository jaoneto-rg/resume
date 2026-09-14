// Easter egg: 2 cliques rápidos (dentro de 2s) no nome do rodapé
// redirecionam pro painel admin. Sem nenhuma pista visual de propósito —
// só quem já sabe que existe vai encontrar.
(function () {
    const trigger = document.getElementById("footerNameTrigger");
    if (!trigger) return;

    const REQUIRED_CLICKS = 2
    const WINDOW_MS = 2000;
    let clickTimestamps = [];

    trigger.addEventListener("click", () => {
        const now = Date.now();
        clickTimestamps = clickTimestamps.filter((t) => now - t < WINDOW_MS);
        clickTimestamps.push(now);

        if (clickTimestamps.length >= REQUIRED_CLICKS) {
            window.location.href = "./admin/admin.html";
        }
    });
})();