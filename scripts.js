/* Houstons Barn Doors — interactive layer
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

  /* ---------- Products dropdown ----------
     `.is-open` is the only thing that opens the menu, in both CSS and JS, so
     the visible state and aria-expanded can never disagree. Hover and focus
     are handled here rather than via :hover/:focus-within, because a clicked
     button keeps focus — which would have pinned the menu open and made
     click-to-close and Escape silent no-ops.

     Stacked (<=1024px): the product links are always rendered, so the button
     becomes an inert section heading. The media query is the single source of
     truth for which mode we're in, mirroring styles.css. */
  const groupToggle = $('#navProductsToggle');
  const groupMenu   = $('#navProductsMenu');
  if (groupToggle && groupMenu) {
    const group   = groupToggle.closest('.nav__group');
    const stacked = window.matchMedia('(max-width: 1024px)');

    const setGroup = (open) => {
      groupMenu.classList.toggle('is-open', open);
      groupToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    const closeGroup = () => setGroup(false);

    const syncGroup = () => {
      if (stacked.matches) {
        // Links are visible regardless, so advertise them as expanded and keep
        // the inert heading out of the tab order.
        groupMenu.classList.remove('is-open');
        groupToggle.setAttribute('aria-expanded', 'true');
        groupToggle.setAttribute('tabindex', '-1');
      } else {
        groupToggle.removeAttribute('tabindex');
        closeGroup();
      }
    };

    syncGroup();
    stacked.addEventListener('change', syncGroup);

    groupToggle.addEventListener('click', () => {
      if (stacked.matches) return;
      setGroup(!groupMenu.classList.contains('is-open'));
    });

    if (group) {
      group.addEventListener('mouseenter', () => {
        if (!stacked.matches) setGroup(true);
      });
      group.addEventListener('mouseleave', () => {
        if (!stacked.matches) closeGroup();
      });
      // Tabbing into the links opens it. Focusing the toggle itself does not —
      // that's what the button is for, and it keeps Escape from re-opening the
      // menu when focus is returned to the toggle.
      group.addEventListener('focusin', (e) => {
        if (!stacked.matches && groupMenu.contains(e.target)) setGroup(true);
      });
      group.addEventListener('focusout', (e) => {
        if (stacked.matches) return;
        if (!group.contains(e.relatedTarget)) closeGroup();
      });
    }

    document.addEventListener('click', (e) => {
      if (stacked.matches) return;
      if (group && !group.contains(e.target)) closeGroup();
    });

    document.addEventListener('keydown', (e) => {
      // Match Escape defensively: legacy engines report "Esc", and keyCode 27
      // is the reliable fallback when `key` is absent or non-standard.
      const isEscape = e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27;
      if (!isEscape || stacked.matches) return;
      if (groupMenu.classList.contains('is-open')) {
        closeGroup();
        groupToggle.focus();
      }
    });
  }

  /* ---------- Gallery lightbox ---------- */
  const lightbox      = $('#lightbox');
  const lightboxImg   = $('#lightboxImg');
  const lightboxCap   = $('#lightboxCaption');
  const lightboxClose = $('#lightboxClose');
  const lightboxPrev  = $('#lightboxPrev');
  const lightboxNext  = $('#lightboxNext');

  if (lightbox && lightboxImg) {
    // Collect all lightbox-eligible items: .tile (portfolio) + .ghost-gallery__item
    const allItems = $$('.tile[href], .ghost-gallery__item[href]');
    let currentIndex = 0;
    let lastFocused = null;
    let activeSet = allItems; // which subset we're navigating

    const openAt = (index, items) => {
      activeSet = items || activeSet;
      currentIndex = index;
      const item = activeSet[index];
      lightboxImg.src = item.getAttribute('href');
      lightboxImg.alt = item.querySelector('img')?.alt || '';
      if (lightboxCap) lightboxCap.textContent = item.getAttribute('data-caption') || '';
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
      const next = (currentIndex + dir + activeSet.length) % activeSet.length;
      openAt(next);
    };

    // Ghost gallery items
    const ghostItems = $$('.ghost-gallery__item[href]');
    ghostItems.forEach((item, i) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        lastFocused = item;
        openAt(i, ghostItems);
      });
    });

    // Portfolio gallery tiles
    const gallery = $('#gallery');
    if (gallery) {
      const tiles = $$('.tile', gallery);
      tiles.forEach((tile, i) => {
        tile.addEventListener('click', (e) => {
          e.preventDefault();
          lastFocused = tile;
          openAt(i, tiles);
        });
      });
    }

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
