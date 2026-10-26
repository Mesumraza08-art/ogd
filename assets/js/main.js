/* OGD Electric — interactions & motion (GSAP 3 + ScrollTrigger + Lenis) */
(function () {
  'use strict';
  const d = document, html = d.documentElement, body = d.body, CFG = window.OGD || {};
  const $ = (s, c = d) => c.querySelector(s), $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = window.gsap, ST = window.ScrollTrigger;
  const hasG = !!(G && ST);
  const store = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  if (hasG) { G.registerPlugin(ST); if (!RM) html.classList.add('js-anim'); }
  html.classList.add('js-ready');

  /* ── Smooth scroll ── */
  let lenis = null;
  if (hasG && !RM && window.Lenis && window.matchMedia('(min-width:1024px) and (pointer:fine)').matches) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }
  const scrollToEl = (el) => { if (lenis) lenis.scrollTo(el, { offset: -80 }); else el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const id = a.getAttribute('href'); if (id.length < 2) return; const t = d.querySelector(id); if (t) { e.preventDefault(); scrollToEl(t); } }));

  /* ── Nav state ── */
  const nav = $('#nav'), callbar = $('#callbar');
  const onScroll = () => {
    const y = window.scrollY || 0;
    if (nav && !nav.classList.contains('force-solid')) nav.classList.toggle('is-solid', y > 40);
    if (callbar) callbar.classList.toggle('show', y > window.innerHeight * 0.6);
  };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Services dropdown ── */
  const dd = $('.dd'), ddm = $('#ddSvc');
  if (dd && ddm) {
    const li = dd.parentElement; let t;
    const open = (v) => { dd.setAttribute('aria-expanded', String(v)); ddm.classList.toggle('open', v); };
    dd.addEventListener('click', () => open(dd.getAttribute('aria-expanded') !== 'true'));
    li.addEventListener('mouseenter', () => { clearTimeout(t); open(true); });
    li.addEventListener('mouseleave', () => { t = setTimeout(() => open(false), 160); });
    li.addEventListener('focusout', (e) => { if (!li.contains(e.relatedTarget)) open(false); });
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ddm.classList.contains('open')) { open(false); dd.focus(); } });
  }

  /* ── Mobile menu ── */
  const burger = $('#burger'), mm = $('#mmenu');
  if (burger && mm) {
    const focusables = () => $$('a,button', mm).concat([burger]);
    const setOpen = (v) => {
      body.classList.toggle('menu-open', v); burger.setAttribute('aria-expanded', String(v)); burger.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
      if (lenis) v ? lenis.stop() : lenis.start();
      if (v) {
        if (hasG && !RM) G.fromTo($$('.big li, .subs a, .mmenu-foot > *', mm), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .04, ease: 'power3.out', delay: .2 });
        setTimeout(() => { const f = $('a', mm); f && f.focus(); }, 300);
      } else burger.focus();
    };
    burger.addEventListener('click', () => setOpen(!body.classList.contains('menu-open')));
    mm.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab') { const f = focusables(); const i = f.indexOf(d.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    });
    burger.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* ── Page transitions ── */
  const pt = $('#pt');
  const ptOut = () => { if (!pt || !html.classList.contains('pt-in')) return; if (!hasG || RM) { html.classList.remove('pt-in'); return; } G.set(pt, { yPercent: 0 }); html.classList.remove('pt-in'); G.to(pt, { yPercent: -101, duration: .7, ease: 'power3.inOut', delay: .05 }); };
  ptOut();
  const isInternal = (a) => {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    const h = a.getAttribute('href') || ''; if (!h || h[0] === '#' || /^(mailto|tel|sms|javascript):/i.test(h)) return false;
    try { const u = new URL(a.href, location.href); if (u.origin !== location.origin) return false; if (u.pathname === location.pathname && u.hash) return false; return true; } catch (e) { return false; }
  };
  d.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a'); if (!isInternal(a) || !pt || !hasG || RM) return;
    e.preventDefault(); const href = a.href; store.set('ogd-nav', '1');
    G.set(pt, { yPercent: 101 }); pt.style.transform = '';
    G.to(pt, { yPercent: 0, duration: .5, ease: 'power3.inOut', onComplete: () => { location.href = href; } });
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted && pt && hasG) G.set(pt, { yPercent: -101 }); });

  /* ── Hero intro sequence (home) ── */
  const intro = $('#intro'), isHome = body.dataset.page === 'home';
  function heroIn(delay = 0) {
    if (!isHome) return;
    const heroPh = $('#heroPh'), lineEls = $$('[data-hero-lines] .line > span'), bits = $$('.hero-anim'), bar = $('.hero-sub .bar');
    if (!hasG || RM) { html.classList.remove('hero-pre'); return; }
    const tl = G.timeline({ delay, onComplete: () => html.classList.remove('hero-pre') });
    tl.fromTo(heroPh, { clipPath: 'inset(18% 12% 18% 12%)', scale: 1.12 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.5, ease: 'expo.out' }, 0)
      .fromTo(lineEls, { y: 0, yPercent: 105 }, { y: 0, yPercent: 0, duration: 1.1, stagger: .12, ease: 'expo.out' }, .25)
      .fromTo(bits, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .08, ease: 'power3.out' }, .55)
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'expo.out' }, .7);
  }
  window.__ogdIntro = true;
  if (isHome) {
    html.classList.add('hero-pre');
    const seen = store.get('ogd-intro');
    if (!intro || !hasG || RM || seen) { if (intro) intro.remove(); heroIn(.1); }
    else runIntro();
  } else if (intro) intro.remove();

  function runIntro() {
    store.set('ogd-intro', '1');
    if (lenis) lenis.stop(); body.style.overflow = 'hidden';
    const logo = $('#introLogo'), pulse = $('.intro-pulse', intro), glow = $('.glow', intro);
    const tb = $('.tr-bolt', intro), ts = $('.tr-shield', intro);
    const L = (k) => $('.lyr-' + k, intro);
    const chars = $$('.intro-word .ch', intro), tag = $('.intro-tag', intro);
    [tb, ts].forEach(p => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
    G.set(chars, { yPercent: 110, opacity: 0 });
    G.set([L('left'), L('right'), L('bottom')], { opacity: 0 });
    G.set(L('left'), { x: -10 }); G.set(L('right'), { x: 10 }); G.set(L('bottom'), { y: 10 });
    let done = false;
    const tl = G.timeline({ onComplete: finish });
    tl.to(pulse, { xPercent: 200, duration: .8, ease: 'power2.inOut' }, 0)
      // Stage 2: trace the bolt
      .to(tb, { strokeDashoffset: 0, duration: .75, ease: 'power2.inOut' }, .35)
      .to(glow, { opacity: 1, scale: 1, duration: .5, ease: 'power2.out' }, .85)
      .fromTo(L('bolt'), { opacity: 0 }, { opacity: 1, duration: .3 }, 1.0)
      // Stage 3: shield assembly
      .to(ts, { strokeDashoffset: 0, duration: .7, ease: 'power2.inOut' }, .95)
      .fromTo(L('base'), { opacity: 0, clipPath: 'circle(0% at 50% 50%)' }, { opacity: 1, clipPath: 'circle(75% at 50% 50%)', duration: .6, ease: 'power2.out' }, 1.35)
      .to([L('left'), L('right'), L('bottom')], { opacity: 1, x: 0, y: 0, duration: .55, stagger: .07, ease: 'power3.out' }, 1.55)
      .to([tb, ts], { opacity: 0, duration: .4 }, 1.75)
      .to(glow, { opacity: .45, duration: .4 }, 1.8)
      // Stage 4: brand reveal
      .to(chars, { yPercent: 0, opacity: 1, duration: .6, stagger: .03, ease: 'expo.out' }, 1.85)
      .fromTo(tag, { opacity: 0, letterSpacing: '.7em' }, { opacity: 1, letterSpacing: '.42em', duration: .8, ease: 'power3.out' }, 2.2)
      // Stage 5: contract & hand off to nav
      .to(glow, { scale: .2, opacity: 0, duration: .45, ease: 'power3.in' }, 2.9)
      .add(toNav, 2.95);
    function toNav() {
      const brandImg = $('#navBrand img');
      const tl2 = G.timeline({ onComplete: () => { done = true; cleanup(); } });
      tl2.to([chars, tag], { opacity: 0, y: -8, duration: .3, stagger: .005, ease: 'power2.in' }, 0);
      if (brandImg) {
        const a = logo.getBoundingClientRect(), b = brandImg.getBoundingClientRect();
        G.set(brandImg, { opacity: 0 });
        tl2.to(logo, { x: (b.left + b.width / 2) - (a.left + a.width / 2), y: (b.top + b.height / 2) - (a.top + a.height / 2), scale: b.width / a.width, duration: .8, ease: 'power3.inOut' }, .1);
      }
      tl2.to(intro, { clipPath: 'inset(0% 0% 100% 0%)', duration: .9, ease: 'power3.inOut' }, .25)
        .add(() => heroIn(0), .35)
        .add(() => { if (brandImg) G.set(brandImg, { opacity: 1 }); }, .9);
    }
    function cleanup() { body.style.overflow = ''; if (lenis) lenis.start(); intro.remove(); ST.refresh(); }
    function finish() {}
    const skip = () => { if (done) return; tl.progress(1); };
    $('#introSkip').addEventListener('click', skip);
    d.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { skip(); d.removeEventListener('keydown', k); } });
  }

  /* ── Scroll animations ── */
  if (hasG && !RM) {
    $$('[data-lines]').forEach(h => {
      G.to($$('.line > span', h), { yPercent: 0, y: 0, duration: 1.1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
      G.set($$('.line > span', h), { yPercent: 105 });
    });
    ST.batch('[data-reveal]', { start: 'top 90%', once: true, onEnter: (els) => G.to(els, { opacity: 1, y: 0, duration: .9, stagger: .08, ease: 'power3.out', overwrite: true }) });
    $$('[data-mask]').forEach(m => {
      const im = $('img', m);
      G.to(m, { clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: m, start: 'top 88%', once: true } });
      if (im) G.fromTo(im, { scale: 1.18 }, { scale: 1, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: m, start: 'top 88%', once: true } });
    });
    $$('[data-vbar]').forEach(v => G.fromTo(v, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: v.parentElement, start: 'top 80%', end: 'bottom 50%', scrub: true } }));
    const mmq = G.matchMedia();
    mmq.add('(min-width:1024px)', () => {
      $$('[data-parallax]').forEach(p => G.fromTo(p, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: p.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
      const hp = $('[data-parallax-hero]'); if (hp) G.to(hp, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      storyPin();
    });
    // process line
    const proc = $('#proc');
    if (proc) {
      const line = $('.proc-line i', proc), items = $$('li', proc);
      if (line) G.to(line, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: proc, start: 'top 75%', end: 'bottom 60%', scrub: true } });
      items.forEach(li => ST.create({ trigger: li, start: 'top 72%', onEnter: () => li.classList.add('on'), onLeaveBack: () => li.classList.remove('on') }));
    }
  } else {
    $$('#proc li').forEach(li => li.classList.add('on'));
  }

  /* ── Industrial storytelling (pinned on desktop) ── */
  function storyPin() {
    const story = $('#story'); if (!story) return;
    story.classList.add('pinned');
    const imgs = $$('[data-story-img]', story), steps = $$('[data-story-step]', story), bar = $('.story-progress i', story);
    let cur = 0;
    const set = (i) => {
      if (i === cur) return;
      const dir = i > cur ? 1 : -1, inEl = imgs[i], outEl = imgs[cur];
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      G.killTweensOf([inEl, outEl]);
      if (dir > 0) { G.set(inEl, { zIndex: 2 }); G.set(outEl, { zIndex: 1 }); G.fromTo(inEl, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: .9, ease: 'expo.inOut' }); G.fromTo($('img', inEl), { scale: 1.15 }, { scale: 1, duration: 1.2, ease: 'expo.out' }); }
      else { G.set(outEl, { zIndex: 2 }); G.set(inEl, { zIndex: 1, clipPath: 'inset(0% 0 0 0)' }); G.to(outEl, { clipPath: 'inset(100% 0 0 0)', duration: .8, ease: 'expo.inOut' }); }
      cur = i;
    };
    const stTrig = ST.create({ trigger: story.closest('section'), start: 'top top', end: () => '+=' + (window.innerHeight * (steps.length - 0.4)), pin: true, scrub: true, anticipatePin: 1,
      onUpdate: (self) => { const i = Math.min(steps.length - 1, Math.floor(self.progress * steps.length)); set(i); if (bar) bar.style.transform = `scaleY(${self.progress})`; } });
    return () => { stTrig.kill(); story.classList.remove('pinned'); imgs.forEach(im => im.removeAttribute('style')); };
  }

  /* ── Industries: keyboard/hover state ── */
  const inds = $('[data-inds]');
  if (inds) {
    const cards = $$('.ind', inds);
    cards.forEach(c => { c.addEventListener('mouseenter', () => cards.forEach(x => x.classList.toggle('is-on', x === c))); c.addEventListener('focus', () => cards.forEach(x => x.classList.toggle('is-on', x === c))); });
    inds.addEventListener('mouseleave', () => cards.forEach((x, i) => x.classList.toggle('is-on', i === 0)));
  }

  /* ── Expertise rows swap the sticky image ── */
  const rows = $$('[data-exp]'), eImgs = $$('[data-exp-img]');
  if (rows.length) {
    const on = (i) => { rows.forEach((r, k) => r.classList.toggle('on', k === i)); eImgs.forEach((m, k) => m.classList.toggle('on', k === i)); };
    rows.forEach((r, i) => { r.addEventListener('mouseenter', () => on(i)); r.addEventListener('focusin', () => on(i)); if (hasG) ST.create({ trigger: r, start: 'top 55%', end: 'bottom 55%', onToggle: (s) => s.isActive && on(i) }); });
  }

  /* ── Filters ── */
  $$('[data-filter-for]').forEach(bar => {
    const grid = d.getElementById(bar.dataset.filterFor), empty = $(`[data-empty-for="${bar.dataset.filterFor}"]`); if (!grid) return;
    const tiles = $$('.tile', grid), btns = $$('button', bar);
    const apply = (f) => {
      btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === f)));
      let shown = 0;
      tiles.forEach(t => { const ok = f === 'all' || t.dataset.cats.split(' ').includes(f); t.classList.toggle('is-hidden', !ok); if (ok) shown++; });
      if (empty) empty.classList.toggle('show', shown === 0);
      if (hasG && !RM) G.fromTo(tiles.filter(t => !t.classList.contains('is-hidden')), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .6, stagger: .04, ease: 'power3.out', overwrite: true });
      if (hasG) ST.refresh();
    };
    btns.forEach(b => b.addEventListener('click', () => apply(b.dataset.filter)));
    const q = new URLSearchParams(location.search).get('category'); if (q && btns.some(b => b.dataset.filter === q)) apply(q);
  });

  /* ── Modal: video + lightbox ── */
  const modal = $('#modal'), mBody = $('#modalBody'), mCap = $('#modalCap'), mClose = $('#modalClose');
  let lastFocus = null, lb = null;
  const openModal = (html_, cap) => { lastFocus = d.activeElement; mBody.innerHTML = html_; mCap.textContent = cap || ''; modal.classList.add('open'); body.style.overflow = 'hidden'; if (lenis) lenis.stop(); mClose.focus(); };
  const closeModal = () => { modal.classList.remove('open'); mBody.innerHTML = ''; body.style.overflow = ''; if (lenis) lenis.start(); lb = null; if (lastFocus) lastFocus.focus(); };
  if (modal) {
    mClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    d.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') closeModal();
      if (lb && e.key === 'ArrowRight') lb.go(1);
      if (lb && e.key === 'ArrowLeft') lb.go(-1);
      if (e.key === 'Tab') { const f = $$('button,video', modal); const i = f.indexOf(d.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    });
    d.addEventListener('click', (e) => {
      const v = e.target.closest('[data-video]'); if (!v) return;
      e.preventDefault();
      openModal(`<video src="${v.dataset.video}" controls autoplay playsinline preload="metadata"></video>`, v.dataset.title);
      const vid = $('video', mBody); vid.addEventListener('error', () => { mBody.innerHTML = '<p style="color:#fff">This video could not be loaded.</p>'; });
    });
    $$('[data-gallery]').forEach(g => {
      const items = JSON.parse(g.dataset.gallery);
      $$('[data-lb]', g).forEach(btn => btn.addEventListener('click', () => {
        let i = +btn.dataset.lb;
        const render = () => { mBody.innerHTML = `<button class="lb-prev" type="button" aria-label="Previous photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button><img class="lb-img" src="${items[i].s}" alt="${items[i].a.replace(/"/g, '&quot;')}"><button class="lb-next" type="button" aria-label="Next photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>`; mCap.textContent = `${i + 1} / ${items.length}`; $('.lb-prev', mBody).onclick = () => lb.go(-1); $('.lb-next', mBody).onclick = () => lb.go(1); };
        openModal('', '');
        lb = { go: (s) => { i = (i + s + items.length) % items.length; render(); } };
        render();
        let x0 = null; mBody.ontouchstart = (e) => { x0 = e.touches[0].clientX; }; mBody.ontouchend = (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) lb.go(dx < 0 ? 1 : -1); x0 = null; };
      }));
    });
  }

  /* ── Reel carousel buttons ── */
  const reelsEl = $('#reels');
  if (reelsEl) {
    const prev = $('[data-reel-prev]'), next = $('[data-reel-next]');
    const step = () => { const c = $('.reel', reelsEl); return c ? c.getBoundingClientRect().width + 20 : 300; };
    const upd = () => { prev.disabled = reelsEl.scrollLeft < 8; next.disabled = reelsEl.scrollLeft + reelsEl.clientWidth >= reelsEl.scrollWidth - 8; };
    prev.addEventListener('click', () => reelsEl.scrollBy({ left: -step(), behavior: RM ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => reelsEl.scrollBy({ left: step(), behavior: RM ? 'auto' : 'smooth' }));
    reelsEl.addEventListener('scroll', upd, { passive: true }); upd(); window.addEventListener('resize', upd);
    reelsEl.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); } if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); } });
    // stop vertical smooth-scroll from swallowing horizontal trackpad gestures
    reelsEl.setAttribute('data-lenis-prevent-wheel', '');
  }

  /* ── Quote form ── */
  const form = $('#quoteForm');
  if (form) {
    const status = $('#fStatus'), submit = $('#fSubmit'), files = $('#f-photos'), fileList = $('#f-files');
    const MAX_FILES = 5, MAX_SIZE = 8 * 1024 * 1024;
    const show = (cls, msg) => { status.className = 'f-status show ' + cls; status.innerHTML = msg; };
    const setErr = (el, msg) => { const f = el.closest('.field') || el.closest('.consent'); const m = f && (f.classList.contains('consent') ? $('#consentMsg') : $('.msg', f)); if (f && f.classList.contains('field')) f.classList.toggle('err', !!msg); if (m) m.textContent = msg || ''; if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); };
    const checkFiles = () => { const fl = Array.from(files.files || []); let msg = ''; if (fl.length > MAX_FILES) msg = `Please choose up to ${MAX_FILES} photos.`; else if (fl.some(f => f.size > MAX_SIZE)) msg = 'Each photo must be 8 MB or smaller.'; else if (fl.some(f => !/^image\//.test(f.type) && !/\.(heic|heif)$/i.test(f.name))) msg = 'Photos must be image files.'; fileList.textContent = fl.length ? fl.map(f => f.name).join(', ') : ''; setErr(files, msg); return !msg; };
    files.addEventListener('change', checkFiles);
    const validate = () => {
      let ok = true, first = null;
      const need = (el, cond, msg) => { if (!cond) { setErr(el, msg); ok = false; first = first || el; } else setErr(el, ''); };
      const v = (n) => (form.elements[n].value || '').trim();
      need(form.elements.name, v('name').length >= 2, 'Please enter your full name.');
      need(form.elements.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email')), 'Please enter a valid email address.');
      need(form.elements.phone, v('phone').replace(/\D/g, '').length >= 10, 'Please enter a phone number with area code.');
      const svc = form.querySelector('input[name=service]:checked'); const svcEl = form.querySelector('input[name=service]'); need(svcEl, !!svc, 'Please choose a type of service.');
      need(form.elements.description, v('description').length >= 10, 'Please describe the project (at least 10 characters).');
      need(form.elements.consent, form.elements.consent.checked, 'Please confirm we may use your details to reply.');
      if (!checkFiles()) { ok = false; first = first || files; }
      if (first) first.focus();
      return ok;
    };
    $$('input,textarea,select', form).forEach(el => el.addEventListener('blur', () => { if (el.getAttribute('aria-invalid')) validate(); }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); status.className = 'f-status';
      if (form.elements.website.value) return; // honeypot
      if (!validate()) { show('bad', 'Please fix the highlighted fields.'); return; }
      const fd = new FormData(form); fd.delete('website');
      const endpoint = CFG.endpoint ? form.getAttribute('action') : '';
      if (endpoint) {
        submit.disabled = true; submit.firstChild.textContent = 'Sending… ';
        try {
          const res = await fetch(endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          show('ok', `<b>Thank you.</b> Your request has been sent to OGD Electric. We will be in touch by your preferred contact method. For anything urgent call <a href="tel:+16473815984">${CFG.phone}</a>.`);
          form.reset(); fileList.textContent = '';
        } catch (err) {
          show('bad', `Sorry, your request could not be sent. Please call <a href="tel:+16473815984">${CFG.phone}</a> or email <a href="mailto:${CFG.email}">${CFG.email}</a>.`);
        } finally { submit.disabled = false; submit.firstChild.textContent = 'Send Request '; }
      } else {
        // No backend configured: hand the request to the visitor's own email app. Nothing is sent by the site itself.
        const lines_ = [`Name: ${fd.get('name')}`, `Email: ${fd.get('email')}`, `Phone: ${fd.get('phone')}`, `Service: ${fd.get('service')}`, `Location: ${fd.get('location') || '-'}`, `Preferred contact: ${fd.get('contact_method')}`, '', 'Project description:', fd.get('description')];
        const hasPhotos = (files.files || []).length > 0;
        const href = `mailto:${CFG.email}?subject=${encodeURIComponent('Quote request: ' + fd.get('service') + ' - ' + fd.get('name'))}&body=${encodeURIComponent(lines_.join('\n'))}`;
        window.location.href = href;
        show('warn', `<b>Your email app should now open</b> with your request filled in. Press send to deliver it to ${CFG.email}.${hasPhotos ? ' Please attach your photos to that email.' : ''} If nothing opened, email <a href="mailto:${CFG.email}">${CFG.email}</a> or call <a href="tel:+16473815984">${CFG.phone}</a>.`);
      }
    });
  }

  window.addEventListener('load', () => { if (hasG) ST.refresh(); });
})();
