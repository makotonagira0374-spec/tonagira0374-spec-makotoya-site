const header = document.querySelector('.blog-header');

function syncHeaderState() {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 8);
}

syncHeaderState();
window.addEventListener('scroll', syncHeaderState, { passive: true });
