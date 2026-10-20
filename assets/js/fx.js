// Interaction + 3D motion layer, loaded after first paint by common.js on every page.
// Scroll progress bar, cursor spotlight, 3D tilt with glare on cards/panels, magnetic buttons, tech-stack marquee,
// and the ambient WebGL field. Everything is transforms/opacity only and is off for prefers-reduced-motion and capture mode.
import { CAPTURE, REDUCED } from './engine.js';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;
if (CAPTURE) throw new Error('fx disabled in capture mode');

// ---- scroll progress ----
{
  const bar = document.createElement('div'); bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true'); document.body.append(bar);
  let raf = 0;
  const upd = () => { raf = 0; const max = root.scrollHeight - innerHeight; bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`; };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true }); addEventListener('resize', upd); upd();
}

// ---- tech stack marquee (seamless loop; the original list stays for assistive tech) ----
{
  const strip = $('.stack-strip'), ul = strip && $('ul', strip);
  if (ul && !REDUCED) {
    [...ul.children].forEach((li) => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); ul.append(c); });
    strip.classList.add('marq');
  }
}

if (!REDUCED && FINE) {
  // ---- cursor spotlight ----
  const spot = document.createElement('div'); spot.className = 'spot'; spot.setAttribute('aria-hidden', 'true'); document.body.prepend(spot);
  let sx = 0, sy = 0, sraf = 0;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return; sx = e.clientX; sy = e.clientY; spot.classList.add('on');
    if (!sraf) sraf = requestAnimationFrame(() => { sraf = 0; spot.style.setProperty('--mx', sx + 'px'); spot.style.setProperty('--my', sy + 'px'); });
  }, { passive: true });
  document.addEventListener('pointerleave', () => spot.classList.remove('on'));

  // ---- 3D tilt + glare (delegated, so cards rendered later work too) ----
  const TILT = '.card, .panel, .ccard, .featured .matte, .conn > div, .lead-card, .deliver, .rs-win, .pub, .caps > div, .svc-card, .prod-card, .sc-pills > li, .proc-line > li, .cta-next > li';
  let cur = null, praf = 0, px = 0, py = 0;
  const reset = (el) => { el.classList.remove('hot'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.style.setProperty('--nx', '0'); el.style.setProperty('--ny', '0'); };
  const apply = () => {
    praf = 0; if (!cur) return; const r = cur.getBoundingClientRect(); if (!r.width) return;
    const nx = (px - r.left) / r.width, ny = (py - r.top) / r.height; const max = Math.min(7, Math.max(2.5, 2400 / Math.max(r.width, 300)));
    cur.style.setProperty('--ry', ((nx - .5) * 2 * max).toFixed(2) + 'deg'); cur.style.setProperty('--rx', ((.5 - ny) * 2 * max).toFixed(2) + 'deg');
    cur.style.setProperty('--gx', (nx * 100).toFixed(1) + '%'); cur.style.setProperty('--gy', (ny * 100).toFixed(1) + '%');
    // unitless pointer offset (-.5..5) so inner layers can drift for a parallax depth effect
    cur.style.setProperty('--nx', (nx - .5).toFixed(3)); cur.style.setProperty('--ny', (ny - .5).toFixed(3));
  };
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest?.(TILT);
    if (el !== cur) { if (cur) reset(cur); cur = el && !el.closest('dialog') ? el : null;
      if (cur) { if (!cur.classList.contains('tilt')) { cur.classList.add('tilt'); const g = document.createElement('i'); g.className = 'glare'; g.setAttribute('aria-hidden', 'true'); cur.append(g); } cur.classList.add('hot'); } }
    if (!cur) return; px = e.clientX; py = e.clientY; if (!praf) praf = requestAnimationFrame(apply);
  }, { passive: true });
  document.addEventListener('pointerleave', () => { if (cur) { reset(cur); cur = null; } });

  // ---- magnetic buttons ----
  let mag = null;
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const b = e.target.closest?.('.btn-primary, .btn');
    if (b !== mag) { if (mag) { mag.style.setProperty('--bx', '0px'); mag.style.setProperty('--by', '0px'); } mag = b; if (b) b.classList.add('mag'); }
    if (!b) return; const r = b.getBoundingClientRect();
    b.style.setProperty('--bx', ((e.clientX - (r.left + r.width / 2)) * .16).toFixed(1) + 'px'); b.style.setProperty('--by', ((e.clientY - (r.top + r.height / 2)) * .28).toFixed(1) + 'px');
  }, { passive: true });
}

// ---- ambient WebGL (idle, after everything else) ----
if (!REDUCED) {
  const go = async () => {
    const { createAmbient, AMBIENT_OK } = await import('./ambient.js');
    if (!AMBIENT_OK()) return;
    const mob = matchMedia('(max-width: 900px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
    // the home page already runs the lens and the robot; on phones and low-core machines skip the extra field there
    if (mob && document.getElementById('hero-media')) return;
    window.__ambient = createAmbient({ tier: mob ? 'mid' : 'high' });
  };
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 400);
}
