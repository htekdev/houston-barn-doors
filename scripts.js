/* Houston Barn Doors — interactive layer
   Sticky nav, mobile menu, scroll reveal, before/after slider, gallery lightbox. */

(() => {
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky nav shadow on scroll ---------- */
  const nav = $('#nav');
  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 12) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle   = $('#navToggle');
  const navLinks = $('#navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Before / After slider ---------- */
  const ba       = $('#ba');
  const baClip   = $('#baClip');
  const baHandle = $('#baHandle');
  if (ba && baClip && baHandle) {
    let dragging = false;

    const setPos = (pct) => {
      const clamped = Math.max(4, Math.min(96, pct));
      baClip.style.width = clamped + '%';
      baHandle.style.left = clamped + '%';
      baHandle.setAttribute('aria-valuenow', Math.round(clamped));
    };

    const positionFromEvent = (evt) => {
      const rect = ba.getBoundingClientRect();
      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setPos(pct);
    };

    const start = (evt) => { dragging = true; positionFromEvent(evt); };
    const move  = (evt) => { if (dragging) positionFromEvent(evt); };
    const end   = () => { dragging = false; };

    baHandle.addEventListener('mousedown', start);
    ba.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    baHandle.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', end);

    baHandle.addEventListener('keydown', (e) => {
      const current = parseFloat(baHandle.style.left) || 50;
      if (e.key === 'ArrowLeft')  setPos(current - 3);
      if (e.key === 'ArrowRight') setPos(current + 3);
      if (e.key === 'Home')       setPos(4);
      if (e.key === 'End')        setPos(96);
    });

    setPos(50);
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

    const openAt = (index) => {
      currentIndex = index;
      const tile = tiles[index];
      lightboxImg.src = tile.getAttribute('href');
      lightboxImg.alt = tile.querySelector('img')?.alt || '';
      lightboxCap.textContent = tile.getAttribute('data-caption') || '';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    const step = (dir) => {
      const next = (currentIndex + dir + tiles.length) % tiles.length;
      openAt(next);
    };

    tiles.forEach((tile, i) => {
      tile.addEventListener('click', (e) => { e.preventDefault(); openAt(i); });
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
