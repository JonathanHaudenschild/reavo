(function () {
  document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('cpr-modal');
    if (!modal) {
      return;
    }

    const storageKey = 'reavoCprSeen';
    const openButtons = document.querySelectorAll('[data-open-cpr], .js-open-cpr');
    const closeButtons = modal.querySelectorAll('[data-modal-close]');
    const overlay = modal.querySelector('.cpr-modal__overlay');
    const body = document.body;
    let previousOverflow = '';
    let lastFocused;

    const setAriaState = (isOpen) => {
      modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    };

    const disableScroll = () => {
      previousOverflow = body.style.overflow;
      body.style.overflow = 'hidden';
    };
    const enableScroll = () => {
      body.style.overflow = previousOverflow || '';
    };

    const markSeen = () => {
      try {
        localStorage.setItem(storageKey, '1');
      } catch (err) {
        // Ignore storage errors (private mode, etc.)
      }
    };

    const openModal = () => {
      if (modal.classList.contains('is-open')) {
        return;
      }
      lastFocused = document.activeElement;
      modal.classList.add('is-open');
      modal.classList.add('opacity-100', 'pointer-events-auto');
      modal.classList.remove('opacity-0', 'pointer-events-none');
      setAriaState(true);
      disableScroll();
      const focusTarget = modal.querySelector('.cpr-modal__close');
      if (focusTarget) {
        focusTarget.focus();
      }
    };

    const closeModal = () => {
      if (!modal.classList.contains('is-open')) {
        return;
      }
      modal.classList.remove('is-open');
      modal.classList.remove('opacity-100', 'pointer-events-auto');
      modal.classList.add('opacity-0', 'pointer-events-none');
      setAriaState(false);
      enableScroll();
      markSeen();
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    };

    openButtons.forEach((btn) => btn.addEventListener('click', openModal));
    closeButtons.forEach((btn) => btn.addEventListener('click', closeModal));
    if (overlay) {
      overlay.addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    });

    let shouldOpen = true;
    try {
      shouldOpen = !localStorage.getItem(storageKey);
    } catch (err) {
      shouldOpen = true;
    }

    if (shouldOpen) {
      window.setTimeout(openModal, 400);
    }
  });
})();
