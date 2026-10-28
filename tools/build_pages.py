# Generates the 4 static pages with a shared header/footer. Run: python3 tools/build_pages.py
import json, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://asad-gulshair.github.io/"
# Contact defaults baked into the HTML (work without JS). The live values come from content/site.json (admin panel).
EMAIL = "asadgulshair6767@gmail.com"
GH = "https://github.com/asad-gulshair"
LI = "https://www.linkedin.com/in/asad-gulshair"
from urllib.parse import quote
MAIL_PROJECT = f"mailto:{EMAIL}?subject={quote('Project enquiry')}"
MAIL_MEET = f"mailto:{EMAIL}?subject={quote('Meeting request - project discussion')}&body={quote('Hi Asad,\n\nI would like to book a Google Meet call about a project.\n\nPreferred times (2-3 options, with your timezone):\n1. \n2. \n3. \n\nShort project summary:\n\n')}"
IRIS = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="none" stroke="#EDEBE6" stroke-width="1.5"/><g stroke="#A3A7AB" stroke-width="1.3" stroke-linecap="round">' + ''.join(f'<path d="M12 12 L12 2.2" transform="rotate({a} 12 12) translate(3.2 0)"/>' for a in range(0, 360, 60)) + '</g><circle cx="12" cy="12" r="2.6" fill="#E8743B"/></svg>'
PAGES = {
 'index.html': ('Asad Gulshair, AI Engineer · Computer Vision & AI Agents', 'Custom AI systems built around your process: computer vision inspection for factories, CV screening for HR, and AI agents and automation for operations teams.', None),
 'projects.html': ('Work · Asad Gulshair, AI Engineer', 'Case studies in industrial computer vision, recruitment automation, AI agents, SaaS tools and agriculture, with honest status labels and real model output.', 'projects'),
 'about.html': ('About · Asad Gulshair, AI Engineer', 'About Asad Gulshair: AI engineer, capabilities, experience, education and IEEE publication.', 'about'),
 'contact.html': ('Contact · Asad Gulshair, AI Engineer', 'Start a project or book a meeting with Asad Gulshair. Email, LinkedIn and GitHub.', 'contact'),
}
def head(fn, title, desc):
    url = SITE + ('' if fn == 'index.html' else fn)
    ld = {"@context": "https://schema.org", "@type": "Person", "name": "Asad Gulshair", "jobTitle": "AI Engineer", "url": SITE, "email": "mailto:" + EMAIL, "sameAs": [GH, LI]}
    pre = '<link rel="modulepreload" href="assets/js/home.js">' if fn == 'index.html' else ''
    # content files are fetched by the page scripts; preloading starts them with the HTML
    data = '<link rel="preload" href="content/site.json" as="fetch" crossorigin>'
    if fn in ('index.html', 'projects.html'): data += '<link rel="preload" href="content/projects.json" as="fetch" crossorigin>'
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="author" content="Asad Gulshair">
<meta name="theme-color" content="#0A0B0D">
{'<meta name="robots" content="noindex">' if fn == '404.html' else ''}<link rel="canonical" href="{url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Asad Gulshair">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}assets/og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{title}"><meta name="twitter:description" content="{desc}"><meta name="twitter:image" content="{SITE}assets/og.jpg">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="icon" href="assets/favicon.png" sizes="32x32"><link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="preload" href="assets/fonts/geist-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css"><link rel="stylesheet" href="assets/css/fx.css">
{data}{pre}
<script data-goatcounter="https://asadgulshair.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
<script type="application/ld+json">{json.dumps(ld)}</script>
<script type="importmap">{{"imports":{{"three":"./assets/vendor/three.module.min.js"}}}}</script>
<script>try{{if(sessionStorage.getItem('intro')||/[?&]capture/.test(location.search))document.documentElement.classList.add('no-intro');else sessionStorage.setItem('intro','1')}}catch(e){{document.documentElement.classList.add('no-intro')}}</script>
</head>
<body>
<div class="intro" aria-hidden="true"><div class="intro-in"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5" fill="none" stroke="#EDEBE6" stroke-width="1.2"/><circle cx="12" cy="12" r="2.6" fill="#E8743B"/></svg><span>Asad Gulshair</span><i></i></div></div>
'''
def header(active):
    def n(href, label, key):
        cur = ' aria-current="page"' if key == active else ''
        return f'<a href="{href}"{cur}>{label}</a>'
    links = n('projects.html', 'Work', 'projects') + n('about.html', 'About', 'about') + n('contact.html', 'Contact', 'contact')
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="hdr"><div class="wrap hdr-in">
  <a class="brand" href="./" aria-label="Asad Gulshair, home">{IRIS}<span>Asad Gulshair</span></a>
  <nav class="nav" aria-label="Primary">{links}</nav>
  <div class="hdr-cta"><a class="btn sm" data-book href="{MAIL_MEET}">Book a meeting</a><a class="btn btn-primary sm" href="contact.html#start">Start a project</a></div>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mnav">Menu</button>
</div>
<nav id="mnav" class="mnav" aria-label="Mobile" hidden><a href="./"{' aria-current="page"' if active is None else ''}>Home</a>{links}<a class="btn btn-primary" href="contact.html#start">Start a project</a><a class="btn" data-book href="{MAIL_MEET}">Book a meeting</a></nav>
</header>
'''
FOOT = f'''<footer class="ftr"><div class="wrap">
  <span>© <span data-year>2026</span> Asad Gulshair</span>
  <nav aria-label="Footer"><a href="mailto:{EMAIL}" data-mail="plain">{EMAIL}</a><a href="{LI}" data-li target="_blank" rel="noopener">LinkedIn ↗</a><a href="{GH}" data-gh target="_blank" rel="noopener">GitHub ↗</a></nav>
</div></footer>
'''
CTA_BAND = f'''<section class="cta-band" aria-labelledby="cta-h"><div class="wrap">
  <div style="display:grid;gap:20px"><p class="meta">Contact</p><h2 id="cta-h">Have a problem worth automating?</h2><p class="lead">Send a short description and what a good result looks like. I usually reply within a day.</p><ol class="cta-next"><li><b>I reply within a day</b><span>with a first view on whether it is feasible.</span></li><li><b>We check your sample data</b><span>before anything is built.</span></li><li><b>Fixed scope and milestones</b><span>agreed up front, handover included.</span></li></ol></div>
  <div class="cta-side"><div class="lead-card" data-lead-form="compact"></div><div class="cta-row"><a class="btn btn-primary" data-book href="{MAIL_MEET}">Book a meeting</a><button class="btn" type="button" data-copy-email><span>Copy email</span></button></div></div>
</div></section>
'''
# small line icons (32px grid, currentColor + one accent detail) for the "How it works" guide
def ICON(body): return f'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">{body}</svg>'
AC = 'stroke="#E8743B"'
STEPS = [
 (ICON(f'<rect x="4" y="9" width="19" height="15" rx="2"/><path d="M4 21l5-5 4 4 3-3 7 7"/><circle cx="17" cy="14" r="1.6"/><path d="M21 4h7v7M28 4l-9 9" {AC}/>'),
  'Share your problem', 'Describe what you need detected, measured or automated, and send a few sample images, videos or documents.'),
 (ICON(f'<rect x="5" y="4" width="16" height="22" rx="2"/><path d="M9 10h8M9 14h6M9 18h4"/><circle cx="21" cy="21" r="5" {AC}/><path d="M24.6 24.6L28 28" {AC}/>'),
  'Feasibility check and plan', 'I check whether your data can support a reliable result, then we agree the scope, success metric and milestones.'),
 (ICON(f'<rect x="9" y="9" width="14" height="14" rx="2"/><path d="M13 5v4M19 5v4M13 23v4M19 23v4M5 13h4M5 19h4M23 13h4M23 19h4"/><path d="M13 16l2 2 4-4" {AC}/>'),
  'Build and test on your data', 'An early prototype on your own samples, then a hardened pipeline evaluated on data the model has not seen.'),
 (ICON(f'<path d="M16 4l11 5.5v13L16 28 5 22.5v-13z"/><path d="M5 9.5L16 15l11-5.5M16 15v13"/><path d="M10.5 6.8l11 5.5" {AC}/>'),
  'Deploy and hand over', 'The model, an API or dashboard, documentation and a walkthrough, so your team can run it without me.'),
]
IC_MAIL = ICON(f'<rect x="4" y="7" width="24" height="18" rx="2"/><path d="M5 9l11 8 11-8" {AC}/>')
IC_CAL = ICON(f'<rect x="4" y="7" width="24" height="20" rx="2"/><path d="M4 13h24M10 4v6M22 4v6"/><path d="M12 20l3 3 5-6" {AC}/>')
IC_CODE = ICON(f'<path d="M11 10l-6 6 6 6M21 10l6 6-6 6"/><path d="M18 7l-4 18" {AC}/>')
FACTS = '''<section class="facts" aria-label="Track record"><div class="wrap"><ul>
  <li><b data-count="17">17</b><span>AI projects built across 4 industries</span></li>
  <li><b data-count="40" data-suffix="%">40%</b><span>less manual work, in production</span></li>
  <li><b data-count="90" data-suffix="%">90%</b><span>detection accuracy on tested models</span></li>
  <li><b>IEEE</b><span>peer-reviewed AI research</span></li>
</ul></div></section>
'''
RECRUITER = (ROOT / 'tools' / 'recruiter_section.html').read_text(encoding='utf-8') + (ROOT / 'tools' / 'scoring_section.html').read_text(encoding='utf-8')
STACK = ['Python', 'PyTorch', 'TensorFlow', 'YOLOv8', 'OpenCV', 'FastAPI', 'LangChain', 'LangGraph', 'n8n', 'Whisper', 'Docker']
SERVICES = [
 (ICON(f'<rect x="4" y="9" width="19" height="15" rx="2"/><circle cx="13.5" cy="16.5" r="4"/><path d="M21 4h7v7M28 4l-9 9" {AC}/>'), 'Computer vision and quality inspection', 'Defect detection, counting and measurement on standard cameras, built for your parts and line.', 'projects.html#industrial', 'Inspection work', '#E8743B'),
 (ICON(f'<circle cx="7" cy="16" r="3"/><circle cx="25" cy="8" r="3"/><circle cx="25" cy="24" r="3"/><path d="M10 16h6M16 16l6-7M16 16l6 7" {AC}/>'), 'AI agents for your workflow', 'An agent built around your process that runs the routine work every day: leads, reports, documents or follow-ups.', 'contact.html?topic=AI%20agent%20for%20my%20business#start', 'Get an agent', '#9B8CFF'),
 (ICON(f'<rect x="4" y="6" width="24" height="18" rx="2"/><path d="M4 11h24M9 16h8M9 20h5"/><circle cx="23" cy="19" r="3" {AC}/>'), 'Ready-to-use tools', 'AI tools that already work today, such as invoice to Excel.', '#products', 'See products', '#8EA2E8'),
 (ICON(f'<rect x="6" y="4" width="15" height="20" rx="2"/><path d="M10 10h7M10 14h7M10 18h4"/><path d="M19 20l3 3 6-7" {AC}/>'), 'Document processing and extraction', 'Invoices, CVs and reports turned into clean, structured data.', 'projects.html#recruitment', 'Document work', '#D2B06A'),
 (ICON(f'<path d="M5 8h14M5 13h10M5 18h12"/><circle cx="23" cy="20" r="5" {AC}/><path d="M26.5 23.5L29 26" {AC}/>'), 'LLM apps and RAG', 'Assistants that answer from your own documents and show the source.', 'projects.html#agents', 'LLM work', '#47D7E6'),
 (ICON(f'<path d="M16 4l11 5.5v13L16 28 5 22.5v-13z"/><path d="M5 9.5L16 15l11-5.5M16 15v13" {AC}/>'), 'Custom build and deployment', 'From a prototype on your data to an API, app or dashboard your team runs.', 'contact.html#start', 'Start a project', '#8DB86A'),
]
PRODUCTS = [
 ('Web app · Live', 'Invoice to Excel', 'Upload invoices, get one clean Excel sheet. No more retyping by hand.', [('Open the app ↗', 'https://invoice-to-excel-tool.streamlit.app/', True), ('Get it customised', 'contact.html?topic=Document%20processing#start', False)], '#8EA2E8'),
 ('SaaS · Built for a media team', 'Subtitles and translation', 'Multilingual subtitles, transcription and translation in one tool, used in production.', [('Get one for your team', 'contact.html?topic=Document%20processing#start', False), ('Case study →', 'projects.html#/work/subtitle-saas', False)], '#47D7E6'),
 ('Custom build', 'Your own AI agent', 'Leads, reports, documents or follow-ups: an agent built around your workflow, with support after launch.', [('Tell me your workflow', 'contact.html?topic=AI%20agent%20for%20my%20business#start', False)], '#9B8CFF'),
]
PROCESS = [
 ('Discover', 'Your problem, your data and what success looks like.'),
 ('Prototype', 'A first working version on your own samples.'),
 ('Validate', 'Tested on data the model has not seen, with real metrics.'),
 ('Deploy', 'An API, app or workflow your team can run, with docs.'),
 ('Improve', 'Tune on new cases and add what the team needs next.'),
]
def page_index():
    PRODUCTS_HTML = f'''<section id="products" class="prod" aria-labelledby="prod-h"><div class="wrap">
  <div class="sec-head reveal"><p class="meta">Products</p><h2 id="prod-h">Tools that work today, and agents built for you.</h2><p class="lead">Try a tool that already works, or tell me the workflow you want an agent to run.</p></div>
  <ul class="prod-grid reveal">{''.join(f'<li class="prod-card" style="--c:{c}"><span class="meta">{tag}</span><h3>{t}</h3><p>{d}</p><div class="prod-acts">' + ''.join(f'<a class="{"btn btn-primary sm" if i == 0 else "tlink"}" href="{h}"' + (' target="_blank" rel="noopener"' if ext else '') + f' data-cta="product">{l}</a>' for i, (l, h, ext) in enumerate(acts)) + '</div></li>' for tag, t, d, acts, c in PRODUCTS)}</ul>
</div></section>
'''
    return f'''<main id="main">
<section class="hero" aria-labelledby="hero-h"><div class="wrap">
  <div class="hero-copy">
    <p class="meta" data-site="hero.eyebrow">Asad Gulshair · AI Engineer</p>
    <h1 id="hero-h" data-site="hero.headline">AI that takes the repetitive work off your team.</h1>
    <p class="lead" data-site="hero.subline">From computer vision on the factory floor to workflow automation across HR and operations, I build AI systems around your process and your data. Tell me the problem and I'll design the solution.</p>
    <div class="cta-row"><a class="btn btn-primary" href="contact.html#start" data-cta="hero">Get a free consultation</a><a class="btn" href="#work" id="cta-work">See real results</a></div>
    <a class="proof" href="#work" data-proof aria-label="Real output from my models: see the work"><span class="proof-th"><img src="assets/media/crack-detect.webp?v=2" alt="" width="64" height="40" loading="eager"><img src="assets/media/porosity-detect.webp?v=2" alt="" width="64" height="40" loading="eager"><img src="assets/media/parcel-count.webp" alt="" width="64" height="40" loading="eager"></span><span class="proof-t"><b>Real output from my models</b><span>Crack, porosity and parcel detection</span></span></a>
    <p class="meta avail" data-avail><i></i><span>Available for new projects</span></p>
    <nav class="practice" aria-label="Practice areas">
      <a href="projects.html#industrial" data-cat="industrial"><span class="dot" style="background:var(--c-industrial)"></span>Industrial Vision</a>
      <a href="projects.html#recruitment" data-cat="recruitment"><span class="dot" style="background:var(--c-recruitment)"></span>Recruitment Automation</a>
      <a href="projects.html#agents" data-cat="agents"><span class="dot" style="background:var(--c-agents)"></span>AI Agents &amp; SaaS</a>
      <a href="projects.html#agriculture" data-cat="agriculture"><span class="dot" style="background:var(--c-agriculture)"></span>Agriculture</a>
    </nav>
  </div>
  <div class="hero-media" id="hero-media"><div class="hero-backdrop" aria-hidden="true"></div><img class="fallback-still" src="assets/media/hero-still.webp" alt="" width="900" height="900" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain"><canvas id="aperture" aria-hidden="true"></canvas><div class="guide-home" id="guide-home"></div></div>
</div><a class="scroll-cue" href="#work" aria-label="Scroll to my work"><i></i><span>Scroll</span></a></section>
{FACTS}<div class="stack-strip" aria-label="Tools used in shipped or published work"><div class="wrap"><ul>{''.join(f'<li>{s}</li>' for s in STACK)}</ul></div></div>
<section id="work" aria-labelledby="work-h"><div class="wrap">
  <div class="sec-head reveal"><p class="meta">Selected work</p><h2 id="work-h">Pick an industry. See what I built.</h2></div>
  <div class="ind reveal" id="ind">
    <div class="ind-tabs" role="tablist" aria-label="Industries"><a class="ind-tab" href="projects.html#industrial"><span class="dot" style="background:var(--c-industrial)"></span>Industrial Vision</a><a class="ind-tab" href="projects.html#recruitment"><span class="dot" style="background:var(--c-recruitment)"></span>Recruitment Automation</a><a class="ind-tab" href="projects.html#agents"><span class="dot" style="background:var(--c-agents)"></span>AI Agents &amp; SaaS</a><a class="ind-tab" href="projects.html#agriculture"><span class="dot" style="background:var(--c-agriculture)"></span>Agriculture</a></div>
    <div class="ind-panel" id="ind-panel" role="tabpanel"></div>
  </div>
  <div class="pub reveal"><span class="meta">Peer-reviewed · IEEE Access · 2025</span><p><b style="color:var(--text);font-weight:500">AI-Driven Smart Agriculture:</b> an integrated approach for soil analysis, irrigation and crop-fertilizer recommendations. Co-author; built as my final-year project.</p><a class="tlink" href="https://ieeexplore.ieee.org/document/11104235" target="_blank" rel="noopener">Read the paper ↗</a></div>
  <p style="margin-top:32px"><a class="btn" href="projects.html">See all projects →</a></p>
</div></section>
{RECRUITER}<section id="services" class="svc" aria-labelledby="svc-h"><div class="wrap">
  <div class="sec-head reveal"><p class="meta">Services</p><h2 id="svc-h">What I can do for you.</h2><p class="lead">Different businesses need different things: a custom system, an AI agent for a daily workflow, or a tool that is ready today.</p></div>
  <ul class="svc-grid reveal">{''.join(f'<li class="svc-card" style="--c:{c}"><span class="svc-ic" aria-hidden="true">{ic}</span><h3>{t}</h3><p>{d}</p><a class="svc-go" href="{h}">{l} →</a></li>' for ic, t, d, h, l, c in SERVICES)}</ul>
</div></section>
{PRODUCTS_HTML}<section id="how" class="proc" aria-labelledby="how-h"><div class="wrap">
  <div class="sec-head reveal"><p class="meta">How we work</p><h2 id="how-h">From first call to a system you own.</h2></div>
  <ol class="proc-line reveal">{''.join(f'<li><span class="proc-n">{n:02d}</span><h3>{t}</h3><p>{d}</p></li>' for n, (t, d) in enumerate(PROCESS, 1))}</ol>
</div></section>
{CTA_BAND}</main>
'''
def page_projects():
    return f'''<main id="main">
<div class="page-head"><div class="wrap"><p class="meta">Work</p><h1 style="font-size:clamp(40px,5vw,72px);max-width:20ch">Selected work</h1><p class="lead">Four areas where I've designed, trained and deployed systems. Open any project for the problem, approach and result.</p></div></div>
<nav class="catnav" aria-label="Work categories"><div class="wrap" style="position:relative"><ul id="catlist">
  <li><a href="#industrial" data-cat="industrial"><span class="dot" style="background:var(--c-industrial)"></span>Industrial Vision</a></li>
  <li><a href="#recruitment" data-cat="recruitment"><span class="dot" style="background:var(--c-recruitment)"></span>Recruitment Automation</a></li>
  <li><a href="#agents" data-cat="agents"><span class="dot" style="background:var(--c-agents)"></span>AI Agents &amp; SaaS</a></li>
  <li><a href="#agriculture" data-cat="agriculture"><span class="dot" style="background:var(--c-agriculture)"></span>Agriculture</a></li>
<li class="bar" aria-hidden="true"></li></ul></div></nav>
<div id="cats"></div>
{CTA_BAND}</main>
'''
def page_about():
    return f'''<main id="main">
<div class="page-head"><div class="wrap"><p class="meta">About</p><h1 style="font-size:clamp(40px,5vw,72px);max-width:20ch" data-site="about.headline">AI engineer where models meet operations.</h1></div></div>
<section style="padding-top:24px" aria-label="About"><div class="wrap about-grid">
  <div><p class="meta" style="margin-bottom:16px">Asad Gulshair</p><div style="display:flex;flex-wrap:wrap;gap:12px"><a class="btn btn-primary" href="contact.html#start">Start a project</a><a class="btn" href="{GH}" data-gh target="_blank" rel="noopener">GitHub ↗</a></div></div>
  <div style="display:grid;gap:20px"><p class="lead" data-site="about.intro">I'm an AI engineer who works where models meet operations: cameras on production lines, documents in HR pipelines, agents inside business tools.</p>
  <p style="color:var(--text-2);max-width:64ch" data-site="about.body">I care about systems that are measurable, maintainable and handed over properly. Most of my work starts with a messy real-world input (a line camera, a pile of applications, a weekly report) and ends with an API or workflow a team uses every day. I'm a co-author of a peer-reviewed IEEE Access paper (2025) on AI for smart agriculture.</p></div>
</div></section>
<section style="padding-top:0" aria-labelledby="cap-h"><div class="wrap">
  <div class="sec-head reveal"><h2 id="cap-h">Capabilities</h2></div>
  <div class="caps reveal" data-site-list="skills">
    <div><h3>Computer vision</h3><ul><li>Object detection and tracking (YOLOv8, ByteTrack)</li><li>Defect and anomaly detection</li><li>Measurement with ArUco markers and depth estimation</li><li>Image classification (CNNs, transfer learning)</li><li>OpenCV pipelines that run on CPU</li></ul></div>
    <div><h3>LLMs and agents</h3><ul><li>LangChain and LangGraph workflows</li><li>Retrieval-augmented generation (FAISS, LlamaIndex)</li><li>Whisper transcription and translation</li><li>n8n and Apps Script automation</li><li>Prompting and evaluation</li></ul></div>
    <div><h3>Delivery</h3><ul><li>FastAPI and REST APIs</li><li>Docker</li><li>Power BI and Looker dashboards</li><li>Python, SQL, TensorFlow, PyTorch, scikit-learn</li><li>Documentation and handover</li></ul></div>
  </div>
</div></section>
<section style="padding-top:0" aria-labelledby="exp-h"><div class="wrap">
  <div class="sec-head reveal"><h2 id="exp-h">Experience</h2></div>
  <ol class="timeline reveal" data-site-list="experience">
    <li><span class="meta">2026 to present</span><div><h3>AI Engineer, manufacturing sector <span class="cur">Current</span></h3><p>LLM-powered HR workflow automation for recruitment and onboarding with LangChain and LangGraph, rolled out with the operations team. Currently also working on bottle bubble detection and mushroom defect classification for production quality control.</p></div></li>
    <li><span class="meta">2025 to 2026</span><div><h3>Data Scientist, digital media</h3><p>Shipped a multilingual subtitle and transcription SaaS (OpenAI, Whisper, FFmpeg) that cut manual translation effort by about 40%. Power BI and Looker dashboards; workflow automation with n8n, Apps Script and APIs.</p></div></li>
    <li><span class="meta">2025</span><div><h3>AI Intern, applied industrial AI</h3><p>Computer-vision inspection systems for manufacturing QA with YOLOv8 and CNNs, served through FastAPI. OpenCV/ArUco dimension measurement and monocular depth estimation.</p></div></li>
  </ol>
</div></section>
<section style="padding-top:0" aria-labelledby="edu-h"><div class="wrap">
  <div class="sec-head reveal"><h2 id="edu-h">Education and research</h2></div>
  <div class="two reveal">
    <div class="panel"><p class="meta">Degree · 2021 to 2025</p><h3>B.S. Data Science</h3><p>Statistics, machine learning, databases, data visualisation and applied Python.</p></div>
    <div class="panel"><p class="meta">Final-year project · Published in IEEE Access, 2025</p><h3>AI-driven smart agriculture</h3><p>IoT soil sensors and a weather API feeding models for soil analysis, irrigation advice and crop-fertilizer recommendations, with explainable AI and a farmer chatbot. </p><div class="stats" aria-label="Accuracies reported in the paper"><div><b data-count="99.13" data-suffix="%">99.13%</b><span>Irrigation advice</span></div><div><b data-count="98.75" data-suffix="%">98.75%</b><span>Crop recommendation</span></div><div><b data-count="99.3" data-suffix="%">99.3%</b><span>Fertilizer recommendation</span></div></div>
      <div style="display:flex;flex-wrap:wrap;gap:12px 20px;margin-top:6px"><a class="tlink" href="https://ieeexplore.ieee.org/document/11104235" target="_blank" rel="noopener">Read the paper ↗</a><a class="tlink" href="projects.html#/work/smart-farming-ieee">View case study →</a><a class="tlink" href="https://github.com/asad-gulshair/Agro-high-AI-powered-Forming-Project" target="_blank" rel="noopener">View code ↗</a></div></div>
  </div>
</div></section>
{CTA_BAND}</main>
'''
def page_contact():
    return f'''<main id="main">
<div class="page-head"><div class="wrap"><p class="meta">Contact</p><h1 style="font-size:clamp(40px,5vw,72px);max-width:18ch">Have a problem worth automating?</h1></div></div>
<section style="padding-top:16px" aria-label="Contact options"><div class="wrap contact-grid">
  <div class="left">
    <p class="lead">Send a short description of the problem and what a good result looks like. I usually reply within a day.</p>
    <p class="meta avail" data-avail><i></i><span>Available for new projects</span></p>
    <div class="panel"><p class="meta">Useful to include</p><ul class="checks" style="grid-template-columns:1fr"><li>What you want detected, measured or automated</li><li>A few sample images, videos or documents</li><li>Where it needs to run (line PC, cloud, existing tool)</li><li>Timeline and any fixed constraints</li></ul></div>
  </div>
  <div class="start-col" id="start"><div class="lead-card" data-lead-form="full"></div>
  <div class="ccards">
    <div class="ccard"><div class="k"><span class="meta">Email</span><span class="v" data-email-text>{EMAIL}</span><span class="d">Best for project briefs and files. “Email me” opens your default mail app; or copy the address.</span></div>
      <div class="acts"><button class="btn sm" type="button" data-copy-email><span>Copy email</span></button><a class="btn btn-primary sm" data-mail="project" href="{MAIL_PROJECT}" title="Opens your default email app">Email me</a></div></div>
    <div class="ccard"><div class="k"><span class="meta">Book a meeting</span><span class="d">A short call to talk through your project. Share a few times that suit you, with your timezone.</span></div>
      <div class="acts"><a class="btn sm" data-book href="{MAIL_MEET}">Book a meeting</a></div></div>
    <div class="ccard"><div class="k"><span class="meta">LinkedIn</span><span class="v" data-li-text>linkedin.com/in/asad-gulshair</span><span class="d">Send a message or connect, whichever you prefer.</span></div>
      <div class="acts"><a class="btn sm" href="{LI}" data-li target="_blank" rel="noopener">Open LinkedIn ↗</a></div></div>
    <div class="ccard"><div class="k"><span class="meta">GitHub</span><span class="v">github.com/asad-gulshair</span><span class="d">Code for the public projects on this site.</span></div>
      <div class="acts"><a class="btn sm" href="{GH}" data-gh target="_blank" rel="noopener">Open GitHub ↗</a></div></div>
  </div></div>
</div></section>
</main>
'''
SCRIPTS = {'index.html': 'home.js', 'projects.html': 'projects.js', 'about.html': 'common.js', 'contact.html': 'common.js'}
BODIES = {'index.html': page_index, 'projects.html': page_projects, 'about.html': page_about, 'contact.html': page_contact}
for fn, (title, desc, active) in PAGES.items():
    html = head(fn, title, desc) + header(active) + BODIES[fn]() + FOOT + f'<script type="module" src="assets/js/{SCRIPTS[fn]}"></script>\n</body>\n</html>\n'
    (ROOT / fn).write_text(html, encoding='utf-8')
# 404
nf = head('404.html', 'Page not found · Asad Gulshair', 'Page not found.') + header('x') + '<main id="main"><div class="page-head"><div class="wrap"><p class="meta">404</p><h1 style="font-size:56px">Page not found.</h1><p class="lead">The link may be old. Try the work page or get in touch.</p><div class="cta-row"><a class="btn btn-primary" href="./">Home</a><a class="btn" href="projects.html">Work</a><a class="btn" href="contact.html">Contact</a></div></div></div></main>' + FOOT + '<script type="module" src="assets/js/common.js"></script>\n</body>\n</html>\n'
(ROOT / '404.html').write_text(nf, encoding='utf-8')
print('built')
