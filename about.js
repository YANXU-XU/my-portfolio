// Page-specific About interactions. Kept separate so script.js stays untouched.
(() => {
  const tr = (key, params, fallback) => window.StickmanI18n?.t(key, params, fallback) ?? fallback;
  const buttons = [...document.querySelectorAll('.about-interactive .panel-action')];
  if (!buttons.length || document.documentElement.dataset.aboutInteractions === 'ready') return;
  document.documentElement.dataset.aboutInteractions = 'ready';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function refreshLabel(button) {
    const panel = button.closest('.about-panel');
    const isActive = Boolean(panel?.classList.contains('is-activated'));
    button.textContent = isActive
      ? tr('about.action.reset', null, 'Reset moment')
      : tr(button.dataset.labelKey, null, button.dataset.fallback);
  }

  buttons.forEach((original) => {
    const label = original.textContent.trim();
    const button = original.cloneNode(true);
    button.dataset.labelKey = original.dataset.actionKey || 'about.panel1.action';
    button.dataset.fallback = label;
    button.setAttribute('aria-pressed', 'false');
    original.replaceWith(button);

    button.addEventListener('click', () => {
      const panel = button.closest('.about-panel');
      if (!panel) return;

      const isActive = panel.classList.toggle('is-activated');
      button.setAttribute('aria-pressed', String(isActive));
      refreshLabel(button);
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
  document.addEventListener('languagechange', () => {
    document.querySelectorAll('.about-interactive .panel-action').forEach(refreshLabel);
  });
})();
