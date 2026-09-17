// Official thinking-orbs 0.3.1 canvas engine; MIT license in vendor/.
import { resolvePreset, MODE_DRAWS } from './vendor/thinking-orbs-engine.js';

const canvas = document.querySelector('#thinking-orb');
const ctx = canvas?.getContext('2d');
if (ctx) {
  const size = 64;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const { mode, speed, opts } = resolvePreset('connecting', size);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = Number(canvas.closest('.layer').style.getPropertyValue('--alpha')) > .01, inViewport = true, frame = 0;
  function paint(time) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    MODE_DRAWS[mode](ctx, size, time, false, opts);
  }
  function loop() {
    frame = 0;
    paint(reduced.matches ? .6 : performance.now() / 1000 * speed);
    if (visible && inViewport && !document.hidden && !reduced.matches) frame = requestAnimationFrame(loop);
  }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    loop();
  }
  document.addEventListener('phaeron:hub-visibility', event => {
    if (visible !== event.detail.visible) { visible = event.detail.visible; sync(); }
  });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
    inViewport = entry.isIntersecting; sync();
  }).observe(canvas);
  sync();
}
