/**
 * InsightFlow — Global / Landing page scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  // Theme (shared)
  InsightUtils?.initTheme?.() || initThemeFallback();

  // Mobile menu
  const menuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');
  menuBtn?.addEventListener('click', () => {
    mobileNav?.classList.toggle('open');
    const open = mobileNav?.classList.contains('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Close mobile nav on link click
  mobileNav?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => mobileNav.classList.remove('open'));
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Navbar shadow on scroll
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.style.boxShadow = 'var(--shadow-md)';
      } else {
        navbar.style.boxShadow = 'none';
      }
    });
  }
});

function initThemeFallback() {
  const theme = localStorage.getItem('if_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('#themeToggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('if_theme', next);
    });
  });
}
