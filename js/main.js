(() => {
  'use strict';

  const CALL_INTERVAL_MS = 650;
  const REVEAL_ROOT_MARGIN = '0px 0px -10% 0px';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.classList.add('js');

  const initNav = () => {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    const setOpen = (isOpen) => {
      toggle.setAttribute('aria-expanded', String(isOpen));
      nav.classList.toggle('is-open', isOpen);
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || toggle.getAttribute('aria-expanded') !== 'true') return;
      setOpen(false);
      toggle.focus();
    });
  };

  // 種目タブ: 選択に合わせてパネルと人体図（data-weapon）を切り替える
  const initWeaponTabs = () => {
    const root = document.querySelector('.weapons');
    if (!root) return;
    const tabs = Array.from(root.querySelectorAll('[role="tab"]'));

    const select = (selected, shouldFocus) => {
      tabs.forEach((tab) => {
        const isSelected = tab === selected;
        tab.setAttribute('aria-selected', String(isSelected));
        tab.tabIndex = isSelected ? 0 : -1;
        const panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (panel) panel.hidden = !isSelected;
      });
      root.dataset.weapon = selected.dataset.weapon;
      if (shouldFocus) selected.focus();
    };

    const keyTargets = {
      ArrowRight: (index) => (index + 1) % tabs.length,
      ArrowLeft: (index) => (index - 1 + tabs.length) % tabs.length,
      Home: () => 0,
      End: () => tabs.length - 1,
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (event) => {
        const next = keyTargets[event.key];
        if (!next) return;
        event.preventDefault();
        select(tabs[next(index)], true);
      });
    });
  };

  const initReveal = () => {
    const targets = document.querySelectorAll('.reveal');
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: REVEAL_ROOT_MARGIN },
    );
    targets.forEach((target) => observer.observe(target));
  };

  // 主審のコール「En garde → Prêts ? → Allez !」を一度だけ流す
  const initCalls = () => {
    const call = document.querySelector('.apparatus-call');
    if (!call || prefersReducedMotion) return;
    const calls = (call.dataset.calls || '').split('|').filter(Boolean);
    calls.forEach((text, index) => {
      window.setTimeout(() => {
        call.textContent = text;
      }, CALL_INTERVAL_MS * index);
    });
  };

  // オープニングがある場合は、終わってからヒーローの演出を始める
  const startHero = () => {
    document.documentElement.classList.add('is-ready');
    initCalls();
  };

  initNav();
  initWeaponTabs();
  initReveal();
  if (document.documentElement.classList.contains('intro')) {
    document.addEventListener('intro:done', startHero, { once: true });
  } else {
    startHero();
  }
})();
