// ============ main.js ============

// --- Scroll-Restoration kontrollieren ---
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
addEventListener('load', () => {
  const nav = performance.getEntriesByType?.('navigation')?.[0];
  const isReload = nav && nav.type === 'reload';
  const hasHash = !!location.hash;
  if (isReload && !hasHash) {
    window.scrollTo(0, 0);
    setTimeout(() => window.scrollTo(0, 0), 0);
  }
});

// Header: beim Scrollen leicht abdunkeln
const header = document.querySelector('.site-header');
function onScroll() {
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 8);
}
addEventListener('scroll', onScroll);
onScroll();

// Reveal / Slide effects
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: .18 });
['.slide-up', '.slide-left', '.slide-right', '.reveal-zoom'].forEach(sel => {
  document.querySelectorAll(sel).forEach(el => io.observe(el));
});

// Hamburger Dropdown (+ Backdrop zum Schließen durch Klick außen)
const menuBtn = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const menuBackdrop = document.getElementById('menuBackdrop');

function openMenu() {
  if (!mobileMenu) return;
  mobileMenu.hidden = false;
  menuBackdrop && (menuBackdrop.hidden = false);
  menuBtn?.setAttribute('aria-expanded', 'true');
  document.body.classList.add('menu-open');
}

function closeMenu() {
  if (!mobileMenu) return;
  mobileMenu.hidden = true;
  menuBackdrop && (menuBackdrop.hidden = true);
  menuBtn?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

function toggleMenu() {
  if (!mobileMenu) return;
  const willOpen = mobileMenu.hidden;
  willOpen ? openMenu() : closeMenu();
}

menuBtn?.addEventListener('click', toggleMenu);

// Links im mobilen Menü schließen das Menü nach Navigation
mobileMenu?.addEventListener('click', (e) => {
  if (e.target.matches('a')) closeMenu();
});

// Klick auf den Backdrop schließt das Menü
menuBackdrop?.addEventListener('click', closeMenu);

// ESC schließt
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

// Sicherheitsnetz: Fenster-Resize -> Menü schließen (Layoutwechsel)
addEventListener('resize', closeMenu);


addEventListener('click', (e) => {
  if (!mobileMenu || mobileMenu.hidden) return;
  const inside = mobileMenu.contains(e.target) || menuBtn.contains(e.target);
  if (!inside && !menuBackdrop) closeMenu();
});

// Smooth-Scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.pushState(null, '', '#' + id);
  });
});

// Lightbox for gallery
const lb = document.getElementById('lightbox');
const lbImg = lb?.querySelector('img');
const lbCap = lb?.querySelector('.lb-cap');
const btnPrev = lb?.querySelector('button.lb-nav.prev');
const btnNext = lb?.querySelector('button.lb-nav.next');
const btnClose = document.getElementById('lbClose');
const cards = [...document.querySelectorAll('.work-card')];
let current = 0;


window.__CAROUSEL_DRAGGED__ = false;

function openLB(i) {
  current = i;
  const c = cards[current];
  const img = c.querySelector('img');
  lbImg.src = img.src; lbImg.alt = img.alt; lbCap.textContent = c.dataset.title || img.alt;
  lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
}
function closeLB() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); }
function nav(step) { current = (current + step + cards.length) % cards.length; openLB(current); }

cards.forEach((c, i) => {
  c.addEventListener('click', () => {
    if (window.__CAROUSEL_DRAGGED__) return; 
    openLB(i);
  });
});
btnPrev?.addEventListener('click', () => nav(-1));
btnNext?.addEventListener('click', () => nav(1));
btnClose?.addEventListener('click', closeLB);
lb?.addEventListener('click', (e) => { if (e.target === lb) closeLB(); });
addEventListener('keydown', (e) => { if (!lb?.classList.contains('open')) return; if (e.key === 'Escape') closeLB(); if (e.key === 'ArrowRight') nav(1); if (e.key === 'ArrowLeft') nav(-1); });

// ===== Simple Carousel (Galerie) =====
(function () {
  const root = document.getElementById('galleryCarousel');
  if (!root) return;
  const viewport = root.querySelector('.carousel-viewport');
  const track = root.querySelector('.carousel-track');
  const slides = [...track.querySelectorAll('.work-card')];
  const btnPrev = root.querySelector('.carousel-nav.prev');
  const btnNext = root.querySelector('.carousel-nav.next');

  let index = 0;       
  let perView = 4;     
  let slideW = 0;      
  let dragging = false;
  let moved = false;
  let startX = 0;
  let lastX = 0;
  let activePointerId = null;

  function computePerView() {
    const w = root.clientWidth;
    if (w <= 480) return 1;
    if (w <= 860) return 2;
    if (w <= 1199) return 3;
    return 4;
  }

  function measure() {
    perView = computePerView();
    const r1 = slides[0].getBoundingClientRect();
    const r2 = slides[1] ? slides[1].getBoundingClientRect() : null;
    slideW = r2 ? (r2.left - r1.left) : r1.width;
    index = Math.max(0, Math.min(index, slides.length - perView));
    apply();
    updateBtns();
  }

  function apply() {
    const x = -index * slideW;
    track.style.transform = `translate3d(${x}px,0,0)`;
  }

  function updateBtns() {
    btnPrev.disabled = (index === 0);
    btnNext.disabled = (index >= slides.length - perView);
  }

  function go(dir) {
    index += dir * 1;
    index = Math.max(0, Math.min(index, slides.length - perView));
    root.classList.add('animating');
    apply();
    updateBtns();
  }

  btnPrev?.addEventListener('click', () => go(-1));
  btnNext?.addEventListener('click', () => go(1));

  track.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'transform') {
      root.classList.remove('animating');
    }
  });

  // Keyboard
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  // Drag / Swipe (Pointer Events)
  track.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    moved = false;
    window.__CAROUSEL_DRAGGED__ = false;
    startX = lastX = e.clientX;
    activePointerId = e.pointerId;
    track.style.transition = 'none';
    root.classList.add('dragging');
  }, { passive: true });

  track.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== activePointerId) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    const total = lastX - startX;

    if (!moved && Math.abs(total) > 8) {
      moved = true;
      window.__CAROUSEL_DRAGGED__ = true;
      try { track.setPointerCapture(activePointerId); } catch { }
    }

    if (moved) {
      const currentX = -index * slideW + total;
      track.style.transform = `translate3d(${currentX}px,0,0)`;
      e.preventDefault();
    }
  });

  const endDrag = (e) => {
    if (!dragging || (activePointerId !== null && e.pointerId !== activePointerId)) return;
    dragging = false;
    track.style.transition = '';
    root.classList.remove('dragging');

    try { if (activePointerId != null) track.releasePointerCapture(activePointerId); } catch { }
    activePointerId = null;

    const totalDx = (lastX - startX);
    if (moved && Math.abs(totalDx) > slideW * 0.25) {
      go(totalDx < 0 ? 1 : -1);
    } else {
      apply();
      window.__CAROUSEL_DRAGGED__ = false;
    }

    requestAnimationFrame(() => { window.__CAROUSEL_DRAGGED__ = false; });
  };

  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('pointerleave', (e) => { if (!dragging) return; endDrag(e); });

  addEventListener('resize', measure);

  addEventListener('load', () => requestAnimationFrame(measure));

  // Init
  requestAnimationFrame(measure);
})();

// Booking via mailto (nur zu testzwecken, nach webhosting vernünftig)
const bookingForm = document.getElementById('bookingForm');
function sendMail(e) {
  e.preventDefault();
  const fd = new FormData(e.target); const d = Object.fromEntries(fd.entries());
  const subject = encodeURIComponent(`Termin – ${d.name || ''}`);
  const body = encodeURIComponent(`Name: ${d.name}\nE-Mail: ${d.email}\nTelefon: ${d.phone || '-'}\nWunschtermin: ${d.date || '-'}\nStil: ${d.style || '-'}\n\nNachricht:\n${d.message || ''}`);
  location.href = `mailto:mouchel.bretschneider@gmail.com?subject=${subject}&body=${body}`;
}
if (bookingForm) bookingForm.addEventListener('submit', sendMail);

// Year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
