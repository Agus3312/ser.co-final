import Lenis from 'lenis';
import './styles-v2.css';
import { siteConfig } from './site-config.js';
import { resolvePrimaryContact } from './contact.js';
import { armadorConfig as config } from './armador-config.js';
import { buildLead, buildMessage, buildShareUrl, buildSummary, renderPath, sanitizeState } from './armador.js';
import { enviarContacto } from './lead-hook.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = window.matchMedia('(max-width: 760px)').matches;
const richMotion = !reduceMotion && !isSmall;
const supportsViewTimeline = CSS.supports('animation-timeline: view()');
const barHeight = () => document.querySelector('.bar').offsetHeight;

/* ---------- Scroll suave ---------- */
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ autoRaf: true, lerp: 0.12 });
}

function scrollToEl(el) {
  const offset = -barHeight();
  if (lenis) lenis.scrollTo(el, { offset });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: reduceMotion ? 'auto' : 'smooth' });
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute('href').slice(1);
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  event.preventDefault();
  if (link.dataset.tipo) builder.preset({ tipo: link.dataset.tipo });
  scrollToEl(target);
  history.replaceState(null, '', `#${id}`);
});

/* ---------- Contacto: WhatsApp cuando haya número, si no Instagram ---------- */
function wireContacts() {
  document.querySelectorAll('.js-contact').forEach((link) => {
    const message = link.dataset.message === 'general' ? siteConfig.whatsappMessage : link.dataset.message;
    const contact = resolvePrimaryContact(siteConfig, message);
    link.href = contact.url;
    link.dataset.channel = contact.channel;
    link.querySelectorAll('.js-contact-label').forEach((label) => { label.textContent = contact.label; });
    if (contact.channel !== 'whatsapp' && link.classList.contains('btn-line') && link.closest('.bar')) {
      link.setAttribute('aria-label', 'Escribinos por Instagram');
    }
  });
}
wireContacts();

/* ---------- 2. Portada con video (solo escritorio) ---------- */
const heroVideo = document.querySelector('.hero-video');
if (richMotion && heroVideo) {
  heroVideo.src = heroVideo.dataset.src;
  heroVideo.addEventListener('playing', () => heroVideo.classList.add('is-playing'), { once: true });
  const heroObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) heroVideo.play().catch(() => {});
    else heroVideo.pause();
  });
  heroObserver.observe(heroVideo);
}

/* ---------- 3. Texto que se pinta: una palabra por <span> ---------- */
document.querySelectorAll('.paint').forEach((p) => {
  const words = p.textContent.trim().split(/\s+/);
  p.textContent = '';
  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.textContent = word;
    span.style.setProperty('--i', i);
    p.append(span);
    if (i < words.length - 1) p.append(' ');
  });
});

/* ---------- 3. Video que avanza con el scroll ---------- */
const scrub = document.querySelector('.scrub');
const scrubVideo = scrub?.querySelector('.scrub-video');
if (richMotion && scrubVideo) {
  const bar = scrub.querySelector('.scrub-progress');
  let active = false;
  let current = 0;

  scrubVideo.src = scrubVideo.dataset.src;
  scrubVideo.preload = 'auto';
  scrubVideo.load();
  scrubVideo.addEventListener('loadeddata', () => scrub.classList.add('is-live'), { once: true });

  new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (active) requestAnimationFrame(tick);
  }, { rootMargin: '20% 0px' }).observe(scrub);

  function tick() {
    if (!active) return;
    const rect = scrub.getBoundingClientRect();
    const travel = rect.height - (window.innerHeight - barHeight());
    const progress = Math.min(1, Math.max(0, (barHeight() - rect.top) / travel));
    bar.style.setProperty('--p', progress.toFixed(4));

    const duration = scrubVideo.duration;
    if (duration) {
      const target = progress * (duration - 0.05);
      current += (target - current) * 0.18;
      if (Math.abs(scrubVideo.currentTime - current) > 0.015 && !scrubVideo.seeking) {
        scrubVideo.currentTime = current;
      }
    }
    requestAnimationFrame(tick);
  }
}

/* ---------- 4. Revelado de fotos donde no hay scroll-timeline ---------- */
if (!supportsViewTimeline && !reduceMotion) {
  document.documentElement.classList.add('js-reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
}

/* ---------- Armador de presupuesto ---------- */
const builder = createBuilder(document.querySelector('#armador'));

function createBuilder(root) {
  const body = root.querySelector('.builder-body');
  const pips = root.querySelector('.builder-steps');
  const previewImg = root.querySelector('.preview-img');
  const previewCaption = root.querySelector('.builder-preview figcaption');
  const legend = root.querySelector('.preview-legend');
  legend.textContent = config.renders.leyenda;

  const screens = [
    ...config.pasos.map((paso) => ({ kind: 'single', paso })),
    { kind: 'visual' },
    { kind: 'single', paso: config.rango, optional: true },
    { kind: 'final' }
  ];
  const questionCount = screens.length - 1;

  let state = {};
  let index = 0;
  let vista = 'exterior';

  // Selector de vista exterior / interior.
  const label = previewCaption.querySelector('.preview-label');
  const toggle = document.createElement('div');
  toggle.className = 'chips';
  toggle.setAttribute('role', 'group');
  toggle.setAttribute('aria-label', 'Vista');
  for (const v of ['exterior', 'interior']) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip chip-sm';
    b.dataset.vista = v;
    b.textContent = v === 'exterior' ? 'Exterior' : 'Interior';
    b.addEventListener('click', () => setVista(v));
    toggle.append(b);
  }
  label.replaceWith(toggle);

  // Precarga de las 9 imágenes cuando el armador se acerca.
  new IntersectionObserver(([entry], obs) => {
    if (!entry.isIntersecting) return;
    obs.disconnect();
    const [techos, fachadas, pisos] = config.visual.grupos.map((g) => g.opciones.map((o) => o.id));
    for (const techo of techos) for (const fachada of fachadas) new Image().src = renderPath(config, { techo, fachada }, 'exterior');
    for (const piso of pisos) new Image().src = renderPath(config, { piso }, 'interior');
  }, { rootMargin: '600px 0px' }).observe(root);

  for (let i = 0; i < questionCount; i++) pips.append(document.createElement('li'));

  function previewAlt() {
    const names = Object.fromEntries(buildSummary(config, { techo: 'dos-aguas', fachada: 'revoque', piso: 'madera', ...state }));
    return vista === 'exterior'
      ? `Fachada con techo ${names.Techo.toLowerCase()} y terminación ${names.Fachada.toLowerCase()}`
      : `Ambiente interior con piso de ${names.Piso.toLowerCase()}`;
  }

  function setVista(v) {
    vista = v;
    previewImg.src = renderPath(config, state, vista);
    previewImg.alt = previewAlt();
    toggle.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vista === vista)));
  }

  function updatePips() {
    [...pips.children].forEach((li, i) => {
      li.className = i < index ? 'is-done' : i === index ? 'is-current' : '';
    });
  }

  function go(next, { focus = true } = {}) {
    index = Math.max(0, Math.min(screens.length - 1, next));
    render();
    if (focus) body.querySelector('h3')?.focus({ preventScroll: true });
  }

  function header(title, help) {
    const frag = document.createDocumentFragment();
    if (index < questionCount) {
      const count = document.createElement('p');
      count.className = 'step-count';
      count.textContent = `Paso ${index + 1} de ${questionCount}`;
      frag.append(count);
    }
    const h = document.createElement('h3');
    h.className = 'step-q';
    h.tabIndex = -1;
    h.textContent = title;
    frag.append(h);
    if (help) {
      const p = document.createElement('p');
      p.className = 'step-help';
      p.textContent = help;
      frag.append(p);
    }
    return frag;
  }

  function navRow(extra = []) {
    const nav = document.createElement('div');
    nav.className = 'step-nav';
    nav.append(...extra);
    if (index > 0) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'link-btn';
      back.textContent = 'Volver';
      back.addEventListener('click', () => go(index - 1));
      nav.append(back);
    }
    return nav;
  }

  function renderSingle({ paso, optional }) {
    const wrap = document.createElement('div');
    wrap.append(header(paso.pregunta, paso.ayuda));
    const list = document.createElement('div');
    list.className = 'options';
    for (const opt of paso.opciones) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'option';
      b.setAttribute('aria-pressed', String(state[paso.id] === opt.id));
      b.innerHTML = `<strong></strong>${opt.detalle ? '<span></span>' : ''}`;
      b.querySelector('strong').textContent = opt.label;
      if (opt.detalle) b.querySelector('span').textContent = opt.detalle;
      b.addEventListener('click', () => {
        state[paso.id] = opt.id;
        list.querySelectorAll('.option').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
        setTimeout(() => go(index + 1), reduceMotion ? 0 : 180);
      });
      list.append(b);
    }
    wrap.append(list);
    const extra = [];
    if (optional) {
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.className = 'btn btn-line';
      skip.textContent = 'Saltear este paso';
      skip.addEventListener('click', () => { delete state[paso.id]; go(index + 1); });
      extra.push(skip);
    }
    wrap.append(navRow(extra));
    return wrap;
  }

  function renderVisual() {
    const wrap = document.createElement('div');
    wrap.append(header(config.visual.pregunta, 'La imagen cambia al instante con cada elección.'));
    for (const grupo of config.visual.grupos) {
      const g = document.createElement('div');
      g.className = 'chip-group';
      const h = document.createElement('h4');
      h.id = `grupo-${grupo.id}`;
      h.textContent = grupo.label;
      const chips = document.createElement('div');
      chips.className = 'chips';
      chips.setAttribute('role', 'group');
      chips.setAttribute('aria-labelledby', h.id);
      const selected = state[grupo.id] ?? { techo: 'dos-aguas', fachada: 'revoque', piso: 'madera' }[grupo.id];
      for (const opt of grupo.opciones) {
        const c = document.createElement('button');
        c.type = 'button';
        c.className = 'chip';
        c.textContent = opt.label;
        c.setAttribute('aria-pressed', String(selected === opt.id));
        c.addEventListener('click', () => {
          state[grupo.id] = opt.id;
          chips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
          setVista(grupo.vista);
        });
        chips.append(c);
      }
      g.append(h, chips);
      wrap.append(g);
    }
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn btn-blue btn-lg';
    next.textContent = 'Seguir';
    next.addEventListener('click', () => {
      for (const grupo of config.visual.grupos) {
        state[grupo.id] ??= { techo: 'dos-aguas', fachada: 'revoque', piso: 'madera' }[grupo.id];
      }
      go(index + 1);
    });
    wrap.append(navRow([next]));
    return wrap;
  }

  function renderFinal() {
    const wrap = document.createElement('div');
    wrap.append(header('Listo. Mandale esto a Oscar.'));

    const dl = document.createElement('dl');
    dl.className = 'summary';
    for (const [k, v] of buildSummary(config, state)) {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      dl.append(dt, dd);
    }
    wrap.append(dl);

    const shareUrl = buildShareUrl(new URL('presupuesto.html', window.location.href).toString(), config, state);
    const message = buildMessage(config, state, shareUrl);
    const contact = resolvePrimaryContact(siteConfig, message);

    const send = document.createElement('a');
    send.className = 'btn btn-blue btn-lg';
    send.href = contact.url;
    send.target = '_blank';
    send.rel = 'noreferrer';
    send.textContent = `Mandar por ${contact.label}`;
    send.addEventListener('click', () => {
      enviarContacto(buildLead(config, state));
      if (contact.channel !== 'whatsapp') copy(message);
    });

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-line btn-lg';
    copyBtn.textContent = 'Copiar resumen';
    copyBtn.addEventListener('click', async () => {
      copyBtn.textContent = (await copy(message)) ? 'Resumen copiado' : 'No se pudo copiar';
    });

    const restart = document.createElement('button');
    restart.type = 'button';
    restart.className = 'link-btn';
    restart.textContent = 'Empezar de nuevo';
    restart.addEventListener('click', () => { state = {}; setVista('exterior'); go(0); });

    const nav = navRow([send, copyBtn]);
    nav.append(restart);
    wrap.append(nav);

    const note = document.createElement('p');
    note.className = 'final-note';
    note.textContent = contact.channel === 'whatsapp'
      ? 'Se abre WhatsApp con todo lo que elegiste y un link a la imagen. No hay precio automático: Oscar te responde con un presupuesto a medida.'
      : 'Copiamos tu resumen: pegalo en el mensaje de Instagram. No hay precio automático: Oscar te responde con un presupuesto a medida.';
    wrap.append(note);
    return wrap;
  }

  function render() {
    const screen = screens[index];
    root.dataset.screen = screen.kind;
    const node = screen.kind === 'single' ? renderSingle(screen) : screen.kind === 'visual' ? renderVisual() : renderFinal();
    node.classList.add('step-enter');
    body.replaceChildren(node);
    updatePips();
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  // Elección previa desde los tres caminos o desde ?tipo= en la URL.
  function preset(values) {
    state = { ...state, ...sanitizeState(config, values) };
    const firstOpen = screens.findIndex((s) => s.kind === 'single' && !state[s.paso.id]);
    go(firstOpen === -1 ? 0 : firstOpen, { focus: false });
  }

  const fromUrl = sanitizeState(config, Object.fromEntries(new URLSearchParams(window.location.search)));
  setVista('exterior');
  if (Object.keys(fromUrl).length) preset(fromUrl);
  else render();

  return { preset };
}
