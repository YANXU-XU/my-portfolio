// Page-specific About interactions. Kept separate so script.js stays untouched.
(() => {
  const buttons = [...document.querySelectorAll('.about-interactive .panel-action')];
  if (!buttons.length || document.documentElement.dataset.aboutInteractions === 'ready') return;
  document.documentElement.dataset.aboutInteractions = 'ready';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  buttons.forEach((original) => {
    const label = original.textContent.trim();
    const button = original.cloneNode(true);
    button.dataset.label = label;
    button.setAttribute('aria-pressed', 'false');
    original.replaceWith(button);

    button.addEventListener('click', () => {
      const panel = button.closest('.about-panel');
      if (!panel) return;

      const isActive = panel.classList.toggle('is-activated');
      button.setAttribute('aria-pressed', String(isActive));
      button.textContent = isActive ? 'Reset moment' : button.dataset.label;
      panel.style.setProperty('--tilt', `${(Math.random() * 6 - 3).toFixed(1)}deg`);

      if (!isActive || reduceMotion.matches || typeof panel.animate !== 'function') return;
      panel.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.025) rotate(var(--tilt))' },
          { transform: 'scale(1)' }
        ],
        { duration: 500, easing: 'cubic-bezier(.2,1.4,.4,1)' }
      );
    });
  });
})();
