// ============ main.js ============

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

// Hamburger Dropdown
const menuBtn = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

function closeMenu() {
  if (!mobileMenu) return;
  mobileMenu.hidden = true;
  menuBtn?.setAttribute('aria-expanded', 'false');
}
function toggleMenu() {
  if (!mobileMenu) return;
  const willOpen = mobileMenu.hidden;
  mobileMenu.hidden = !willOpen ? true : false;
  menuBtn?.setAttribute('aria-expanded', String(willOpen));
}
menuBtn?.addEventListener('click', toggleMenu);
mobileMenu?.addEventListener('click', e => { if (e.target.matches('a')) closeMenu(); });
addEventListener('click', e => {
  if (!mobileMenu || mobileMenu.hidden) return;
  const inside = mobileMenu.contains(e.target) || menuBtn.contains(e.target);
  if (!inside) closeMenu();
});
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

// Lightbox for gallery
const lb = document.getElementById('lightbox');
const lbImg = lb?.querySelector('img');
const lbCap = lb?.querySelector('.lb-cap');
const btnPrev = lb?.querySelector('button.lb-nav.prev');
const btnNext = lb?.querySelector('button.lb-nav.next');
const btnClose = document.getElementById('lbClose');
const cards = [...document.querySelectorAll('.work-card')];
let current = 0;

// Flag vom Carousel: unterdrückt Klicks, wenn tatsächlich geswiped wurde
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
    if (window.__CAROUSEL_DRAGGED__) return; // Klick ignorieren, wenn vorher Drag
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

  let index = 0;       // aktuelle erste Slide im View
  let perView = 4;     // wird dynamisch berechnet
  let slideW = 0;      // px-Breite inkl. Gap
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
    root.classList.add('animating');   // ← NEU: Flag für CSS-Hover-Pause
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


  // Keyboard (falls Fokus auf Carousel-Buttons oder innerhalb)
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  // Drag / Swipe (Pointer Events) – Pointer Capture erst nach Schwelle
  track.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // nur linker Button
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

    // Erst ab ~8px horizontaler Bewegung als „Swipe“ interpretieren
    if (!moved && Math.abs(total) > 8) {
      moved = true;
      window.__CAROUSEL_DRAGGED__ = true;
      // Erst jetzt Pointer Capture – so bleibt Click-Event auf Cards intakt
      try { track.setPointerCapture(activePointerId); } catch { }
    }

    if (moved) {
      const currentX = -index * slideW + total;
      track.style.transform = `translate3d(${currentX}px,0,0)`;
      e.preventDefault(); // verhindert Text-Selektion
    }
  });

  const endDrag = (e) => {
    if (!dragging || (activePointerId !== null && e.pointerId !== activePointerId)) return;
    dragging = false;
    track.style.transition = ''; // zurück zur CSS-Transition
    root.classList.remove('dragging');

    // Capture sauber lösen (fix für festhängende Pointer)
    try { if (activePointerId != null) track.releasePointerCapture(activePointerId); } catch { }
    activePointerId = null;

    const totalDx = (lastX - startX);
    if (moved && Math.abs(totalDx) > slideW * 0.25) {
      go(totalDx < 0 ? 1 : -1);
    } else {
      // Kein „echter“ Swipe -> Position zurücksetzen und Klick erlauben
      apply();
      window.__CAROUSEL_DRAGGED__ = false;
    }

    // Nach dem Frame Klicks wieder erlauben
    requestAnimationFrame(() => { window.__CAROUSEL_DRAGGED__ = false; });
  };

  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('pointerleave', (e) => {
    if (!dragging) return;
    endDrag(e);
  });

  // Resize / Orientation
  addEventListener('resize', measure);
  addEventListener('load', measure);

  // Init
  measure();
})();

// Booking via mailto
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
