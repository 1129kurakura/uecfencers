// オープニングを流すかどうかを最初の描画前に決める（head で同期実行）
(() => {
  'use strict';
  const INTRO_SEEN_KEY = 'uecf-intro-seen';
  const isForced = new URLSearchParams(window.location.search).has('intro');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    if (!isForced && window.sessionStorage.getItem(INTRO_SEEN_KEY)) return;
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch (error) {
    // sessionStorage が使えない環境では毎回流す
  }
  document.documentElement.classList.add('intro');
})();
