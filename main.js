// Header: beim Scrollen leicht abdunkeln
const header = document.querySelector('.site-header');
function onScroll(){
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 8);
}
addEventListener('scroll', onScroll);
onScroll();

// Reveal / Slide effects
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  });
},{ threshold:.18 });
['.slide-up','.slide-left','.slide-right','.reveal-zoom'].forEach(sel=>{
  document.querySelectorAll(sel).forEach(el=> io.observe(el));
});

// Hamburger Dropdown
const menuBtn = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

function closeMenu(){
  if (!mobileMenu) return;
  mobileMenu.hidden = true;
  menuBtn?.setAttribute('aria-expanded','false');
}
function toggleMenu(){
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
const btnPrev = lb?.querySelector('.lb-nav.prev');
const btnNext = lb?.querySelector('.lb-nav.next');
const btnClose = document.getElementById('lbClose');
const cards = [...document.querySelectorAll('.work-card')];
let current = 0;

function openLB(i){
  current = i;
  const c = cards[current];
  const img = c.querySelector('img');
  lbImg.src = img.src; lbImg.alt = img.alt; lbCap.textContent = c.dataset.title || img.alt;
  lb.classList.add('open'); lb.setAttribute('aria-hidden','false');
}
function closeLB(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); }
function nav(step){ current = (current + step + cards.length) % cards.length; openLB(current); }

cards.forEach((c,i)=> c.addEventListener('click', ()=> openLB(i)));
btnPrev?.addEventListener('click', ()=> nav(-1));
btnNext?.addEventListener('click', ()=> nav(1));
btnClose?.addEventListener('click', closeLB);
lb?.addEventListener('click', (e)=>{ if(e.target===lb) closeLB(); });
addEventListener('keydown', (e)=>{ if(!lb.classList.contains('open')) return; if(e.key==='Escape') closeLB(); if(e.key==='ArrowRight') nav(1); if(e.key==='ArrowLeft') nav(-1); });

// Booking via mailto
const bookingForm = document.getElementById('bookingForm');
function sendMail(e){
  e.preventDefault();
  const fd = new FormData(e.target); const d = Object.fromEntries(fd.entries());
  const subject = encodeURIComponent(`Termin – ${d.name||''}`);
  const body = encodeURIComponent(`Name: ${d.name}\nE-Mail: ${d.email}\nTelefon: ${d.phone||'-'}\nWunschtermin: ${d.date||'-'}\nStil: ${d.style||'-'}\n\nNachricht:\n${d.message||''}`);
  location.href = `mailto:mikimineta@tutanota.com?subject=${subject}&body=${body}`;
}
if (bookingForm) bookingForm.addEventListener('submit', sendMail);

// Year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
