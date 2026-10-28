// Scout, the portfolio guide (home page).
// - Lives in the hero, docks to the lower-left corner once the hero scrolls away (wide screens).
// - Says one short line when a new part of the page arrives; never over the recruiter or scoring sections.
// - "Ask my guide" opens a small panel: pick an interest, get the business problem, the solution, the matching case
//   studies and a "discuss this" link that pre-fills the enquiry form. All answers are predefined, from this site's content.
// - Closing the bubble mutes it for the session. Keyboard: the panel is a labelled region, Esc closes, focus returns.
import { createCompanion } from './companion.js';
import { REDUCED } from './engine.js';
import { PROJECTS, loadProjects } from './data.js';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const LINES = {
  hello: ['Welcome. Let’s build something intelligent.', 'happy'],
  nudge: ['Explore the systems I’ve built, or ask me where to start.', 'idle'],
  work: ['Pick an industry. I’ll show you the work.', 'happy'],
  services: ['Need to automate a manual workflow?', 'idle'],
  how: ['Five steps, from first call to a system you own.', 'idle'],
  contact: ['Have a problem worth solving? Send a short note.', 'happy'],
  industrial: ['Cameras that catch defects people miss.', 'ok'],
  recruitment: ['Screening to onboarding, in one system.', 'ok'],
  agents: ['AI agents and SaaS tools that run for you.', 'ok'],
  agriculture: ['Models for crops and farms.', 'ok'],
  exit: ['Before you go: what would you like to automate? I reply within a day.', 'happy'],
  sent: ['Thanks! Asad will reply within a day.', 'happy'],
  wake: ['Oh, hello again.', 'happy'],
};
// interests: problem -> solution -> proof -> next step. Slugs must exist in content/projects.json (missing ones are skipped).
const TOPICS = [
  { k: 'mfg', label: 'Manufacturing and inspection', topic: 'Computer vision inspection and detection', mood: 'ok',
    problem: 'Manual inspection misses small defects and changes from shift to shift.',
    answer: 'A camera and a trained detector flag defects and measure parts on every item, with results sent to your system through an API.',
    work: ['weld-line-inspection', 'parcel-counting', 'weld-defect-detection'] },
  { k: 'hr', label: 'HR and recruitment', topic: 'Recruitment and HR automation', mood: 'ok',
    problem: 'Recruiters spend hours reading CVs and chasing candidates between steps.',
    answer: 'Every CV is parsed and scored against the role with the reasons shown. A person decides, and interviews are tracked in one place.',
    work: ['hr-workflow-automation', 'resume-screening'], jump: ['#scoring', 'See how a CV is scored'] },
  { k: 'agent', label: 'AI agent for my business', topic: 'AI agent for my business', mood: 'ok',
    problem: 'Routine work such as leads, reports, documents and follow-ups eats hours every week.',
    answer: 'An agent built around your workflow runs it every day. I build it around your process, test it on your data and set it up for your team.',
    work: ['n8n-automations', 'invoice-to-excel', 'rag-pipeline'] },
  { k: 'saas', label: 'Ready-to-use tool', topic: 'Document processing', mood: 'happy',
    problem: 'You need a tool that works now, not a long project.',
    answer: 'Start with a ready tool such as invoice to Excel, or get one adapted for your team and your data.',
    work: ['invoice-to-excel', 'subtitle-saas'], jump: ['#products', 'See products'] },
  { k: 'docs', label: 'Document processing', topic: 'Workflow automation', mood: 'ok',
    problem: 'People retype invoices, CVs and reports into spreadsheets. It is slow and errors slip in.',
    answer: 'Documents are read into clean, structured rows and sent where your team already works, such as Excel or your HR system.',
    work: ['invoice-to-excel', 'hr-workflow-automation', 'n8n-automations'] },
  { k: 'custom', label: 'Something custom', topic: 'Something else', mood: 'happy',
    problem: 'Not sure if AI can solve it, or where to start?',
    answer: 'Tell me the problem. I check what is possible, agree the scope with you, then build it around your process and data.',
    work: ['weld-line-inspection', 'tomato-ripeness-grading', 'smart-farming-ieee'] },
];

export function initGuide() {
  const home = $('#guide-home'), hero = $('.hero'); if (!home || !hero) return;
  // dock only where the left gutter can hold the robot without covering content; narrower screens get the small launcher
  const wide = matchMedia('(min-width: 1420px)'), roomy = matchMedia('(min-width: 1940px)');
  // desktop with a mouse: after the hero, Scout follows the cursor and pitches the project you are looking at
  const fine = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)');
  const follows = () => fine.matches, canDock = () => wide.matches || follows();
  if (window.__adFor?.hello) LINES.hello = [window.__adFor.hello, 'happy'];
  const canvas = document.createElement('canvas'); canvas.className = 'guide-bot'; canvas.setAttribute('aria-hidden', 'true');
  const say = document.createElement('div'); say.className = 'guide-say'; say.setAttribute('role', 'status'); say.setAttribute('aria-live', 'polite');
  say.innerHTML = '<span></span><button type="button" class="guide-x" aria-label="Hide guide messages">×</button>';
  const ask = document.createElement('button'); ask.type = 'button'; ask.className = 'guide-ask'; ask.setAttribute('aria-expanded', 'false'); ask.setAttribute('aria-controls', 'guide-panel');
  ask.innerHTML = '<i aria-hidden="true"></i>Ask my guide';
  home.append(canvas, say, ask);
  let bot = null, figure = canvas;
  try { const t = document.createElement('canvas'); if (t.getContext('webgl2') || t.getContext('webgl')) bot = createCompanion(canvas, { size: 260 }); } catch (_) {}
  // no WebGL: a drawn face stands in, the guide panel still works
  if (!bot) { figure = Object.assign(document.createElement('div'), { className: 'guide-face', innerHTML: '<i></i><i></i>' }); canvas.replaceWith(figure); bot = { setMood() {}, nod() {}, look() {}, resize() {}, scan() {}, wave() {}, hop() {}, spin() {}, point() {}, celebrate() {}, lookAround() {}, sleep() {}, lean() {}, sleeping: false }; }
  home.classList.add('on');
  window.__scout = bot; // handy for debugging in the console

  // docked button (wide) and a small launcher (narrow screens, sits above the quick-contact bar)
  const dock = document.createElement('button'); dock.type = 'button'; dock.className = 'guide-dock'; dock.setAttribute('aria-label', 'Open the portfolio guide'); dock.setAttribute('aria-controls', 'guide-panel'); dock.setAttribute('aria-expanded', 'false');
  const launch = document.createElement('button'); launch.type = 'button'; launch.className = 'guide-launch'; launch.setAttribute('aria-label', 'Open the portfolio guide'); launch.setAttribute('aria-controls', 'guide-panel'); launch.setAttribute('aria-expanded', 'false');
  launch.innerHTML = '<span class="guide-face sm"><i></i><i></i></span>';
  const panel = document.createElement('section'); panel.id = 'guide-panel'; panel.className = 'guide-panel'; panel.hidden = true; panel.setAttribute('aria-label', 'Portfolio guide'); panel.tabIndex = -1;
  document.body.append(dock, launch, panel);

  let muted = false; try { muted = sessionStorage.getItem('guide-off') === '1'; } catch (_) {}
  const seen = new Set(); let hideT = 0, docked = false, open = false, opener = null;
  function speak(key, force) {
    const l = LINES[key]; if (!l || open || (!force && seen.has(key))) return; seen.add(key);
    if (bot.sleeping) bot.sleep(false);
    if (docked && !['hello', 'sent', 'wake'].includes(key)) bot.point(1, 1.4);
    // lines only where they cannot cover content: in the hero, or docked on very wide screens
    if (!muted && followActive() && ['sent', 'exit'].includes(key)) { bubble(l[0], key === 'exit' ? ['Start a project →', 'contact.html#start'] : null, key === 'exit' ? 9000 : 5200); bot.setMood(l[1], 2.4); if (key === 'exit') bot.wave(); return; }
    if (muted || (docked && !roomy.matches) || (!docked && !state.hero)) { bot.setMood(l[1], 2); if (l[1] === 'ok') bot.nod(); return; }
    $('span', say).textContent = l[0]; say.classList.add('show'); bot.setMood(l[1], 2.4); if (l[1] === 'ok') bot.nod();
    clearTimeout(hideT); hideT = setTimeout(() => say.classList.remove('show'), 5200);
  }
  $('.guide-x', say).addEventListener('click', (e) => { e.stopPropagation(); muted = true; say.classList.remove('show'); try { sessionStorage.setItem('guide-off', '1'); } catch (_) {} });

  // ---- panel ----
  const byslug = (s) => PROJECTS.find((p) => p.slug === s);
  function menu() {
    panel.innerHTML = `<header><span class="guide-face sm" aria-hidden="true"><i></i><i></i></span><div><b>Scout</b><span>Portfolio guide</span></div><button type="button" class="guide-close" aria-label="Close the guide">×</button></header>
      <p class="gp-q">Hi. What are you looking to solve?</p>
      <ul class="gp-chips">${TOPICS.map((t) => `<li><button type="button" data-k="${t.k}">${esc(t.label)}</button></li>`).join('')}<li><button type="button" data-k="browse" class="ghost">Just browsing</button></li></ul>
      <p class="gp-foot">Predefined answers from this portfolio. For anything else, <a class="tlink" href="contact.html#start">write to me</a>.</p>`;
  }
  function answer(k) {
    if (k === 'browse') { close(); const w = $('#work'); if (w) scrollTo({ top: w.getBoundingClientRect().top + scrollY - 70, behavior: REDUCED ? 'auto' : 'smooth' }); return; }
    const t = TOPICS.find((x) => x.k === k); if (!t) return;
    const work = t.work.map(byslug).filter(Boolean).slice(0, 3);
    panel.innerHTML = `<header><span class="guide-face sm" aria-hidden="true"><i></i><i></i></span><div><b>Scout</b><span>${esc(t.label)}</span></div><button type="button" class="guide-close" aria-label="Close the guide">×</button></header>
      <div class="gp-a" tabindex="-1"><p class="gp-k">The problem</p><p>${esc(t.problem)}</p><p class="gp-k">What I build</p><p>${esc(t.answer)}</p></div>
      ${work.length ? `<p class="gp-k">Related case studies</p><ul class="gp-work">${work.map((p) => `<li><a href="projects.html#/work/${p.slug}"><b>${esc(p.title)}</b><span>${esc(p.badge)} · ${esc(p.year)}</span></a></li>`).join('')}</ul>` : ''}
      <div class="gp-acts"><a class="btn btn-primary sm" href="contact.html?topic=${encodeURIComponent(t.topic)}#start">Discuss this with Asad</a>${t.jump ? `<a class="btn sm" href="${t.jump[0]}" data-jump>${esc(t.jump[1])}</a>` : ''}<button type="button" class="btn sm ghost" data-back>Other topics</button></div>`;
    bot.setMood(t.mood, 3); bot.nod(); bot.point(1, 1.2);
    $('.gp-a', panel)?.focus?.();
  }
  panel.addEventListener('click', (e) => {
    const c = e.target.closest('[data-k]'); if (c) return answer(c.dataset.k);
    if (e.target.closest('[data-back]')) { menu(); $('.gp-chips button', panel)?.focus(); return; }
    if (e.target.closest('.guide-close')) return close();
    const j = e.target.closest('[data-jump]'); if (j) { e.preventDefault(); close(); const el = $(j.getAttribute('href')); if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - 70, behavior: REDUCED ? 'auto' : 'smooth' }); }
  });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  function setExpanded(v) { [ask, dock, launch].forEach((b) => b.setAttribute('aria-expanded', String(v))); }
  function openPanel(from) {
    if (open) return close(); open = true; opener = from || document.activeElement;
    menu(); panel.hidden = false; requestAnimationFrame(() => panel.classList.add('show'));
    say.classList.remove('show'); setExpanded(true); document.documentElement.classList.add('guide-open');
    if (canDock()) place(true); if (bot.sleeping) bot.sleep(false); bot.setMood('happy', 1.6); bot.look(.4, .1); bot.hop();
    setTimeout(() => $('.gp-chips button', panel)?.focus(), 30);
  }
  function close() {
    if (!open) return; open = false; panel.classList.remove('show'); setExpanded(false); document.documentElement.classList.remove('guide-open');
    setTimeout(() => { if (!open) panel.hidden = true; }, 250); bot.look(); update();
    if (opener && document.contains(opener) && getComputedStyle(opener).display !== 'none') opener.focus({ preventScroll: true });
  }
  [ask, dock, launch].forEach((b) => b.addEventListener('click', () => openPanel(b)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) close(); });
  document.addEventListener('pointerdown', (e) => { if (open && !panel.contains(e.target) && ![ask, dock, launch].some((b) => b.contains(e.target))) close(); });
  loadProjects().catch(() => {});

  // ---- hero <-> dock ----
  const state = { hero: true }, blockers = new Set();
  function place(toDock) {
    if (toDock === docked) return; docked = toDock; if (!roomy.matches) say.classList.remove('show');
    (toDock ? dock : home).prepend(figure, say); dock.classList.toggle('on', toDock); bot.resize();
  }
  function update() {
    place(canDock() && (open || !state.hero));
    const away = blockers.size > 0 && !open; dock.classList.toggle('away', away); launch.classList.toggle('on', !canDock() && !state.hero && !away);
    document.documentElement.classList.toggle('buddy-on', follows());
    if (followActive()) setTimeout(hint, 900); else hideBubble(true);
  }
  new IntersectionObserver(([e]) => { state.hero = e.isIntersecting; update(); }, { threshold: .12 }).observe(hero);
  ['#recruiter', '#scoring'].forEach((s) => { const el = $(s); if (el) new IntersectionObserver(([e]) => { e.isIntersecting ? blockers.add(s) : blockers.delete(s); update(); }, { threshold: .05 }).observe(el); });
  wide.addEventListener('change', update); fine.addEventListener('change', update);

  // ---- follow the cursor, pitch the project under it, catch the visitor before they leave ----
  const pitch = document.createElement('div'); pitch.className = 'guide-pitch'; pitch.setAttribute('role', 'status'); pitch.setAttribute('aria-live', 'polite');
  pitch.innerHTML = '<p></p><a class="btn btn-primary sm" data-cta="scout"></a><button type="button" class="gpi-x" aria-label="Hide Scout tips">×</button>';
  document.body.append(pitch);
  const PITCH = {
    'weld-line-inspection': 'Cracks missed by eye? This flags them for your inspector.',
    'parcel-counting': 'Need exact counts per hour on your belt?',
    'weld-defect-detection': 'Porosity and undercut, caught on every seam.',
    'flange-dimension-compliance': 'One camera, every part measured, pass or fail.',
    'wall-paint-defects': 'Coating defects found before your customer sees them.',
    'hr-workflow-automation': 'Too many CVs? Every one scored, a person decides.',
    'resume-screening': 'Shortlist faster, with the reasons shown.',
    'invoice-to-excel': 'Still retyping invoices? This tool does it for you.',
    'subtitle-saas': 'Subtitles in many languages, without the manual work.',
    'n8n-automations': 'Reports that build and send themselves.',
    'rag-pipeline': 'Answers from your own documents, with the source.',
  };
  const CATP = { industrial: ['Want this on your line? I’ll scope it for your parts.', 'Computer vision inspection and detection', 'Build this for me →'], recruitment: ['Want this for your hiring?', 'Recruitment and HR automation', 'Build this for me →'], agents: ['Want an agent like this for your team?', 'AI agent for my business', 'Get this for my team →'], agriculture: ['Grading and counting from ordinary cameras.', 'Computer vision inspection and detection', 'Talk about my project →'] };
  const SAAS = new Set(['invoice-to-excel', 'subtitle-saas']);
  let tipsOff = false; try { tipsOff = sessionStorage.getItem('scout-tips') === '0'; } catch (_) {}
  // Scout keeps one calm seat in the corner. He never chases the mouse: his eyes follow the cursor, and when the
  // visitor rests on a project he turns to it, points and says what it can do for their business, from his seat.
  let pitchEl = null, bubbleT = 0, leaveT = 0, exitOn = false, shown = false;
  const pitched = new Set(), MAX_PITCH = 4;
  function followActive() { return follows() && docked && !open && dock.classList.contains('on') && !dock.classList.contains('away'); }
  function placeBubble() {
    const r = dock.getBoundingClientRect(), bh = pitch.offsetHeight;
    pitch.style.transform = `translate3d(${Math.round(r.right + 4)}px,${Math.round(Math.max(72, r.top + r.height * .1 - bh * .35))}px,0)`;
  }
  function bubble(text, cta, ms) {
    $('p', pitch).textContent = text; const a = $('a', pitch);
    if (cta) { a.textContent = cta[0]; a.href = cta[1]; a.hidden = false; } else a.hidden = true;
    shown = true; pitch.classList.add('typing'); placeBubble(); pitch.classList.add('show');
    clearTimeout(pitch._ty); pitch._ty = setTimeout(() => { pitch.classList.remove('typing'); placeBubble(); }, REDUCED ? 0 : 420);
    clearTimeout(bubbleT); if (ms) bubbleT = setTimeout(() => { exitOn = false; hideBubble(); }, ms);
  }
  function hideBubble(now) { shown = false; pitch.classList.remove('show'); clearTimeout(bubbleT); if (now) { pitchEl = null; exitOn = false; } }
  function startPitch(card) {
    const slug = card.dataset.slug;
    // each card once per visit, a few per visit at most: helpful, never nagging
    if (tipsOff || !followActive() || exitOn || pitched.has(slug) || pitched.size >= MAX_PITCH) return; pitched.add(slug);
    const p = PROJECTS.find((x) => x.slug === slug), c = CATP[p?.cat] || CATP.agents, topic = SAAS.has(slug) ? 'Document processing' : c[1];
    pitchEl = card; bubble(PITCH[slug] || c[0], [SAAS.has(slug) ? 'Get this for my team →' : c[2], `contact.html?topic=${encodeURIComponent(topic)}#start`], 0);
    // turn toward the card and point at it
    const d = dock.getBoundingClientRect(), cr = card.getBoundingClientRect(), dx = (cr.left + cr.width / 2) - (d.left + d.width / 2), dy = (cr.top + cr.height / 2) - (d.top + d.height / 2);
    bot.look(Math.max(-.7, Math.min(.7, dx / 900)), Math.max(-.3, Math.min(.3, dy / 1400))); bot.setMood('ok', 2.4); bot.nod(); setTimeout(() => bot.point(1, 1.4), 350);
  }
  function endPitch() { pitchEl = null; hideBubble(); bot.look(); }
  // the first time he docks, one line on how he helps
  let hinted = false; try { hinted = sessionStorage.getItem('scout-hint') === '1'; } catch (_) {}
  function hint() {
    if (hinted || tipsOff || !followActive()) return; hinted = true; try { sessionStorage.setItem('scout-hint', '1'); } catch (_) {}
    bubble('Rest on any project and I’ll tell you what it can do for your business.', null, 5000); bot.wave();
  }
  let hover = null, dwellT = 0;
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || !follows()) return;
    if (pitch.contains(e.target)) { clearTimeout(leaveT); clearTimeout(dwellT); hover = null; return; }
    const card = e.target.closest?.('.card[data-slug],.featured[data-slug]');
    if (card === hover) { if (card) clearTimeout(leaveT); return; }
    hover = card; clearTimeout(dwellT);
    if (card) { clearTimeout(leaveT); if (card !== pitchEl) dwellT = setTimeout(() => startPitch(card), 900); }
    else if (pitchEl) { clearTimeout(leaveT); leaveT = setTimeout(endPitch, 2600); }
  });
  $('.gpi-x', pitch).addEventListener('click', () => { tipsOff = true; try { sessionStorage.setItem('scout-tips', '0'); } catch (_) {} endPitch(); exitOn = false; });
  $('a', pitch).addEventListener('pointerenter', () => { bot.hop(); bot.setMood('happy', 1.4); });
  addEventListener('resize', () => { if (shown) placeBubble(); });
  const born = performance.now(); let exitDone = false; try { exitDone = sessionStorage.getItem('scout-exit') === '1'; } catch (_) {}
  document.addEventListener('mouseout', (e) => {
    if (e.relatedTarget || e.clientY > 6 || exitDone || open || tipsOff || !fine.matches || performance.now() - born < 12000) return;
    exitDone = true; try { sessionStorage.setItem('scout-exit', '1'); } catch (_) {}
    if (followActive()) { endPitch(); exitOn = true; } speak('exit', true);
  });

  // ---- section lines ----
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; const k = e.target.dataset.guide; speak(k); if (!open) k === 'contact' ? bot.look(.55, .12) : bot.look(); }), { threshold: .35 });
  [['#work', 'work'], ['#services', 'services'], ['#how', 'how'], ['.cta-band', 'contact']].forEach(([s, k]) => { const el = $(s); if (el) { el.dataset.guide = k; io.observe(el); } });
  document.addEventListener('click', (e) => { const b = e.target.closest('.ind-tab[data-cat]'); if (b) { speak(b.dataset.cat, true); bot.hop(); } });

  // ---- life: hover wave, click, idle look-around, sleep and wake, scroll lean, celebrate a sent enquiry ----
  let lastWave = 0, lastAct = performance.now(), looked = false;
  const waveOnce = () => { const n = performance.now(); if (n - lastWave > 4000 && !bot.sleeping) { lastWave = n; bot.wave(); } };
  figure.addEventListener('pointerenter', waveOnce); dock.addEventListener('pointerenter', waveOnce);
  figure.addEventListener('click', () => openPanel(ask));
  const active = () => { lastAct = performance.now(); looked = false; if (bot.sleeping) { bot.sleep(false); speak('wake', true); } };
  ['pointermove', 'keydown', 'touchstart', 'wheel'].forEach((ev) => addEventListener(ev, active, { passive: true }));
  if (!REDUCED) setInterval(() => {
    if (document.hidden || open) return; const idle = (performance.now() - lastAct) / 1000;
    if (idle > 12 && !looked) { looked = true; bot.lookAround(); }
    if (idle > 30 && !bot.sleeping) bot.sleep(true);
  }, 1000);
  let lastY = scrollY, lastS = performance.now();
  addEventListener('scroll', () => { const n = performance.now(), dt = Math.max(16, n - lastS), v = (scrollY - lastY) / dt; lastY = scrollY; lastS = n; lastAct = n; if (bot.sleeping) bot.sleep(false); if (!REDUCED) bot.lean(-v * .6); }, { passive: true });
  addEventListener('lead:sent', () => { bot.celebrate(); speak('sent', true); });
  setTimeout(() => speak('hello'), REDUCED ? 300 : 1600);
  setTimeout(() => { if (state.hero) speak('nudge'); }, 8500);
}
