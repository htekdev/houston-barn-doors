/* ============================================================
   DOOR TYPE PAGES — Shared JavaScript (Lightbox + AOS init)
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  // Initialize AOS
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60
    });
  }

  // ---- Lightbox ----
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const lbImg = lightbox.querySelector('.lightbox__img');
  const lbCaption = lightbox.querySelector('.lightbox__caption');
  const lbClose = lightbox.querySelector('.lightbox__close');
  const lbPrev = lightbox.querySelector('.lightbox__prev');
  const lbNext = lightbox.querySelector('.lightbox__next');

  const galleryItems = Array.from(document.querySelectorAll('.door-gallery__item'));
  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    const item = galleryItems[index];
    if (!item) return;

    lbImg.src = item.href;
    lbImg.alt = item.querySelector('img')?.alt || '';
    lbCaption.textContent = item.dataset.caption || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  function navigate(direction) {
    currentIndex = (currentIndex + direction + galleryItems.length) % galleryItems.length;
    openLightbox(currentIndex);
  }

  // Attach click handlers to gallery items
  galleryItems.forEach(function (item, i) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      openLightbox(i);
    });
  });

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', function () { navigate(-1); });
  if (lbNext) lbNext.addEventListener('click', function () { navigate(1); });

  // Close on backdrop click
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target.classList.contains('lightbox__content')) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', function (e) {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  // ---- Mobile nav toggle (for sub-pages) ----
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !expanded);
      navLinks.classList.toggle('nav__links--open');
    });
  }
});
