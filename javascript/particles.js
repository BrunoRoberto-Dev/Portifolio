const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const siteHeader = document.querySelector("[data-site-header]");
const menuButton = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

document.querySelectorAll("[data-current-year]").forEach((year) => {
  year.textContent = String(new Date().getFullYear());
});

const closeMenu = () => {
  if (!menuButton || !siteNav) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Abrir menu");
  siteNav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
};

if (menuButton && siteNav) {
  menuButton.addEventListener("click", () => {
    const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(willOpen));
    menuButton.setAttribute("aria-label", willOpen ? "Fechar menu" : "Abrir menu");
    siteNav.classList.toggle("is-open", willOpen);
    document.body.classList.toggle("menu-open", willOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

let scrollTicking = false;

const updateScrollUi = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
  document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 16);
  scrollTicking = false;
};

window.addEventListener(
  "scroll",
  () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollUi);
  },
  { passive: true }
);

updateScrollUi();

const initProjectLightbox = () => {
  const projectImages = Array.from(
    document.querySelectorAll(".case-cover img, .gallery-grid .gallery-item img")
  );

  if (!projectImages.length) return;

  const lightbox = document.createElement("div");
  lightbox.className = "project-lightbox";
  lightbox.hidden = true;
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Visualizador de imagens do projeto");
  lightbox.innerHTML = `
    <button class="project-lightbox__control project-lightbox__close" type="button" aria-label="Fechar visualizador">×</button>
    <button class="project-lightbox__control project-lightbox__previous" type="button" aria-label="Imagem anterior" aria-controls="project-lightbox-image">←</button>
    <div class="project-lightbox__stage">
      <img id="project-lightbox-image" class="project-lightbox__image" alt="">
    </div>
    <button class="project-lightbox__control project-lightbox__next" type="button" aria-label="Próxima imagem" aria-controls="project-lightbox-image">→</button>
    <div class="project-lightbox__meta">
      <p class="project-lightbox__caption"></p>
      <span class="project-lightbox__counter" aria-live="polite"></span>
    </div>
  `;
  document.body.append(lightbox);

  const displayedImage = lightbox.querySelector(".project-lightbox__image");
  const stage = lightbox.querySelector(".project-lightbox__stage");
  const caption = lightbox.querySelector(".project-lightbox__caption");
  const counter = lightbox.querySelector(".project-lightbox__counter");
  const closeButton = lightbox.querySelector(".project-lightbox__close");
  const previousButton = lightbox.querySelector(".project-lightbox__previous");
  const nextButton = lightbox.querySelector(".project-lightbox__next");
  const controls = [closeButton, previousButton, nextButton];
  let currentIndex = 0;
  let lastFocusedElement = null;
  let closeTimer = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  const imageCaption = (image, index) =>
    image.closest("figure")?.querySelector("figcaption")?.textContent?.trim() ||
    image.alt ||
    `Imagem ${index + 1} do projeto`;

  const preloadAdjacentImages = () => {
    const adjacentIndexes = [
      (currentIndex - 1 + projectImages.length) % projectImages.length,
      (currentIndex + 1) % projectImages.length,
    ];

    adjacentIndexes.forEach((index) => {
      const preload = new Image();
      preload.src = projectImages[index].currentSrc || projectImages[index].src;
    });
  };

  const showImage = (index) => {
    currentIndex = (index + projectImages.length) % projectImages.length;
    const selectedImage = projectImages[currentIndex];
    displayedImage.src = selectedImage.currentSrc || selectedImage.src;
    displayedImage.alt = selectedImage.alt;
    caption.textContent = imageCaption(selectedImage, currentIndex);
    counter.textContent = `${currentIndex + 1} / ${projectImages.length}`;
    preloadAdjacentImages();
  };

  const openLightbox = (index) => {
    window.clearTimeout(closeTimer);
    lastFocusedElement = document.activeElement;
    showImage(index);
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    window.requestAnimationFrame(() => lightbox.classList.add("is-open"));
    closeButton.focus({ preventScroll: true });
  };

  const closeLightbox = () => {
    if (lightbox.hidden) return;
    lightbox.classList.remove("is-open");
    document.body.classList.remove("lightbox-open");
    closeTimer = window.setTimeout(
      () => {
        lightbox.hidden = true;
        displayedImage.removeAttribute("src");
        lastFocusedElement?.focus({ preventScroll: true });
      },
      reduceMotion ? 0 : 220
    );
  };

  projectImages.forEach((image, index) => {
    const label = imageCaption(image, index);
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-haspopup", "dialog");
    image.setAttribute("aria-label", `Ampliar: ${label}`);

    image.addEventListener("click", () => openLightbox(index));
    image.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openLightbox(index);
    });
  });

  closeButton.addEventListener("click", closeLightbox);
  previousButton.addEventListener("click", () => showImage(currentIndex - 1));
  nextButton.addEventListener("click", () => showImage(currentIndex + 1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  stage.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].clientX;
      touchStartY = event.changedTouches[0].clientY;
    },
    { passive: true }
  );

  stage.addEventListener(
    "touchend",
    (event) => {
      const distanceX = event.changedTouches[0].clientX - touchStartX;
      const distanceY = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(distanceX) < 45 || Math.abs(distanceX) <= Math.abs(distanceY)) return;
      showImage(distanceX > 0 ? currentIndex - 1 : currentIndex + 1);
    },
    { passive: true }
  );

  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) return;

    if (event.key === "Escape") {
      closeLightbox();
      return;
    }

    if (event.key === "ArrowLeft") {
      showImage(currentIndex - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      showImage(currentIndex + 1);
      return;
    }

    if (event.key !== "Tab") return;
    const focusedIndex = controls.indexOf(document.activeElement);
    const nextFocusIndex = event.shiftKey
      ? (focusedIndex - 1 + controls.length) % controls.length
      : (focusedIndex + 1) % controls.length;
    event.preventDefault();
    controls[nextFocusIndex].focus();
  });
};

initProjectLightbox();

const initMotion = async () => {
  if (reduceMotion) return;

  try {
    const { animate, inView, stagger } = await import(
      "https://cdn.jsdelivr.net/npm/motion@12.43.0/+esm"
    );

    const heroItems = document.querySelectorAll("[data-hero-item]");
    if (heroItems.length) {
      heroItems.forEach((item) => {
        item.style.opacity = "0";
        item.style.transform = "translateY(22px)";
      });

      animate(
        heroItems,
        { opacity: [0, 1], y: [22, 0] },
        {
          duration: 0.72,
          delay: stagger(0.075),
          ease: [0.22, 1, 0.36, 1],
        }
      );
    }

    document.querySelectorAll("[data-reveal]").forEach((element) => {
      element.style.opacity = "0";
      element.style.transform = "translateY(30px)";
    });

    inView(
      "[data-reveal]",
      (element) => {
        animate(
          element,
          { opacity: [0, 1], y: [30, 0] },
          { duration: 0.72, ease: [0.22, 1, 0.36, 1] }
        );
      },
      { amount: 0.14, margin: "0px 0px -8% 0px" }
    );
  } catch (error) {
    document.querySelectorAll("[data-hero-item], [data-reveal]").forEach((element) => {
      element.style.removeProperty("opacity");
      element.style.removeProperty("transform");
    });
  }
};

const initThreeScene = async () => {
  const canvas = document.querySelector("#hero-canvas");
  const visual = document.querySelector(".hero-visual");
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const hasSlowConnection = connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || "");

  if (!canvas || !visual || reduceMotion || hasSlowConnection || window.innerWidth < 760) return;

  try {
    const THREE = await import(
      "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js"
    );

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 5.4;

    const group = new THREE.Group();
    scene.add(group);

    const geometry = new THREE.IcosahedronGeometry(1.46, 2);
    const solid = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0x6f4bd8,
        transparent: true,
        opacity: 0.08,
      })
    );
    const wireframe = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0x9d86ef,
        transparent: true,
        opacity: 0.36,
        wireframe: true,
      })
    );
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0x55e1e7,
        transparent: true,
        opacity: 0.72,
        size: 0.032,
        sizeAttenuation: true,
      })
    );

    group.add(solid, wireframe, points);
    group.rotation.set(-0.25, 0.35, -0.12);

    const starCount = 54;
    const starPositions = new Float32Array(starCount * 3);
    for (let index = 0; index < starCount; index += 1) {
      const offset = index * 3;
      starPositions[offset] = (Math.random() - 0.5) * 8;
      starPositions[offset + 1] = (Math.random() - 0.5) * 7;
      starPositions[offset + 2] = (Math.random() - 0.5) * 3 - 1;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        color: 0x8d9ccf,
        transparent: true,
        opacity: 0.42,
        size: 0.022,
      })
    );
    scene.add(stars);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event) => {
      const rect = visual.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.42;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.3;
    };
    visual.addEventListener("pointermove", onPointerMove, { passive: true });

    const resize = () => {
      const { width, height } = visual.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(visual);
    resize();

    let frameId = 0;
    let isVisible = true;
    let lastFrame = 0;

    const stopLoop = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const render = (time) => {
      frameId = window.requestAnimationFrame(render);
      if (time - lastFrame < 34) return;
      lastFrame = time;

      group.rotation.y += 0.0028;
      group.rotation.x += (pointer.y - group.rotation.x - 0.18) * 0.018;
      group.position.x += (pointer.x - group.position.x) * 0.02;
      stars.rotation.y -= 0.00045;
      renderer.render(scene, camera);
    };

    const startLoop = () => {
      if (!frameId && isVisible && !document.hidden) frameId = window.requestAnimationFrame(render);
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) startLoop();
        else stopLoop();
      },
      { rootMargin: "100px" }
    );
    visibilityObserver.observe(visual);

    const onVisibilityChange = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    document.documentElement.classList.add("three-ready");
    startLoop();

    window.addEventListener(
      "pagehide",
      () => {
        stopLoop();
        visibilityObserver.disconnect();
        resizeObserver.disconnect();
        visual.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        geometry.dispose();
        starGeometry.dispose();
        solid.material.dispose();
        wireframe.material.dispose();
        points.material.dispose();
        stars.material.dispose();
        renderer.dispose();
      },
      { once: true }
    );
  } catch (error) {
    document.documentElement.classList.add("three-fallback");
  }
};

initMotion();

const scheduleThree = () => initThreeScene();
if ("requestIdleCallback" in window) {
  window.requestIdleCallback(scheduleThree, { timeout: 1800 });
} else {
  window.setTimeout(scheduleThree, 700);
}
