(() => {
  const body = document.body;
  const openButton = document.querySelector('.js-hamburger');
  const closeButton = document.querySelector('.js-close-nav');
  const overlay = document.getElementById('responsive-nav');

  const setOpen = (open) => {
    body.classList.toggle('show-responsive-nav', open);
    if (openButton) openButton.setAttribute('aria-expanded', String(open));
    if (overlay) overlay.setAttribute('aria-hidden', String(!open));
  };

  if (openButton) openButton.addEventListener('click', () => setOpen(true));
  if (closeButton) closeButton.addEventListener('click', () => setOpen(false));
  if (overlay) {
    overlay.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
})();
