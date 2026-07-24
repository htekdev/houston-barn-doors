/* Houston's Barn Doors — interactive layer
   AOS init, sticky nav, mobile menu, cinematic parallax, gallery lightbox. */

(() => {
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- AOS — Animate On Scroll ---------- */
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 900,
      easing: 'ease-out-cubic',
      once: true,
      offset: 90,
      disable: prefersReducedMotion,
    });
  }

  /* ---------- Year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky nav on scroll ---------- */
  const nav = $('#nav');
  const setNavState = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  };

  /* ---------- Cinematic parallax ---------- */
  const heroBg  = $('#heroBg');
  const bandBg  = $('#bandBg');
  const band    = bandBg ? bandBg.closest('.band') : null;

  const applyParallax = () => {
    if (prefersReducedMotion) return;

    if (heroBg) {
      // Slow drift + gentle fade as the hero scrolls away.
      const y = window.scrollY;
      const vh = window.innerHeight || 1;
      const progress = Math.min(y / vh, 1.2);
      heroBg.style.transform = `scale(${1.06 + progress * 0.06}) translate3d(0, ${y * 0.22}px, 0)`;
    }

    if (bandBg && band) {
      const rect = band.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (rect.bottom > -200 && rect.top < vh + 200) {
        // -1 (below viewport) .. 1 (above viewport)
        const centered = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
        bandBg.style.transform = `translate3d(0, ${centered * 9}%, 0)`;
      }
    }
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      setNavState();
      applyParallax();
      ticking = false;
    });
  };

  document.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  setNavState();
  applyParallax();

  /* ---------- Mobile menu ---------- */
  const toggle   = $('#navToggle');
  const navLinks = $('#navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      }
    });
  }

  /* ---------- Gallery lightbox ---------- */
  const gallery       = $('#gallery');
  const lightbox      = $('#lightbox');
  const lightboxImg   = $('#lightboxImg');
  const lightboxCap   = $('#lightboxCaption');
  const lightboxClose = $('#lightboxClose');
  const lightboxPrev  = $('#lightboxPrev');
  const lightboxNext  = $('#lightboxNext');

  if (gallery && lightbox && lightboxImg) {
    const tiles = $$('.tile', gallery);
    let currentIndex = 0;
    let lastFocused = null;

    const openAt = (index) => {
      currentIndex = index;
      const tile = tiles[index];
      lightboxImg.src = tile.getAttribute('href');
      lightboxImg.alt = tile.querySelector('img')?.alt || '';
      if (lightboxCap) lightboxCap.textContent = tile.getAttribute('data-caption') || '';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lightboxClose?.focus();
    };

    const close = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lastFocused?.focus();
    };

    const step = (dir) => {
      const next = (currentIndex + dir + tiles.length) % tiles.length;
      openAt(next);
    };

    tiles.forEach((tile, i) => {
      tile.addEventListener('click', (e) => {
        e.preventDefault();
        lastFocused = tile;
        openAt(i);
      });
    });

    lightboxClose?.addEventListener('click', close);
    lightboxPrev?.addEventListener('click', () => step(-1));
    lightboxNext?.addEventListener('click', () => step(1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox__figure')) close();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape')     close();
      if (e.key === 'ArrowLeft')  step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }
})();
