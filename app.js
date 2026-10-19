/* Move & Help Kids (demo). Static, offline, no backend, no analytics.
   All data lives in this browser's localStorage under one key. */
(function () {
  'use strict';
  const D = window.MHK_DATA;
  const I = window.MHK_I18N;
  const KEY = 'mhk-demo-v1';
  const AGES = D.ages;
  const params = new URLSearchParams(location.search);
  // ?speed=10 makes the timer run faster (used by the automated test only).
  const SPEED = Math.min(60, Math.max(1, parseInt(params.get('speed'), 10) || 1));
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const modalRoot = document.getElementById('modal-root');

  let S = load();
  const ui = {
    setupStep: 1, setupPin: null, draftKids: [], draftAvatar: 'fox', draftAge: '5-7',
    pinBuf: '', pinTries: 0, lockUntil: 0, pinErr: '', parentOk: false,
    dashTab: 'approve', editing: null, timer: null, celebrate: null, lastRoute: null, toastT: null
  };

  /* ---------- helpers ---------- */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const dkey = (d) => { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const daysAgo = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function t(k, v) {
    let s = I[S.lang] && I[S.lang][k];
    if (s == null) s = I.en[k];
    if (s == null) s = k;
    if (v) Object.keys(v).forEach((x) => { s = s.split('{' + x + '}').join(v[x]); });
    return s;
  }
  const L = (o) => (o ? (o[S.lang] || o.en || '') : '');
  function hashPin(p) { // Demo only. A real app would never keep a PIN like this.
    let h = 2166136261; const s = 'mhk-demo:' + p;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16);
  }
  const starTxt = (n) => n + ' ' + (n === 1 ? t('star') : t('starsWord'));

  /* ---------- storage ---------- */
  function blank(lang) { return { v: 1, lang: lang || 'en', family: null, kids: [], moves: [], chores: [], rewards: [], log: [], redemptions: [] }; }
  function load() {
    try {
      const r = localStorage.getItem(KEY);
      if (r) { const s = JSON.parse(r); if (s && s.v === 1) return s; }
    } catch (e) { /* ignore */ }
    const nl = (navigator.language || 'en').slice(0, 2).toLowerCase() === 'es' ? 'es' : 'en';
    return blank(nl);
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage full or blocked */ } }
  function initContent(pin) {
    S.family = { pin: hashPin(pin), created: dkey(), demo: false };
    S.moves = clone(D.moves).map((m) => Object.assign(m, { on: true }));
    S.chores = clone(D.chores).map((c) => Object.assign(c, { on: true }));
    S.rewards = clone(D.rewards);
    S.log = []; S.redemptions = [];
  }
  function addLog(kid, type, item, date, status, stars, secs) {
    S.log.push({ id: uid(), kid, type, item, date, status, stars, secs: secs || 0, ts: Date.now() });
  }
  function seedDemo() {
    const lang = S.lang;
    S = blank(lang);
    initContent('1234');
    S.family.demo = true;
    S.kids = [
      { id: 'k1', nick: 'Kid 1', avatar: 'fox', age: '5-7' },
      { id: 'k2', nick: 'Kid 2', avatar: 'panda', age: '8-10' }
    ];
    const plan = {
      k1: [[1, ['jacks', 'frog'], ['bed', 'toys']], [2, ['bear', 'march'], ['toys', 'pet']], [3, ['star'], ['bed', 'table']], [4, ['crab', 'reach'], ['plants']]],
      k2: [[1, ['arms', 'jacks', 'freeze'], ['laundry', 'bed', 'recycle']], [2, ['flamingo'], ['table']], [5, ['march', 'crab'], ['clothes', 'pet']], [6, ['star'], ['bed']]]
    };
    Object.keys(plan).forEach((kid) => plan[kid].forEach(([n, ms, cs]) => {
      const date = dkey(daysAgo(n));
      ms.forEach((m) => { const mv = moveById(m); addLog(kid, 'move', m, date, 'approved', mv.stars, mv.secs); });
      cs.forEach((c) => addLog(kid, 'chore', c, date, 'approved', choreById(c).stars));
    }));
    const today = dkey();
    addLog('k1', 'move', 'jacks', today, 'approved', 1, 30);
    addLog('k2', 'move', 'march', today, 'approved', 1, 45);
    addLog('k2', 'chore', 'bed', today, 'pending', 2);
    S.redemptions.push({ id: uid(), kid: 'k2', reward: 'game', cost: 8, status: 'approved', ts: daysAgo(3).getTime() });
    save();
  }

  /* ---------- queries ---------- */
  const kidById = (id) => S.kids.find((k) => k.id === id);
  const moveById = (id) => S.moves.find((m) => m.id === id);
  const choreById = (id) => S.chores.find((c) => c.id === id);
  const rewardById = (id) => S.rewards.find((r) => r.id === id);
  const todayLog = (kid, type, item) => S.log.find((e) => e.kid === kid && e.type === type && e.item === item && e.date === dkey());
  const choreStatus = (kid, cid) => { const e = todayLog(kid, 'chore', cid); return e ? e.status : null; };
  const moveDoneToday = (kid, mid) => !!todayLog(kid, 'move', mid);
  const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
  const earned = (kid) => sum(S.log.filter((e) => e.kid === kid && e.status === 'approved'), (e) => e.stars);
  const spent = (kid) => sum(S.redemptions.filter((r) => r.kid === kid && r.status === 'approved'), (r) => r.cost);
  const reserved = (kid) => sum(S.redemptions.filter((r) => r.kid === kid && r.status === 'pending'), (r) => r.cost);
  const balance = (kid) => earned(kid) - spent(kid);
  const available = (kid) => balance(kid) - reserved(kid);
  const starsToday = (kid) => sum(S.log.filter((e) => e.kid === kid && e.date === dkey() && e.status === 'approved'), (e) => e.stars);
  const pendingToday = (kid) => sum(S.log.filter((e) => e.kid === kid && e.status === 'pending'), (e) => e.stars);
  function streak(kid) {
    const days = new Set(S.log.filter((e) => e.kid === kid).map((e) => e.date));
    let n = 0; let i = days.has(dkey()) ? 0 : 1;
    while (days.has(dkey(daysAgo(i)))) { n++; i++; }
    return n;
  }
  const choresFor = (kid) => { const k = kidById(kid); return S.chores.filter((c) => c.on && c.ages.indexOf(k.age) >= 0); };
  const movesOn = () => S.moves.filter((m) => m.on);
  function todaysMoves(kid) {
    const ms = movesOn(); if (!ms.length) return [];
    const off = (new Date().getDate() * 3 + kid.charCodeAt(kid.length - 1)) % ms.length;
    const out = [];
    for (let i = 0; i < Math.min(3, ms.length); i++) out.push(ms[(off + i) % ms.length]);
    return out;
  }
  const pendingCount = () => S.log.filter((e) => e.status === 'pending').length + S.redemptions.filter((r) => r.status === 'pending').length;

  /* ---------- small view parts ---------- */
  const LOGO = '<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true" focusable="false"><rect width="48" height="48" rx="14" fill="#5B3DF5"/><path d="M24 8.5l4.6 9.4 10.3 1.5-7.5 7.3 1.8 10.3L24 32.1l-9.2 4.9 1.8-10.3-7.5-7.3 10.3-1.5z" fill="#FFD23F" stroke="#1E1B3A" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  function avatarSvg(key, size, labelled) {
    const a = D.avatars[key] || D.avatars.fox;
    const lab = labelled ? 'role="img" aria-label="' + esc(L(a.name)) + '"' : 'aria-hidden="true" focusable="false"';
    return '<svg class="av" viewBox="0 0 100 100" width="' + size + '" height="' + size + '" ' + lab + '><circle cx="50" cy="50" r="50" fill="' + a.bg + '"/>' + a.svg + '</svg>';
  }
  function langToggle() {
    return '<div class="lang" role="group" aria-label="Language / Idioma">' +
      ['en', 'es'].map((l) => '<button type="button" class="lang-btn" data-act="lang" data-v="' + l + '" aria-pressed="' + (S.lang === l) + '" lang="' + l + '" title="' + (l === 'en' ? 'English' : 'Español') + '">' + l.toUpperCase() + '</button>').join('') + '</div>';
  }
  function header(kidId) {
    const kid = kidId ? kidById(kidId) : null;
    return '<header class="top"><div class="brand">' + LOGO + '<span class="brand-txt"><span class="brand-name">' + t('appName') + '</span><span class="badge">' + t('demo') + '</span></span></div>' +
      '<div class="top-actions">' + langToggle() +
      (kid ? '<a class="avatar-btn" href="#/who" aria-label="' + esc(t('switchKid')) + '">' + avatarSvg(kid.avatar, 40) + '</a>' : '') + '</div></header>';
  }
  function kidNav(kid, active) {
    const items = [['today', '🏠', '#/kid/' + kid], ['move', '🏃', '#/kid/' + kid + '/move'], ['chores', '🧹', '#/kid/' + kid + '/chores'], ['rewards', '🎁', '#/kid/' + kid + '/rewards']];
    return '<nav class="tabbar" aria-label="' + esc(t('appName')) + '">' + items.map(([k, ic, h]) =>
      '<a href="' + h + '" class="tab' + (active === k ? ' on' : '') + '"' + (active === k ? ' aria-current="page"' : '') + '><span class="tab-ic" aria-hidden="true">' + ic + '</span><span class="tab-lbl">' + t(k) + '</span></a>').join('') + '</nav>';
  }
  function moveCard(kid, m) {
    const done = moveDoneToday(kid, m.id);
    return '<a class="item move-card' + (done ? ' is-done' : '') + '" href="#/kid/' + kid + '/move/' + m.id + '">' +
      '<span class="item-ic ic-move" aria-hidden="true">' + m.icon + '</span>' +
      '<span class="item-body"><span class="tag tag-move">🏃 ' + t('move') + '</span><span class="item-title">' + esc(L(m.name)) + '</span>' +
      '<span class="item-meta"><span>⏱️ ' + t('secs', { n: m.secs }) + '</span><span>⭐ ' + m.stars + '</span></span></span>' +
      '<span class="item-cta" aria-hidden="true">' + (done ? '✅' : '▶') + '</span>' +
      (done ? '<span class="sr-only">' + t('doneToday') + '</span>' : '') + '</a>';
  }
  function choreCard(kid, c) {
    const st = choreStatus(kid, c.id);
    let action;
    if (st === 'pending') action = '<span class="status status-wait">⏳ ' + t('waiting') + '</span>';
    else if (st === 'approved') action = '<span class="status status-ok">✅ ' + t('approvedTag') + '</span>';
    else action = '<button type="button" class="btn done-btn" data-act="chore-done" data-id="' + c.id + '">👍 ' + t('tapDone') + '</button>';
    return '<div class="item chore-card' + (st ? ' is-' + st : '') + '" data-chore="' + c.id + '">' +
      '<span class="item-ic ic-chore" aria-hidden="true">' + esc(c.icon) + '</span>' +
      '<span class="item-body"><span class="tag tag-chore">🧹 ' + t('chores') + '</span><span class="item-title">' + esc(L(c.name)) + '</span>' +
      '<span class="item-meta"><span>⭐ ' + c.stars + '</span></span>' + action + '</span></div>';
  }
  function safetyNote(open) {
    return '<details class="safety"' + (open ? ' open' : '') + '><summary>🛡️ ' + t('safetyTitle') + '</summary><p>' + t('safetyText') + '</p></details>';
  }
  function err(id) { return '<p class="err" id="' + id + '" role="alert" aria-live="assertive"></p>'; }

  /* ---------- screens ---------- */
  function vWelcome() {
    return header() + '<main class="screen welcome" id="main">' +
      '<div class="hero" aria-hidden="true"><span class="hero-av b1">' + avatarSvg('fox', 84) + '</span><span class="hero-av b2">' + avatarSvg('frog', 104) + '</span><span class="hero-av b3">' + avatarSvg('panda', 84) + '</span>' +
      '<span class="spark s1">⭐</span><span class="spark s2">⭐</span><span class="spark s3">✨</span></div>' +
      '<h1 tabindex="-1">' + t('welcomeTitle') + '</h1><p class="lead">' + t('welcomeText') + '</p>' +
      '<p class="note note-privacy"><span aria-hidden="true">🔒</span> ' + t('privacyShort') + '</p>' +
      '<div class="stack"><button type="button" class="btn primary big" data-act="go-setup"><span aria-hidden="true">👪</span> ' + t('startSetup') + '</button>' +
      '<button type="button" class="btn secondary big" data-act="demo"><span aria-hidden="true">✨</span> ' + t('tryDemo') + '</button></div>' +
      '<p class="hint center">' + t('demoPinHint') + '</p></main><footer class="foot">' + t('footerDemo') + '</footer>';
  }

  function vSetup() {
    if (ui.setupStep === 1) {
      return header() + '<main class="screen" id="main"><h1 tabindex="-1">' + t('setupTitle') + '</h1><p class="step"><span class="step-dot on"></span><span class="step-dot"></span> ' + t('step1') + '</p>' +
        '<form class="card form" data-form="pin" novalidate><p>' + t('pinExplain') + '</p>' +
        '<label for="pin1">' + t('pin') + '</label><input id="pin1" class="pin-input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" required>' +
        '<label for="pin2">' + t('pinConfirm') + '</label><input id="pin2" class="pin-input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" required>' +
        err('pinErr') +
        '<div class="row"><button type="button" class="btn ghost" data-act="nav" data-to="#/welcome">← ' + t('back') + '</button><button type="submit" class="btn primary grow">' + t('next') + ' →</button></div></form></main>';
    }
    const list = ui.draftKids.length ? '<ul class="kid-list">' + ui.draftKids.map((k, i) =>
      '<li>' + avatarSvg(k.avatar, 48) + '<span class="kl-name">' + esc(k.nick) + '</span><span class="kl-age">' + t('ageLabel', { a: k.age }) + '</span>' +
      '<button type="button" class="btn small ghost" data-act="draft-remove" data-i="' + i + '" aria-label="' + esc(t('remove') + ' ' + k.nick) + '">' + t('remove') + '</button></li>').join('') + '</ul>'
      : '<p class="muted">' + t('noKidsYet') + '</p>';
    return header() + '<main class="screen" id="main"><h1 tabindex="-1">' + t('setupTitle') + '</h1><p class="step"><span class="step-dot on"></span><span class="step-dot on"></span> ' + t('step2') + '</p>' +
      '<p class="note note-privacy"><span aria-hidden="true">🔒</span> ' + t('kidsExplain') + '</p>' +
      kidForm('kid-add', { nick: '', avatar: ui.draftAvatar, age: ui.draftAge }, '＋ ' + t('addKid')) +
      '<section class="card"><h2>' + t('kidsAdded') + ' (' + ui.draftKids.length + ')</h2>' + list + '</section>' + err('finishErr') +
      '<div class="row"><button type="button" class="btn ghost" data-act="setup-back">← ' + t('back') + '</button><button type="button" class="btn primary grow" data-act="setup-finish">✅ ' + t('finish') + '</button></div></main>';
  }
  function kidForm(formName, k, submitLabel, extra) {
    return '<form class="card form" data-form="' + formName + '" novalidate>' +
      '<label for="nick-' + formName + '">' + t('nickname') + '</label><input id="nick-' + formName + '" name="nick" maxlength="12" autocomplete="off" autocapitalize="words" spellcheck="false" value="' + esc(k.nick) + '" aria-describedby="nh-' + formName + '">' +
      '<p class="hint" id="nh-' + formName + '">' + t('nicknameHint') + '</p>' +
      '<fieldset><legend>' + t('avatar') + '</legend><div class="avatar-grid">' + Object.keys(D.avatars).map((a) =>
        '<label class="av-opt"><input type="radio" name="avatar" value="' + a + '"' + (k.avatar === a ? ' checked' : '') + '><span class="av-tile">' + avatarSvg(a, 60) + '<span class="av-name">' + L(D.avatars[a].name) + '</span></span></label>').join('') + '</div></fieldset>' +
      '<fieldset><legend>' + t('ageRange') + '</legend><div class="seg">' + AGES.map((a) =>
        '<label class="seg-opt"><input type="radio" name="age" value="' + a + '"' + (k.age === a ? ' checked' : '') + '><span>' + t('ageLabel', { a }) + '</span></label>').join('') + '</div></fieldset>' +
      err('err-' + formName) + '<div class="row">' + (extra || '') + '<button type="submit" class="btn secondary grow">' + submitLabel + '</button></div></form>';
  }

  function vWho() {
    return header() + '<main class="screen" id="main"><h1 tabindex="-1" class="center">' + t('whoTitle') + '</h1><div class="kid-grid">' +
      S.kids.map((k) => '<a class="kid-tile" href="#/kid/' + k.id + '" style="--tile:' + D.avatars[k.avatar].bg + '">' + avatarSvg(k.avatar, 104) +
        '<span class="kid-name">' + esc(k.nick) + '</span><span class="kid-stars"><span aria-hidden="true">⭐</span> ' + starTxt(balance(k.id)) + '</span></a>').join('') +
      '</div><div class="center"><a class="btn ghost parent-link" href="#/parent"><span aria-hidden="true">🔒</span> ' + t('grownUps') +
      (pendingCount() ? ' <span class="count" aria-label="' + pendingCount() + '">' + pendingCount() + '</span>' : '') + '</a></div></main>' +
      '<footer class="foot">' + t('footerDemo') + '</footer>';
  }

  function vKidHome(kid) {
    const k = kidById(kid);
    const ms = todaysMoves(kid); const cs = choresFor(kid).slice(0, 4);
    const mix = [];
    for (let i = 0; i < Math.max(ms.length, cs.length); i++) {
      if (ms[i]) mix.push(moveCard(kid, ms[i]));
      if (cs[i]) mix.push(choreCard(kid, cs[i]));
    }
    const st = streak(kid); const pend = pendingToday(kid);
    return header(kid) + '<main class="screen kid" id="main">' +
      '<section class="hello">' + avatarSvg(k.avatar, 64) + '<div><p class="hello-day">📅 ' + t('today') + '</p><h1 tabindex="-1">' + t('hi', { name: esc(k.nick) }) + '</h1></div></section>' +
      '<div class="stats">' +
      '<div class="stat st-star"><span class="stat-ic" aria-hidden="true">⭐</span><span class="stat-num" data-testid="stars-today">' + starsToday(kid) + '</span><span class="stat-lbl">' + t('starsToday') + '</span>' + (pend ? '<span class="stat-sub">' + t('pendingStars', { n: pend }) + '</span>' : '') + '</div>' +
      '<div class="stat st-fire"><span class="stat-ic" aria-hidden="true">🔥</span><span class="stat-num">' + st + '</span><span class="stat-lbl">' + t('streak') + ': ' + (st === 1 ? t('day1') : t('days', { n: st })) + '</span></div>' +
      '<a class="stat st-bank" href="#/kid/' + kid + '/rewards"><span class="stat-ic" aria-hidden="true">🌟</span><span class="stat-num" data-testid="balance">' + balance(kid) + '</span><span class="stat-lbl">' + t('myStars') + '</span></a>' +
      '</div><div class="cards">' + mix.join('') + '</div>' +
      '<div class="row two"><a class="btn soft-blue" href="#/kid/' + kid + '/move">🏃 ' + t('moreMoves') + '</a><a class="btn soft-green" href="#/kid/' + kid + '/chores">🧹 ' + t('seeAll') + '</a></div>' +
      '</main>' + kidNav(kid, 'today');
  }

  function vMoves(kid) {
    return header(kid) + '<main class="screen kid" id="main"><h1 tabindex="-1">🏃 ' + t('move') + '</h1>' + safetyNote(false) +
      '<div class="cards">' + movesOn().map((m) => moveCard(kid, m)).join('') + '</div></main>' + kidNav(kid, 'move');
  }

  const RING_R = 88; const RING_C = 2 * Math.PI * RING_R;
  function vMoveTimer(kid, mid) {
    const m = moveById(mid);
    if (!m) { return vMoves(kid); }
    const tm = ui.timer && ui.timer.mid === mid && ui.timer.kid === kid ? ui.timer : null;
    const left = tm ? Math.ceil(tm.left) : m.secs;
    const frac = tm ? tm.left / tm.total : 1;
    let ctl;
    if (!tm) ctl = '<button type="button" class="btn start-btn" data-act="timer-start" data-id="' + m.id + '"><span aria-hidden="true">▶</span> ' + t('start') + '</button>';
    else ctl = '<button type="button" class="btn secondary big" data-act="timer-toggle">' + (tm.running ? '⏸ ' + t('pause') : '▶ ' + t('resume')) + '</button>' +
      '<button type="button" class="btn ghost big" data-act="timer-stop">⏹ ' + t('stop') + '</button>';
    return header(kid) + '<main class="screen kid timer-screen" id="main">' +
      '<a class="back-link" href="#/kid/' + kid + '/move">← ' + t('moreMoves') + '</a>' +
      '<h1 tabindex="-1" class="center">' + esc(L(m.name)) + '</h1>' +
      '<div class="timer-wrap"><div class="ring-wrap"><svg class="ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="' + RING_R + '" class="ring-bg"/>' +
      '<circle cx="100" cy="100" r="' + RING_R + '" class="ring-fg" id="ringfg" stroke-dasharray="' + RING_C.toFixed(1) + '" stroke-dashoffset="' + (RING_C * (1 - frac)).toFixed(1) + '"/></svg>' +
      '<div class="ring-inner"><span class="illus anim-' + m.anim + (tm && tm.running ? ' playing' : '') + '" id="illus" aria-hidden="true">' + m.icon + '</span>' +
      '<span class="ring-num" id="tnum" role="timer" aria-label="' + esc(t('timeLeft', { n: left })) + '">' + left + '</span></div></div>' +
      '<p class="cue" id="tcue" aria-live="polite">' + cueText(m, tm) + '</p></div>' +
      '<div class="controls" id="tctl">' + ctl + '</div>' +
      '<ol class="steps">' + (m.steps ? L(m.steps) : []).map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
      '<p class="kid-safety"><span aria-hidden="true">⚠️</span> ' + t('kidSafety') + '</p>' +
      '</main>' + kidNav(kid, 'move');
  }
  function cueText(m, tm) {
    if (!tm) return t('getReady');
    const el = tm.total - tm.left;
    if (m.cue === 'freeze') return Math.floor(el / 5) % 2 === 0 ? '💃 ' + t('dance') : '🧊 ' + t('freeze');
    if (m.cue === 'switch' && tm.left <= tm.total / 2 && tm.left > tm.total / 2 - 4) return '🦶 ' + t('switchFeet');
    if (tm.left <= 5) return '🏁 ' + t('almost');
    return '💪 ' + t('keepGoing');
  }

  function vChores(kid) {
    const cs = choresFor(kid);
    return header(kid) + '<main class="screen kid" id="main"><h1 tabindex="-1">🧹 ' + t('chores') + '</h1><p class="lead">' + t('choresIntro') + '</p>' +
      '<div class="cards">' + cs.map((c) => choreCard(kid, c)).join('') + '</div></main>' + kidNav(kid, 'chores');
  }

  function vRewards(kid) {
    const av = available(kid);
    return header(kid) + '<main class="screen kid" id="main"><h1 tabindex="-1">🎁 ' + t('rewards') + '</h1><p class="lead">' + t('rewardsIntro') + '</p>' +
      '<div class="bank"><span class="bank-ic" aria-hidden="true">🌟</span><span class="bank-num" data-testid="available">' + av + '</span><span class="bank-lbl">' + t('starsToUse') + '</span></div>' +
      '<div class="cards">' + S.rewards.slice().sort((a, b) => a.cost - b.cost).map((r) => {
        const pend = S.redemptions.find((x) => x.kid === kid && x.reward === r.id && x.status === 'pending');
        const pct = Math.min(100, Math.round((Math.max(0, av) / r.cost) * 100));
        let act;
        if (pend) act = '<span class="status status-wait">⏳ ' + t('requested') + '</span>';
        else if (av >= r.cost) act = '<button type="button" class="btn primary done-btn" data-act="redeem" data-id="' + r.id + '">🙋 ' + t('askRedeem') + '</button>';
        else act = '<span class="status status-need">' + t('needMore', { n: r.cost - av }) + '</span>';
        return '<div class="item reward-card' + (pct >= 100 ? ' ready' : '') + '"><span class="item-ic ic-reward" aria-hidden="true">' + esc(r.icon) + '</span><span class="item-body">' +
          '<span class="item-title">' + esc(L(r.name)) + '</span>' +
          '<span class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + r.cost + '" aria-valuenow="' + Math.min(r.cost, Math.max(0, av)) + '" aria-label="' + esc(L(r.name)) + '"><span class="bar" style="width:' + (pend ? 100 : pct) + '%"></span></span>' +
          '<span class="item-meta"><span>⭐ ' + t('of', { a: Math.min(r.cost, Math.max(0, av)), b: r.cost }) + '</span></span>' + act + '</span></div>';
      }).join('') + '</div></main>' + kidNav(kid, 'rewards');
  }

  function vPin() {
    const locked = Date.now() < ui.lockUntil;
    const dots = [0, 1, 2, 3].map((i) => '<span class="pdot' + (i < ui.pinBuf.length ? ' on' : '') + '"></span>').join('');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
    return header() + '<main class="screen pin-screen" id="main"><h1 tabindex="-1" class="center">🔒 ' + t('pinTitle') + '</h1><p class="center lead">' + t('pinEnter') + '</p>' +
      '<div class="pin-dots" aria-hidden="true">' + dots + '</div><p class="sr-only" aria-live="polite">' + ui.pinBuf.length + ' / 4</p>' +
      '<p class="err center" role="alert">' + esc(locked ? t('pinLocked', { n: Math.ceil((ui.lockUntil - Date.now()) / 1000) }) : ui.pinErr) + '</p>' +
      '<div class="keypad">' + keys.map((k) => {
        const lab = k === 'C' ? t('clear') : k === '⌫' ? t('del') : k;
        return '<button type="button" class="key' + (/\d/.test(k) ? '' : ' key-fn') + '" data-act="key" data-k="' + k + '" aria-label="' + esc(lab) + '"' + (locked ? ' disabled' : '') + '>' + (k === 'C' ? t('clear') : k) + '</button>';
      }).join('') + '</div>' +
      (S.family && S.family.demo ? '<p class="hint center">' + t('demoPinHint') + '</p>' : '') +
      '<div class="center stack-sm"><a class="btn ghost" href="#/who">← ' + t('back') + '</a><button type="button" class="link-btn" data-act="reset">' + t('forgotPin') + ' ' + t('resetDemo') + '</button></div></main>';
  }

  /* ---------- parent dashboard ---------- */
  const TABS = [['approve', '✅'], ['week', '📊'], ['chores', '🧹'], ['moves', '🏃'], ['rewards', '🎁'], ['kids', '🧒'], ['settings', '⚙️']];
  function vDash() {
    const tab = ui.dashTab; const pc = pendingCount();
    const tabKey = { approve: 'tabApprove', week: 'tabWeek', chores: 'tabChores', moves: 'tabMoves', rewards: 'tabRewards', kids: 'tabKids', settings: 'tabSettings' };
    const body = { approve: pApprove, week: pWeek, chores: pChores, moves: pMoves, rewards: pRewards, kids: pKids, settings: pSettings }[tab]();
    return header() + '<main class="screen parent" id="main"><div class="dash-head"><h1 tabindex="-1">' + t('dashTitle') + '</h1>' +
      '<div class="dash-btns"><a class="btn small ghost" href="#/who">👀 ' + t('toKids') + '</a><button type="button" class="btn small dark" data-act="lock">🔒 ' + t('lock') + '</button></div></div>' +
      '<div class="ptabs" role="tablist" aria-label="' + esc(t('dashTitle')) + '">' + TABS.map(([k, ic]) =>
        '<button type="button" role="tab" class="ptab' + (tab === k ? ' on' : '') + '" aria-selected="' + (tab === k) + '" data-act="ptab" data-v="' + k + '"><span class="ptab-ic" aria-hidden="true">' + ic + '</span><span class="ptab-lbl">' + t(tabKey[k]) + '</span>' +
        (k === 'approve' && pc ? ' <span class="count">' + pc + '</span>' : '') + '</button>').join('') + '</div>' +
      '<section class="pbody" role="tabpanel">' + body + '</section></main>';
  }
  function pApprove() {
    const chores = S.log.filter((e) => e.status === 'pending');
    const reds = S.redemptions.filter((r) => r.status === 'pending');
    if (!chores.length && !reds.length) return '<div class="card empty"><span class="big-emoji" aria-hidden="true">🎉</span><p>' + t('nothingPending') + '</p></div>';
    const row = (kid, ic, kind, title, stars, act, id) => {
      const k = kidById(kid);
      return '<div class="card appr"><div class="appr-top">' + (k ? avatarSvg(k.avatar, 44) : '') + '<div class="appr-txt"><span class="appr-kid">' + esc(k ? k.nick : '?') + '</span>' +
        '<span class="appr-what"><span aria-hidden="true">' + esc(ic) + '</span> <span class="tag ' + (kind === 'chore' ? 'tag-chore' : 'tag-reward') + '">' + t(kind === 'chore' ? 'choreReq' : 'rewardReq') + '</span> ' + esc(title) + '</span></div>' +
        '<span class="appr-stars">' + (kind === 'chore' ? '+' : '−') + stars + ' ⭐</span></div>' +
        '<div class="row"><button type="button" class="btn ghost grow" data-act="' + act + '-no" data-id="' + id + '">' + t('notYet') + '</button><button type="button" class="btn ok grow" data-act="' + act + '-yes" data-id="' + id + '">✅ ' + t('approve') + '</button></div></div>';
    };
    return (chores.length + reds.length > 1 ? '<div class="row end"><button type="button" class="btn ok small" data-act="approve-all">✅ ' + t('approveAll') + '</button></div>' : '') +
      chores.map((e) => { const c = choreById(e.item) || { icon: '🧹', name: { en: e.item } }; return row(e.kid, c.icon, 'chore', L(c.name), e.stars, 'chore', e.id); }).join('') +
      reds.map((r) => { const rw = rewardById(r.reward) || { icon: '🎁', name: { en: r.reward } }; return row(r.kid, rw.icon, 'reward', L(rw.name), r.cost, 'red', r.id); }).join('');
  }
  function pWeek() {
    const days = [6, 5, 4, 3, 2, 1, 0].map((n) => daysAgo(n));
    const locale = S.lang === 'es' ? 'es-MX' : 'en-US';
    return '<h2>' + t('weekTitle') + '</h2>' + S.kids.map((k) => {
      const keys = days.map((d) => dkey(d));
      const wk = S.log.filter((e) => e.kid === k.id && keys.indexOf(e.date) >= 0);
      const appr = wk.filter((e) => e.status === 'approved');
      const per = keys.map((dk) => sum(appr.filter((e) => e.date === dk), (e) => e.stars));
      const max = Math.max(4, ...per);
      const moves = wk.filter((e) => e.type === 'move').length;
      const chores = appr.filter((e) => e.type === 'chore').length;
      const mins = Math.round(sum(wk.filter((e) => e.type === 'move'), (e) => e.secs) / 60);
      return '<div class="card week">' + '<div class="week-head">' + avatarSvg(k.avatar, 44) + '<h3>' + esc(k.nick) + '</h3><span class="muted">' + t('ageLabel', { a: k.age }) + '</span></div>' +
        '<div class="kpis"><div><b>' + sum(appr, (e) => e.stars) + '</b><span>⭐ ' + t('starsEarned') + '</span></div><div><b>' + moves + '</b><span>🏃 ' + t('movesDone') + '</span></div>' +
        '<div><b>' + chores + '</b><span>🧹 ' + t('choresDone') + '</span></div><div><b>' + mins + '</b><span>⏱️ ' + t('activeMin') + '</span></div></div>' +
        '<ul class="bars" aria-label="' + esc(t('weekTitle') + ', ' + k.nick) + '">' + days.map((d, i) => {
          const lab = d.toLocaleDateString(locale, { weekday: 'short' });
          return '<li aria-label="' + esc(d.toLocaleDateString(locale, { weekday: 'long' }) + ': ' + starTxt(per[i])) + '"><span class="bar-val" aria-hidden="true">' + (per[i] || '') + '</span><span class="bar-col"><span class="bar-fill" style="height:' + Math.round((per[i] / max) * 100) + '%"></span></span><span class="bar-day" aria-hidden="true">' + esc(lab.replace('.', '')) + '</span></li>';
        }).join('') + '</ul>' +
        '<p class="week-foot">🔥 ' + t('streakNow') + ': <b>' + (streak(k.id) === 1 ? t('day1') : t('days', { n: streak(k.id) })) + '</b> · 🌟 ' + t('balance') + ': <b>' + balance(k.id) + '</b></p></div>';
    }).join('');
  }
  function toggle(kind, id, on) {
    return '<label class="switch"><input type="checkbox" data-act="toggle" data-kind="' + kind + '" data-id="' + id + '"' + (on ? ' checked' : '') + '><span class="sw" aria-hidden="true"></span><span class="sr-only">' + t('showKids') + '</span></label>';
  }
  function field(id, label, val, attrs) { return '<label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + id + '" value="' + esc(val) + '" ' + (attrs || '') + '>'; }
  function editForm(kind, it) {
    const isNew = !it.id;
    let f = '<form class="card form edit" data-form="edit" data-kind="' + kind + '" data-id="' + (it.id || '') + '" novalidate><h3>' + (isNew ? t(kind === 'chore' ? 'newChore' : 'newReward') : t('edit')) + '</h3>' +
      field('f-en', t('nameEn'), it.name ? it.name.en : '', 'maxlength="40" autocomplete="off"') + field('f-es', t('nameEs'), it.name ? it.name.es : '', 'maxlength="40" autocomplete="off" lang="es"');
    if (kind !== 'move') f += field('f-icon', t('icon'), it.icon || (kind === 'chore' ? '🧹' : '🎁'), 'maxlength="8" autocomplete="off" class="short"');
    if (kind === 'chore') {
      f += field('f-stars', t('stars') + ' (1 - 5)', it.stars || 1, 'type="number" min="1" max="5" inputmode="numeric" class="short"');
      f += '<fieldset><legend>' + t('ages') + '</legend><div class="seg">' + AGES.map((a) => '<label class="seg-opt"><input type="checkbox" name="ages" value="' + a + '"' + (!it.ages || it.ages.indexOf(a) >= 0 ? ' checked' : '') + '><span>' + a + '</span></label>').join('') + '</div></fieldset>';
    }
    if (kind === 'move') {
      f += field('f-secs', t('seconds'), it.secs, 'type="number" min="30" max="60" step="5" inputmode="numeric" class="short"');
      f += field('f-stars', t('stars') + ' (1 - 3)', it.stars, 'type="number" min="1" max="3" inputmode="numeric" class="short"');
    }
    if (kind === 'reward') f += field('f-cost', t('cost') + ' (1 - 200)', it.cost || 10, 'type="number" min="1" max="200" inputmode="numeric" class="short"');
    f += err('err-edit') + '<div class="row"><button type="button" class="btn ghost" data-act="edit-cancel">' + t('cancel') + '</button>' +
      (!isNew && kind !== 'move' ? '<button type="button" class="btn danger" data-act="edit-delete" data-kind="' + kind + '" data-id="' + it.id + '">' + t('del2') + '</button>' : '') +
      '<button type="submit" class="btn ok grow">💾 ' + t('save') + '</button></div></form>';
    return f;
  }
  function plist(kind, items, meta) {
    const newKey = kind + ':new';
    return (ui.editing === newKey ? editForm(kind, {}) : (kind !== 'move' ? '<button type="button" class="btn secondary wide" data-act="edit" data-key="' + newKey + '">＋ ' + t(kind === 'chore' ? 'newChore' : 'newReward') + '</button>' : '')) +
      '<ul class="plist">' + items.map((it) => {
        if (ui.editing === kind + ':' + it.id) return '<li class="plain">' + editForm(kind, it) + '</li>';
        return '<li class="card prow' + (it.on === false ? ' off' : '') + '"><span class="item-ic" aria-hidden="true">' + esc(it.icon) + '</span><span class="prow-body"><span class="prow-title">' + esc(L(it.name)) + '</span><span class="muted small">' + meta(it) + '</span></span>' +
          (kind !== 'reward' ? toggle(kind, it.id, it.on !== false) : '') +
          '<button type="button" class="btn small ghost" data-act="edit" data-key="' + kind + ':' + it.id + '" aria-label="' + esc(t('edit') + ': ' + L(it.name)) + '">✏️ ' + t('edit') + '</button></li>';
      }).join('') + '</ul>';
  }
  const pChores = () => plist('chore', S.chores, (c) => '⭐ ' + c.stars + ' · ' + (c.ages.length === AGES.length ? t('allAges') : c.ages.join(', ')) + (c.on === false ? ' · ' + t('hidden') : ''));
  const pMoves = () => safetyNote(true) + plist('move', S.moves, (m) => '⏱️ ' + t('secs', { n: m.secs }) + ' · ⭐ ' + m.stars + (m.on === false ? ' · ' + t('hidden') : ''));
  const pRewards = () => plist('reward', S.rewards, (r) => '⭐ ' + t('costLabel', { n: r.cost }));
  function pKids() {
    let h = '';
    if (ui.editing === 'kid:new') h += kidForm('kid-edit', { nick: '', avatar: 'bear', age: '5-7' }, '💾 ' + t('save'), '<button type="button" class="btn ghost" data-act="edit-cancel">' + t('cancel') + '</button>');
    else h += '<button type="button" class="btn secondary wide" data-act="edit" data-key="kid:new">＋ ' + t('newKid') + '</button>';
    h += '<ul class="plist">' + S.kids.map((k) => {
      if (ui.editing === 'kid:' + k.id) {
        return '<li class="plain">' + kidForm('kid-edit', k, '💾 ' + t('save'), '<button type="button" class="btn ghost" data-act="edit-cancel">' + t('cancel') + '</button>' +
          (S.kids.length > 1 ? '<button type="button" class="btn danger" data-act="kid-delete" data-id="' + k.id + '">' + t('del2') + '</button>' : '')).replace('data-form="kid-edit"', 'data-form="kid-edit" data-id="' + k.id + '"') + '</li>';
      }
      return '<li class="card prow">' + avatarSvg(k.avatar, 48) + '<span class="prow-body"><span class="prow-title">' + esc(k.nick) + '</span><span class="muted small">' + t('ageLabel', { a: k.age }) + ' · ⭐ ' + balance(k.id) + '</span></span>' +
        '<button type="button" class="btn small ghost" data-act="edit" data-key="kid:' + k.id + '" aria-label="' + esc(t('edit') + ': ' + k.nick) + '">✏️ ' + t('edit') + '</button></li>';
    }).join('') + '</ul>';
    return h;
  }
  function pSettings() {
    return '<form class="card form" data-form="newpin" novalidate><h3>🔑 ' + t('changePin') + '</h3>' +
      '<label for="np1">' + t('newPin') + '</label><input id="np1" class="pin-input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off">' +
      '<label for="np2">' + t('pinConfirm') + '</label><input id="np2" class="pin-input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off">' +
      err('err-newpin') + '<button type="submit" class="btn ok wide">💾 ' + t('save') + '</button></form>' +
      '<section class="card"><h3>🔒 ' + t('privacyTitle') + '</h3><ul class="checks"><li>' + t('privacy1') + '</li><li>' + t('privacy2') + '</li><li>' + t('privacy3') + '</li><li>' + t('privacy4') + '</li></ul></section>' +
      safetyNote(false) +
      '<button type="button" class="btn danger wide" data-act="reset">🔄 ' + t('resetDemo') + '</button>';
  }

  /* ---------- celebration ---------- */
  function celebrateHtml(c) {
    const colors = ['#FFD23F', '#FF5D8F', '#5B3DF5', '#2BB673', '#2F7FF5', '#FF8A3D'];
    let conf = '';
    for (let i = 0; i < 36; i++) {
      conf += '<i style="left:' + ((i * 37) % 100) + '%;background:' + colors[i % colors.length] + ';animation-delay:' + ((i % 9) * 0.12).toFixed(2) + 's;animation-duration:' + (1.8 + (i % 5) * 0.3).toFixed(1) + 's"></i>';
    }
    return '<div class="celebrate" role="dialog" aria-modal="true" aria-labelledby="celT"><div class="confetti" aria-hidden="true">' + conf + '</div>' +
      '<div class="cel-card"><div class="cel-star" aria-hidden="true">🌟</div><h2 id="celT">' + t('greatJob') + '</h2>' +
      (c.stars ? '<p class="cel-earn">' + t('youEarned', { n: '' }) + ' <b>+' + c.stars + ' ⭐</b></p>' : '<p class="cel-sub">' + t('funOnly') + '</p>') +
      '<div class="stack"><button type="button" class="btn primary big" data-act="cel-home">🏠 ' + t('backToday') + '</button>' +
      '<button type="button" class="btn ghost big" data-act="cel-again">🔁 ' + t('again') + '</button></div></div></div>';
  }

  /* ---------- timer ---------- */
  function startTimer(kid, mid) {
    const m = moveById(mid);
    stopTimer();
    ui.timer = { kid, mid, total: m.secs, left: m.secs, running: true, last: performance.now(), h: null, lastCue: '' };
    ui.timer.h = setInterval(tick, 100);
    render();
  }
  function stopTimer() { if (ui.timer && ui.timer.h) clearInterval(ui.timer.h); ui.timer = null; }
  function tick() {
    const tm = ui.timer; if (!tm) return;
    const now = performance.now();
    if (tm.running) tm.left -= ((now - tm.last) / 1000) * SPEED;
    tm.last = now;
    if (tm.left <= 0) { finishMove(); return; }
    const m = moveById(tm.mid);
    const n = document.getElementById('tnum'); const ring = document.getElementById('ringfg'); const cue = document.getElementById('tcue');
    if (n) { const v = String(Math.ceil(tm.left)); if (n.textContent !== v) { n.textContent = v; n.setAttribute('aria-label', t('timeLeft', { n: v })); } }
    if (ring) ring.setAttribute('stroke-dashoffset', (RING_C * (1 - tm.left / tm.total)).toFixed(1));
    if (cue) { const c = cueText(m, tm); if (cue.textContent !== c) cue.textContent = c; }
  }
  function finishMove() {
    const tm = ui.timer; const m = moveById(tm.mid);
    const already = moveDoneToday(tm.kid, m.id);
    const stars = already ? 0 : m.stars;
    addLog(tm.kid, 'move', m.id, dkey(), 'approved', stars, m.secs);
    save();
    const kid = tm.kid; const mid = tm.mid;
    stopTimer();
    ui.celebrate = { kid, mid, stars };
    render();
  }

  /* ---------- toast & modal ---------- */
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(ui.toastT); ui.toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }
  function confirmBox(msg, yes, onYes) {
    const prev = document.activeElement;
    modalRoot.innerHTML = '<div class="modal-back"><div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="mT" aria-describedby="mD"><h2 id="mT">' + t('confirmTitle') + '</h2><p id="mD">' + esc(msg) + '</p>' +
      '<div class="row"><button type="button" class="btn ghost grow" data-m="no">' + t('cancel') + '</button><button type="button" class="btn danger grow" data-m="yes">' + esc(yes) + '</button></div></div></div>';
    const close = () => { modalRoot.innerHTML = ''; if (prev && prev.focus) prev.focus(); };
    modalRoot.querySelector('[data-m="no"]').onclick = close;
    modalRoot.querySelector('[data-m="yes"]').onclick = () => { modalRoot.innerHTML = ''; onYes(); };
    modalRoot.querySelector('.modal-back').onkeydown = (e) => { if (e.key === 'Escape') close(); };
    modalRoot.querySelector('[data-m="no"]').focus();
  }

  /* ---------- routing ---------- */
  function route() {
    const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean);
    return parts;
  }
  function nav(h) { if (location.hash === h) render(); else location.hash = h; }
  function render() {
    const p = route();
    const r = p.join('/');
    document.documentElement.lang = S.lang;
    document.title = t('appName') + ' (' + t('demo') + ')';
    if (!S.family || !S.kids.length) {
      if (p[0] !== 'setup' && p[0] !== 'welcome') { location.replace('#/welcome'); return; }
    } else if (!p.length || p[0] === 'welcome' || p[0] === 'setup') { location.replace('#/who'); return; }
    if (p[0] !== 'parent') ui.parentOk = false;
    if (!(p[0] === 'kid' && p[2] === 'move' && p[3])) stopTimer();
    let html = '';
    if (p[0] === 'welcome') html = vWelcome();
    else if (p[0] === 'setup') html = vSetup();
    else if (p[0] === 'who') html = vWho();
    else if (p[0] === 'kid') {
      const kid = p[1];
      if (!kidById(kid)) { location.replace('#/who'); return; }
      if (p[2] === 'move' && p[3]) html = vMoveTimer(kid, p[3]);
      else if (p[2] === 'move') html = vMoves(kid);
      else if (p[2] === 'chores') html = vChores(kid);
      else if (p[2] === 'rewards') html = vRewards(kid);
      else html = vKidHome(kid);
    } else if (p[0] === 'parent') html = ui.parentOk ? vDash() : vPin();
    else { location.replace('#/who'); return; }
    if (ui.celebrate) html += celebrateHtml(ui.celebrate);
    app.innerHTML = html;
    const routeKey = r + (ui.parentOk ? ':ok' : '');
    if (ui.celebrate) { const b = app.querySelector('.celebrate [data-act="cel-home"]'); if (b) b.focus(); }
    else if (ui.lastRoute !== routeKey) {
      if (ui.lastRoute !== null && !ui.keepToast) { toastEl.classList.remove('show'); }
      window.scrollTo(0, 0);
      const h1 = app.querySelector('h1'); if (h1 && ui.lastRoute !== null) h1.focus({ preventScroll: true });
    }
    ui.lastRoute = routeKey; ui.keepToast = false;
  }

  /* ---------- actions ---------- */
  function setErr(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg; }
  function readKidForm(form) {
    const nick = form.querySelector('[name="nick"]').value.trim().replace(/\s+/g, ' ');
    const av = form.querySelector('[name="avatar"]:checked'); const age = form.querySelector('[name="age"]:checked');
    return { nick, avatar: av ? av.value : 'fox', age: age ? age.value : '5-7' };
  }
  function pressKey(k) {
    if (Date.now() < ui.lockUntil) return;
    if (k === 'C') ui.pinBuf = '';
    else if (k === '⌫') ui.pinBuf = ui.pinBuf.slice(0, -1);
    else if (ui.pinBuf.length < 4) ui.pinBuf += k;
    ui.pinErr = '';
    if (ui.pinBuf.length === 4) {
      if (hashPin(ui.pinBuf) === S.family.pin) { ui.parentOk = true; ui.pinTries = 0; ui.dashTab = pendingCount() ? 'approve' : 'week'; ui.editing = null; }
      else {
        ui.pinTries++; ui.pinErr = t('pinWrong');
        if (ui.pinTries >= 5) { ui.lockUntil = Date.now() + 30000; ui.pinTries = 0; setTimeout(render, 30100); }
      }
      ui.pinBuf = '';
    }
    render();
    const again = app.querySelector('[data-k="' + (k === '⌫' ? '⌫' : k) + '"]'); if (again && !ui.parentOk) again.focus();
  }
  function approveLog(id, yes) {
    const e = S.log.find((x) => x.id === id); if (!e) return;
    if (yes) e.status = 'approved'; else S.log = S.log.filter((x) => x.id !== id);
  }
  function approveRed(id, yes) {
    const r = S.redemptions.find((x) => x.id === id); if (!r) return;
    if (yes) { if (balance(r.kid) >= r.cost) r.status = 'approved'; } else S.redemptions = S.redemptions.filter((x) => x.id !== id);
  }

  app.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]'); if (!el || el.tagName === 'INPUT') return;
    const act = el.dataset.act; const p = route(); const kid = p[0] === 'kid' ? p[1] : null;
    switch (act) {
      case 'lang': S.lang = el.dataset.v; save(); render(); { const b = app.querySelector('[data-act="lang"][data-v="' + S.lang + '"]'); if (b) b.focus(); } break;
      case 'nav': nav(el.dataset.to); break;
      case 'go-setup': ui.setupStep = 1; ui.draftKids = []; nav('#/setup'); break;
      case 'demo': seedDemo(); nav('#/who'); break;
      case 'setup-back': ui.setupStep = 1; render(); break;
      case 'draft-remove': ui.draftKids.splice(+el.dataset.i, 1); render(); break;
      case 'setup-finish':
        if (!ui.draftKids.length) { setErr('finishErr', t('errNeedKid')); return; }
        { const lang = S.lang; S = blank(lang); initContent(ui.setupPin); S.kids = ui.draftKids.map((k) => Object.assign({ id: 'k' + uid() }, k)); save(); ui.draftKids = []; ui.setupPin = null; nav('#/who'); }
        break;
      case 'chore-done':
        if (kid && !choreStatus(kid, el.dataset.id)) { const c = choreById(el.dataset.id); addLog(kid, 'chore', c.id, dkey(), 'pending', c.stars); save(); render(); toast('⏳ ' + t('waiting')); const card = app.querySelector('[data-chore="' + c.id + '"]'); if (card) card.setAttribute('tabindex', '-1'), card.focus(); }
        break;
      case 'redeem':
        if (kid) { const r = rewardById(el.dataset.id); if (r && available(kid) >= r.cost) { S.redemptions.push({ id: uid(), kid, reward: r.id, cost: r.cost, status: 'pending', ts: Date.now() }); save(); render(); toast('⏳ ' + t('requested')); } }
        break;
      case 'timer-start': startTimer(kid, el.dataset.id); { const b = app.querySelector('[data-act="timer-toggle"]'); if (b) b.focus(); } break;
      case 'timer-toggle': if (ui.timer) { ui.timer.running = !ui.timer.running; ui.timer.last = performance.now(); render(); const b = app.querySelector('[data-act="timer-toggle"]'); if (b) b.focus(); } break;
      case 'timer-stop': stopTimer(); render(); break;
      case 'cel-home': { const c = ui.celebrate; ui.celebrate = null; nav('#/kid/' + c.kid); } break;
      case 'cel-again': { ui.celebrate = null; render(); } break;
      case 'key': pressKey(el.dataset.k); break;
      case 'lock': ui.parentOk = false; nav('#/who'); break;
      case 'ptab': ui.dashTab = el.dataset.v; ui.editing = null; render(); { const b = app.querySelector('.ptab.on'); if (b) b.focus(); } break;
      case 'chore-yes': case 'chore-no': approveLog(el.dataset.id, act === 'chore-yes'); save(); render(); if (act === 'chore-yes') toast('✅ ' + t('approvedToast')); break;
      case 'red-yes': case 'red-no': approveRed(el.dataset.id, act === 'red-yes'); save(); render(); if (act === 'red-yes') toast('🎁 ' + t('redeemedToast')); break;
      case 'approve-all':
        S.log.filter((e) => e.status === 'pending').forEach((e) => { e.status = 'approved'; });
        S.redemptions.filter((r) => r.status === 'pending').forEach((r) => approveRed(r.id, true));
        save(); render(); toast('✅ ' + t('approvedToast')); break;
      case 'edit': ui.editing = el.dataset.key; render(); { const f = app.querySelector('form.edit input, form[data-form="kid-edit"] input'); if (f) f.focus(); } break;
      case 'edit-cancel': ui.editing = null; render(); break;
      case 'edit-delete':
        confirmBox(t('deleteConfirm'), t('yesDelete'), () => {
          const kind = el.dataset.kind; const id = el.dataset.id;
          if (kind === 'chore') S.chores = S.chores.filter((c) => c.id !== id);
          if (kind === 'reward') { S.rewards = S.rewards.filter((r) => r.id !== id); S.redemptions = S.redemptions.filter((r) => !(r.reward === id && r.status === 'pending')); }
          ui.editing = null; save(); render();
        });
        break;
      case 'kid-delete':
        confirmBox(t('deleteConfirm'), t('yesDelete'), () => {
          const id = el.dataset.id; S.kids = S.kids.filter((k) => k.id !== id); S.log = S.log.filter((e) => e.kid !== id); S.redemptions = S.redemptions.filter((r) => r.kid !== id);
          ui.editing = null; save(); render();
        });
        break;
      case 'reset':
        confirmBox(t('resetConfirm'), t('yesReset'), () => {
          const lang = S.lang; try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
          S = blank(lang); save(); ui.parentOk = false; ui.editing = null; ui.pinBuf = ''; ui.pinErr = ''; ui.setupStep = 1; ui.draftKids = []; stopTimer();
          nav('#/welcome');
        });
        break;
    }
  });

  app.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.dataset.act === 'toggle') {
      const list = el.dataset.kind === 'chore' ? S.chores : S.moves;
      const it = list.find((x) => x.id === el.dataset.id); if (it) { it.on = el.checked; save(); toast(t('saved')); }
      const row = el.closest('.prow'); if (row) row.classList.toggle('off', !el.checked);
    }
    if (el.name === 'avatar' && el.closest('[data-form="kid-add"]')) ui.draftAvatar = el.value;
    if (el.name === 'age' && el.closest('[data-form="kid-add"]')) ui.draftAge = el.value;
  });

  app.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = ev.target; const name = f.dataset.form;
    if (name === 'pin' || name === 'newpin') {
      const a = f.querySelector(name === 'pin' ? '#pin1' : '#np1').value; const b = f.querySelector(name === 'pin' ? '#pin2' : '#np2').value;
      const eid = name === 'pin' ? 'pinErr' : 'err-newpin';
      if (!/^\d{4}$/.test(a)) { setErr(eid, t('pinErrFormat')); return; }
      if (a !== b) { setErr(eid, t('pinErrMatch')); return; }
      if (name === 'pin') { ui.setupPin = a; ui.setupStep = 2; render(); const n = app.querySelector('#nick-kid-add'); if (n) n.focus(); }
      else { S.family.pin = hashPin(a); S.family.demo = false; save(); render(); toast('🔑 ' + t('pinChanged')); }
      return;
    }
    if (name === 'kid-add' || name === 'kid-edit') {
      const k = readKidForm(f); const eid = 'err-' + name;
      if (!k.nick) { setErr(eid, t('errNickname')); return; }
      if (k.nick.length > 12) { setErr(eid, t('errNickLong')); return; }
      if (name === 'kid-add') { ui.draftKids.push(k); ui.draftAvatar = k.avatar; ui.draftAge = k.age; render(); const n = app.querySelector('#nick-kid-add'); if (n) n.focus(); }
      else {
        const id = f.dataset.id;
        if (id) Object.assign(kidById(id), k); else S.kids.push(Object.assign({ id: 'k' + uid() }, k));
        ui.editing = null; save(); render(); toast(t('saved'));
      }
      return;
    }
    if (name === 'edit') {
      const kind = f.dataset.kind; const id = f.dataset.id;
      const v = (n) => { const i = f.querySelector('#' + n); return i ? i.value.trim() : ''; };
      const en = v('f-en'); const es = v('f-es') || en;
      if (!en) { setErr('err-edit', t('errName')); return; }
      const num = (n, a, b) => { const x = parseInt(v(n), 10); return isNaN(x) || x < a || x > b ? null : x; };
      let it = id ? (kind === 'chore' ? choreById(id) : kind === 'move' ? moveById(id) : rewardById(id)) : null;
      const data = { name: { en, es } };
      if (kind !== 'move') data.icon = v('f-icon') || (kind === 'chore' ? '🧹' : '🎁');
      if (kind === 'chore') {
        data.stars = num('f-stars', 1, 5); if (data.stars == null) { setErr('err-edit', t('errRange', { a: 1, b: 5 })); return; }
        data.ages = Array.from(f.querySelectorAll('[name="ages"]:checked')).map((x) => x.value); if (!data.ages.length) data.ages = AGES.slice();
      }
      if (kind === 'move') {
        data.secs = num('f-secs', 30, 60); if (data.secs == null) { setErr('err-edit', t('errRange', { a: 30, b: 60 })); return; }
        data.stars = num('f-stars', 1, 3); if (data.stars == null) { setErr('err-edit', t('errRange', { a: 1, b: 3 })); return; }
      }
      if (kind === 'reward') { data.cost = num('f-cost', 1, 200); if (data.cost == null) { setErr('err-edit', t('errRange', { a: 1, b: 200 })); return; } }
      if (it) Object.assign(it, data);
      else { it = Object.assign({ id: kind[0] + uid() }, data); if (kind === 'chore') { it.on = true; S.chores.push(it); } else S.rewards.push(it); }
      ui.editing = null; save(); render(); toast('💾 ' + t('saved'));
    }
  });

  document.addEventListener('keydown', (e) => {
    if (route()[0] === 'parent' && !ui.parentOk && !modalRoot.innerHTML) {
      if (/^\d$/.test(e.key)) { e.preventDefault(); pressKey(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); pressKey('⌫'); }
    }
  });
  window.addEventListener('hashchange', render);
  document.addEventListener('visibilitychange', () => { if (document.hidden && ui.timer && ui.timer.running) { ui.timer.running = false; render(); } });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline cache is optional */ });
  }
  render();
})();
