(function () {
  function initHeroSection(scope) {
    const mount = scope || document;
    const root = document.documentElement;
    const hero = mount.querySelector("#hero");
    const topbar = mount.querySelector(".topbar");
    const themeToggle = mount.querySelector("#themeToggle");
    const themeLabel = mount.querySelector("#themeLabel");
    const themeIcon = mount.querySelector("#themeIcon");
    const waveToggle = mount.querySelector("#waveToggle");
    const langToggle = mount.querySelector("#langToggle");
    const langLabel = mount.querySelector("#langLabel");
    const menuToggle = mount.querySelector("#menuToggle");
    const typedSubtitleTop = mount.querySelector("#typedSubtitleTop");
    const typedSubtitleBottom = mount.querySelector("#typedSubtitleBottom");
    const caretTop = mount.querySelector("#caretTop");
    const caretBottom = mount.querySelector("#caretBottom");
    const autoAge = document.getElementById("autoAge");
    const worldContainer = mount.querySelector(".world");
    const fragmentShaderScript = mount.querySelector("#fragmentShader");
    const vertexShaderScript = mount.querySelector("#vertexShader");

    if (!hero || !worldContainer || !fragmentShaderScript || !vertexShaderScript) {
      return;
    }

    const atmospheres = {
      light: [
        { speed: 0.14, hue: 0.0, hueVariation: 0.0, density: 0.58, displacement: 0.44, saturation: 0.92, lightness: 0.95, lightnessVariation: 0.02 },
        { speed: 0.16, hue: 0.0, hueVariation: 0.0, density: 0.62, displacement: 0.50, saturation: 0.96, lightness: 0.94, lightnessVariation: 0.03 },
        { speed: 0.18, hue: 0.0, hueVariation: 0.0, density: 0.66, displacement: 0.52, saturation: 0.99, lightness: 0.93, lightnessVariation: 0.04 }
      ],
      dark: [
        { speed: 0.14, hue: 0.0, hueVariation: 0.0, density: 0.58, displacement: 0.44, saturation: 0.92, lightness: 0.95, lightnessVariation: 0.02 },
        { speed: 0.16, hue: 0.0, hueVariation: 0.0, density: 0.62, displacement: 0.50, saturation: 0.96, lightness: 0.94, lightnessVariation: 0.03 },
        { speed: 0.18, hue: 0.0, hueVariation: 0.0, density: 0.66, displacement: 0.52, saturation: 0.99, lightness: 0.93, lightnessVariation: 0.04 }
      ]
    };

    class World {
      constructor(width, height) {
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(width, height);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 20000);
        this.camera.position.z = 200;
        worldContainer.appendChild(this.renderer.domElement);

        this.timer = 0;
        this.mousePos = { x: 0.5, y: 0.5 };
        this.targetMousePos = { x: 0.5, y: 0.5 };
        this.parameters = atmospheres.light[0];
        this.createPlane();
      }

      createPlane() {
        this.material = new THREE.RawShaderMaterial({
          vertexShader: vertexShaderScript.textContent,
          fragmentShader: fragmentShaderScript.textContent,
          uniforms: {
            uTime: { value: 0 },
            uHue: { value: 0.0 },
            uHueVariation: { value: 0.0 },
            uDensity: { value: 0.58 },
            uDisplacement: { value: 0.44 },
            uSaturation: { value: 0.92 },
            uLightness: { value: 0.95 },
            uLightnessVariation: { value: 0.02 },
            uMousePosition: { value: new THREE.Vector2(0.5, 0.5) }
          }
        });

        this.plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 1, 1), this.material);
        this.scene.add(this.plane);
      }

      applyParameters(next) {
        this.parameters = next;
        const u = this.plane.material.uniforms;
        u.uHue.value = next.hue;
        u.uHueVariation.value = next.hueVariation;
        u.uDensity.value = next.density;
        u.uDisplacement.value = next.displacement;
        u.uSaturation.value = next.saturation;
        u.uLightness.value = next.lightness;
        u.uLightnessVariation.value = next.lightnessVariation;
      }

      render() {
        this.timer += this.parameters.speed;
        this.plane.material.uniforms.uTime.value = this.timer;

        this.mousePos.x += (this.targetMousePos.x - this.mousePos.x) * 0.1;
        this.mousePos.y += (this.targetMousePos.y - this.mousePos.y) * 0.1;
        this.plane.material.uniforms.uMousePosition.value = new THREE.Vector2(this.mousePos.x, this.mousePos.y);
        this.renderer.render(this.scene, this.camera);
      }

      loop() {
        this.render();
        requestAnimationFrame(this.loop.bind(this));
      }

      updateSize(w, h) {
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
      }

      mouseMove(mousePos) {
        this.targetMousePos.x = mousePos.px;
        this.targetMousePos.y = mousePos.py;
      }
    }

    let world;
    let moodIndex = 0;

    function currentTheme() {
      return root.dataset.theme === "dark" ? "dark" : "light";
    }

    function setTheme(next) {
      root.dataset.theme = next;
      localStorage.setItem("theme", next);
      if (themeLabel) {
        themeLabel.textContent = next === "dark" ? "Dark" : "Light";
      }
      if (themeIcon) {
        themeIcon.textContent = next === "dark" ? "☾" : "☀";
      }
      moodIndex = 0;
      if (world) world.applyParameters(atmospheres[next][moodIndex]);
    }

    const i18n = {
      pt: {
        "nav.home": "Início",
        "nav.about": "Sobre",
        "nav.summary": "Resumo",
        "nav.journey": "Trajetória",
        "nav.education": "Formação",
        "nav.projects": "Projetos",
        "nav.contact": "Contato",
        "hero.subtitle.top": "Sou Desenvolvedor Front-end",
        "hero.subtitle.bottom": "& Designer UI/UX",
        "resume.eyebrow": "Resumo Profissional",
        "resume.title": "Resumo Profissional",
        "resume.body": "Desenvolvedor Front-end Pleno e UI/UX Designer com experiência no desenvolvimento de aplicações web e mobile, atuando desde a concepção da interface até a implementação técnica. Forte atuação com React.js, Vue.js, TypeScript e React Native, com foco em arquitetura baseada em componentes, performance e acessibilidade. Vivência em ambientes ágeis, integração com APIs RESTful e colaboração com times multidisciplinares para entrega de soluções centradas no usuário.",
        "about.role": "Web Artisan & UI/UX Designer",
        "about.quote": "\"Be the change that you want to see in the world.\"",
        "about.birthday.label": "Aniversario:",
        "about.birthday.value": "30 Out",
        "about.phone.label": "Telefone:",
        "about.phone.value": "+55 82 99138 1414",
        "about.city.label": "Cidade:",
        "about.city.value": "Maceio, Brasil",
        "about.age.label": "Idade:",
        "about.age.value": "27",
        "about.degree.label": "Nível:",
        "about.degree.value": "Pleno",
        "about.email.label": "Email:",
        "about.email.value": "contatojmendonca@gmail.com",
        "journey.eyebrow": "Trajetória",
        "journey.title": "Experiencia Profissional",
        "journey.agill.title": "Agill — Desenvolvedor Front-end",
        "journey.agill.meta": "Ago/2024 - Nov/2025 · Presencial · Maceio/AL",
        "journey.agill.body": "Desenvolvimento, evolução e manutenção de interfaces web com Vue.js, JavaScript e TypeScript. Decisões técnicas de arquitetura de componentes, modernização de sistemas internos, melhoria de performance e UX. Integração com APIs RESTful e trabalho em ambiente agil (Scrum) com designers e back-end.",
        "journey.daily.title": "Daily Grind — Mobile Full Stack Project (Projeto Proprio)",
        "journey.daily.meta": "Dez/2025 - Jan/2026 · Remoto · Maceio/AL",
        "journey.daily.body": "Idealização e desenvolvimento de app mobile de produtividade com React Native. Definição de arquitetura, criação de interfaces e funcionalidades. Prototipação no Figma, princípios de UX/UI, integração com serviços back-end e versionamento com Git.",
        "journey.freelance.title": "Freelancer — Desenvolvedor Front-end",
        "journey.freelance.meta": "Abr/2023 - Jun/2023 · Remoto · Maceio/AL",
        "journey.freelance.body": "Interfaces responsivas com HTML5, CSS3 e JavaScript. Definição visual e organização de layouts. Integração com Laravel via APIs RESTful e boas práticas de acessibilidade e compatibilidade cross-browser.",
        "journey.defesa.title": "Defesa Civil de Maceio — Desenvolvedor Full-stack",
        "journey.defesa.meta": "Mar/2021 - Nov/2021 · Presencial · Maceio/AL",
        "journey.defesa.body": "Desenvolvimento e manutenção de sistemas internos com Laravel, atuando no front-end e em ajustes de usabilidade e layout. Correção de funcionalidades e melhoria da experiência dos usuários internos.",
        "education.eyebrow": "Formação",
        "education.title": "Formação Academica e Certificados",
        "education.degree": "Bacharelado em Sistemas da Informação — CESMAC",
        "education.degree.meta": "Conclusão: 2024 · Maceio/AL",
        "education.degree.body": "Formação focada em desenvolvimento de software, bancos de dados, engenharia de requisitos e gestão de projetos.",
        "education.languages.title": "Idiomas",
        "education.languages.pt": "Portugues (Nativo)",
        "education.languages.en": "Ingles — Intermediario (Leitura tecnica e documentacao)",
        "education.languages.es": "Espanhol (Tecnico)",
        "education.certs.title": "Certificados",
        "education.certs.front": "Formação Front-end — Udemy — 2024",
        "education.certs.vue": "Desenvolvimento Web Avançado com Vue.js — Udemy — 2024",
        "education.certs.laravel": "Laravel — Udemy — 2024",
        "education.certs.uiux": "UI/UX Designer com Figma — Udemy — 2024",
        "education.certs.rn": "React Native — Udemy — 2024",
        "projects.eyebrow": "Projetos",
        "projects.title": "Portfolio em Progresso",
        "projects.body": "Estou preparando meus projetos para publicacao. Enquanto isso, este espaco destaca as tecnologias que utilizo com mais frequencia.",
        "projects.pokedex.body": "Projeto de Pokedex simples para praticar consumo de API externa e manipulacao do DOM. A aplicacao busca dados na PokeAPI e exibe nome, numero e sprite do Pokemon, alem de permitir navegar entre os registros.",
        "projects.pokedex.live": "Acessar Projeto",
        "projects.placeholder.title": "Em breve",
        "projects.placeholder.name2": "Projeto 2",
        "projects.placeholder.name3": "Projeto 3",
        "projects.placeholder.name4": "Projeto 4",
        "projects.placeholder.name5": "Projeto 5",
        "projects.placeholder.body": "Novo projeto sendo preparado para entrar no portfolio.",
        "transition.about": "Sobre",
        "about.body": "Sou uma pessoa em constante evolucao, aprendo com facilidade e gosto de colaborar com o time para construir relacoes positivas e resultados solidos.",
        "contact.eyebrow": "Contato",
        "contact.title": "Vamos Conversar",
        "contact.location.title": "Localização",
        "contact.location.body": "Brasil - Maceio / AL",
        "contact.phone.title": "Telefone",
        "contact.links.title": "Links",
        "footer.tagline": "Frontend Developer & UI/UX Designer",
        "waves.label": "Ondas"
      },
      en: {
        "nav.home": "Home",
        "nav.about": "About",
        "nav.summary": "Summary",
        "nav.journey": "Journey",
        "nav.education": "Education",
        "nav.projects": "Projects",
        "nav.contact": "Contact",
        "hero.subtitle.top": "I'm a Frontend Developer",
        "hero.subtitle.bottom": "& UI/UX Designer",
        "resume.eyebrow": "Professional Summary",
        "resume.title": "Professional Summary",
        "resume.body": "Mid-level Front-end Developer and UI/UX Designer with experience building web and mobile applications, from interface conception to technical implementation. Strong work with React.js, Vue.js, TypeScript, and React Native, focusing on component-based architecture, performance, and accessibility. Experience in agile environments, RESTful API integration, and collaboration with multidisciplinary teams to deliver user-centered solutions.",
        "about.role": "Web Artisan & UI/UX Designer",
        "about.quote": "\"Be the change that you want to see in the world.\"",
        "about.birthday.label": "Birthday:",
        "about.birthday.value": "30 Oct",
        "about.phone.label": "Phone:",
        "about.phone.value": "+55 82 99138 1414",
        "about.city.label": "City:",
        "about.city.value": "Maceio, Brazil",
        "about.age.label": "Age:",
        "about.age.value": "27",
        "about.degree.label": "Degree:",
        "about.degree.value": "Pleno",
        "about.email.label": "Email:",
        "about.email.value": "contatojmendonca@gmail.com",
        "journey.eyebrow": "Journey",
        "journey.title": "Professional Experience",
        "journey.agill.title": "Agill — Front-end Developer",
        "journey.agill.meta": "Aug/2024 - Nov/2025 · On-site · Maceio/AL",
        "journey.agill.body": "Development, evolution, and maintenance of web interfaces using Vue.js, JavaScript, and TypeScript. Technical decisions on component architecture, modernization of internal systems, performance improvements, and UX enhancements. RESTful API integration and agile Scrum collaboration with designers and back-end.",
        "journey.daily.title": "Daily Grind — Mobile Full Stack Project (Personal Project)",
        "journey.daily.meta": "Dec/2025 - Jan/2026 · Remote · Maceio/AL",
        "journey.daily.body": "Designed and built a productivity mobile app with React Native. Defined architecture, created interfaces, and implemented features. Prototyped in Figma with UX/UI principles, integrated back-end services, and versioned with Git for scalability and visual consistency.",
        "journey.freelance.title": "Freelancer — Front-end Developer",
        "journey.freelance.meta": "Apr/2023 - Jun/2023 · Remote · Maceio/AL",
        "journey.freelance.body": "Responsive interfaces using HTML5, CSS3, and JavaScript. Visual definition and layout organization. Laravel integration via RESTful APIs and best practices for accessibility and cross-browser compatibility.",
        "journey.defesa.title": "Civil Defense of Maceio — Full-stack Developer",
        "journey.defesa.meta": "Mar/2021 - Nov/2021 · On-site · Maceio/AL",
        "journey.defesa.body": "Development and maintenance of internal systems with Laravel, working on front-end and usability/layout adjustments. Bug fixes and user experience improvements for internal teams.",
        "education.eyebrow": "Education",
        "education.title": "Education and Certificates",
        "education.degree": "B.Sc. in Information Systems — CESMAC",
        "education.degree.meta": "Graduated: 2024 · Maceio/AL",
        "education.degree.body": "Program focused on software development, databases, requirements engineering, and project management.",
        "education.languages.title": "Languages",
        "education.languages.pt": "Portuguese (Native)",
        "education.languages.en": "English — Intermediate (Technical Reading and Documentation)",
        "education.languages.es": "Spanish (Technical)",
        "education.certs.title": "Certificates",
        "education.certs.front": "Front-end Training — Udemy — 2024",
        "education.certs.vue": "Advanced Web Development with Vue.js — Udemy — 2024",
        "education.certs.laravel": "Laravel — Udemy — 2024",
        "education.certs.uiux": "UI/UX Designer with Figma — Udemy — 2024",
        "education.certs.rn": "React Native — Udemy — 2024",
        "projects.eyebrow": "Projects",
        "projects.title": "Portfolio In Progress",
        "projects.body": "I'm preparing my projects for publication. For now, this section highlights the technologies I use most often.",
        "projects.pokedex.body": "Simple Pokedex project built to practice consuming an external API and DOM manipulation. The app fetches data from PokeAPI and shows the Pokemon name, number, and sprite, plus navigation between entries.",
        "projects.pokedex.live": "Acess Project",
        "projects.placeholder.title": "Coming soon",
        "projects.placeholder.name2": "Project 2",
        "projects.placeholder.name3": "Project 3",
        "projects.placeholder.name4": "Project 4",
        "projects.placeholder.name5": "Project 5",
        "projects.placeholder.body": "New project being prepared for the portfolio.",
        "transition.about": "About",
        "about.body": "I'm a person in constant evolution, I learn fast and enjoy collaborating with the team to build positive relationships and solid results.",
        "contact.eyebrow": "Contact",
        "contact.title": "Let's Talk",
        "contact.location.title": "Location",
        "contact.location.body": "Maceio / AL",
        "contact.phone.title": "Phone",
        "contact.links.title": "Links",
        "footer.tagline": "Frontend Developer & UI/UX Designer",
        "waves.label": "Waves"
      }
    };

    function applyI18n(lang) {
      const dict = i18n[lang] || i18n.pt;
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (!key || !dict[key]) return;
        el.textContent = dict[key];
      });

      if (typedSubtitleTop) typedSubtitleTop.dataset.text = dict["hero.subtitle.top"];
      if (typedSubtitleBottom) typedSubtitleBottom.dataset.text = dict["hero.subtitle.bottom"];
    }

    function computeAge() {
      const today = new Date();
      const birth = new Date(1998, 9, 30);
      let age = today.getFullYear() - birth.getFullYear();
      const beforeBirthday =
        today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
      if (beforeBirthday) age -= 1;
      if (autoAge) autoAge.textContent = String(age);
      return age;
    }

    function setLang(next) {
      root.dataset.lang = next;
      localStorage.setItem("lang", next);
      document.documentElement.lang = next === "en" ? "en" : "pt-BR";
      if (langLabel) {
        langLabel.textContent = next === "en" ? "EN" : "PT";
      }
      applyI18n(next);
      computeAge();
      startTypingAnimation();
    }

    function initTheme() {
      const saved = localStorage.getItem("theme");
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(saved || (systemPrefersDark ? "dark" : "light"));
    }

    function getHeroMouse(event) {
      const rect = hero.getBoundingClientRect();
      const x = event.clientX ?? event.touches[0].clientX;
      const y = event.clientY ?? event.touches[0].clientY;
      const px = (x - rect.left) / rect.width;
      const py = 1.0 - (y - rect.top) / rect.height;
      return {
        px: Math.max(0, Math.min(1, px)),
        py: Math.max(0, Math.min(1, py))
      };
    }

    function initWorld() {
      const rect = hero.getBoundingClientRect();
      world = new World(rect.width, rect.height);
      world.applyParameters(atmospheres[currentTheme()][moodIndex]);
      world.loop();
    }

    window.addEventListener("resize", function () {
      if (!world) return;
      const rect = hero.getBoundingClientRect();
      world.updateSize(rect.width, rect.height);
    });

    hero.addEventListener("mousemove", function (event) {
      if (!world) return;
      world.mouseMove(getHeroMouse(event));
    });

    hero.addEventListener("touchmove", function (event) {
      if (!world || !event.touches[0]) return;
      world.mouseMove(getHeroMouse(event));
    }, { passive: true });

    if (themeToggle) {
      themeToggle.addEventListener("click", function () {
        const next = currentTheme() === "dark" ? "light" : "dark";
        setTheme(next);
      });
    }

    if (menuToggle && topbar) {
      menuToggle.addEventListener("click", function () {
        const isOpen = topbar.classList.toggle("is-open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
      });
    }

    if (waveToggle) {
      waveToggle.addEventListener("click", function () {
        const list = atmospheres[currentTheme()];
        moodIndex = (moodIndex + 1) % list.length;
        if (world) world.applyParameters(list[moodIndex]);
      });
    }

    if (langToggle) {
      langToggle.addEventListener("click", function () {
        const next = (root.dataset.lang || "pt") === "pt" ? "en" : "pt";
        setLang(next);
      });
    }

    let typingTimeout;

    function startTypingAnimation() {
      if (!typedSubtitleTop || !typedSubtitleBottom) return;

      const textTop = typedSubtitleTop.dataset.text || "";
      const textBottom = typedSubtitleBottom.dataset.text || "";
      const typingSpeed = 54;
      const deletingSpeed = 28;
      const holdAfterBothTyped = 1300;
      const holdAfterAllDeleted = 320;

      let topIndex = 0;
      let bottomIndex = 0;
      let phase = "typingTop";

      function setActiveCaret(active) {
        if (caretTop) caretTop.classList.toggle("active", active === "top");
        if (caretBottom) caretBottom.classList.toggle("active", active === "bottom");
      }

      function tick() {
        typedSubtitleTop.textContent = textTop.slice(0, topIndex);
        typedSubtitleBottom.textContent = textBottom.slice(0, bottomIndex);

        if (phase === "typingTop") {
          setActiveCaret("top");
          if (topIndex < textTop.length) {
            topIndex += 1;
            typingTimeout = setTimeout(tick, typingSpeed);
          } else {
            phase = "typingBottom";
            typingTimeout = setTimeout(tick, typingSpeed + 50);
          }
          return;
        }

        if (phase === "typingBottom") {
          setActiveCaret("bottom");
          if (bottomIndex < textBottom.length) {
            bottomIndex += 1;
            typingTimeout = setTimeout(tick, typingSpeed);
          } else {
            phase = "deletingBottom";
            typingTimeout = setTimeout(tick, holdAfterBothTyped);
          }
          return;
        }

        if (phase === "deletingBottom") {
          setActiveCaret("bottom");
          if (bottomIndex > 0) {
            bottomIndex -= 1;
            typingTimeout = setTimeout(tick, deletingSpeed);
          } else {
            phase = "deletingTop";
            typingTimeout = setTimeout(tick, deletingSpeed + 40);
          }
          return;
        }

        setActiveCaret("top");
        if (topIndex > 0) {
          topIndex -= 1;
          typingTimeout = setTimeout(tick, deletingSpeed);
        } else {
          phase = "typingTop";
          typingTimeout = setTimeout(tick, holdAfterAllDeleted);
        }
      }

      if (typingTimeout) clearTimeout(typingTimeout);
      typedSubtitleTop.textContent = "";
      typedSubtitleBottom.textContent = "";
      tick();
    }

    function initProjectsCarousel() {
      const carousel = document.querySelector(".projects-carousel");
      if (!carousel) return;

      const track = carousel.querySelector(".carousel-track");
      if (!track) return;

      const originals = Array.from(track.querySelectorAll(".carousel-card"));
      if (!originals.length) return;

      originals.forEach((card, index) => {
        card.dataset.index = String(index);
      });

      const clonesBefore = originals.map((card) => {
        const clone = card.cloneNode(true);
        clone.dataset.clone = "before";
        return clone;
      });
      const clonesAfter = originals.map((card) => {
        const clone = card.cloneNode(true);
        clone.dataset.clone = "after";
        return clone;
      });

      track.prepend(...clonesBefore);
      track.append(...clonesAfter);

      let cards = Array.from(track.querySelectorAll(".carousel-card"));
      const total = originals.length;

      const pokedexIndex = originals.findIndex((card) =>
        card.querySelector("h3")?.textContent?.trim().toUpperCase() === "POKEDEX"
      );
      let currentIndex = total + (pokedexIndex >= 0 ? pokedexIndex : Math.floor(total / 2));
      let startX = 0;
      let startTranslate = 0;
      let currentTranslate = 0;
      let isDragging = false;
      let hasMoved = false;

      function normalizeIndex(index) {
        return ((index % total) + total) % total;
      }

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
        if (event.target.closest("a")) return;
        isDragging = true;
        hasMoved = false;
        carousel.classList.add("is-dragging");
        track.style.transition = "none";
        startX = event.clientX ?? 0;
        startTranslate = currentTranslate;
        carousel.setPointerCapture(event.pointerId);
      }

      function onPointerMove(event) {
        if (!isDragging) return;
        const delta = (event.clientX ?? 0) - startX;
        if (Math.abs(delta) > 6) {
          hasMoved = true;
        }
        currentTranslate = startTranslate + delta;
        track.style.transform = `translateX(${currentTranslate}px)`;
      }

      function onPointerUp(event) {
        if (!isDragging) return;
        isDragging = false;
        hasMoved = false;
        carousel.classList.remove("is-dragging");
        carousel.releasePointerCapture(event.pointerId);
        snapToClosest();
      }

      carousel.addEventListener("pointerdown", onPointerDown);
      carousel.addEventListener("pointermove", onPointerMove);
      carousel.addEventListener("pointerup", onPointerUp);
      carousel.addEventListener("pointerleave", onPointerUp);

      cards.forEach((card) => {
        card.addEventListener("click", () => {
          if (hasMoved) return;
          const rawIndex = Number(card.dataset.index ?? 0);
          currentIndex = rawIndex + total;
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

      window.addEventListener("resize", () => {
        updateCenter();
      });

      updateCenter();
    }

    initTheme();
    computeAge();
    setLang(localStorage.getItem("lang") || "pt");
    initWorld();
    startTypingAnimation();
    initProjectsCarousel();
  }

  window.initHeroSection = initHeroSection;
})();
