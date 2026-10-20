// "Agent network" 3D scene for the Services section (home page, desktop only).
// A central AI core with one satellite per service card, linked by beams that carry data packets out and back.
// Hovering a service card lights up its satellite. Procedural Three.js only (no downloads, nothing paid).
// Pauses when off screen or when the tab is hidden; does nothing for prefers-reduced-motion or without WebGL.
import * as THREE from 'three';
import { onTick, REDUCED } from './engine.js';

const glowTex = (() => {
  let t;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
})();
const sprite = (color, size, opacity = 1) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(size); return s;
};

export function createAgentNet(host, cards) {
  if (REDUCED || !host) return null;
  const canvas = document.createElement('canvas');
  canvas.className = 'agentnet'; canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { return null; }
  if (!renderer.getContext()) return null;
  host.prepend(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 60); camera.position.set(0, 1.2, 12.5); camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0x9098a8, .8));
  const key = new THREE.DirectionalLight(0xffeedd, 1.6); key.position.set(-5, 6, 7); scene.add(key);
  const rim = new THREE.PointLight(0xE8743B, 40, 30, 1.5); rim.position.set(4, -1, 5); scene.add(rim);

  const rig = new THREE.Group(); rig.rotation.x = .32; scene.add(rig);

  // core: faceted glass shell, glowing edges and a pulsing heart
  const coreGeo = new THREE.IcosahedronGeometry(1.15, 1);
  const core = new THREE.Mesh(coreGeo, new THREE.MeshStandardMaterial({ color: 0x1a1d23, metalness: .85, roughness: .25, flatShading: true, transparent: true, opacity: .9 }));
  core.add(new THREE.LineSegments(new THREE.EdgesGeometry(coreGeo, 1), new THREE.LineBasicMaterial({ color: 0xE8743B, transparent: true, opacity: .75 })));
  const heart = sprite(0xE8743B, 3.4, .9); core.add(heart);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.9, .015, 8, 120), new THREE.MeshBasicMaterial({ color: 0xE8743B, transparent: true, opacity: .35 }));
  halo.rotation.x = Math.PI / 2; rig.add(core, halo);

  // satellites: one per service, coloured like its card
  const N = cards.length, R = 3.6, shapes = [new THREE.OctahedronGeometry(.36, 0), new THREE.BoxGeometry(.5, .5, .5), new THREE.TetrahedronGeometry(.46, 0), new THREE.IcosahedronGeometry(.38, 0)];
  const orbit = new THREE.Group(); rig.add(orbit);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, .008, 6, 200), new THREE.MeshBasicMaterial({ color: 0x8a92a0, transparent: true, opacity: .22 }));
  ring.rotation.x = Math.PI / 2; orbit.add(ring);
  const sats = cards.map((card, i) => {
    const col = new THREE.Color((getComputedStyle(card).getPropertyValue('--c') || '#E8743B').trim() || '#E8743B');
    const a = (i / N) * Math.PI * 2, y = Math.sin(i * 1.7) * .35;
    const g = shapes[i % shapes.length];
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x1b1f26, metalness: .7, roughness: .3, flatShading: true, emissive: col, emissiveIntensity: .25 }));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: .9 }));
    m.add(edges); const glow = sprite(col, 1.5, .55); m.add(glow);
    m.position.set(Math.cos(a) * R, y, Math.sin(a) * R); orbit.add(m);
    // beam from core to satellite
    const beamGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), m.position.clone()]);
    const beam = new THREE.Line(beamGeo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: .28 }));
    orbit.add(beam);
    // packets travelling along the beam (out to the tool, back to the core)
    const packets = [0, .5].map((ph) => { const p = sprite(col, .42, .95); orbit.add(p); return { s: p, ph }; });
    return { m, edges, glow, beam, packets, col, spin: (.004 + (i % 3) * .002) * (i % 2 ? 1 : -1), hot: 0 };
  });

  // dust
  const dustN = 260, pos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) { const r = 2 + Math.random() * 5.5, a = Math.random() * Math.PI * 2, y = (Math.random() - .5) * 3.4; pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xa3a7ab, size: .035, transparent: true, opacity: .55, depthWrite: false }));
  rig.add(dust);

  // hover link: a service card lights its satellite
  let focus = -1;
  cards.forEach((c, i) => {
    c.addEventListener('pointerenter', () => (focus = i));
    c.addEventListener('pointerleave', () => { if (focus === i) focus = -1; });
    c.addEventListener('focusin', () => (focus = i)); c.addEventListener('focusout', () => { if (focus === i) focus = -1; });
  });

  // pointer parallax
  let tx = 0, ty = 0, cx = 0, cy = 0;
  addEventListener('pointermove', (e) => { tx = (e.clientX / innerWidth - .5); ty = (e.clientY / innerHeight - .5); }, { passive: true });

  const size = () => { const r = canvas.getBoundingClientRect(); if (!r.width) return; renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); };
  new ResizeObserver(size).observe(canvas); size();

  const tmp = new THREE.Vector3();
  let t = 0, off = null, frames = 0, slow = 0, lastT = 0;
  const frame = (now, dt) => {
    t += dt / 1000;
    // guard: if the device struggles (most frames slower than ~14 fps), step the resolution down instead of hiding the scene
    if (lastT) { const f = now - lastT; frames++; if (f > 70) slow++; if (frames === 120) { if (slow > 90) { const pr = renderer.getPixelRatio(); if (pr > .75) { renderer.setPixelRatio(pr > 1 ? 1 : .75); size(); } } frames = slow = 0; } }
    lastT = now;
    cx += (tx - cx) * .04; cy += (ty - cy) * .04;
    rig.rotation.y = cx * .5; rig.rotation.x = .32 + cy * .25;
    orbit.rotation.y += dt * .00012;
    core.rotation.y += dt * .0003; core.rotation.x += dt * .00012;
    const pulse = .85 + Math.sin(t * 2.2) * .15; heart.scale.setScalar(3.1 * pulse); halo.scale.setScalar(1 + Math.sin(t * 1.3) * .03);
    sats.forEach((s, i) => {
      s.hot += ((focus === i ? 1 : 0) - s.hot) * .12;
      s.m.rotation.x += s.spin * dt * .06; s.m.rotation.y += s.spin * dt * .09;
      s.m.scale.setScalar(1 + s.hot * .55);
      s.glow.material.opacity = .45 + s.hot * .5; s.beam.material.opacity = .22 + s.hot * .6;
      s.m.material.emissiveIntensity = .25 + s.hot * .9;
      const speed = .28 + s.hot * .5;
      s.packets.forEach((p) => {
        const k = (t * speed + p.ph + i * .13) % 1, out = k < .5, u = out ? k * 2 : 2 - k * 2;
        tmp.copy(s.m.position).multiplyScalar(u); p.s.position.copy(tmp);
        p.s.material.opacity = (Math.sin(Math.PI * u) * .9 + .1) * (.7 + s.hot * .3);
        p.s.scale.setScalar(.36 + s.hot * .3);
      });
    });
    dust.rotation.y -= dt * .00004;
    renderer.render(scene, camera);
  };
  const start = () => { if (!off) { lastT = 0; off = onTick(frame); } };
  const stop = () => { if (off) { off(); off = null; } };
  const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop()), { rootMargin: '120px' });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (canvas.getBoundingClientRect().top < innerHeight) start(); });
  requestAnimationFrame(() => canvas.classList.add('on'));
  return { stop, start };
}
