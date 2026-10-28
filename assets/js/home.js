import { CAPTURE, REDUCED } from './engine.js';
import { $, $$, esc, site } from './common.js';
import { PROJECTS, CATS, loadProjects } from './data.js';
import { cardHTML, wireMedia, wireOpeners, routeFromHash } from './cards.js';
import { initShowcase } from './showcase3d.js';
import { initScoring } from './scoring.js';
import { initGuide } from './guide.js';

// ---- industry guide: pick an industry, see its outcomes and best projects (from content/projects.json) ----
const OUT = {
  industrial: ['Catches defects the eye misses', 'Counts and measures parts automatically', 'Same pass or fail standard on every part'],
  recruitment: ['Screening and shortlisting, scored on evidence', 'Candidates compared, interviews scheduled', 'Onboarding managed in the same system'],
  agents: ['AI agents that run your routine work every day', 'Ready-to-use tools, such as invoice to Excel', 'About 40% less manual translation work, in production'],
  agriculture: ['Grades ripeness and flags disease early', 'Counts and monitors from ordinary camera footage', 'Peer-reviewed in IEEE Access, 2025'],
};
// ---- ad / post links: ?for=factory|warehouse|hr|agents|saas lands each audience on its own headline and industry ----
const FOR = {
  factory: { cat: 'industrial', topic: 'Computer vision inspection and detection', h: 'Catch every defect on your line with AI inspection.', s: 'Custom computer vision for cracks, weld defects, coating and dimension checks on standard cameras, built around your parts and your line.', hello: 'Inspection on your line? Let me show you.' },
  warehouse: { cat: 'industrial', first: 'parcel-counting', topic: 'Computer vision inspection and detection', h: 'Count every parcel automatically, live.', s: 'Camera-based counting for conveyors and docks: a live rate per hour, empty-belt alerts and a log your team can trust.', hello: 'Counting parcels? Here’s how it works.' },
  hr: { cat: 'recruitment', topic: 'Recruitment and HR automation', h: 'Screen every CV in minutes. A person still decides.', s: 'AI scores each CV against the role with the reasons shown, then tracks interviews through to hire.', hello: 'Hiring? Let me show you the CV scoring.' },
  agents: { cat: 'agents', topic: 'AI agent for my business', h: 'An AI agent that does the routine work, every day.', s: 'Agents built around your workflow (leads, reports, documents, follow-ups), built and set up for your team.', hello: 'Want an agent for your workflow?' },
  saas: { cat: 'agents', topic: 'Document processing', h: 'AI tools your team can use today.', s: 'Ready-to-use tools such as invoice to Excel, plus custom tools built around your workflow.', hello: 'Looking for a ready-made tool?' },
};
const ALIAS = { manufacturing: 'factory', inspection: 'factory', logistics: 'warehouse', recruitment: 'hr', automation: 'agents', agent: 'agents', tools: 'saas' };
const AD = (() => { try { const k = (new URLSearchParams(location.search).get('for') || '').toLowerCase(); return FOR[ALIAS[k] || k] || null; } catch (_) { return null; } })();
function applyAd() {
  if (!AD) return; window.__adFor = AD;
  const h = $('#hero-h'), l = $('.hero .lead'), c = $('[data-cta="hero"]');
  if (h) { h.removeAttribute('data-site'); h.textContent = AD.h; } if (l) { l.removeAttribute('data-site'); l.textContent = AD.s; }
  if (c) c.href = `contact.html?topic=${encodeURIComponent(AD.topic)}#start`;
}
applyAd();
// "Real output" strip in the hero opens the industry tab with those projects
$('[data-proof]')?.addEventListener('click', (e) => { if (e.button !== 0 || e.metaKey || e.ctrlKey) return; e.preventDefault(); $('.ind-tab[data-cat="industrial"]')?.click(); const hh = $('.hdr').offsetHeight; scrollTo({ top: $('#work').getBoundingClientRect().top + scrollY - hh - 12, behavior: REDUCED ? 'auto' : 'smooth' }); });
const RANK = { PRODUCTION: 0, 'CURRENT ROLE': 0, PUBLISHED: 1, DEMO: 2, PROTOTYPE: 3, RESEARCH: 4 };
const best = (list) => list.map((p, i) => ({ p, k: [p.media.type === 'illus' ? 1 : 0, p.featured ? 0 : 1, RANK[p.badge] ?? 5, i] }))
  .sort((x, y) => { for (let j = 0; j < 4; j++) if (x.k[j] !== y.k[j]) return x.k[j] - y.k[j]; return 0; }).map((x) => x.p);
function render() {
  const host = $('#ind'); if (!host) return;
  const cats = CATS.filter((c) => PROJECTS.some((p) => p.cat === c.id)); if (!cats.length) throw new Error('no categories');
  const tabs = $('.ind-tabs', host), panel = $('#ind-panel', host);
  tabs.innerHTML = cats.map((c, i) => `<button class="ind-tab" type="button" role="tab" id="it-${c.id}" aria-selected="${i === 0}" aria-controls="ind-panel" tabindex="${i === 0 ? 0 : -1}" data-cat="${c.id}"><span class="dot" style="background:${esc(c.dot)}"></span>${esc(c.label)}</button>`).join('');
  const show = (id, focus) => {
    const c = cats.find((x) => x.id === id) || cats[0], all = PROJECTS.filter((p) => p.cat === c.id), ranked = best(all), fi = AD?.first ? ranked.findIndex((p) => p.slug === AD.first) : -1; if (fi > 0) ranked.unshift(...ranked.splice(fi, 1)); const top = ranked.slice(0, 3);
    $$('.ind-tab', tabs).forEach((b) => { const on = b.dataset.cat === c.id; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    panel.setAttribute('aria-labelledby', 'it-' + c.id); panel.style.setProperty('--cat', c.dot);
    panel.innerHTML = `<div class="ind-head"><h3>${esc(c.h)}</h3><ul class="ind-out">${(OUT[c.id] || []).map((o) => `<li>${esc(o)}</li>`).join('')}</ul></div>
      <div class="ind-cards n${top.length}">${top.map((p) => cardHTML(p, { hrefBase: 'projects.html' })).join('')}</div>
      <a class="ind-all" href="projects.html#${c.id}">All ${all.length} ${esc(c.label)} project${all.length === 1 ? '' : 's'} →</a>`;
    wireMedia(panel); panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
  };
  tabs.addEventListener('click', (e) => { const b = e.target.closest('.ind-tab'); if (b) show(b.dataset.cat); });
  tabs.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!k) return; e.preventDefault();
    const i = cats.findIndex((c) => c.id === $('.ind-tab[aria-selected="true"]', tabs).dataset.cat); show(cats[(i + k + cats.length) % cats.length].id, true);
  });
  show(AD && cats.some((c) => c.id === AD.cat) ? AD.cat : cats[0].id);
  $$('.practice a').forEach((a) => { const c = CATS.find((x) => x.id === a.dataset.cat); if (c && a.lastChild.textContent !== c.label) a.lastChild.textContent = c.label; });
  // the hero's practice links jump to the matching tab instead of leaving the page
  $$('.practice a').forEach((a) => a.addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || !cats.some((c) => c.id === a.dataset.cat)) return; e.preventDefault(); show(a.dataset.cat);
    const hh = $('.hdr').offsetHeight; scrollTo({ top: $('#work').getBoundingClientRect().top + scrollY - hh - 12, behavior: REDUCED ? 'auto' : 'smooth' });
  }));
}
wireOpeners(document);
initShowcase();
initScoring();
if (!CAPTURE) (window.requestIdleCallback || ((f) => setTimeout(f, 200)))(() => initGuide(), { timeout: 1500 });
// 3D agent network beside the Services heading (desktop; loads only when the section comes near)
{
  const svc = $('#services .wrap');
  if (svc && !CAPTURE && !REDUCED && matchMedia('(min-width: 1001px)').matches) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      import('./agentnet.js').then(({ createAgentNet }) => createAgentNet(svc, $$('.svc-card', svc))).catch((err) => console.warn('agentnet', err));
    }, { rootMargin: '600px 0px' });
    io.observe(svc);
  }
}
Promise.all([loadProjects(), site]).then(([, d]) => {
  render();
  addEventListener('popstate', routeFromHash); addEventListener('hashchange', routeFromHash);
  if (location.hash.startsWith('#/work/')) routeFromHash();
}).catch((err) => {
  console.error('Projects not loaded:', err);
  $('#ind').innerHTML = `<div class="load-err" role="alert" ><p>The project highlights didn’t load. <a class="tlink" href="projects.html">Open the work page</a></p></div>`;
});

// ---- in-page CTA scroll with header offset ----
$('#cta-work')?.addEventListener('click', (e) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault();
  const t = $('#work'), hh = $('.hdr').offsetHeight; const y = t.getBoundingClientRect().top + scrollY - hh - 24;
  if (Math.abs(t.getBoundingClientRect().top - hh - 24) > 8) scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' });
  history.replaceState(null, '', '#work');
  setTimeout(() => $('#work-h').setAttribute('tabindex', '-1') || $('#work-h').focus({ preventScroll: true }), REDUCED ? 0 : 700);
});

// ---- hero 3D (dynamic import after first paint) ----
const media = $('#hero-media'), canvas = $('#aperture');
function tier() {
  try { const c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) return 'low'; } catch (e) { return 'low'; }
  const mob = matchMedia('(max-width: 900px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  return mob ? 'mid' : 'high';
}
let ap = null;
async function boot() {
  const t = tier(); if (t === 'low') return;
  const { createAperture } = await import('./aperture.js');
  ap = createAperture(canvas, { tier: t }); if (!ap) return;
  media.classList.add('gl'); const still = $('.fallback-still', media); if (still) still.style.display = 'none';
  const { createHUD } = await import('./hud.js'); const hud = createHUD(media, ap);
  window.__site = { ap, hud };
  // practice index: hover/focus previews (150ms intent) and pause the auto demo; click navigates (default link)
  if (matchMedia('(hover: hover)').matches) $$('.practice a').forEach((a) => {
    let tm; const on = () => { clearTimeout(tm); hud.hold(); tm = setTimeout(() => ap.preview(a.dataset.cat), 150); }, off = () => { clearTimeout(tm); ap.preview(null); hud.release(); };
    a.addEventListener('pointerenter', on); a.addEventListener('focus', on); a.addEventListener('pointerleave', off); a.addEventListener('blur', off);
  });
  const hero = $('.hero'); const onScroll = () => { const r = hero.getBoundingClientRect(); ap.setScroll(Math.max(0, -r.top) / (r.height * .8)); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
}
if (CAPTURE) boot(); else if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 600 }); else setTimeout(boot, 200);

// capture helpers for the showcase recorder
window.__cap = {
  caption(t) { let c = $('.cap'); if (!t) { c && c.remove(); return; } if (!c) { c = document.createElement('div'); c.className = 'cap'; document.body.append(c); } c.textContent = t; },
  end(html) { const d = document.createElement('div'); d.className = 'endcard'; d.innerHTML = html; document.body.append(d); },
};
