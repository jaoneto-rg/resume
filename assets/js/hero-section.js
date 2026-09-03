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
        "hero.subtitle.top": "Sou Desenvolvedor Full-Stack",
        "hero.subtitle.bottom": "& Mobile Engineer",
        "resume.eyebrow": "Resumo Profissional",
        "resume.title": "Resumo Profissional",
        "resume.body": "Desenvolvedor Full-Stack com sólida experiência no desenvolvimento de aplicações web e mobile completas, atuando da interface à integração de back-end. Domínio prático de React.js, Vue.js, Next.js, React Native e TypeScript no front-end, e Node.js, Laravel/PHP e Supabase no back-end, incluindo modelagem de dados, autenticação e APIs RESTful. Experiência em arquitetura de componentes, metodologias ágeis (Scrum) e CI/CD. Base sólida em UI/UX Design (Figma), unindo visão de produto à execução técnica ponta a ponta.",
        "about.role": "Full-Stack Developer & Mobile Engineer",
        "about.quote": "\"Be the change that you want to see in the world.\"",
        "about.birthday.label": "Aniversário:",
        "about.birthday.value": "30 Out",
        "about.phone.label": "Telefone:",
        "about.phone.value": "+55 82 99138 1414",
        "about.city.label": "Cidade:",
        "about.city.value": "Maceió, Brasil",
        "about.age.label": "Idade:",
        "about.age.value": "27",
        "about.degree.label": "Nível:",
        "about.degree.value": "Full-Stack",
        "about.email.label": "Email:",
        "about.email.value": "contatojmendonca@gmail.com",
        "journey.eyebrow": "Trajetória",
        "journey.title": "Experiência Profissional",
        "journey.visio.title": "Visio Sunglass — E-commerce Full-Stack (Freelancer)",
        "journey.visio.meta": "Mai/2026 – Jul/2026 · Remoto",
        "journey.visio.body": "Projetei e desenvolvi sozinho, do zero, uma loja virtual de óculos de sol com Next.js, React, TypeScript, Supabase e Tailwind CSS, cobrindo front-end, back-end, banco de dados e deploy. Substituí um catálogo estático por uma vitrine interativa mobile-first, elevando a experiência de navegação e gerando aumento de até 120% na aderência dos compradores.",
        "journey.daily.title": "Daily Grind — Projeto Full-Stack Mobile (Projeto Próprio)",
        "journey.daily.meta": "Dez/2025 – Jan/2026 · Remoto",
        "journey.daily.body": "Idealizei e desenvolvi, ponta a ponta, um app mobile de produtividade em React Native (Expo), com back-end em Supabase (banco de dados, autenticação e storage). Arquitetura com Zustand, Expo Router, TypeScript strict, Zod e React Hook Form. CI/CD com GitHub Actions e EAS Build. Localização bilíngue (PT-BR/EN).",
        "journey.agill.title": "Agill — Desenvolvedor Front-end",
        "journey.agill.meta": "Ago/2024 – Nov/2025 · Presencial · Maceió/AL",
        "journey.agill.body": "Desenvolvi e mantive interfaces web com Vue.js, JavaScript e TypeScript, participando de decisões técnicas de arquitetura de componentes. Integrei aplicações com APIs RESTful e colaborei com back-end e design em ambiente ágil (Scrum). Contribuí para modernização de sistemas internos e melhoria de performance e experiência do usuário.",
        "journey.freelance.title": "Freelancer — Desenvolvedor Full-Stack",
        "journey.freelance.meta": "Abr/2023 – Jun/2023 · Remoto",
        "journey.freelance.body": "Desenvolvi interfaces responsivas com HTML5, CSS3 e JavaScript, com foco em acessibilidade e compatibilidade cross-browser. Integrei o front-end a sistemas back-end em Laravel via APIs RESTful, cobrindo o ciclo completo da aplicação.",
        "journey.defesa.title": "Defesa Civil de Maceió — Desenvolvedor Full-Stack",
        "journey.defesa.meta": "Mar/2021 – Nov/2021 · Presencial · Maceió/AL",
        "journey.defesa.body": "Desenvolvi e mantive sistemas internos com Laravel no back-end, atuando também em front-end e usabilidade. Corrigi funcionalidades e reorganizei interfaces, contribuindo para maior estabilidade e eficiência das aplicações.",
        "education.eyebrow": "Formação",
        "education.title": "Formação Acadêmica e Certificados",
        "education.degree": "Bacharelado em Sistemas da Informação — CESMAC",
        "education.degree.meta": "Conclusão: 2024 · Maceió/AL",
        "education.degree.body": "Formação focada em desenvolvimento de software, bancos de dados, engenharia de requisitos e gestão de projetos.",
        "education.languages.title": "Idiomas",
        "education.languages.pt": "Português (Nativo)",
        "education.languages.en": "Inglês — Intermediário (Leitura técnica e documentação)",
        "education.languages.es": "Espanhol (Técnico)",
        "education.certs.title": "Certificados",
        "education.certs.front": "Formação Front-end — Udemy (2024)",
        "education.certs.vue": "Desenvolvimento Web Avançado com Vue.js — Udemy (2024)",
        "education.certs.laravel": "Laravel 5.8 — Udemy (2024)",
        "education.certs.uiux": "UI/UX Designer com Figma — Udemy (2024)",
        "education.certs.rn": "React Native — Udemy (2024)",
        "projects.eyebrow": "Projetos",
        "projects.title": "Portfolio em Progresso",
        "projects.body": "Estou preparando meus projetos para publicação. Enquanto isso, este espaço destaca as tecnologias que utilizo com mais frequência.",
        "projects.pokedex.body": "Projeto de Pokédex simples para praticar consumo de API externa e manipulação do DOM. A aplicação busca dados na PokeAPI e exibe nome, número e sprite do Pokémon, além de permitir navegar entre os registros.",
        "projects.pokedex.live": "Acessar Projeto",
        "projects.placeholder.title": "Em breve",
        "projects.placeholder.name2": "Projeto 2",
        "projects.placeholder.name3": "Projeto 3",
        "projects.placeholder.name4": "Projeto 4",
        "projects.placeholder.name5": "Projeto 5",
        "projects.placeholder.body": "Novo projeto sendo preparado para entrar no portfolio.",
        "transition.about": "Sobre",
        "about.body": "Sou uma pessoa em constante evolução, aprendo com facilidade e gosto de colaborar com o time para construir relações positivas e resultados sólidos.",
        "contact.eyebrow": "Contato",
        "contact.title": "Vamos Conversar",
        "contact.location.title": "Localização",
        "contact.location.body": "Brasil - Maceió / AL",
        "contact.phone.title": "Telefone",
        "contact.links.title": "Links",
        "footer.tagline": "Full-Stack Developer & Mobile Engineer",
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
        "hero.subtitle.top": "I'm a Full-Stack Developer",
        "hero.subtitle.bottom": "& Mobile Engineer",
        "resume.eyebrow": "Professional Summary",
        "resume.title": "Professional Summary",
        "resume.body": "Full-Stack Developer with solid experience building complete web and mobile applications, from interface to back-end integration. Practical expertise in React.js, Vue.js, Next.js, React Native, and TypeScript on the front-end, and Node.js, Laravel/PHP, and Supabase on the back-end, including data modeling, authentication, and RESTful APIs. Experience with component architecture, agile methodologies (Scrum), and CI/CD. Strong foundation in UI/UX Design (Figma), bridging product vision with end-to-end technical execution.",
        "about.role": "Full-Stack Developer & Mobile Engineer",
        "about.quote": "\"Be the change that you want to see in the world.\"",
        "about.birthday.label": "Birthday:",
        "about.birthday.value": "30 Oct",
        "about.phone.label": "Phone:",
        "about.phone.value": "+55 82 99138 1414",
        "about.city.label": "City:",
        "about.city.value": "Maceió, Brazil",
        "about.age.label": "Age:",
        "about.age.value": "27",
        "about.degree.label": "Level:",
        "about.degree.value": "Full-Stack",
        "about.email.label": "Email:",
        "about.email.value": "contatojmendonca@gmail.com",
        "journey.eyebrow": "Journey",
        "journey.title": "Professional Experience",
        "journey.visio.title": "Visio Sunglass — Full-Stack E-commerce (Freelancer)",
        "journey.visio.meta": "May/2026 – Jul/2026 · Remote",
        "journey.visio.body": "Designed and developed solo, from scratch, a sunglasses e-commerce store with Next.js, React, TypeScript, Supabase, and Tailwind CSS, covering front-end, back-end, database, and deployment. Replaced a static catalog with an interactive mobile-first storefront, boosting buyer engagement by up to 120%.",
        "journey.daily.title": "Daily Grind — Full-Stack Mobile Project (Personal Project)",
        "journey.daily.meta": "Dec/2025 – Jan/2026 · Remote",
        "journey.daily.body": "Designed and built end-to-end a productivity mobile app with React Native (Expo) and Supabase back-end (database, auth, and storage). Architecture with Zustand, Expo Router, strict TypeScript, Zod, and React Hook Form. CI/CD with GitHub Actions and EAS Build. Bilingual localization (PT-BR/EN).",
        "journey.agill.title": "Agill — Front-end Developer",
        "journey.agill.meta": "Aug/2024 – Nov/2025 · On-site · Maceió/AL",
        "journey.agill.body": "Developed and maintained web interfaces with Vue.js, JavaScript, and TypeScript, contributing to technical decisions on component architecture. Integrated applications with RESTful APIs and collaborated with back-end and design teams in an agile (Scrum) environment. Contributed to modernizing internal systems and improving performance and user experience.",
        "journey.freelance.title": "Freelancer — Full-Stack Developer",
        "journey.freelance.meta": "Apr/2023 – Jun/2023 · Remote",
        "journey.freelance.body": "Built responsive interfaces with HTML5, CSS3, and JavaScript, focusing on accessibility and cross-browser compatibility. Integrated front-end with Laravel back-end systems via RESTful APIs, covering the full application cycle.",
        "journey.defesa.title": "Civil Defense of Maceió — Full-Stack Developer",
        "journey.defesa.meta": "Mar/2021 – Nov/2021 · On-site · Maceió/AL",
        "journey.defesa.body": "Developed and maintained internal systems with Laravel on the back-end, also working on front-end and usability. Fixed functionalities and reorganized interfaces, contributing to greater stability and efficiency of the applications.",
        "education.eyebrow": "Education",
        "education.title": "Education and Certificates",
        "education.degree": "B.Sc. in Information Systems — CESMAC",
        "education.degree.meta": "Graduated: 2024 · Maceió/AL",
        "education.degree.body": "Program focused on software development, databases, requirements engineering, and project management.",
        "education.languages.title": "Languages",
        "education.languages.pt": "Portuguese (Native)",
        "education.languages.en": "English — Intermediate (Technical Reading and Documentation)",
        "education.languages.es": "Spanish (Technical)",
        "education.certs.title": "Certificates",
        "education.certs.front": "Front-end Training — Udemy (2024)",
        "education.certs.vue": "Advanced Web Development with Vue.js — Udemy (2024)",
        "education.certs.laravel": "Laravel 5.8 — Udemy (2024)",
        "education.certs.uiux": "UI/UX Designer with Figma — Udemy (2024)",
        "education.certs.rn": "React Native — Udemy (2024)",
        "projects.eyebrow": "Projects",
        "projects.title": "Portfolio In Progress",
        "projects.body": "I'm preparing my projects for publication. For now, this section highlights the technologies I use most often.",
        "projects.pokedex.body": "Simple Pokédex project built to practice consuming an external API and DOM manipulation. The app fetches data from PokéAPI and shows the Pokémon name, number, and sprite, plus navigation between entries.",
        "projects.pokedex.live": "Access Project",
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
        "contact.location.body": "Maceió / AL",
        "contact.phone.title": "Phone",
        "contact.links.title": "Links",
        "footer.tagline": "Full-Stack Developer & Mobile Engineer",
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
