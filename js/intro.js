// オープニング: 赤と緑のランプがドットで点灯し、「Allez !」で散ってページが現れる
(() => {
  'use strict';

  const COLS = 14;
  const ROWS = 10;
  const BLOCK_WIDTH_RATIO = 0.36;
  const BLOCK_MAX_WIDTH = 380;
  const BLOCK_GAP_RATIO = 0.08;
  const BLOCK_CENTER_Y_RATIO = 0.42;
  const DOT_RADIUS_RATIO = 0.36;
  const LIGHT_SPREAD_MS = 420;
  const LIGHT_POP_MS = 240;
  const GREEN_DELAY_MS = 160;
  const CALL_TIMES_MS = [0, 560, 1120];
  const SCATTER_AT_MS = 1750;
  const SCATTER_SPREAD_MS = 260;
  const SCATTER_MS = 1050;
  const END_PADDING_MS = 150;
  const LAMPS = [
    { hueFrom: 350, hueTo: 385, lightness: 58, delay: 0 },
    { hueFrom: 152, hueTo: 100, lightness: 60, delay: GREEN_DELAY_MS },
  ];

  const root = document.documentElement;
  const overlay = document.querySelector('.intro-overlay');
  if (!overlay || !root.classList.contains('intro')) return;

  const finish = () => {
    overlay.remove();
    root.classList.remove('intro', 'intro-lock');
    document.dispatchEvent(new CustomEvent('intro:done'));
  };

  const canvas = overlay.querySelector('.intro-canvas');
  const call = overlay.querySelector('.intro-call');
  const context = canvas ? canvas.getContext('2d') : null;
  if (!context || !call) {
    finish();
    return;
  }

  const calls = (call.dataset.calls || '').split('|').filter(Boolean);
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  context.scale(pixelRatio, pixelRatio);

  const blockWidth = Math.min(width * BLOCK_WIDTH_RATIO, BLOCK_MAX_WIDTH);
  const pitch = blockWidth / COLS;
  const blockHeight = pitch * ROWS;
  const gap = width * BLOCK_GAP_RATIO;
  const blockTop = height * BLOCK_CENTER_Y_RATIO - blockHeight / 2;
  const firstLeft = (width - blockWidth * 2 - gap) / 2;
  const flightRange = Math.max(width, height) * 0.7;
  call.style.top = `${blockTop + blockHeight + pitch * 2}px`;

  const createDots = (lamp, lampIndex) => {
    const left = firstLeft + lampIndex * (blockWidth + gap);
    const centerX = left + blockWidth / 2;
    const centerY = blockTop + blockHeight / 2;
    return Array.from({ length: COLS * ROWS }, (_, index) => {
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      const x = left + (col + 0.5) * pitch;
      const y = blockTop + (row + 0.5) * pitch;
      const blend = (col / (COLS - 1)) * 0.6 + (row / (ROWS - 1)) * 0.4;
      const hue = lamp.hueFrom + (lamp.hueTo - lamp.hueFrom) * blend;
      const angle = Math.atan2(y - centerY, x - centerX) + (Math.random() - 0.5) * 1.4;
      const distance = flightRange * (0.25 + Math.random() * 0.85);
      return {
        x,
        y,
        color: `hsl(${hue} 92% ${lamp.lightness + blend * 8}%)`,
        lightAt: lamp.delay + Math.random() * LIGHT_SPREAD_MS,
        scatterAt: Math.random() * SCATTER_SPREAD_MS,
        driftX: Math.cos(angle) * distance,
        driftY: Math.sin(angle) * distance,
        phase: Math.random() * Math.PI * 2,
      };
    });
  };

  const dots = LAMPS.flatMap(createDots);
  const dotRadius = pitch * DOT_RADIUS_RATIO;
  const clamp01 = (value) => Math.min(1, Math.max(0, value));
  const easeOutCubic = (value) => 1 - (1 - value) ** 3;

  const drawDot = (dot, elapsed, scatterElapsed) => {
    const lit = easeOutCubic(clamp01((elapsed - dot.lightAt) / LIGHT_POP_MS));
    if (lit === 0) return;
    const flight = clamp01((scatterElapsed - dot.scatterAt) / SCATTER_MS);
    if (flight === 1) return;
    const travelled = easeOutCubic(flight);
    const shimmer = 0.82 + 0.18 * Math.sin(elapsed / 110 + dot.phase);
    context.globalAlpha = lit * shimmer * (1 - flight ** 2);
    context.fillStyle = dot.color;
    context.beginPath();
    context.arc(
      dot.x + dot.driftX * travelled,
      dot.y + dot.driftY * travelled,
      dotRadius * lit * (1 - flight * 0.6),
      0,
      Math.PI * 2,
    );
    context.fill();
  };

  let startTime = 0;
  let scatterStart = SCATTER_AT_MS;
  let hasLeft = false;

  const leave = () => {
    hasLeft = true;
    overlay.classList.add('is-leaving');
    root.classList.remove('intro-lock');
  };

  const frame = (now) => {
    if (!startTime) startTime = now;
    const elapsed = now - startTime;
    const scatterElapsed = elapsed - scatterStart;

    const callIndex = CALL_TIMES_MS.filter((time) => time <= elapsed).length - 1;
    if (calls[callIndex] && call.textContent !== calls[callIndex]) call.textContent = calls[callIndex];
    if (scatterElapsed >= 0 && !hasLeft) leave();

    context.clearRect(0, 0, width, height);
    dots.forEach((dot) => drawDot(dot, elapsed, scatterElapsed));

    if (scatterElapsed > SCATTER_MS + SCATTER_SPREAD_MS + END_PADDING_MS) {
      finish();
      return;
    }
    window.requestAnimationFrame(frame);
  };

  // クリックやキー操作ですぐ散らす
  const skip = () => {
    if (hasLeft || !startTime) return;
    scatterStart = Math.min(scatterStart, performance.now() - startTime);
  };
  overlay.addEventListener('pointerdown', skip);
  document.addEventListener('keydown', skip, { once: true });

  root.classList.add('intro-lock');
  window.requestAnimationFrame(frame);
})();
