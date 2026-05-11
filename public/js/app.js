// DOLCE client — vanilla JS SPA.

const socket = io();

// ---- map (must match server.js) ----
const MAP_W = 2200;
const MAP_H = 1500;
const LOCATIONS = [
  { id: 'archive',     name: 'ARCHIVE',     x: 60,   y: 80,   w: 220, h: 280, theme: 'archive'     },
  { id: 'library',     name: 'LIBRARY',     x: 340,  y: 80,   w: 220, h: 280, theme: 'library'     },
  { id: 'sauna',       name: 'SAUNA',       x: 620,  y: 80,   w: 220, h: 280, theme: 'sauna'       },
  { id: 'observatory', name: 'OBSERVATORY', x: 1240, y: 80,   w: 280, h: 280, theme: 'observatory' },
  { id: 'arcade',      name: 'ARCADE',      x: 1580, y: 80,   w: 220, h: 280, theme: 'arcade'      },
  { id: 'workshop',    name: 'WORKSHOP',    x: 1860, y: 80,   w: 220, h: 280, theme: 'workshop'    },
  { id: 'lab',     name: 'LAB',     x: 60,   y: 560,  w: 220, h: 280, theme: 'lab'     },
  { id: 'cafe',    name: 'CAFÉ',    x: 340,  y: 560,  w: 220, h: 280, theme: 'cafe'    },
  { id: 'storage', name: 'STORAGE', x: 620,  y: 560,  w: 460, h: 280, theme: 'storage' },
  { id: 'lounge',  name: 'LOUNGE',  x: 1380, y: 560,  w: 220, h: 280, theme: 'lounge'  },
  { id: 'transit', name: 'TRANSIT', x: 1660, y: 560,  w: 220, h: 280, theme: 'transit' },
  { id: 'park',   name: 'PARK',         x: 660,  y: 1080, w: 320, h: 280, theme: 'park'   },
  { id: 'street', name: 'SNOWY STREET', x: 1040, y: 1080, w: 320, h: 280, theme: 'street' }
];
const PLAZA = { id: 'cafeteria', name: 'CAFETERIA', x: 900, y: 80, w: 280, h: 280, theme: 'cafeteria' };
const CORRIDORS = [
  // Top deck horizontal bridges
  { x: 280,  y: 200, w: 60, h: 60 },
  { x: 560,  y: 200, w: 60, h: 60 },
  { x: 840,  y: 200, w: 60, h: 60 },
  { x: 1180, y: 200, w: 60, h: 60 },
  { x: 1520, y: 200, w: 60, h: 60 },
  { x: 1800, y: 200, w: 60, h: 60 },
  // Mid deck horizontal bridges
  { x: 280,  y: 680, w: 60, h: 60 },
  { x: 560,  y: 680, w: 60, h: 60 },
  { x: 1080, y: 680, w: 300, h: 60 },
  { x: 1600, y: 680, w: 60, h: 60 },
  // Vertical corridors
  { x: 130,  y: 360, w: 80, h: 200 },
  { x: 410,  y: 360, w: 80, h: 200 },
  { x: 700,  y: 360, w: 80, h: 200 },
  { x: 1000, y: 360, w: 80, h: 200 },
  { x: 1340, y: 360, w: 80, h: 200 },
  { x: 1700, y: 360, w: 80, h: 200 },
  { x: 1940, y: 360, w: 80, h: 200 },
  // South spurs
  { x: 760,  y: 840, w: 80, h: 240 },
  { x: 1140, y: 840, w: 80, h: 240 },
  { x: 980,  y: 1180, w: 60, h: 80 }
];
const VENTS = [
  { id: 'v_archive',     roomId: 'archive',     x: 160,  y: 130  },
  { id: 'v_sauna',       roomId: 'sauna',       x: 720,  y: 130  },
  { id: 'v_observatory', roomId: 'observatory', x: 1380, y: 130  },
  { id: 'v_workshop',    roomId: 'workshop',    x: 1960, y: 130  },
  { id: 'v_lab',         roomId: 'lab',         x: 160,  y: 600  },
  { id: 'v_storage',     roomId: 'storage',     x: 850,  y: 600  },
  { id: 'v_transit',     roomId: 'transit',     x: 1760, y: 600  },
  { id: 'v_street',      roomId: 'street',      x: 1300, y: 1300 }
];
const WALKABLE = [...LOCATIONS, PLAZA, ...CORRIDORS];

const MOVE_SPEED = 280;
const PLAYER_VIEW_W = 900;
const PLAYER_VIEW_H = 700;
const KILL_RANGE = 90;
const REPORT_RANGE = 110;

const SAB_KINDS = [
  { kind: 'stun',    label: 'STUN',    help: 'freeze a Seeker · 6s' },
  { kind: 'intrude', label: 'INTRUDE', help: "reset a Seeker's task" },
  { kind: 'drift',   label: 'DRIFT',   help: 'timers warp · 12s' },
  { kind: 'fog',     label: 'FOG',     help: 'vision drops · 7s' }
];

const PERSONAS = {
  authoritarian: { label: 'THE AUTHORITARIAN', tagline: 'discipline first.',  power: 'tasks 30% faster',         weakness: 'one extra task' },
  board:         { label: 'THE BOARD',         tagline: 'open · close · open.', power: 'JUMP to a task room · 60s', weakness: 'still moment +2s'      },
  observer:      { label: 'THE OBSERVER',      tagline: 'just watching.',     power: 'glimpse Distraction · 30s', weakness: 'vote counts as half'   }
};

// ---- room palette ----
const ROOM_PALETTE = {
  archive:     { floor: '#2e2014', floor2: '#3a2a1a', accent: '#a47540', dim: '#1a0e06' },
  library:     { floor: '#5a3a22', floor2: '#6b4628', accent: '#d4a45f', dim: '#3d2515' },
  sauna:       { floor: '#7a4a22', floor2: '#9a5a28', accent: '#ffb27a', dim: '#4a2a12' },
  lab:         { floor: '#1f3a44', floor2: '#26505c', accent: '#2dd4bf', dim: '#0e2128' },
  arcade:      { floor: '#1a0d2e', floor2: '#241346', accent: '#ec4899', dim: '#0e0420' },
  workshop:    { floor: '#2c2c30', floor2: '#3a3a40', accent: '#f59e0b', dim: '#15151a' },
  cafe:        { floor: '#3a2818', floor2: '#46301d', accent: '#fbbf24', dim: '#241408' },
  park:        { floor: '#3d6e44', floor2: '#487a4f', accent: '#fde68a', dim: '#2a4f2f' },
  storage:     { floor: '#373c44', floor2: '#454c56', accent: '#94a3b8', dim: '#1f242c' },
  transit:     { floor: '#3a3f4d', floor2: '#444a59', accent: '#fbbf24', dim: '#1f2532' },
  lounge:      { floor: '#2a1226', floor2: '#3a1834', accent: '#f472b6', dim: '#15071a' },
  observatory: { floor: '#0a1130', floor2: '#0f1a3e', accent: '#a8c1ff', dim: '#04081c' },
  street:      { floor: '#1c2230', floor2: '#262d3e', accent: '#dde6f5', dim: '#0d111a' },
  plaza:       { floor: '#bbc7d6', floor2: '#cdd6e2', accent: '#7dd3c0', dim: '#8492a4' },
  cafeteria:   { floor: '#bbc7d6', floor2: '#cdd6e2', accent: '#7dd3c0', dim: '#8492a4' }
};

const state = {
  view: null,
  role: null,
  code: null,
  me: null,
  pub: null,
  you: null,
  positions: [],
  localPos: null,
  inputs: { up: false, down: false, left: false, right: false },
  facing: { x: 0, y: 1 },
  walkPhase: 0,
  walking: false,
  rafId: null,
  anim: 0,
  lastMoveTick: 0,
  lastMoveSent: 0,
  meetingTimer: null,
  stillOverlay: null,
  taskOverlay: null,
  ventOverlay: null,
  gameOver: null,
  cooldownTicker: null,
  roleOverlay: null,
  shake: { until: 0, intensity: 0, startedAt: 0, duration: 0 },
  prevPhase: null,
  prevMeetingPhase: null,
  prevStillPhase: null,
  prevFogUntil: 0,
  palette: null,
  hats: null,
  faces: null,
  visors: null,
  accessories: null,
  pets: null,
  myVote: null,
  stunUntil: 0
};

// ---------- screen shake ----------
function triggerShake(intensity = 8, ms = 350) {
  const now = performance.now();
  const remaining = Math.max(0, state.shake.until - now);
  if (intensity * ms <= state.shake.intensity * remaining) return;
  state.shake.startedAt = now;
  state.shake.duration = ms;
  state.shake.until = now + ms;
  state.shake.intensity = intensity;
}

// ---------- audio ----------
const audio = {
  ctx: null, enabled: true, master: null,
  init() {
    if (this.ctx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.45;
      this.master.connect(this.ctx.destination);
    } catch {}
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); },
  beep({ freq = 440, dur = 0.12, type = 'sine', gain = 0.4, slide = 0 } = {}) {
    if (!this.enabled) return; this.init(); if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(60, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },
  sweep(from, to, dur = 0.4, type = 'sawtooth', gain = 0.3) {
    if (!this.enabled) return; this.init(); if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },
  click()      { this.beep({ freq: 880, dur: 0.05, type: 'square', gain: 0.18 }); },
  good()       { this.beep({ freq: 660, dur: 0.08, type: 'triangle', gain: 0.3, slide: 220 }); },
  bad()        { this.beep({ freq: 240, dur: 0.18, type: 'sawtooth', gain: 0.28, slide: -120 }); },
  taskStart()  { this.beep({ freq: 520, dur: 0.06, type: 'triangle', gain: 0.25 }); },
  meeting()    { this.sweep(120, 700, 0.45, 'sawtooth', 0.32); },
  stillOpen()  { this.sweep(440, 110, 1.2, 'sine', 0.2); },
  sabotage()   { this.sweep(800, 90, 0.45, 'square', 0.28); },
  vent()       { this.sweep(180, 540, 0.18, 'sine', 0.22); },
  beat(i)      { this.beep({ freq: 440 + i * 40, dur: 0.08, type: 'sine', gain: 0.22 }); },
  pourTone()   { this.beep({ freq: 380, dur: 0.06, type: 'sine', gain: 0.15 }); }
};
window.addEventListener('pointerdown', () => { audio.init(); audio.resume(); }, { once: true, capture: true });
window.addEventListener('keydown',     () => { audio.init(); audio.resume(); }, { once: true, capture: true });

// ---------- utilities ----------
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function toast(msg, ms = 2400) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), ms);
}

function useTemplate(id) {
  const tpl = document.getElementById(id);
  const node = tpl.content.firstElementChild.cloneNode(true);
  const app = $('#app');
  app.innerHTML = '';
  app.appendChild(node);
  return node;
}

function openOverlay(id) {
  const tpl = document.getElementById(id);
  const node = tpl.content.firstElementChild.cloneNode(true);
  document.body.appendChild(node);
  return node;
}

function closeOverlay(el) {
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

function locMeta(id) { return LOCATIONS.find(l => l.id === id); }
function locationAtXY(x, y) {
  for (const l of LOCATIONS) {
    if (x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h) return l;
  }
  return null;
}
function inPlazaXY(x, y) {
  return x >= PLAZA.x && x <= PLAZA.x + PLAZA.w && y >= PLAZA.y && y <= PLAZA.y + PLAZA.h;
}
function myCurrentLocation() {
  if (state.localPos) return locationAtXY(state.localPos.x, state.localPos.y);
  if (state.you && typeof state.you.x === 'number') return locationAtXY(state.you.x, state.you.y);
  return locMeta(state.you?.locationId);
}
function myInPlaza() {
  if (state.localPos) return inPlazaXY(state.localPos.x, state.localPos.y);
  if (state.you && typeof state.you.x === 'number') return inPlazaXY(state.you.x, state.you.y);
  return state.you?.locationId === 'plaza';
}

function paletteColor(colorId) {
  if (!state.palette) return '#7dd3c0';
  const c = state.palette.find(p => p.id === colorId);
  return c ? c.hex : '#7dd3c0';
}
function paletteShade(colorId) {
  // Slightly darker shade for the crewmate's lower body.
  const hex = paletteColor(colorId);
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = Math.max(0, parseInt(m[1], 16) - 38);
  const g = Math.max(0, parseInt(m[2], 16) - 38);
  const b = Math.max(0, parseInt(m[3], 16) - 38);
  return `rgb(${r},${g},${b})`;
}

// ---------- socket ----------

socket.on('state', (s) => {
  const prevPhase = state.prevPhase;
  const prevMeeting = state.prevMeetingPhase;
  const prevFog = state.prevFogUntil;
  state.pub = s;

  if (prevPhase && prevPhase !== s.phase) {
    if (s.phase === 'playing' && prevPhase === 'lobby') { triggerShake(8, 400); audio.good(); }
    else if (s.phase === 'meeting') { triggerShake(6, 400); audio.meeting(); }
    else if (s.phase === 'still_moment') { triggerShake(4, 300); audio.stillOpen(); }
  }
  const nowMeetingPhase = s.meeting?.phase;
  if (s.phase === 'meeting' && prevMeeting !== 'resolved' && nowMeetingPhase === 'resolved' && s.meeting?.eliminated) {
    triggerShake(8, 500); audio.bad();
  }
  if (s.fogUntil && s.fogUntil > Date.now() && s.fogUntil !== prevFog) {
    triggerShake(6, 400); audio.sabotage();
  }
  state.prevFogUntil = s.fogUntil || 0;
  state.prevPhase = s.phase;
  state.prevMeetingPhase = nowMeetingPhase;

  drivePhase();
  updateHUD();
  updateStillReveal();
});

socket.on('you', (y) => {
  state.you = y;
  drivePhase();
  updatePlayerHUD();
});

socket.on('role_reveal', (info) => { showRoleReveal(info); });

socket.on('task_start', (task) => { audio.taskStart(); renderTaskModal(task); });
socket.on('task_cancel', () => {
  if (state.taskOverlay) { closeOverlay(state.taskOverlay); state.taskOverlay = null; }
});

socket.on('still_question', ({ question, endsAt }) => {
  triggerShake(7, 500); audio.stillOpen();
  showStillQuestion(question, endsAt);
});

socket.on('toast', ({ msg }) => {
  if (/intrude|something intruded|drift|fog|stun/i.test(msg || '')) {
    triggerShake(5, 280); audio.sabotage();
  }
  toast(msg);
});
socket.on('err', ({ msg }) => toast(msg, 3500));

socket.on('stunned', ({ until }) => {
  state.stunUntil = until || 0;
  triggerShake(8, 500);
  audio.bad();
  toast('You were stunned.', 3500);
});

socket.on('glimpse', ({ until }) => {
  toast('GLIMPSE — Distraction visible.', 1500);
  audio.good();
});

socket.on('killed', () => {
  triggerShake(14, 800);
  audio.bad();
  audio.sweep(440, 80, 0.9, 'sawtooth', 0.35);
  toast('You were killed. Drift as a ghost.', 4500);
});

socket.on('game_over', (info) => {
  triggerShake(12, 700);
  audio.sweep(660, 110, 1.0, 'triangle', 0.3);
  state.gameOver = info;
  if (state.view !== 'end') renderEnd();
  else populateEnd();
});

socket.on('positions', (ps) => {
  state.positions = ps;
  if (state.localPos && state.you) {
    const mine = ps.find(p => p.id === state.you.id);
    if (mine) {
      const dx = mine.x - state.localPos.x;
      const dy = mine.y - state.localPos.y;
      if (dx * dx + dy * dy > 160 * 160) {
        state.localPos.x = mine.x;
        state.localPos.y = mine.y;
      }
    }
  }
});

socket.on('snap_to', ({ x, y }) => {
  if (state.localPos) { state.localPos.x = x; state.localPos.y = y; }
});

socket.on('disconnect', () => toast('Disconnected — refresh to reconnect.', 5000));

// ---------- drive phase ----------

function drivePhase() {
  if (!state.pub) return;
  const phase = state.pub.phase;

  if (phase === 'lobby') {
    if (state.role === 'host' && state.view !== 'host-lobby') renderHostLobby();
    if (state.role === 'player' && state.view !== 'player-lobby') renderPlayerLobby();
    updateLobby();
  } else if (phase === 'playing' || phase === 'still_moment') {
    if (state.role === 'host' && state.view !== 'host-game') renderHostGame();
    if (state.role === 'player' && state.view !== 'player-game') renderPlayerGame();

    const appEl = $('#app');
    if (appEl) {
      if (phase === 'still_moment') appEl.classList.add('dimmed');
      else appEl.classList.remove('dimmed');
    }

    if (phase !== 'still_moment' || state.pub.stillMoment?.phase !== 'question') {
      if (state.stillOverlay && state.stillOverlay.dataset.kind === 'question') {
        closeOverlay(state.stillOverlay);
        state.stillOverlay = null;
      }
    }

    if (phase === 'still_moment' && state.pub.stillMoment?.phase === 'reveal') {
      if (!state.stillOverlay || state.stillOverlay.dataset.kind !== 'reveal') {
        if (state.stillOverlay) { closeOverlay(state.stillOverlay); state.stillOverlay = null; }
        showStillReveal();
      }
    } else {
      if (state.stillOverlay && state.stillOverlay.dataset.kind === 'reveal') {
        closeOverlay(state.stillOverlay);
        state.stillOverlay = null;
      }
    }
  } else if (phase === 'meeting') {
    if (state.view !== 'meeting') renderMeeting();
    updateMeeting();
    if (state.taskOverlay) { closeOverlay(state.taskOverlay); state.taskOverlay = null; }
    if (state.ventOverlay) { closeOverlay(state.ventOverlay); state.ventOverlay = null; }
  } else if (phase === 'ended') {
    if (state.view !== 'end') renderEnd();
  }
}

// ---------- landing ----------

function renderLanding() {
  state.view = 'landing';
  const node = useTemplate('tpl-landing');
  node.querySelector('[data-action="host"]').addEventListener('click', () => {
    audio.click();
    socket.emit('host_create', {}, (res) => {
      if (!res || !res.ok) return toast(res?.msg || 'Could not host.');
      state.role = 'host';
      state.code = res.code;
      state.palette = res.palette || null;
      state.hats = res.hats || null;
      state.faces = res.faces || null;
      state.visors = res.visors || null;
      state.accessories = res.accessories || null;
      state.pets = res.pets || null;
    });
  });
  node.querySelector('[data-action="join"]').addEventListener('click', doJoin);
  const codeIn = node.querySelector('#code-in');
  codeIn.addEventListener('input', () => codeIn.value = codeIn.value.toUpperCase().replace(/[^A-Z]/g, ''));
  codeIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin(); });
  const nameIn = node.querySelector('#name-in');
  nameIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin(); });

  const savedName = localStorage.getItem('still_name');
  if (savedName) nameIn.value = savedName;
}

function doJoin() {
  const code = ($('#code-in')?.value || '').toUpperCase();
  const name = ($('#name-in')?.value || '').trim();
  if (code.length !== 4) return toast('Enter a 4-letter code.');
  if (!name) return toast('Enter a name.');
  audio.click();
  socket.emit('player_join', { code, name }, (res) => {
    if (!res || !res.ok) return toast(res?.msg || 'Could not join.');
    state.role = 'player';
    state.code = res.code;
    state.me = res.you;
    state.palette = res.palette || null;
    state.hats = res.hats || null;
    state.faces = res.faces || null;
    state.visors = res.visors || null;
    state.accessories = res.accessories || null;
    state.pets = res.pets || null;
    localStorage.setItem('still_name', name);
  });
}

// ---------- lobby ----------

function renderHostLobby() {
  state.view = 'host-lobby';
  const node = useTemplate('tpl-host-lobby');
  node.querySelector('#code').textContent = state.pub?.code || state.code;
  node.querySelector('#join-url').textContent = location.origin;
  node.querySelector('#start').addEventListener('click', () => { audio.click(); socket.emit('start_game'); });
  updateLobby();
}

function renderPlayerLobby() {
  state.view = 'player-lobby';
  const node = useTemplate('tpl-player-lobby');
  node.querySelector('#code').textContent = state.pub?.code || state.code;
  node.querySelector('#me-name').textContent = state.me?.name || 'you';
  buildColorGrid(node.querySelector('#color-grid'));
  buildHatGrid(node.querySelector('#hat-grid'));
  buildFaceGrid(node.querySelector('#face-grid'));
  buildVisorGrid(node.querySelector('#visor-grid'));
  buildAccessoryGrid(node.querySelector('#accessory-grid'));
  buildPetGrid(node.querySelector('#pet-grid'));
  setupCustomizeTabs(node);
  drawMePreview();
  updateLobby();
}

function setupCustomizeTabs(root) {
  const tabs = root.querySelectorAll('.cust-tab');
  const panels = root.querySelectorAll('.cust-panel');
  for (const t of tabs) {
    t.addEventListener('click', () => {
      audio.click();
      const id = t.dataset.tab;
      tabs.forEach(x => x.classList.toggle('active', x === t));
      panels.forEach(p => { p.hidden = p.dataset.panel !== id; });
    });
  }
}

function buildColorGrid(grid) {
  if (!grid || !state.palette) return;
  grid.innerHTML = '';
  for (const c of state.palette) {
    const b = document.createElement('button');
    b.className = 'color-swatch';
    b.style.background = c.hex;
    b.title = c.id;
    b.dataset.color = c.id;
    b.addEventListener('click', () => {
      audio.click();
      socket.emit('change_color', { color: c.id });
    });
    grid.appendChild(b);
  }
}

function meCustomization() {
  return {
    color:     state.me?.color,
    hat:       state.me?.hat       || 'none',
    face:      state.me?.face      || 'calm',
    visor:     state.me?.visor     || 'sky',
    accessory: state.me?.accessory || 'none',
    pet:       state.me?.pet       || 'none'
  };
}

function buildChipGrid(grid, items, dataKey, override, emitName) {
  if (!grid || !items) return;
  grid.innerHTML = '';
  for (const item of items) {
    const b = document.createElement('button');
    b.className = 'hf-chip ' + dataKey + '-chip';
    b.dataset[dataKey] = item.id;
    const c = document.createElement('canvas');
    c.width = 56; c.height = 60;
    b.appendChild(c);
    const lab = document.createElement('span');
    lab.className = 'hf-label';
    lab.textContent = item.label || item.id;
    b.appendChild(lab);
    const ctx = c.getContext('2d');
    const me = meCustomization();
    const opts = { ...me, [dataKey]: item.id, ...(override || {}) };
    drawCrewmate(ctx, 28, 36, opts.color, { x: 0, y: 1 }, false, false, 1.0, false, 0, null, opts.hat, opts.face, false, opts.visor, opts.accessory, opts.pet);
    b.addEventListener('click', () => {
      audio.click();
      socket.emit(emitName, { [dataKey]: item.id });
    });
    grid.appendChild(b);
  }
}

function buildHatGrid(grid)        { buildChipGrid(grid, state.hats,        'hat',       null, 'change_hat'); }
function buildFaceGrid(grid)       { buildChipGrid(grid, state.faces,       'face',      null, 'change_face'); }
function buildVisorGrid(grid)      { buildChipGrid(grid, state.visors,      'visor',     null, 'change_visor'); }
function buildAccessoryGrid(grid)  { buildChipGrid(grid, state.accessories, 'accessory', null, 'change_accessory'); }
function buildPetGrid(grid)        { buildChipGrid(grid, state.pets,        'pet',       null, 'change_pet'); }

function drawMePreview() {
  const wrap = $('#me-preview');
  if (!wrap) return;
  wrap.innerHTML = '';
  const c = document.createElement('canvas');
  c.width = 160; c.height = 180;
  c.className = 'preview-canvas';
  wrap.appendChild(c);
  const ctx = c.getContext('2d');
  const me = meCustomization();
  drawCrewmate(ctx, 80, 90, me.color, { x: 0, y: 1 }, false, false, 2.4, false, 0, null, me.hat, me.face, false, me.visor, me.accessory, me.pet);
}

function updateLobby() {
  const ul = $('#player-list');
  if (!ul || !state.pub) return;
  ul.innerHTML = '';
  for (const p of state.pub.players) {
    const li = document.createElement('li');
    const isMe = state.me && p.id === state.me.id;
    li.innerHTML = `
      <span class="dot" style="background:${paletteColor(p.color)}"></span>
      <span class="${isMe ? 'me' : ''}">${escapeHtml(p.name)}${isMe ? ' (you)' : ''}</span>
    `;
    ul.appendChild(li);
  }
  // Mark taken colors / current selection in player-lobby grid
  if (state.role === 'player') {
    const taken = new Set(state.pub.players.filter(p => p.id !== state.me?.id).map(p => p.color));
    for (const sw of $$('.color-swatch')) {
      const c = sw.dataset.color;
      sw.classList.toggle('taken', taken.has(c));
      sw.classList.toggle('me', state.me && state.pub.players.find(p => p.id === state.me.id)?.color === c);
    }
    const mine = state.pub.players.find(p => p.id === state.me?.id);
    let changed = false;
    if (mine) {
      const fields = ['color', 'hat', 'face', 'visor', 'accessory', 'pet'];
      for (const f of fields) {
        if (mine[f] !== state.me?.[f]) { state.me = { ...state.me, [f]: mine[f] }; changed = true; }
      }
    }
    if (changed) {
      drawMePreview();
      // Re-tint chips so previews use the live color/customization
      buildHatGrid($('#hat-grid'));
      buildFaceGrid($('#face-grid'));
      buildVisorGrid($('#visor-grid'));
      buildAccessoryGrid($('#accessory-grid'));
      buildPetGrid($('#pet-grid'));
    }
    const me = state.me || {};
    for (const chip of $$('.hat-chip'))       chip.classList.toggle('me', chip.dataset.hat       === me.hat);
    for (const chip of $$('.face-chip'))      chip.classList.toggle('me', chip.dataset.face      === me.face);
    for (const chip of $$('.visor-chip'))     chip.classList.toggle('me', chip.dataset.visor     === me.visor);
    for (const chip of $$('.accessory-chip')) chip.classList.toggle('me', chip.dataset.accessory === me.accessory);
    for (const chip of $$('.pet-chip'))       chip.classList.toggle('me', chip.dataset.pet       === me.pet);
  }
  const btn = $('#start');
  const hint = $('#start-hint');
  if (btn && state.role === 'host') {
    const n = state.pub.players.length;
    btn.disabled = n < 2 || n > 20;
    if (hint) {
      if (n < 2) hint.textContent = `waiting for more players (${n}/2)`;
      else if (n > 20) hint.textContent = 'too many players (max 20)';
      else hint.textContent = `${n} crewmates ready.`;
    }
  }
}

// ---------- role reveal ----------

function showRoleReveal(info) {
  if (state.roleOverlay) closeOverlay(state.roleOverlay);
  const ol = openOverlay('tpl-role-reveal');
  state.roleOverlay = ol;
  const title = ol.querySelector('#role-title');
  const desc = ol.querySelector('#role-desc');
  if (info.role === 'distraction') {
    title.textContent = 'THE DISTRACTION';
    title.className = 'role-distraction';
    audio.sweep(200, 80, 0.6, 'sawtooth', 0.3);
  } else {
    const persona = info.persona ? PERSONAS[info.persona] : null;
    title.textContent = persona ? persona.label : 'SEEKER';
    title.className = 'role-seeker' + (info.persona ? ' persona-' + info.persona : '');
    audio.beep({ freq: 660, dur: 0.4, type: 'triangle', gain: 0.28 });
  }
  // Show note + persona power/weakness chips if present
  desc.innerHTML = '';
  const note = document.createElement('p');
  note.textContent = info.note || '';
  desc.appendChild(note);
  if (info.persona && PERSONAS[info.persona]) {
    const p = PERSONAS[info.persona];
    const chips = document.createElement('div');
    chips.className = 'persona-chips';
    chips.innerHTML = `<div class="chip power">+ ${escapeHtml(p.power)}</div><div class="chip weakness">− ${escapeHtml(p.weakness)}</div>`;
    desc.appendChild(chips);
  }
  ol.querySelector('[data-close]').addEventListener('click', () => {
    audio.click();
    closeOverlay(ol);
    state.roleOverlay = null;
  });
  setTimeout(() => { if (state.roleOverlay) { closeOverlay(state.roleOverlay); state.roleOverlay = null; } }, 14000);
}

// ---------- game ----------

function renderHostGame() {
  state.view = 'host-game';
  useTemplate('tpl-host-game');
  setupFullscreenButton();
  updateHUD();
  startRenderLoop();
}

function fmtTime(ms) {
  if (ms == null) return '—';
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function updateHUD() {
  if (!state.pub) return;
  const calm = $('#calm-fill'); if (calm) calm.style.width = state.pub.calm + '%';
  const ml = $('#meetings-label'); if (ml) ml.textContent = `meetings: ${state.pub.meetingsLeft}`;
  const tl = $('#tasks-label'); if (tl) tl.textContent = `tasks: ${state.pub.tasksDone}/${state.pub.tasksTotal || 0}`;
  const tm = $('#timer-label'); if (tm) tm.textContent = fmtTime(state.pub.timeLeftMs);
  const fl = $('#drift-label'); if (fl) fl.hidden = !state.pub.driftActive;
  const log = $('#log');
  if (log && state.view === 'host-game') {
    log.innerHTML = '';
    for (const e of state.pub.log) {
      const d = document.createElement('div');
      d.className = 'entry';
      d.textContent = '· ' + e.text;
      log.appendChild(d);
    }
    log.scrollTop = log.scrollHeight;
  }
  if (state.view === 'player-game') updatePlayerHUD();
}

function renderPlayerGame() {
  state.view = 'player-game';
  useTemplate('tpl-player-game');

  state.localPos = {
    x: (state.you && typeof state.you.x === 'number') ? state.you.x : 1000,
    y: (state.you && typeof state.you.y === 'number') ? state.you.y : 740
  };
  state.lastMoveTick = performance.now();
  state.lastMoveSent = 0;

  setupDPad();
  setupKeyboard();
  setupActButton();
  setupFullscreenButton();

  $('#meeting-btn').addEventListener('click', () => {
    if (state.pub?.phase !== 'playing') return toast('Not a good time.');
    if (state.pub.meetingsLeft <= 0) return toast('No meetings left.');
    if (state.you?.locationId !== 'cafeteria') return toast('Go to the cafeteria.');
    audio.click();
    socket.emit('call_meeting');
  });

  updatePlayerHUD();
  startRenderLoop();
  startMovementLoop();

  clearInterval(state.cooldownTicker);
  state.cooldownTicker = setInterval(updateSabotageCooldowns, 200);
}

function updatePlayerHUD() {
  if (state.view !== 'player-game' || !state.you || !state.pub) return;
  const chip = $('#role-chip');
  if (chip) {
    let label, cls;
    if (state.you.role === 'distraction') { label = 'DISTRACTION'; cls = 'distraction'; }
    else if (state.you.role === 'seeker') {
      const persona = PERSONAS[state.you.persona];
      label = persona ? persona.label : 'SEEKER';
      cls = 'seeker' + (persona ? ' persona-' + state.you.persona : '');
    }
    else { label = 'NO ROLE'; cls = ''; }
    if (state.you.eliminated) label = 'GHOST · ' + label;
    chip.className = 'role-chip ' + cls;
    chip.textContent = label;
  }
  const locLabel = $('#loc-label');
  if (locLabel) {
    const l = locMeta(state.you.locationId);
    if (l) locLabel.textContent = l.name;
    else if (state.you.locationId === 'cafeteria') locLabel.textContent = 'CAFETERIA';
    else locLabel.textContent = '— corridor —';
  }

  // HUD pills
  const ht = $('#hud-tasks');
  if (ht) {
    const timeStr = fmtTime(state.pub.timeLeftMs);
    if (state.you.role === 'seeker' && !state.you.eliminated) {
      const myDone = (state.you.assignedTasks || []).filter(t => t.completed).length;
      const myTotal = (state.you.assignedTasks || []).length;
      const persona = PERSONAS[state.you.persona];
      const personaPill = persona
        ? `<span class="hud-pill persona persona-${state.you.persona}">${persona.tagline}</span>`
        : '';
      const jumpPill = (state.you.persona === 'board')
        ? (() => {
            const cd = Math.max(0, (state.you.boardJumpCooldownUntil || 0) - Date.now());
            return cd > 0
              ? `<span class="hud-pill">JUMP <strong>${Math.ceil(cd/1000)}s</strong></span>`
              : `<span class="hud-pill on">JUMP READY</span>`;
          })()
        : '';
      ht.innerHTML = `<span class="hud-pill">tasks <strong>${myDone}/${myTotal}</strong></span> ` +
        `<span class="hud-pill">crew <strong>${state.pub.tasksDone}/${state.pub.tasksTotal}</strong></span> ` +
        `<span class="hud-pill timer">${timeStr}</span> ` + personaPill + ' ' + jumpPill;
    } else if (state.you.role === 'distraction' && !state.you.eliminated) {
      const ventStatus = state.you.onVent ? '<span class="hud-pill on">ON VENT</span>' : '';
      ht.innerHTML = `<span class="hud-pill">crew <strong>${state.pub.tasksDone}/${state.pub.tasksTotal}</strong></span> ` +
        `<span class="hud-pill timer">${timeStr}</span> ${ventStatus}`;
    } else {
      ht.innerHTML = `<span class="hud-pill timer">${timeStr}</span>`;
    }
  }

  // Personal task checklist (Seeker only)
  const tl = $('#task-list');
  if (tl) {
    if (state.you.role === 'seeker' && !state.you.eliminated && Array.isArray(state.you.assignedTasks)) {
      tl.innerHTML = '';
      tl.hidden = false;
      for (const t of state.you.assignedTasks) {
        const here = state.you.locationId === t.locationId && !t.completed;
        const li = document.createElement('div');
        li.className = 'task-item' + (t.completed ? ' done' : '') + (here ? ' here' : '');
        li.innerHTML =
          `<span class="task-mark">${t.completed ? '✓' : (here ? '▶' : '·')}</span>` +
          `<span class="task-loc">${escapeHtml((locMeta(t.locationId)?.name) || t.locationId)}</span>` +
          `<span class="task-label">${escapeHtml(t.label)}</span>`;
        tl.appendChild(li);
      }
    } else {
      tl.hidden = true;
    }
  }

  renderSabotageBar();

  const mbtn = $('#meeting-btn');
  if (mbtn) {
    const inCafeteria = state.you.locationId === 'cafeteria';
    const disabled = state.pub.meetingsLeft <= 0 || state.you.eliminated || state.pub.phase !== 'playing' || !inCafeteria;
    mbtn.disabled = disabled;
    const sub = mbtn.querySelector('#meeting-sub');
    if (sub) {
      if (state.pub.meetingsLeft <= 0) sub.textContent = 'NONE LEFT';
      else if (!inCafeteria) sub.textContent = 'CAFETERIA ONLY';
      else sub.textContent = `${state.pub.meetingsLeft} LEFT`;
    }
    mbtn.classList.toggle('depleted', state.pub.meetingsLeft <= 0);
  }

  updateActButton();
}

function actContext() {
  // Returns one of: 'kill' | 'report' | 'vent' | 'task' | 'jump' | 'idle'
  // Bodies are visual cues; standing over one lets ACT call a meeting (free —
  // doesn't consume the emergency-meeting tokens). Distractions can self-report.
  if (!state.you || state.you.eliminated || state.pub?.phase !== 'playing') return 'idle';
  const isDistraction = state.you.role === 'distraction';
  const body = nearestBody();
  if (isDistraction) {
    const k = nearestKillTarget();
    const onCD = (state.you.killCooldownUntil || 0) > Date.now();
    if (k && !onCD) return { kind: 'kill', target: k };
    if (body) return { kind: 'report', target: body };
    if (state.you.onVent) return { kind: 'vent' };
    return 'idle';
  } else {
    if (state.you.activeTask) return 'idle';
    if (body) return { kind: 'report', target: body };
    // Board persona: ACT triggers JUMP picker if not in a task room.
    if (state.you.persona === 'board' && !pickAssignedHere()) {
      const onCd = (state.you.boardJumpCooldownUntil || 0) > Date.now();
      if (!onCd) return { kind: 'jump' };
    }
    if (myCurrentLocation() && pickAssignedHere()) return { kind: 'task' };
    return 'idle';
  }
}

function pickAssignedHere() {
  if (!state.you || !Array.isArray(state.you.assignedTasks)) return null;
  return state.you.assignedTasks.find(t => !t.completed && t.locationId === state.you.locationId);
}

function nearestKillTarget() {
  if (!state.you || state.you.role !== 'distraction' || state.you.eliminated) return null;
  const me = state.localPos || { x: state.you.x, y: state.you.y };
  const positions = state.positions && state.positions.length ? state.positions : (state.pub?.players || []);
  let best = null, bestD = KILL_RANGE * KILL_RANGE;
  for (const p of positions) {
    if (!p || p.id === state.you.id || p.eliminated) continue;
    const dx = p.x - me.x, dy = p.y - me.y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= bestD) { bestD = d2; best = p; }
  }
  return best;
}

function nearestBody() {
  if (!state.you || state.you.eliminated) return null;
  const me = state.localPos || { x: state.you.x, y: state.you.y };
  const bodies = state.pub?.bodies || [];
  let best = null, bestD = REPORT_RANGE * REPORT_RANGE;
  for (const b of bodies) {
    const dx = b.x - me.x, dy = b.y - me.y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= bestD) { bestD = d2; best = b; }
  }
  return best;
}

function updateActButton() {
  const act = $('#act-btn');
  if (!act || !state.you || !state.pub) return;
  const ctx = actContext();
  act.classList.remove('vent-mode', 'jump-mode', 'kill-mode', 'report-mode', 'stunned');
  // Stunned override
  if (state.you.stunUntil && state.you.stunUntil > Date.now()) {
    act.textContent = 'STUNNED';
    act.classList.add('stunned');
    act.disabled = true;
    return;
  }
  if (ctx && ctx.kind === 'kill') {
    act.textContent = 'KILL';
    act.classList.add('kill-mode');
    act.disabled = false;
  } else if (ctx && ctx.kind === 'report') {
    act.textContent = 'REPORT';
    act.classList.add('report-mode');
    act.disabled = false;
  } else if (ctx && ctx.kind === 'vent') {
    act.textContent = 'VENT';
    act.classList.add('vent-mode');
    act.disabled = state.pub.phase !== 'playing';
  } else if (ctx && ctx.kind === 'jump') {
    act.textContent = 'JUMP';
    act.classList.add('jump-mode');
    act.disabled = false;
  } else if (ctx && ctx.kind === 'task') {
    act.textContent = 'ACT';
    act.disabled = !!state.you.activeTask;
  } else {
    // Distraction with kill on cooldown gets a countdown so they can plan.
    if (state.you.role === 'distraction') {
      const cd = Math.max(0, (state.you.killCooldownUntil || 0) - Date.now());
      if (cd > 0) {
        act.textContent = `KILL ${Math.ceil(cd/1000)}s`;
        act.disabled = true;
      } else {
        act.textContent = '—';
        act.disabled = true;
      }
    } else {
      act.textContent = 'ACT';
      act.disabled = true;
    }
  }
}

function renderSabotageBar() {
  const bar = $('#sabotage-bar');
  if (!bar) return;
  bar.innerHTML = '';
  if (!state.you || state.you.role !== 'distraction' || state.you.eliminated) return;
  for (const s of SAB_KINDS) {
    const b = document.createElement('button');
    b.className = 'btn';
    b.dataset.sabKind = s.kind;
    b.innerHTML = `<div>${s.label}</div><div class="sab-help">${s.help}</div>`;
    b.addEventListener('click', () => { audio.click(); socket.emit('sabotage', { kind: s.kind }); });
    bar.appendChild(b);
  }
  updateSabotageCooldowns();
}

function updateSabotageCooldowns() {
  if (!state.you || state.you.role !== 'distraction') return;
  const remaining = Math.max(0, (state.you.sabotageCooldownUntil || 0) - Date.now());
  const cooling = remaining > 0;
  for (const b of $$('#sabotage-bar .btn')) {
    b.disabled = cooling || state.pub?.phase !== 'playing';
    const kind = b.dataset.sabKind;
    const def = SAB_KINDS.find(s => s.kind === kind);
    if (!def) continue;
    if (cooling) {
      const secs = Math.ceil(remaining / 1000);
      b.innerHTML = `<div>${def.label}</div><div class="sab-help">${secs}s</div>`;
    } else {
      b.innerHTML = `<div>${def.label}</div><div class="sab-help">${def.help}</div>`;
    }
  }
}

// ---------- input ----------

function setupDPad() {
  for (const btn of $$('.pad[data-dir]')) {
    const dir = btn.dataset.dir;
    const down = (e) => { e.preventDefault(); state.inputs[dir] = true; };
    const up = (e) => { e.preventDefault(); state.inputs[dir] = false; };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
  }
}

function setupKeyboard() {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

function onKeyDown(e) {
  if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
  const k = e.key;
  if (k === 'ArrowUp' || k === 'w' || k === 'W') { state.inputs.up = true; e.preventDefault(); }
  if (k === 'ArrowDown' || k === 's' || k === 'S') { state.inputs.down = true; e.preventDefault(); }
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') { state.inputs.left = true; e.preventDefault(); }
  if (k === 'ArrowRight' || k === 'd' || k === 'D') { state.inputs.right = true; e.preventDefault(); }
  if (k === ' ' || k === 'e' || k === 'E') {
    const act = $('#act-btn'); if (act) act.click();
  }
}
function onKeyUp(e) {
  const k = e.key;
  if (k === 'ArrowUp' || k === 'w' || k === 'W') state.inputs.up = false;
  if (k === 'ArrowDown' || k === 's' || k === 'S') state.inputs.down = false;
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') state.inputs.left = false;
  if (k === 'ArrowRight' || k === 'd' || k === 'D') state.inputs.right = false;
}

function setupFullscreenButton() {
  const btn = $('#fs-btn');
  if (!btn) return;
  const sync = () => { btn.classList.toggle('on', !!document.fullscreenElement); };
  btn.addEventListener('click', () => {
    audio.click();
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      req && req.call(el).catch(() => toast('Fullscreen blocked by the browser.'));
    }
  });
  document.addEventListener('fullscreenchange', sync);
  sync();
}

function setupActButton() {
  const act = $('#act-btn');
  if (!act) return;
  act.addEventListener('click', () => {
    if (!state.you || !state.pub) return;
    if (state.pub.phase !== 'playing' || state.you.eliminated) return;
    if (state.you.stunUntil && state.you.stunUntil > Date.now()) {
      toast('You are stunned.');
      return;
    }

    const ctx = actContext();
    if (ctx && ctx.kind === 'kill') {
      audio.click();
      socket.emit('kill', { targetId: ctx.target.id });
      return;
    }
    if (ctx && ctx.kind === 'report') {
      audio.click();
      socket.emit('report_body');
      return;
    }
    if (ctx && ctx.kind === 'vent') {
      audio.click();
      openVentPicker();
      return;
    }
    if (ctx && ctx.kind === 'jump') {
      audio.click();
      openJumpPicker();
      return;
    }
    if (ctx && ctx.kind === 'task') {
      if (state.you.activeTask) return;
      audio.click();
      if (state.localPos) socket.emit('move', { x: state.localPos.x, y: state.localPos.y });
      socket.emit('start_task');
      return;
    }
    // idle — give a tiny hint
    if (state.you.role === 'distraction') {
      const cd = Math.max(0, (state.you.killCooldownUntil || 0) - Date.now());
      if (cd > 0) toast(`Kill on cooldown (${Math.ceil(cd/1000)}s).`);
      else toast('Get closer to a Seeker, find a vent, or sabotage.');
    } else {
      if (myInPlaza()) toast('Walk into a room first.');
      else if (!myCurrentLocation()) toast('Walk into a location first.');
    }
  });
}

function isWalkable(x, y) {
  for (const r of WALKABLE) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
  }
  return false;
}

function startMovementLoop() {
  function tick() {
    if (state.view !== 'player-game') return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - state.lastMoveTick) / 1000);
    state.lastMoveTick = now;

    if (state.localPos && state.you && !state.you.eliminated && state.pub?.phase === 'playing') {
      let vx = 0, vy = 0;
      if (state.inputs.up) vy -= 1;
      if (state.inputs.down) vy += 1;
      if (state.inputs.left) vx -= 1;
      if (state.inputs.right) vx += 1;

      const moving = !!(vx || vy);
      state.walking = moving;
      if (moving) {
        const n = Math.hypot(vx, vy) || 1;
        vx /= n; vy /= n;
        state.facing = { x: vx, y: vy };
        state.walkPhase += dt * 9;

        const step = MOVE_SPEED * dt;
        const tx = state.localPos.x + vx * step;
        const ty = state.localPos.y + vy * step;
        let nx = tx, ny = ty;
        if (!isWalkable(nx, ny)) {
          if (isWalkable(state.localPos.x, ny))      nx = state.localPos.x;
          else if (isWalkable(nx, state.localPos.y)) ny = state.localPos.y;
          else { nx = state.localPos.x; ny = state.localPos.y; }
        }
        state.localPos.x = Math.max(0, Math.min(MAP_W, nx));
        state.localPos.y = Math.max(0, Math.min(MAP_H, ny));

        if (now - state.lastMoveSent > 80) {
          socket.emit('move', { x: state.localPos.x, y: state.localPos.y });
          state.lastMoveSent = now;
        }
      }
      const locLabel = $('#loc-label');
      if (locLabel) {
        const l = myCurrentLocation();
        if (l) locLabel.textContent = l.name;
        else if (myInPlaza()) locLabel.textContent = 'CAFETERIA';
        else locLabel.textContent = '— corridor —';
      }
      // Re-evaluate the ACT button context every frame so KILL/REPORT
      // states light up the moment we get within range.
      updateActButton();
    }
    requestAnimationFrame(tick);
  }
  state.lastMoveTick = performance.now();
  tick();
}

// ---------- vent picker ----------

function openVentPicker() {
  if (state.ventOverlay) closeOverlay(state.ventOverlay);
  const ol = openOverlay('tpl-vent');
  state.ventOverlay = ol;
  ol.querySelector('[data-close]').addEventListener('click', () => {
    closeOverlay(ol); state.ventOverlay = null;
  });
  const list = ol.querySelector('#vent-list');
  for (const v of VENTS) {
    if (v.id === state.you?.onVent) continue;
    const b = document.createElement('button');
    b.className = 'btn vent-target';
    b.innerHTML = `<div class="vent-room">${escapeHtml(locMeta(v.roomId)?.name || v.roomId)}</div>` +
                  `<div class="vent-sub">VENT</div>`;
    b.addEventListener('click', () => {
      socket.emit('vent_to', { ventId: v.id });
      audio.vent();
      closeOverlay(ol); state.ventOverlay = null;
    });
    list.appendChild(b);
  }
}

// ---------- jump picker (Board persona) ----------

function openJumpPicker() {
  if (state.ventOverlay) closeOverlay(state.ventOverlay);
  const ol = openOverlay('tpl-vent');
  state.ventOverlay = ol;
  ol.querySelector('h3').textContent = 'JUMP';
  ol.querySelector('.hint').textContent = 'pick an unfinished task room.';
  ol.querySelector('[data-close]').addEventListener('click', () => {
    closeOverlay(ol); state.ventOverlay = null;
  });
  const list = ol.querySelector('#vent-list');
  const targets = (state.you.assignedTasks || [])
    .filter(t => !t.completed)
    .reduce((acc, t) => { if (!acc.includes(t.locationId)) acc.push(t.locationId); return acc; }, []);
  for (const locId of targets) {
    const b = document.createElement('button');
    b.className = 'btn vent-target';
    b.innerHTML = `<div class="vent-room">${escapeHtml(locMeta(locId)?.name || locId)}</div>` +
                  `<div class="vent-sub">JUMP</div>`;
    b.addEventListener('click', () => {
      socket.emit('board_jump', { locationId: locId });
      audio.vent();
      closeOverlay(ol); state.ventOverlay = null;
    });
    list.appendChild(b);
  }
}

// ---------- canvas ----------

function startRenderLoop() {
  cancelAnimationFrame(state.rafId);
  function frame() {
    if (state.view !== 'host-game' && state.view !== 'player-game') return;
    drawMap();
    state.anim += 0.02;
    state.rafId = requestAnimationFrame(frame);
  }
  frame();
}

function drawMap() {
  const canvas = $('#map');
  if (!canvas) return;
  // Match the canvas backing buffer to its displayed size (× devicePixelRatio)
  // so the map renders crisp at any viewport size, not blurry-stretched.
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const targetW = Math.max(2, Math.round(rect.width  * dpr));
  const targetH = Math.max(2, Math.round(rect.height * dpr));
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.save();
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  const isPlayer = state.view === 'player-game';
  let camX = 0, camY = 0, scale = 1;
  if (isPlayer && state.localPos) {
    scale = W / PLAYER_VIEW_W;
    const viewW = W / scale, viewH = H / scale;
    camX = Math.max(0, Math.min(MAP_W - viewW, state.localPos.x - viewW / 2));
    camY = Math.max(0, Math.min(MAP_H - viewH, state.localPos.y - viewH / 2));
  } else {
    scale = Math.min(W / MAP_W, H / MAP_H);
    camX = (MAP_W - W / scale) / 2;
    camY = (MAP_H - H / scale) / 2;
  }
  const now = performance.now();
  if (state.shake.until > now) {
    const remaining = (state.shake.until - now) / state.shake.duration;
    const amp = state.shake.intensity * Math.max(0, remaining);
    const sx = (Math.random() * 2 - 1) * amp;
    const sy = (Math.random() * 2 - 1) * amp;
    ctx.translate(sx, sy);
  }
  ctx.scale(scale, scale);
  ctx.translate(-camX, -camY);

  // Corridors render first — concrete-gray strips that visually distinguish
  // them from the themed rooms. No explicit "walls" — Among Us-style, the
  // floor color contrast against the black background does the work.
  for (const c of CORRIDORS) drawCorridor(ctx, c);
  // Cafeteria + themed rooms paint on top.
  drawRoom(ctx, PLAZA);
  for (const loc of LOCATIONS) drawRoom(ctx, loc);

  // Vents (drawn on top of floor, beneath players)
  for (const v of VENTS) drawVent(ctx, v);

  // Bodies (drawn beneath players)
  for (const b of (state.pub?.bodies || [])) drawBody(ctx, b);

  // Glimpse: render a translucent silhouette of any visible Distraction.
  if (state.pub?.glimpseActive && Array.isArray(state.pub.distractionPositions)) {
    for (const dp of state.pub.distractionPositions) {
      ctx.save();
      ctx.fillStyle = 'rgba(168, 193, 255, 0.28)';
      ctx.beginPath();
      ctx.arc(dp.x, dp.y - 4, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(168, 193, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dp.x, dp.y - 4, 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(168, 193, 255, 0.9)';
      ctx.font = '600 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GLIMPSE', dp.x, dp.y - 50);
      ctx.restore();
    }
  }

  // Room labels
  ctx.textAlign = 'center';
  for (const loc of LOCATIONS) {
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(loc.name, loc.x + loc.w / 2, loc.y + 32);
  }
  ctx.font = '600 22px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 4;
  ctx.strokeText('PLAZA', PLAZA.x + PLAZA.w / 2, PLAZA.y + 32);
  ctx.fillText('PLAZA', PLAZA.x + PLAZA.w / 2, PLAZA.y + 32);

  // Players (drawn last)
  const positions = (state.positions && state.positions.length)
    ? state.positions
    : (state.pub?.players || []);
  for (const p of positions) {
    const isMe = state.you && p.id === state.you.id;
    const px = (isMe && state.localPos) ? state.localPos.x : p.x;
    const py = (isMe && state.localPos) ? state.localPos.y : p.y;
    if (typeof px !== 'number' || typeof py !== 'number') continue;

    let walking, phase, facing;
    if (isMe) {
      walking = !!state.walking;
      phase = state.walkPhase;
      facing = state.facing;
    } else {
      const m = peerMotion(p, px, py);
      walking = m.walking;
      phase = m.phase;
      state.peerFacing = state.peerFacing || {};
      const prev = state.peerFacing[p.id] || { x: 0, y: 1 };
      if (walking) {
        const dx = px - m.prevX, dy = py - m.prevY;
        const n = Math.hypot(dx, dy);
        if (n > 0.1) { prev.x = dx / n; prev.y = dy / n; }
      }
      state.peerFacing[p.id] = prev;
      facing = prev;
    }

    drawCrewmate(ctx, px, py, p.color, facing, !!p.eliminated, isMe, 1.7, walking, phase, p.name, p.hat || 'none', p.face || 'calm', !!p.stunned, p.visor || 'sky', p.accessory || 'none', p.pet || 'none');
  }

  ctx.restore();

  // Fog overlay (player view only, seekers only) — formerly BLACKOUT
  if (isPlayer && state.you && state.you.role === 'seeker') {
    const left = (state.pub?.fogUntil || 0) - Date.now();
    if (left > 0) {
      const alpha = Math.min(0.92, left / 7000 + 0.5);
      ctx.save();
      const grad = ctx.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, Math.max(W, H) * 0.55);
      grad.addColorStop(0, `rgba(20,30,50,${alpha * 0.35})`);
      grad.addColorStop(1, `rgba(20,30,50,${alpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(168,193,255,${0.8 * Math.min(1, left / 1500)})`;
      ctx.font = '300 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FOG', W / 2, H / 2);
      ctx.restore();
    }
  }

  // Time-out warning (last 30s pulses red on the host map)
  if (!isPlayer && state.pub?.timeLeftMs != null && state.pub.timeLeftMs <= 30000 && state.pub.timeLeftMs > 0) {
    const t = (state.anim || 0);
    ctx.save();
    ctx.fillStyle = `rgba(220, 70, 70, ${0.18 + 0.12 * Math.sin(t * 6)})`;
    ctx.fillRect(0, 0, W, 8);
    ctx.fillRect(0, H - 8, W, 8);
    ctx.restore();
  }
}

// ---- room rendering: clean cartoon-vector ----
// Each room is drawn as a small "scene": a solid floor (with a subtle
// diagonal-stripe pattern for grip), an inner inset-shadow border to give
// depth, then 2-4 hero props. Props are deterministic and animation-aware
// (no Math.random per-frame) so the rooms don't shimmer.

function drawRoom(ctx, r) {
  const theme = r.theme || r.id;
  const pal = ROOM_PALETTE[theme] || ROOM_PALETTE.plaza;

  // Floor base
  ctx.fillStyle = pal.floor;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Inner inset shadow (gives the room a "sunken floor" look)
  const inset = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  inset.addColorStop(0, 'rgba(0,0,0,0.18)');
  inset.addColorStop(0.15, 'rgba(0,0,0,0)');
  inset.addColorStop(0.85, 'rgba(0,0,0,0)');
  inset.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = inset;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Theme-specific floor pattern
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  if (theme === 'library' || theme === 'cafe' || theme === 'archive' || theme === 'lounge' || theme === 'sauna') drawWoodFloorPattern(ctx, r, pal);
  else if (theme === 'park') drawGrassPattern(ctx, r, pal);
  else if (theme === 'plaza' || theme === 'cafeteria') drawTilePattern(ctx, r, pal);
  else if (theme === 'transit' || theme === 'storage' || theme === 'workshop') drawConcretePattern(ctx, r, pal);
  else if (theme === 'arcade') drawGridPattern(ctx, r, pal, 'rgba(236, 72, 153, 0.10)');
  else if (theme === 'lab') drawGridPattern(ctx, r, pal, 'rgba(45, 212, 191, 0.10)');
  else if (theme === 'observatory') drawStarfieldPattern(ctx, r, pal);
  else if (theme === 'street') drawSnowPattern(ctx, r, pal);
  ctx.restore();

  // Theme-specific props
  if (theme === 'archive')     drawArchiveRoom(ctx, r, pal);
  if (theme === 'library')     drawLibraryRoom(ctx, r, pal);
  if (theme === 'sauna')       drawSaunaRoom(ctx, r, pal);
  if (theme === 'lab')         drawLabRoom(ctx, r, pal);
  if (theme === 'arcade')      drawArcadeRoom(ctx, r, pal);
  if (theme === 'workshop')    drawWorkshopRoom(ctx, r, pal);
  if (theme === 'cafe')        drawCafeRoom(ctx, r, pal);
  if (theme === 'park')        drawParkRoom(ctx, r, pal);
  if (theme === 'storage')     drawStorageRoom(ctx, r, pal);
  if (theme === 'transit')     drawTransitRoom(ctx, r, pal);
  if (theme === 'lounge')      drawLoungeRoom(ctx, r, pal);
  if (theme === 'observatory') drawObservatoryRoom(ctx, r, pal);
  if (theme === 'street')      drawStreetRoom(ctx, r, pal);
  if (theme === 'plaza' || theme === 'cafeteria') drawPlazaRoom(ctx, r, pal);
}

function drawStarfieldPattern(ctx, r, pal) {
  // Deep blue night sky with stars. Animated twinkle synced to state.anim.
  ctx.fillStyle = pal.dim;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  const t = state.anim || 0;
  // Faint nebula
  const grd = ctx.createRadialGradient(r.x + r.w * 0.65, r.y + r.h * 0.4, 0, r.x + r.w * 0.65, r.y + r.h * 0.4, r.w * 0.6);
  grd.addColorStop(0, 'rgba(80, 100, 200, 0.18)');
  grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grd;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  // Stars (deterministic by position)
  for (let sy = r.y + 14; sy < r.y + r.h - 6; sy += 18) {
    for (let sx = r.x + 14; sx < r.x + r.w - 6; sx += 22) {
      const seed = (sx * 31 + sy * 17) % 100;
      if (seed < 35) continue;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + seed));
      const sz = (seed % 6 < 1) ? 1.6 : 1.0;
      ctx.fillStyle = `rgba(220, 230, 255, ${tw})`;
      ctx.beginPath();
      ctx.arc(sx + (seed % 7), sy + (seed % 5), sz, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSnowPattern(ctx, r, pal) {
  // Cobblestone street with falling snow.
  ctx.fillStyle = pal.dim;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  // Cobble bricks
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1;
  const bw = 32, bh = 22;
  for (let yy = 0; yy < r.h; yy += bh) {
    for (let xx = 0; xx < r.w; xx += bw) {
      const ox = (Math.floor(yy / bh) % 2) * (bw / 2);
      ctx.strokeRect(r.x + ((xx + ox) % r.w), r.y + yy, bw, bh);
    }
  }
  // Snow accumulation along bottom
  ctx.fillStyle = 'rgba(240, 245, 255, 0.55)';
  ctx.fillRect(r.x, r.y + r.h - 6, r.w, 6);
  // Falling snowflakes (animated by state.anim)
  const t = state.anim || 0;
  for (let i = 0; i < 24; i++) {
    const seed = i * 17 + 3;
    const sx = r.x + ((seed * 53) % r.w);
    const drift = ((t * 60 + seed * 13) % (r.h)) ;
    const sy = r.y + drift;
    const sz = (seed % 3 === 0) ? 1.6 : 1.0;
    ctx.fillStyle = `rgba(240, 245, 255, ${0.4 + (seed % 5) * 0.1})`;
    ctx.beginPath();
    ctx.arc(sx + Math.sin(t + i) * 4, sy, sz, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSaunaRoom(ctx, r, pal) {
  // Wooden box with horizontal plank lines drawn extra prominent.
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.2;
  for (let y = r.y + 16; y < r.y + r.h; y += 22) {
    ctx.beginPath();
    ctx.moveTo(r.x + 4, y);
    ctx.lineTo(r.x + r.w - 4, y);
    ctx.stroke();
  }
  // Bench (long wood board across the room)
  ctx.fillStyle = '#a05a22';
  roundRectFill(ctx, r.x + 14, r.y + r.h - 56, r.w - 28, 16, 3);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = '#7a3e10';
  roundRectFill(ctx, r.x + 22, r.y + r.h - 38, r.w - 44, 6, 2);
  // Stove with rocks
  const sx = r.x + 22, sy = r.y + 56;
  ctx.fillStyle = '#262026';
  roundRectFill(ctx, sx, sy, 44, 50, 4);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // Rocks on top
  ctx.fillStyle = '#5a5a5a';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(sx + 6 + i * 8, sy + 4, 4 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }
  // Heat shimmer (animated)
  const t = state.anim || 0;
  ctx.fillStyle = `rgba(255, 178, 122, ${0.18 + 0.06 * Math.sin(t * 3)})`;
  ctx.beginPath();
  ctx.ellipse(sx + 22, sy - 14, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Steam wisps
  ctx.strokeStyle = `rgba(255, 220, 180, ${0.25})`;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const baseY = sy - 18 - i * 8;
    ctx.moveTo(sx + 10 + i * 10, baseY);
    ctx.bezierCurveTo(sx + 16 + i * 10 + Math.sin(t + i) * 4, baseY - 8,
                      sx + 4 + i * 10 + Math.sin(t * 1.4 + i) * 4,  baseY - 14,
                      sx + 12 + i * 10, baseY - 22);
    ctx.stroke();
  }
  // Sand timer
  const tx = r.x + r.w - 50, ty = r.y + 60;
  ctx.fillStyle = '#caa674';
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx + 22, ty);
  ctx.lineTo(tx + 11, ty + 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(tx + 11, ty + 14);
  ctx.lineTo(tx, ty + 28);
  ctx.lineTo(tx + 22, ty + 28);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#7a5530';
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function drawObservatoryRoom(ctx, r, pal) {
  // Telescope on a tripod, plus a star chart on the wall.
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h - 90;
  // Tripod legs
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);     ctx.lineTo(cx - 22, cy + 56);
  ctx.moveTo(cx, cy);     ctx.lineTo(cx + 22, cy + 56);
  ctx.moveTo(cx, cy);     ctx.lineTo(cx, cy + 60);
  ctx.stroke();
  // Mount
  ctx.fillStyle = '#374151';
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();
  // Telescope tube — angled up to the right
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.7);
  ctx.fillStyle = '#1f2937';
  roundRectFill(ctx, -8, -50, 16, 56, 4);
  ctx.strokeStyle = '#0b0f17';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // Aperture
  ctx.fillStyle = '#a8c1ff';
  ctx.beginPath();
  ctx.arc(0, -50, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Eyepiece
  ctx.fillStyle = '#0b0f17';
  ctx.fillRect(cx + 4, cy - 4, 4, 10);
  // Star chart on wall (top-left)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  roundRectFill(ctx, r.x + 18, r.y + 56, 80, 56, 3);
  ctx.strokeStyle = 'rgba(168, 193, 255, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Constellation lines
  const points = [
    [r.x + 32, r.y + 72],
    [r.x + 50, r.y + 80],
    [r.x + 64, r.y + 70],
    [r.x + 80, r.y + 90],
    [r.x + 70, r.y + 100]
  ];
  ctx.strokeStyle = 'rgba(168, 193, 255, 0.7)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
  ctx.fillStyle = '#fde68a';
  for (const [x, y] of points) {
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStreetRoom(ctx, r, pal) {
  // Lamp post in the middle, snowy ground, distant building silhouettes.
  // Distant skyline
  ctx.fillStyle = 'rgba(60, 75, 100, 0.55)';
  for (let i = 0; i < 5; i++) {
    const bx = r.x + 12 + i * 60;
    const bh = 30 + (i % 3) * 14;
    ctx.fillRect(bx, r.y + 18, 44, bh);
    // Windows
    ctx.fillStyle = `rgba(255, 220, 140, ${0.3 + (i % 2) * 0.2})`;
    for (let wy = 0; wy < bh; wy += 8) {
      for (let wx = 0; wx < 44; wx += 10) {
        if ((wy + wx + i) % 14 < 4) ctx.fillRect(bx + wx + 2, r.y + 22 + wy, 4, 4);
      }
    }
    ctx.fillStyle = 'rgba(60, 75, 100, 0.55)';
  }
  // Lamp post (off-center)
  const lx = r.x + r.w * 0.6;
  const ly = r.y + r.h - 130;
  ctx.fillStyle = '#1f2532';
  ctx.fillRect(lx - 1.5, ly, 3, 110);
  // Lamp head
  ctx.fillStyle = '#0f1421';
  roundRectFill(ctx, lx - 8, ly - 14, 16, 14, 3);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Glow
  const t = state.anim || 0;
  const intens = 0.55 + 0.08 * Math.sin(t * 5);
  const grd = ctx.createRadialGradient(lx, ly - 4, 4, lx, ly - 4, 80);
  grd.addColorStop(0, `rgba(255, 220, 140, ${intens})`);
  grd.addColorStop(1, 'rgba(255, 220, 140, 0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(lx, ly - 4, 80, 0, Math.PI * 2);
  ctx.fill();
  // Bulb
  ctx.fillStyle = `rgba(255, 240, 180, ${intens})`;
  ctx.beginPath();
  ctx.arc(lx, ly - 4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Bench at the bottom (snowed on)
  ctx.fillStyle = '#3a2a1a';
  roundRectFill(ctx, r.x + 24, r.y + r.h - 50, 80, 8, 2);
  ctx.fillStyle = '#dde6f5';
  roundRectFill(ctx, r.x + 22, r.y + r.h - 54, 84, 4, 2);
  // Bench legs
  ctx.fillStyle = '#1a0e06';
  ctx.fillRect(r.x + 30, r.y + r.h - 42, 4, 18);
  ctx.fillRect(r.x + 90, r.y + r.h - 42, 4, 18);
}

// ---- floor patterns ----

function drawWoodFloorPattern(ctx, r, pal) {
  // Plank seams (horizontal lines, alternating staggered)
  ctx.strokeStyle = 'rgba(0,0,0,0.32)';
  ctx.lineWidth = 1;
  const plankH = 28;
  for (let y = r.y + plankH; y < r.y + r.h; y += plankH) {
    ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.20)';
  let row = 0;
  for (let y = r.y; y < r.y + r.h; y += plankH) {
    const offset = (row % 2) ? 90 : 0;
    for (let x = r.x + offset; x < r.x + r.w; x += 180) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + plankH);
      ctx.stroke();
    }
    row++;
  }
  // Soft warm highlight
  const warm = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, 0, r.x + r.w / 2, r.y + r.h / 2, r.w * 0.7);
  warm.addColorStop(0, 'rgba(255,200,120,0.05)');
  warm.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function drawGrassPattern(ctx, r, pal) {
  // Speckled grass texture (deterministic)
  ctx.fillStyle = 'rgba(80, 130, 80, 0.5)';
  for (let i = 0; i < 70; i++) {
    const gx = r.x + ((i * 53) % r.w);
    const gy = r.y + ((i * 31) % r.h);
    ctx.fillRect(gx, gy, 2, 2);
  }
  ctx.fillStyle = 'rgba(140, 200, 130, 0.3)';
  for (let i = 0; i < 35; i++) {
    const gx = r.x + ((i * 73 + 19) % r.w);
    const gy = r.y + ((i * 47 + 11) % r.h);
    ctx.fillRect(gx, gy, 1, 3);
  }
}

function drawTilePattern(ctx, r, pal) {
  // Plaza paving stones (grid lines)
  ctx.strokeStyle = 'rgba(0,0,0,0.10)';
  ctx.lineWidth = 1;
  const tile = 56;
  for (let x = r.x + tile; x < r.x + r.w; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke();
  }
  for (let y = r.y + tile; y < r.y + r.h; y += tile) {
    ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke();
  }
  // soft highlight at center
  const g = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, 0, r.x + r.w / 2, r.y + r.h / 2, 320);
  g.addColorStop(0, 'rgba(255,255,255,0.06)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function drawConcretePattern(ctx, r, pal) {
  // Concrete platform — long horizontal slabs
  ctx.strokeStyle = 'rgba(0,0,0,0.20)';
  ctx.lineWidth = 1;
  for (let y = r.y + 70; y < r.y + r.h; y += 70) {
    ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke();
  }
}

function drawGridPattern(ctx, r, pal, glowColor) {
  // Tech grid (LAB / ARCADE)
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  const grid = 32;
  for (let x = r.x + grid; x < r.x + r.w; x += grid) {
    ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke();
  }
  for (let y = r.y + grid; y < r.y + r.h; y += grid) {
    ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke();
  }
  // ambient glow
  const g = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, 0, r.x + r.w / 2, r.y + r.h / 2, r.w * 0.7);
  g.addColorStop(0, glowColor);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

// ---- soft drop shadow helper ----

function softShadow(ctx, x, y, w, h) {
  const r = Math.min(w, h) * 0.5;
  const g = ctx.createRadialGradient(x + w / 2, y + h, 0, x + w / 2, y + h, r);
  g.addColorStop(0, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 6, y + h - r * 0.4, w + 12, r);
}

function roundRectFill(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fillStyle = fill;
  ctx.fill();
}

// ---- LIBRARY ----

function drawLibraryRoom(ctx, r, pal) {
  // Two big bookshelves along top wall
  drawBookshelf(ctx, r.x + 20,  r.y + 50, 170, 80);
  drawBookshelf(ctx, r.x + 210, r.y + 50, 170, 80);
  // Reading table + chairs
  drawReadingTable(ctx, r.x + r.w / 2, r.y + r.h / 2 + 50);
  // Lamp glow above table
  const lx = r.x + r.w / 2, ly = r.y + r.h / 2 + 30;
  const lamp = ctx.createRadialGradient(lx, ly, 0, lx, ly, 110);
  lamp.addColorStop(0, 'rgba(255, 210, 140, 0.32)');
  lamp.addColorStop(1, 'rgba(255, 210, 140, 0)');
  ctx.fillStyle = lamp;
  ctx.beginPath(); ctx.arc(lx, ly, 110, 0, Math.PI * 2); ctx.fill();
  // Floating dust motes
  for (let i = 0; i < 6; i++) {
    const dx = r.x + 60 + ((i * 71) % (r.w - 120));
    const dy = r.y + 160 + ((Math.sin(state.anim * 0.7 + i * 1.3) + 1) * 60);
    ctx.fillStyle = 'rgba(255, 220, 160, 0.4)';
    ctx.beginPath(); ctx.arc(dx, dy, 1.6, 0, Math.PI * 2); ctx.fill();
  }
}

function drawBookshelf(ctx, x, y, w, h) {
  // Drop shadow
  softShadow(ctx, x, y, w, h);
  // Wooden frame (dark wood)
  const grd = ctx.createLinearGradient(x, y, x + w, y);
  grd.addColorStop(0, '#3a2515');
  grd.addColorStop(0.5, '#5a3923');
  grd.addColorStop(1, '#3a2515');
  roundRectFill(ctx, x, y, w, h, 4, grd);
  // outline
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Inner cubby
  const inset = 4;
  const innerW = w - inset * 2;
  const innerH = h - inset * 2;
  ctx.fillStyle = '#2a1808';
  ctx.fillRect(x + inset, y + inset, innerW, innerH);
  // Shelves (3 rows)
  const rows = 3;
  const rowH = innerH / rows;
  // Books per row, deterministic mix of colors and heights
  const bookColors = ['#9b3232', '#2f5fa0', '#a06b2f', '#2d8546', '#6a3a9c', '#a73d6e', '#c89a3a', '#3aa39b'];
  for (let row = 0; row < rows; row++) {
    const sy = y + inset + row * rowH;
    let bx = x + inset + 2;
    let i = (row * 7) % bookColors.length;
    while (bx < x + inset + innerW - 4) {
      const bw = 5 + ((i * 13 + row * 5) % 4);
      const bh = rowH - 4 - ((i * 11) % 6);
      ctx.fillStyle = bookColors[i % bookColors.length];
      ctx.fillRect(bx, sy + (rowH - bh) - 1, bw, bh);
      // little gold stripe on every 3rd book
      if (i % 3 === 0) {
        ctx.fillStyle = 'rgba(255,210,120,0.7)';
        ctx.fillRect(bx, sy + rowH - bh + 4, bw, 1);
      }
      bx += bw + 1;
      i++;
    }
    // shelf line
    ctx.fillStyle = '#1a0d04';
    ctx.fillRect(x + inset, sy + rowH - 2, innerW, 2);
  }
}

function drawReadingTable(ctx, cx, cy) {
  // Soft shadow under the table
  const tw = 130, th = 50;
  softShadow(ctx, cx - tw / 2, cy - th / 2, tw, th);
  // Tabletop (oval)
  ctx.fillStyle = '#7a4a28';
  ctx.beginPath();
  ctx.ellipse(cx, cy, tw / 2, th / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3d2515';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Top sheen
  ctx.fillStyle = 'rgba(255,220,170,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx - 10, cy - 8, tw / 2 - 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Books on table
  ctx.fillStyle = '#7c2d2d';
  roundRectFill(ctx, cx - 40, cy - 6, 26, 10, 2);
  ctx.fillStyle = '#2f5fa0';
  roundRectFill(ctx, cx + 8, cy - 4, 22, 8, 2);
  // Lamp base on table
  ctx.fillStyle = '#1a1a22';
  ctx.fillRect(cx - 4, cy - 18, 8, 6);
  ctx.fillStyle = '#e8c878';
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 24); ctx.lineTo(cx + 12, cy - 24);
  ctx.lineTo(cx + 8, cy - 16); ctx.lineTo(cx - 8, cy - 16);
  ctx.closePath();
  ctx.fill();
  // Two chairs on either side
  drawChair(ctx, cx - tw / 2 - 18, cy - 8);
  drawChair(ctx, cx + tw / 2 + 6,  cy - 8);
}

function drawChair(ctx, x, y) {
  ctx.fillStyle = '#5a3923';
  roundRectFill(ctx, x, y, 16, 18, 3);
  ctx.fillStyle = '#3d2515';
  ctx.fillRect(x, y, 16, 4);
}

// ---- LAB ----

function drawLabRoom(ctx, r, pal) {
  // Lab bench along top wall — silver/gray with computer monitor
  drawLabBench(ctx, r.x + 30, r.y + 60, r.w - 60);
  // Test tube rack on left
  drawTubeRack(ctx, r.x + 50, r.y + 200);
  // Hazard sign on right
  drawHazardSign(ctx, r.x + r.w - 80, r.y + 220);
  // Centrifuge / machine
  drawLabMachine(ctx, r.x + r.w / 2, r.y + r.h - 70);
}

function drawLabBench(ctx, x, y, w) {
  const h = 42;
  softShadow(ctx, x, y, w, h);
  // Bench top — silver
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, '#cdd6e0');
  grd.addColorStop(1, '#7a8696');
  roundRectFill(ctx, x, y, w, h, 4, grd);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Drawers
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  for (let dx = x + 60; dx < x + w; dx += 60) {
    ctx.beginPath();
    ctx.moveTo(dx, y + 4); ctx.lineTo(dx, y + h - 4);
    ctx.stroke();
  }
  // Computer monitor on top-center
  const mx = x + w / 2 - 32, my = y - 44;
  ctx.fillStyle = '#0c0c0c';
  roundRectFill(ctx, mx, my, 64, 44, 3);
  // Screen
  ctx.fillStyle = '#0a3d3a';
  ctx.fillRect(mx + 4, my + 4, 56, 32);
  // Animated lines
  ctx.fillStyle = `rgba(45, 212, 191, ${0.6 + 0.3 * Math.sin(state.anim * 4)})`;
  for (let i = 0; i < 4; i++) {
    const ly = my + 6 + i * 7 + Math.sin(state.anim * 3 + i) * 1.5;
    ctx.fillRect(mx + 6, ly, 52, 2);
  }
  // Stand
  ctx.fillStyle = '#0c0c0c';
  ctx.fillRect(mx + 28, my + 44, 8, 4);
  ctx.fillRect(mx + 22, my + 48, 20, 2);
}

function drawTubeRack(ctx, x, y) {
  // Wooden rack
  ctx.fillStyle = '#3d2515';
  roundRectFill(ctx, x, y + 28, 80, 14, 2);
  softShadow(ctx, x, y, 80, 42);
  // Tubes
  const colors = ['#ec4899', '#fbbf24', '#2dd4bf', '#a78bfa'];
  for (let i = 0; i < 4; i++) {
    const tx = x + 8 + i * 18;
    // Glass tube
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(tx, y, 10, 32);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tx, y, 10, 32);
    // Liquid
    const lh = 14 + (i * 3) % 10;
    ctx.fillStyle = colors[i];
    ctx.fillRect(tx + 1, y + 32 - lh, 8, lh);
    // Bubble (animated)
    const bub = (state.anim * 1.2 + i * 0.4) % 1;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(tx + 5, y + 32 - lh + (1 - bub) * (lh - 4) + 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHazardSign(ctx, x, y) {
  // Yellow triangle with black border, exclamation in center
  softShadow(ctx, x - 28, y - 4, 56, 50);
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 28, y + 44);
  ctx.lineTo(x - 28, y + 44);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1f1300';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // !
  ctx.fillStyle = '#1f1300';
  ctx.fillRect(x - 2, y + 14, 4, 14);
  ctx.beginPath();
  ctx.arc(x, y + 34, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawLabMachine(ctx, cx, cy) {
  softShadow(ctx, cx - 30, cy - 26, 60, 52);
  // Body
  ctx.fillStyle = '#2a3540';
  roundRectFill(ctx, cx - 26, cy - 22, 52, 44, 4);
  ctx.strokeStyle = '#0a0e14';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Glass dome (with spinning highlight)
  const angle = state.anim * 4;
  const grd = ctx.createRadialGradient(cx + Math.cos(angle) * 8, cy - 4, 0, cx, cy - 4, 18);
  grd.addColorStop(0, 'rgba(45, 212, 191, 0.7)');
  grd.addColorStop(1, 'rgba(45, 212, 191, 0.15)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy - 4, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy - 4, 16, 0, Math.PI * 2);
  ctx.stroke();
  // LED lights
  for (let i = 0; i < 3; i++) {
    const lit = (Math.floor(state.anim * 4) + i) % 3 === 0;
    ctx.fillStyle = lit ? '#22d3ee' : '#0a3d3a';
    ctx.beginPath();
    ctx.arc(cx - 16 + i * 16, cy + 14, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- ARCADE ----

function drawArcadeRoom(ctx, r, pal) {
  // Three arcade cabinets along top wall
  drawArcadeCabinet(ctx, r.x + 50,  r.y + 50, '#ec4899', 0);
  drawArcadeCabinet(ctx, r.x + 160, r.y + 50, '#22d3ee', 1);
  drawArcadeCabinet(ctx, r.x + 270, r.y + 50, '#facc15', 2);
  // Pinball/skee-ball table at bottom
  drawPinball(ctx, r.x + r.w / 2, r.y + r.h - 80);
  // Neon pink ambient glow
  const g = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, 0, r.x + r.w / 2, r.y + r.h / 2, r.w * 0.7);
  g.addColorStop(0, 'rgba(236, 72, 153, 0.10)');
  g.addColorStop(1, 'rgba(236, 72, 153, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function drawArcadeCabinet(ctx, x, y, color, idx) {
  const w = 70, h = 110;
  softShadow(ctx, x, y, w, h);
  // Body
  const grd = ctx.createLinearGradient(x, y, x + w, y);
  grd.addColorStop(0, lighten(color, -40));
  grd.addColorStop(0.5, color);
  grd.addColorStop(1, lighten(color, -50));
  roundRectFill(ctx, x, y, w, h, 6, grd);
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Marquee (top sign)
  ctx.fillStyle = lighten(color, 30);
  roundRectFill(ctx, x + 4, y + 4, w - 8, 16, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.font = 'bold 9px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(['ZAP!', 'BLAST', 'SPIN'][idx % 3], x + w / 2, y + 12);
  // Screen
  ctx.fillStyle = '#0c0c10';
  roundRectFill(ctx, x + 6, y + 24, w - 12, 36, 2);
  // Animated screen content (color blocks)
  const flick = Math.floor(state.anim * 6 + idx) % 4;
  const screenColors = [
    ['#22d3ee', '#fbbf24'],
    ['#ec4899', '#a3e635'],
    ['#fde047', '#f472b6'],
    ['#22c55e', '#3b82f6']
  ];
  ctx.fillStyle = screenColors[flick][0];
  ctx.fillRect(x + 10, y + 28, 12, 6);
  ctx.fillStyle = screenColors[flick][1];
  ctx.fillRect(x + w - 22, y + 28, 12, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(x + 8, y + 38 + Math.floor(state.anim * 4) % 4, w - 16, 1.5);
  // Control panel
  ctx.fillStyle = '#1a1a22';
  roundRectFill(ctx, x + 4, y + 64, w - 8, 18, 2);
  // Joystick
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(x + 18, y + 73, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Buttons
  ['#22d3ee', '#facc15', '#a3e635'].forEach((bc, i) => {
    ctx.fillStyle = bc;
    ctx.beginPath();
    ctx.arc(x + 36 + i * 9, y + 73, 2.8, 0, Math.PI * 2);
    ctx.fill();
  });
  // Coin slot
  ctx.fillStyle = '#000';
  ctx.fillRect(x + w / 2 - 6, y + 86, 12, 3);
  // Front panel art (a stripe)
  ctx.fillStyle = lighten(color, -20);
  ctx.fillRect(x + 4, y + 92, w - 8, 14);
}

function drawPinball(ctx, cx, cy) {
  const w = 110, h = 50;
  softShadow(ctx, cx - w / 2, cy - h / 2, w, h);
  // Table
  const grd = ctx.createLinearGradient(cx - w / 2, cy, cx + w / 2, cy);
  grd.addColorStop(0, '#1a0d2e');
  grd.addColorStop(0.5, '#341660');
  grd.addColorStop(1, '#1a0d2e');
  roundRectFill(ctx, cx - w / 2, cy - h / 2, w, h, 4, grd);
  ctx.strokeStyle = '#0a0418';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Bumpers
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = ['#ec4899', '#22d3ee', '#fde047'][i];
    ctx.beginPath();
    ctx.arc(cx - 28 + i * 28, cy - 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Ball (animated bouncing)
  const bx = cx + Math.sin(state.anim * 2) * 30;
  const by = cy + 10 + Math.abs(Math.cos(state.anim * 4)) * 4;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

// ---- PARK ----

function drawParkRoom(ctx, r, pal) {
  // Curving stone path
  ctx.strokeStyle = 'rgba(180, 160, 120, 0.5)';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r.x + 30, r.y + r.h - 30);
  ctx.bezierCurveTo(
    r.x + 80, r.y + r.h * 0.6,
    r.x + r.w - 80, r.y + r.h * 0.5,
    r.x + r.w - 30, r.y + 60
  );
  ctx.stroke();
  // Path edge
  ctx.strokeStyle = 'rgba(140, 120, 80, 0.4)';
  ctx.lineWidth = 24;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200, 180, 140, 0.8)';
  ctx.lineWidth = 18;
  ctx.stroke();
  // Trees scattered
  drawTree(ctx, r.x + 60,  r.y + 100, 28);
  drawTree(ctx, r.x + 320, r.y + 80,  32);
  drawTree(ctx, r.x + 50,  r.y + 280, 24);
  drawTree(ctx, r.x + 340, r.y + 290, 30);
  // Bench in middle
  drawParkBench(ctx, r.x + r.w / 2 - 30, r.y + r.h / 2 + 10);
  // Flowers
  drawFlower(ctx, r.x + 130, r.y + 220, '#ef4444');
  drawFlower(ctx, r.x + 300, r.y + 200, '#facc15');
  drawFlower(ctx, r.x + 200, r.y + 280, '#a78bfa');
  // Falling leaves
  for (let i = 0; i < 4; i++) {
    const t = (state.anim * 0.4 + i * 0.3) % 1;
    const lx = r.x + 80 + (i * 90) % (r.w - 160) + Math.sin(state.anim * 1.5 + i) * 18;
    const ly = r.y + 80 + t * (r.h - 160);
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(state.anim * 2 + i);
    ctx.fillStyle = `rgba(220, 140, 60, ${0.8 - t * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawTree(ctx, cx, cy, size) {
  // Soft shadow on grass
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + size + 6, size * 0.7, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Trunk
  ctx.fillStyle = '#5a3923';
  ctx.fillRect(cx - 4, cy + 4, 8, size - 4);
  ctx.strokeStyle = '#3d2515';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 4, cy + 4, 8, size - 4);
  // Canopy: 3 overlapping circles (Among Us tree look)
  const canopyColor1 = '#3d6e44';
  const canopyColor2 = '#487a4f';
  const highlight    = '#6a9c66';
  ctx.fillStyle = canopyColor1;
  ctx.beginPath(); ctx.arc(cx,         cy,        size * 0.95, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = canopyColor2;
  ctx.beginPath(); ctx.arc(cx - size*0.45, cy + 4, size * 0.7,  0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + size*0.45, cy + 4, size * 0.7,  0, Math.PI * 2); ctx.fill();
  // Highlight
  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.arc(cx - size * 0.3, cy - size * 0.3, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function drawParkBench(ctx, x, y) {
  const w = 60, h = 14;
  softShadow(ctx, x, y, w, h + 8);
  // Seat
  ctx.fillStyle = '#7a4a28';
  roundRectFill(ctx, x, y, w, 6, 2);
  // Backrest
  ctx.fillStyle = '#5a3923';
  roundRectFill(ctx, x, y - 12, w, 4, 1);
  // Legs
  ctx.fillStyle = '#2a1a0c';
  ctx.fillRect(x + 4,  y + 6, 3, 12);
  ctx.fillRect(x + w - 7, y + 6, 3, 12);
  // Slats
  ctx.strokeStyle = '#5a3923';
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (w * i) / 4, y);
    ctx.lineTo(x + (w * i) / 4, y + 6);
    ctx.stroke();
  }
}

function drawFlower(ctx, cx, cy, petalColor) {
  // Stem
  ctx.strokeStyle = '#3d6e44';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 4);
  ctx.lineTo(cx, cy + 14);
  ctx.stroke();
  // Petals (4)
  ctx.fillStyle = petalColor;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * 3, cy + Math.sin(a) * 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Center
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fill();
}

// ---- CAFÉ ----

function drawCafeRoom(ctx, r, pal) {
  // Counter along top wall
  drawCafeCounter(ctx, r.x + 30, r.y + 60, r.w - 60);
  // Espresso machine on counter
  drawEspressoMachine(ctx, r.x + r.w / 2 - 30, r.y + 32);
  // Round tables with chairs
  drawRoundTable(ctx, r.x + 90,  r.y + r.h - 100);
  drawRoundTable(ctx, r.x + r.w - 90, r.y + r.h - 100);
  // Pendant lamp glow
  const lx = r.x + r.w / 2, ly = r.y + 80;
  const lamp = ctx.createRadialGradient(lx, ly, 0, lx, ly, 100);
  lamp.addColorStop(0, 'rgba(255, 200, 120, 0.30)');
  lamp.addColorStop(1, 'rgba(255, 200, 120, 0)');
  ctx.fillStyle = lamp;
  ctx.beginPath(); ctx.arc(lx, ly, 100, 0, Math.PI * 2); ctx.fill();
}

function drawCafeCounter(ctx, x, y, w) {
  const h = 36;
  softShadow(ctx, x, y, w, h);
  // Wood front
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, '#8b5a2b');
  grd.addColorStop(1, '#5a3923');
  roundRectFill(ctx, x, y, w, h, 4, grd);
  ctx.strokeStyle = '#3d2515';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Marble countertop
  ctx.fillStyle = '#d6dae0';
  ctx.fillRect(x, y, w, 6);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x + w, y + 6); ctx.stroke();
  // Subtle marble veins
  ctx.strokeStyle = 'rgba(150,150,170,0.3)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 30 + i * 80, y + 1);
    ctx.bezierCurveTo(x + 50 + i * 80, y + 3, x + 60 + i * 80, y + 5, x + 80 + i * 80, y + 4);
    ctx.stroke();
  }
  // A few mugs along the counter
  drawMug(ctx, x + 24, y - 10);
  drawMug(ctx, x + w - 36, y - 10);
}

function drawMug(ctx, x, y) {
  // Mug body
  ctx.fillStyle = '#fafafa';
  roundRectFill(ctx, x, y, 12, 12, 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Coffee
  ctx.fillStyle = '#5a3018';
  ctx.fillRect(x + 1, y + 1, 10, 3);
  // Handle
  ctx.strokeStyle = '#fafafa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 14, y + 6, 3, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // Steam
  for (let i = 0; i < 2; i++) {
    const t = (state.anim * 0.6 + i * 0.5) % 1;
    ctx.fillStyle = `rgba(220,220,220,${0.6 - t * 0.5})`;
    ctx.beginPath();
    ctx.arc(x + 4 + i * 4 + Math.sin(state.anim * 4 + i) * 1.2, y - t * 14 - 2, 2 - t, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEspressoMachine(ctx, x, y) {
  const w = 60, h = 28;
  // Body — stainless steel
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, '#cdd6e0');
  grd.addColorStop(0.5, '#a8b2bf');
  grd.addColorStop(1, '#7a8696');
  roundRectFill(ctx, x, y, w, h, 4, grd);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Group head
  ctx.fillStyle = '#1a1a22';
  roundRectFill(ctx, x + w / 2 - 8, y + h, 16, 8, 1);
  // Buttons
  ['#dc2626', '#22c55e', '#fde047'].forEach((bc, i) => {
    ctx.fillStyle = bc;
    ctx.beginPath();
    ctx.arc(x + 12 + i * 8, y + 8, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  // Steam wand
  ctx.fillStyle = '#7a8696';
  ctx.fillRect(x + w - 8, y + 6, 2, 14);
  // Steam from the group
  for (let i = 0; i < 3; i++) {
    const t = (state.anim * 0.5 + i * 0.3) % 1;
    ctx.fillStyle = `rgba(230,230,230,${0.4 - t * 0.3})`;
    ctx.beginPath();
    ctx.arc(x + w / 2 + Math.sin(state.anim * 4 + i) * 3, y - t * 18, 3 - t * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRoundTable(ctx, cx, cy) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18, 22, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tabletop (round)
  const grd = ctx.createRadialGradient(cx - 4, cy - 4, 0, cx, cy, 22);
  grd.addColorStop(0, '#8b5a2b');
  grd.addColorStop(1, '#5a3923');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3d2515';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Mug centered on it
  drawMug(ctx, cx - 6, cy - 6);
}

// ---- TRANSIT ----

function drawTransitRoom(ctx, r, pal) {
  // Yellow safety stripe along front of platform
  drawSafetyStripe(ctx, r.x + 16, r.y + r.h - 36, r.w - 32);
  // Tracks below
  drawTracks(ctx, r.x + 16, r.y + r.h - 22, r.w - 32);
  // Train silhouette in upper area
  drawTrain(ctx, r.x + 24, r.y + 70, r.w - 48);
  // Hanging sign / station marker
  drawStationSign(ctx, r.x + r.w / 2, r.y + 30);
  // Bench on the platform
  drawParkBench(ctx, r.x + 50, r.y + r.h - 70);
}

function drawSafetyStripe(ctx, x, y, w) {
  // Yellow with diagonal black stripes
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x, y, w, 8);
  ctx.fillStyle = '#1f1300';
  for (let dx = x; dx < x + w; dx += 14) {
    ctx.beginPath();
    ctx.moveTo(dx, y);
    ctx.lineTo(dx + 7, y + 8);
    ctx.lineTo(dx + 7 + 4, y + 8);
    ctx.lineTo(dx + 4, y);
    ctx.closePath();
    ctx.fill();
  }
  // White edge
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(x, y - 2, w, 1.5);
}

function drawTracks(ctx, x, y, w) {
  // Sleepers
  ctx.fillStyle = '#3a2515';
  for (let dx = x; dx < x + w; dx += 18) {
    ctx.fillRect(dx, y, 12, 8);
  }
  // Rails
  ctx.fillStyle = '#7a8696';
  ctx.fillRect(x, y, w, 1.5);
  ctx.fillRect(x, y + 6, w, 1.5);
}

function drawTrain(ctx, x, y, w) {
  const h = 70;
  softShadow(ctx, x, y, w, h);
  // Body — gradient blue/silver
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, '#5a7290');
  grd.addColorStop(0.4, '#cdd6e0');
  grd.addColorStop(1, '#5a7290');
  roundRectFill(ctx, x, y, w, h, 8, grd);
  ctx.strokeStyle = '#1f2532';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Stripe along the middle
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x + 4, y + h / 2 - 2, w - 8, 4);
  // Windows
  for (let i = 0, wx = x + 16; wx < x + w - 30; wx += 38, i++) {
    const lit = (i + Math.floor(state.anim * 1.5)) % 4 === 0;
    ctx.fillStyle = lit ? '#fde68a' : '#1a3344';
    roundRectFill(ctx, wx, y + 12, 26, 14, 2);
    ctx.strokeStyle = '#0a1018';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Door at the end
  ctx.fillStyle = '#1a1a22';
  roundRectFill(ctx, x + w - 30, y + h - 36, 24, 30, 2);
  ctx.strokeStyle = '#0a1018';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(x + w - 12, y + h - 18, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawStationSign(ctx, cx, cy) {
  // Hanging cable
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy);
  ctx.stroke();
  // Sign panel
  softShadow(ctx, cx - 50, cy, 100, 24);
  ctx.fillStyle = '#1565c0';
  roundRectFill(ctx, cx - 50, cy, 100, 22, 3);
  ctx.strokeStyle = '#0a1f3d';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // White M circle (subway-style)
  ctx.fillStyle = '#fafafa';
  ctx.beginPath();
  ctx.arc(cx - 32, cy + 11, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1565c0';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', cx - 32, cy + 11);
  // Station name
  ctx.fillStyle = '#fafafa';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TRANSIT', cx - 18, cy + 11);
}

// ---- PLAZA ----

function drawPlazaRoom(ctx, r, pal) {
  // Central fountain
  drawFountain(ctx, r.x + r.w / 2, r.y + r.h / 2);
  // Benches arranged around the fountain
  drawParkBench(ctx, r.x + r.w / 2 - 200, r.y + r.h / 2 - 8);
  drawParkBench(ctx, r.x + r.w / 2 + 140, r.y + r.h / 2 - 8);
  drawParkBench(ctx, r.x + r.w / 2 - 30,  r.y + r.h / 2 - 160);
  drawParkBench(ctx, r.x + r.w / 2 - 30,  r.y + r.h / 2 + 140);
  // Potted plants at corners
  drawPottedPlant(ctx, r.x + 70,         r.y + 70);
  drawPottedPlant(ctx, r.x + r.w - 70,   r.y + 70);
  drawPottedPlant(ctx, r.x + 70,         r.y + r.h - 70);
  drawPottedPlant(ctx, r.x + r.w - 70,   r.y + r.h - 70);
}

function drawFountain(ctx, cx, cy) {
  // Outer bowl shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 60, 64, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Outer ring (stone)
  const stone = ctx.createRadialGradient(cx, cy, 30, cx, cy, 60);
  stone.addColorStop(0, '#8d97a5');
  stone.addColorStop(1, '#5a6470');
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.arc(cx, cy, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a4350';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Inner pool (water)
  const water = ctx.createRadialGradient(cx, cy, 0, cx, cy, 46);
  water.addColorStop(0, '#7dd3c0');
  water.addColorStop(0.7, '#38bdf8');
  water.addColorStop(1, '#1565c0');
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.fill();
  // Animated ripples
  for (let i = 0; i < 3; i++) {
    const ringR = 12 + ((state.anim * 12 + i * 14) % 36);
    ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ringR / 46)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Center pillar / spout
  ctx.fillStyle = '#5a6470';
  ctx.fillRect(cx - 4, cy - 14, 8, 18);
  ctx.beginPath();
  ctx.arc(cx, cy - 14, 6, 0, Math.PI * 2);
  ctx.fill();
  // Water spray (animated)
  for (let i = 0; i < 6; i++) {
    const t = (state.anim * 1.4 + i * 0.16) % 1;
    const angle = -Math.PI / 2 + (i - 3) * 0.18;
    const dist = t * 26;
    const px = cx + Math.cos(angle) * dist;
    const py = cy - 14 + Math.sin(angle) * dist + t * t * 18;
    ctx.fillStyle = `rgba(125,211,192,${0.9 - t * 0.6})`;
    ctx.beginPath();
    ctx.arc(px, py, 2 - t, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPottedPlant(ctx, cx, cy) {
  // Pot
  softShadow(ctx, cx - 14, cy, 28, 22);
  ctx.fillStyle = '#a05a3a';
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy);
  ctx.lineTo(cx + 14, cy);
  ctx.lineTo(cx + 11, cy + 18);
  ctx.lineTo(cx - 11, cy + 18);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#6a3a1f';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Soil
  ctx.fillStyle = '#3d2515';
  ctx.fillRect(cx - 12, cy - 1, 24, 4);
  // Leaves
  ctx.fillStyle = '#3d6e44';
  ctx.beginPath(); ctx.arc(cx,    cy - 6,  10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#487a4f';
  ctx.beginPath(); ctx.arc(cx - 7, cy - 2, 8,  0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 7, cy - 2, 8,  0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6a9c66';
  ctx.beginPath(); ctx.arc(cx - 3, cy - 8, 5,  0, Math.PI * 2); ctx.fill();
}

// ---- ARCHIVE (file cabinets + safe + boxes) ----

function drawArchiveRoom(ctx, r, pal) {
  // Filing cabinets along top wall
  for (let i = 0; i < 4; i++) {
    drawFileCabinet(ctx, r.x + 30 + i * 75, r.y + 50);
  }
  // Records safe — center-left
  drawSafe(ctx, r.x + 80, r.y + r.h / 2 + 30);
  // Stack of file boxes in center-right
  drawBoxStack(ctx, r.x + r.w - 100, r.y + r.h / 2);
  // Light glow from a desk lamp
  const lx = r.x + r.w - 60, ly = r.y + r.h - 80;
  const lamp = ctx.createRadialGradient(lx, ly, 0, lx, ly, 90);
  lamp.addColorStop(0, 'rgba(255, 200, 130, 0.22)');
  lamp.addColorStop(1, 'rgba(255, 200, 130, 0)');
  ctx.fillStyle = lamp;
  ctx.beginPath(); ctx.arc(lx, ly, 90, 0, Math.PI * 2); ctx.fill();
  // Dust motes
  for (let i = 0; i < 5; i++) {
    const dx = r.x + 60 + ((i * 73) % (r.w - 120));
    const dy = r.y + 180 + ((Math.sin(state.anim * 0.5 + i * 1.4) + 1) * 50);
    ctx.fillStyle = 'rgba(255, 200, 130, 0.32)';
    ctx.beginPath(); ctx.arc(dx, dy, 1.4, 0, Math.PI * 2); ctx.fill();
  }
}

function drawFileCabinet(ctx, x, y) {
  const w = 56, h = 100;
  softShadow(ctx, x, y, w, h);
  // Body
  const grd = ctx.createLinearGradient(x, y, x + w, y);
  grd.addColorStop(0, '#3a3540');
  grd.addColorStop(0.5, '#5a5560');
  grd.addColorStop(1, '#3a3540');
  roundRectFill(ctx, x, y, w, h, 3, grd);
  ctx.strokeStyle = '#1a1820';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Drawers (3)
  for (let i = 0; i < 3; i++) {
    const dy = y + 4 + i * 32;
    ctx.fillStyle = '#46414c';
    roundRectFill(ctx, x + 4, dy, w - 8, 28, 2);
    ctx.strokeStyle = '#1f1c25';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Handle
    ctx.fillStyle = '#a47540';
    roundRectFill(ctx, x + w / 2 - 8, dy + 12, 16, 4, 1);
    // Label slot
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(x + 8, dy + 4, 18, 5);
  }
}

function drawSafe(ctx, cx, cy) {
  const w = 80, h = 80;
  const x = cx - w / 2, y = cy - h / 2;
  softShadow(ctx, x, y, w, h);
  // Body
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, '#2a2530');
  grd.addColorStop(1, '#0a0810');
  roundRectFill(ctx, x, y, w, h, 4, grd);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Inner door panel
  ctx.fillStyle = '#1a1820';
  roundRectFill(ctx, x + 6, y + 6, w - 12, h - 12, 2);
  // Dial (rotating slightly with anim for life)
  const dx = cx - 14, dy = cy - 4;
  ctx.fillStyle = '#5a5560';
  ctx.beginPath(); ctx.arc(dx, dy, 12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a47540';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Dial pointer
  const ang = state.anim * 0.6;
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(dx, dy);
  ctx.lineTo(dx + Math.cos(ang) * 9, dy + Math.sin(ang) * 9);
  ctx.stroke();
  // Handle
  ctx.fillStyle = '#a47540';
  roundRectFill(ctx, cx + 6, cy - 8, 18, 4, 1);
  ctx.fillStyle = '#fde68a';
  ctx.beginPath(); ctx.arc(cx + 24, cy - 6, 3, 0, Math.PI * 2); ctx.fill();
  // "SAFE" label
  ctx.fillStyle = '#a47540';
  ctx.font = 'bold 9px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RECORDS', cx, cy + 24);
}

function drawBoxStack(ctx, cx, cy) {
  // Three cardboard boxes stacked
  const colors = ['#a47540', '#8a6230', '#7a5028'];
  for (let i = 0; i < 3; i++) {
    const w = 50 - i * 4;
    const x = cx - w / 2, y = cy + 30 - i * 30;
    softShadow(ctx, x, y, w, 28);
    ctx.fillStyle = colors[i];
    roundRectFill(ctx, x, y, w, 28, 2);
    ctx.strokeStyle = '#3d2515';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Tape
    ctx.fillStyle = 'rgba(220, 200, 160, 0.5)';
    ctx.fillRect(x, y + 12, w, 4);
    ctx.fillRect(x + w / 2 - 2, y, 4, 28);
  }
}

// ---- WORKSHOP (workbench + machine + welding sparks) ----

function drawWorkshopRoom(ctx, r, pal) {
  // Workbench across top with tools
  drawWorkbench(ctx, r.x + 20, r.y + 80, r.w - 40);
  // Big machine in center
  drawWorkshopMachine(ctx, r.x + r.w / 2, r.y + r.h - 100);
  // Hazard tape on floor
  drawHazardTape(ctx, r.x + 20, r.y + r.h - 30, r.w - 40);
  // Welding sparks (animated)
  const sx = r.x + r.w / 2 - 20, sy = r.y + r.h - 90;
  for (let i = 0; i < 6; i++) {
    if ((Math.floor(state.anim * 5) + i) % 5 === 0) {
      const a = Math.PI / 2 + (i - 3) * 0.4;
      const d = ((state.anim * 60 + i * 8) % 30);
      ctx.fillStyle = 'rgba(255, 220, 120, 0.9)';
      ctx.fillRect(sx + Math.cos(a) * d, sy + Math.sin(a) * d - 4, 1.5, 1.5);
    }
  }
}

function drawWorkbench(ctx, x, y, w) {
  const h = 36;
  softShadow(ctx, x, y, w, h);
  // Bench top
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, '#7a4a28');
  grd.addColorStop(1, '#3d2515');
  roundRectFill(ctx, x, y, w, h, 3, grd);
  ctx.strokeStyle = '#1a0d04';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Tools laid out
  // Hammer
  const hx = x + 24;
  ctx.fillStyle = '#3d2515';
  ctx.fillRect(hx, y + 12, 22, 4);
  ctx.fillStyle = '#5a5560';
  ctx.fillRect(hx + 18, y + 6, 8, 16);
  // Wrench
  const wx = x + 64;
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(wx, y + 14, 20, 5);
  ctx.beginPath(); ctx.arc(wx, y + 16, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a3a40';
  ctx.beginPath(); ctx.arc(wx, y + 16, 3, 0, Math.PI * 2); ctx.fill();
  // Screwdriver
  const sx2 = x + 110;
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(sx2, y + 13, 10, 6);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(sx2 + 10, y + 15, 18, 2);
  // Saw
  const swx = x + w - 70;
  ctx.fillStyle = '#cdd6e0';
  ctx.beginPath();
  ctx.moveTo(swx, y + 8);
  ctx.lineTo(swx + 50, y + 8);
  ctx.lineTo(swx + 48, y + 16);
  ctx.lineTo(swx, y + 16);
  ctx.closePath();
  ctx.fill();
  // Saw teeth
  ctx.fillStyle = '#7a8696';
  for (let tx = swx + 2; tx < swx + 48; tx += 4) {
    ctx.beginPath();
    ctx.moveTo(tx, y + 16);
    ctx.lineTo(tx + 2, y + 20);
    ctx.lineTo(tx + 4, y + 16);
    ctx.fill();
  }
  ctx.fillStyle = '#3d2515';
  roundRectFill(ctx, swx - 12, y + 8, 12, 8, 2);
}

function drawWorkshopMachine(ctx, cx, cy) {
  const w = 100, h = 70;
  const x = cx - w / 2, y = cy - h / 2;
  softShadow(ctx, x, y, w, h);
  // Body
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, '#6b6068');
  grd.addColorStop(1, '#2a242a');
  roundRectFill(ctx, x, y, w, h, 4, grd);
  ctx.strokeStyle = '#0a080a';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Big rotating gear (animated)
  const gx = x + 30, gy = y + h / 2;
  const ang = state.anim * 1.2;
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(ang);
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18);
    ctx.lineTo(Math.cos(a + 0.2) * 22, Math.sin(a + 0.2) * 22);
    ctx.lineTo(Math.cos(a + Math.PI / 4 - 0.2) * 22, Math.sin(a + Math.PI / 4 - 0.2) * 22);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a3a40';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Pressure dial
  ctx.fillStyle = '#fafafa';
  ctx.beginPath();
  ctx.arc(x + w - 22, y + 18, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a1a22';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Needle
  const needAng = -Math.PI * 0.7 + Math.sin(state.anim * 1.5) * 0.6;
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w - 22, y + 18);
  ctx.lineTo(x + w - 22 + Math.cos(needAng) * 7, y + 18 + Math.sin(needAng) * 7);
  ctx.stroke();
  // Pipe
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x + w, y + h - 12);
  ctx.lineTo(x + w + 16, y + h - 12);
  ctx.stroke();
  // LED strip
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x + 6, y + h - 8, w - 12, 3);
  ctx.fillStyle = `rgba(255, 220, 120, ${0.5 + 0.4 * Math.sin(state.anim * 6)})`;
  ctx.fillRect(x + 6 + ((state.anim * 60) % (w - 30)), y + h - 8, 22, 3);
}

function drawHazardTape(ctx, x, y, w) {
  ctx.fillStyle = '#1f1300';
  ctx.fillRect(x, y, w, 6);
  ctx.fillStyle = '#fbbf24';
  for (let dx = x; dx < x + w; dx += 14) {
    ctx.beginPath();
    ctx.moveTo(dx, y);
    ctx.lineTo(dx + 7, y + 6);
    ctx.lineTo(dx + 7 + 4, y + 6);
    ctx.lineTo(dx + 4, y);
    ctx.closePath();
    ctx.fill();
  }
}

// ---- STORAGE (crates + breaker box + pallets) ----

function drawStorageRoom(ctx, r, pal) {
  // Stack of crates left
  drawCrate(ctx, r.x + 50,  r.y + 80, 60, 60, '#7a4a28');
  drawCrate(ctx, r.x + 50,  r.y + 150, 60, 60, '#8a5a30');
  drawCrate(ctx, r.x + 120, r.y + 80, 50, 50, '#6a4020');
  // Stack of crates right
  drawCrate(ctx, r.x + r.w - 110, r.y + 80, 60, 60, '#5a3a18');
  drawCrate(ctx, r.x + r.w - 110, r.y + 150, 60, 60, '#7a4a28');
  drawCrate(ctx, r.x + r.w - 170, r.y + 100, 40, 40, '#8a5a30');
  // Pallet in middle bottom
  drawPallet(ctx, r.x + r.w / 2 - 50, r.y + r.h - 110);
  // Breaker box on top wall
  drawBreakerBox(ctx, r.x + r.w / 2, r.y + 50);
  // Forklift hint (a red caution outline on floor)
  ctx.strokeStyle = 'rgba(220, 80, 80, 0.4)';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x + 30, r.y + r.h - 60, r.w - 60, 30);
  ctx.setLineDash([]);
}

function drawCrate(ctx, x, y, w, h, color) {
  softShadow(ctx, x, y, w, h);
  // Body
  ctx.fillStyle = color;
  roundRectFill(ctx, x, y, w, h, 2);
  ctx.strokeStyle = '#1a0d04';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Wood planks
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + h / 3); ctx.lineTo(x + w, y + h / 3);
  ctx.moveTo(x, y + 2 * h / 3); ctx.lineTo(x + w, y + 2 * h / 3);
  ctx.stroke();
  // Metal corners
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x, y, 6, 6);
  ctx.fillRect(x + w - 6, y, 6, 6);
  ctx.fillRect(x, y + h - 6, 6, 6);
  ctx.fillRect(x + w - 6, y + h - 6, 6, 6);
  // Stamp
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.font = 'bold 9px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CARGO', x + w / 2, y + h / 2 + 3);
}

function drawPallet(ctx, x, y) {
  const w = 100, h = 30;
  softShadow(ctx, x, y, w, h);
  ctx.fillStyle = '#7a4a28';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#3d2515';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  // Slats
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + (w * i) / 4, y, 2, h);
  }
  // A bag on top
  ctx.fillStyle = '#cdd6e0';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y - 6, 24, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a8696';
  ctx.stroke();
}

function drawBreakerBox(ctx, cx, cy) {
  const w = 70, h = 60;
  const x = cx - w / 2, y = cy - h / 2;
  softShadow(ctx, x, y, w, h);
  // Body
  ctx.fillStyle = '#5a5560';
  roundRectFill(ctx, x, y, w, h, 3);
  ctx.strokeStyle = '#1a1820';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Door (slight inset)
  ctx.fillStyle = '#3a3540';
  roundRectFill(ctx, x + 4, y + 4, w - 8, h - 8, 2);
  // Switches (6, alternating up/down)
  for (let i = 0; i < 6; i++) {
    const sx = x + 8 + (i % 3) * 18;
    const sy = y + 10 + Math.floor(i / 3) * 22;
    const up = (i + Math.floor(state.anim * 1.5)) % 2 === 0;
    ctx.fillStyle = '#1f1820';
    ctx.fillRect(sx, sy, 12, 16);
    ctx.fillStyle = up ? '#22c55e' : '#dc2626';
    ctx.fillRect(sx + 2, up ? sy + 2 : sy + 8, 8, 6);
  }
  // Warning label
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x + w - 12, y + h - 10, 10, 8);
  ctx.fillStyle = '#1f1300';
  ctx.font = 'bold 7px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('!', x + w - 7, y + h - 4);
}

// ---- LOUNGE (cocktail bar + jukebox + lounge chairs) ----

function drawLoungeRoom(ctx, r, pal) {
  // Bar along top
  drawCocktailBar(ctx, r.x + 20, r.y + 70, r.w - 40);
  // Jukebox on the right
  drawJukebox(ctx, r.x + r.w - 60, r.y + r.h - 110);
  // Two lounge chairs around a table
  drawLoungeSeating(ctx, r.x + 90, r.y + r.h - 100);
  // Disco glow
  const dx = r.x + r.w / 2, dy = r.y + r.h / 2 + 20;
  for (let i = 0; i < 4; i++) {
    const a = state.anim * 1.5 + i * (Math.PI / 2);
    const px = dx + Math.cos(a) * 80;
    const py = dy + Math.sin(a) * 40;
    const colors = ['rgba(244,114,182,0.18)', 'rgba(34,211,238,0.18)', 'rgba(253,224,71,0.18)', 'rgba(167,139,250,0.18)'];
    const grd = ctx.createRadialGradient(px, py, 0, px, py, 80);
    grd.addColorStop(0, colors[i]);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
}

function drawCocktailBar(ctx, x, y, w) {
  const h = 50;
  softShadow(ctx, x, y, w, h);
  // Wood front
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, '#5a2d40');
  grd.addColorStop(1, '#2a0e1c');
  roundRectFill(ctx, x, y, w, h, 3, grd);
  ctx.strokeStyle = '#1a0510';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Counter top
  ctx.fillStyle = '#1a0510';
  ctx.fillRect(x, y, w, 6);
  ctx.fillStyle = 'rgba(244,114,182,0.4)';
  ctx.fillRect(x, y, w, 1.5);  // edge highlight
  // Bottles in a row on the back wall above the bar
  const bottleColors = ['#22d3ee', '#fbbf24', '#a3e635', '#ec4899', '#f472b6', '#a78bfa', '#fde047'];
  for (let i = 0, bx = x + 16; bx < x + w - 20; bx += 22, i++) {
    drawBottle(ctx, bx, y - 24, bottleColors[i % bottleColors.length]);
  }
  // Cocktail glass on the counter
  drawCocktailGlass(ctx, x + 30, y - 8);
  drawCocktailGlass(ctx, x + w - 50, y - 8);
}

function drawBottle(ctx, x, y, color) {
  // Body
  ctx.fillStyle = color;
  roundRectFill(ctx, x, y + 6, 10, 16, 1);
  // Neck
  ctx.fillStyle = lighten(color, -30);
  ctx.fillRect(x + 3, y, 4, 6);
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(x + 1, y + 8, 2, 12);
}

function drawCocktailGlass(ctx, cx, cy) {
  // Stem
  ctx.strokeStyle = '#fafafa';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 14);
  ctx.stroke();
  // Base
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(cx - 5, cy + 13, 10, 2);
  // Bowl (inverted triangle)
  ctx.fillStyle = 'rgba(244, 114, 182, 0.7)';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 6);
  ctx.lineTo(cx + 8, cy - 6);
  ctx.lineTo(cx, cy + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.stroke();
  // Cherry
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(cx + 4, cy - 4, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawJukebox(ctx, cx, cy) {
  const w = 50, h = 80;
  const x = cx - w / 2, y = cy - h / 2;
  softShadow(ctx, x, y, w, h);
  // Body — chrome rounded
  const grd = ctx.createLinearGradient(x, y, x + w, y);
  grd.addColorStop(0, '#7a3a8a');
  grd.addColorStop(0.5, '#cdaaee');
  grd.addColorStop(1, '#7a3a8a');
  roundRectFill(ctx, x, y, w, h, 8, grd);
  ctx.strokeStyle = '#3a1448';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Top arch with lights
  const archGrd = ctx.createLinearGradient(x, y, x, y + 24);
  archGrd.addColorStop(0, '#ffeb99');
  archGrd.addColorStop(1, '#f59e0b');
  ctx.fillStyle = archGrd;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 22);
  ctx.quadraticCurveTo(x + w / 2, y - 4, x + w - 4, y + 22);
  ctx.lineTo(x + w - 4, y + 24);
  ctx.lineTo(x + 4, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a1448';
  ctx.stroke();
  // Light bulbs on arch (animated)
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 - 0.7 + (i * 0.35);
    const lx = x + w / 2 + Math.cos(a) * 18;
    const ly = y + 22 + Math.sin(a) * 18;
    const lit = (Math.floor(state.anim * 4) + i) % 2 === 0;
    ctx.fillStyle = lit ? '#fde68a' : '#5a4a30';
    ctx.beginPath(); ctx.arc(lx, ly, 2, 0, Math.PI * 2); ctx.fill();
  }
  // Display window
  ctx.fillStyle = '#0a0810';
  roundRectFill(ctx, x + 6, y + 30, w - 12, 18, 2);
  // Marquee text scrolling
  ctx.fillStyle = `rgba(244, 114, 182, ${0.7 + 0.3 * Math.sin(state.anim * 4)})`;
  ctx.font = 'bold 8px Inter, sans-serif';
  ctx.textAlign = 'left';
  const offset = (state.anim * 30) % 30;
  ctx.fillText('♪ B-15 ♪ A-22 ♪', x + 8 - offset, y + 42);
  // Keypad
  ctx.fillStyle = '#1f0e22';
  roundRectFill(ctx, x + 6, y + 52, w - 12, 22, 2);
  for (let i = 0; i < 6; i++) {
    const kx = x + 8 + (i % 3) * 12;
    const ky = y + 56 + Math.floor(i / 3) * 10;
    ctx.fillStyle = '#cdaaee';
    roundRectFill(ctx, kx, ky, 8, 6, 1);
  }
}

function drawLoungeSeating(ctx, x, y) {
  // Round table center
  const tx = x + 60, ty = y + 30;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(tx, ty + 18, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a2d40';
  ctx.beginPath(); ctx.arc(tx, ty, 22, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2a0e1c';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Cocktail glass on table
  drawCocktailGlass(ctx, tx, ty - 4);
  // Two armchairs flanking the table
  drawArmchair(ctx, x - 4, y);
  drawArmchair(ctx, x + 88, y);
}

function drawArmchair(ctx, x, y) {
  const w = 36, h = 40;
  softShadow(ctx, x, y, w, h);
  // Backrest
  ctx.fillStyle = '#7a3a48';
  roundRectFill(ctx, x, y, w, h * 0.55, 6);
  ctx.strokeStyle = '#3a1820';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Seat
  ctx.fillStyle = '#a45064';
  roundRectFill(ctx, x + 2, y + h * 0.4, w - 4, h * 0.45, 4);
  ctx.stroke();
  // Cushion line
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + h * 0.55); ctx.lineTo(x + w - 4, y + h * 0.55);
  ctx.stroke();
}

// ---- vents ----

function drawCorridor(ctx, c) {
  // Solid concrete floor.
  ctx.fillStyle = '#3a414f';
  ctx.fillRect(c.x, c.y, c.w, c.h);
  // Subtle grain
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  if (c.w > c.h) {
    // horizontal corridor — vertical seams every 28px
    for (let x = c.x + 28; x < c.x + c.w; x += 28) {
      ctx.fillRect(x, c.y, 1, c.h);
    }
    // dashed center stripe
    ctx.fillStyle = 'rgba(125,211,192,0.18)';
    for (let x = c.x + 6; x < c.x + c.w - 6; x += 14) {
      ctx.fillRect(x, c.y + c.h / 2 - 0.5, 8, 1);
    }
  } else {
    for (let y = c.y + 28; y < c.y + c.h; y += 28) {
      ctx.fillRect(c.x, y, c.w, 1);
    }
    ctx.fillStyle = 'rgba(125,211,192,0.18)';
    for (let y = c.y + 6; y < c.y + c.h - 6; y += 14) {
      ctx.fillRect(c.x + c.w / 2 - 0.5, y, 1, 8);
    }
  }
}

function drawBody(ctx, b) {
  // Slumped crewmate silhouette: the body lies on its side with a soft shadow
  // pool. Color matches the victim's crew color so it can be identified.
  const px = b.x, py = b.y;
  const c = paletteColor(b.color);
  const sh = paletteShade(b.color);
  // Soft shadow pool (no blood — keeps the tone in line with DOLCE's quieter
  // visual language).
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(px + 4, py + 14, 32, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body — bean turned 90° (lying down)
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(Math.PI / 2);
  // body fill
  ctx.beginPath();
  crewmateBodyPath(ctx, -10, -14, 20, 28);
  const grd = ctx.createLinearGradient(-10, 0, 10, 0);
  grd.addColorStop(0, lighten(c, 14));
  grd.addColorStop(0.5, c);
  grd.addColorStop(1, sh);
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  crewmateBodyPath(ctx, -10, -14, 20, 28);
  ctx.stroke();
  // visor (broken X marks instead of a face)
  ctx.fillStyle = '#9ab8c4';
  roundRectFill(ctx, 1, -10, 8, 6, 1.6);
  ctx.strokeStyle = '#5b8a9c';
  ctx.beginPath(); roundRectFill(ctx, 1, -10, 8, 6, 1.6); ctx.stroke();
  ctx.strokeStyle = '#1a2a35';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(2, -9);  ctx.lineTo(8, -5);
  ctx.moveTo(8, -9);  ctx.lineTo(2, -5);
  ctx.stroke();
  ctx.restore();
  // Name above (no pulsing tap-cue — the body is informational; meetings
  // are called from the dedicated MEETING button.)
  ctx.fillStyle = '#f59e0b';
  ctx.font = '600 11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(b.name, px, py - 18);
}

function drawVent(ctx, v) {
  // Among Us vent: dark slot with horizontal bars and a faint glow.
  const w = 36, h = 26;
  const x = v.x - w / 2, y = v.y - h / 2;
  // glow
  const glow = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, w);
  const pulse = 0.4 + 0.25 * Math.sin(state.anim * 4 + v.x * 0.01);
  glow.addColorStop(0, `rgba(125,211,192,${pulse * 0.35})`);
  glow.addColorStop(1, 'rgba(125,211,192,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(v.x - w, v.y - h, w * 2, h * 2);
  // body
  ctx.fillStyle = '#0a0a10';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  // bars
  ctx.strokeStyle = '#7a7a7a';
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 5; i++) {
    const yy = y + (h * i) / 5;
    ctx.beginPath();
    ctx.moveTo(x + 3, yy);
    ctx.lineTo(x + w - 3, yy);
    ctx.stroke();
  }
  // "VENT" mark: only show when distraction is on it (subtle)
  if (state.you?.role === 'distraction' && state.you.onVent && VENTS.find(vv => vv.id === state.you.onVent)?.id === v.id) {
    ctx.strokeStyle = '#7dd3c0';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
  }
}

// ---- crewmate (Among Us style, procedural) ----

function peerMotion(p, px, py) {
  const now = performance.now();
  state.peerMotion = state.peerMotion || {};
  const m = state.peerMotion[p.id] || { x: px, y: py, movedAt: 0, phase: 0, prevX: px, prevY: py };
  if (Math.abs(m.x - px) + Math.abs(m.y - py) > 0.5) {
    m.movedAt = now;
    m.phase += 0.35;
  }
  m.prevX = m.x; m.prevY = m.y;
  m.x = px; m.y = py;
  state.peerMotion[p.id] = m;
  return { walking: (now - m.movedAt) < 220, phase: m.phase, prevX: m.prevX, prevY: m.prevY };
}

function visorColor(visorId) {
  if (!state.visors) return '#bfe9ff';
  const v = state.visors.find(x => x.id === visorId);
  return v ? v.hex : '#bfe9ff';
}

function visorEdgeFor(hex) {
  // darker variant of the visor color for edges
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return '#5b8a9c';
  const r = Math.max(0, parseInt(m[1], 16) - 70);
  const g = Math.max(0, parseInt(m[2], 16) - 70);
  const b = Math.max(0, parseInt(m[3], 16) - 70);
  return `rgb(${r},${g},${b})`;
}

function drawCrewmate(ctx, px, py, colorId, facing, dead, isMe, scale = 1.7, walking = false, phase = 0, name = null, hat = 'none', face = 'calm', stunned = false, visorId = 'sky', accessory = 'none', pet = 'none') {
  const baseColor = dead ? '#3a3a3a' : paletteColor(colorId);
  const shade     = dead ? '#222' : paletteShade(colorId);
  const visorHex  = visorColor(visorId);
  const visor     = dead ? '#111' : visorHex;
  const visorEdge = dead ? '#000' : visorEdgeFor(visorHex);

  const facingLeft = facing && facing.x < -0.2;
  const bob = walking ? Math.abs(Math.sin(phase)) * 1.5 : 0;
  const cy = py - bob;

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(px, py + 16 * scale * 0.5, 14 * scale * 0.6, 4 * scale * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // self glow
  if (isMe && !dead) {
    const g = ctx.createRadialGradient(px, cy, 0, px, cy, 38 * scale);
    g.addColorStop(0, 'rgba(125,211,192,0.32)');
    g.addColorStop(1, 'rgba(125,211,192,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, cy, 38 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // stun ring
  if (stunned && !dead) {
    ctx.strokeStyle = 'rgba(168, 193, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(px, cy, 22 * scale, 0, Math.PI * 2);
    ctx.stroke();
    // stun stars
    ctx.fillStyle = 'rgba(255, 230, 100, 0.95)';
    for (let i = 0; i < 3; i++) {
      const a = (state.anim || 0) * 2 + i * (Math.PI * 2 / 3);
      const sx = px + Math.cos(a) * 18 * scale;
      const sy = cy - 18 * scale + Math.sin(a) * 4;
      ctx.fillText('✦', sx, sy);
    }
  }

  // legs (two short stubs, alternating swing while walking)
  const legSwing = walking ? Math.sin(phase) * 2 : 0;
  ctx.fillStyle = shade;
  const legW = 5 * scale, legH = 7 * scale;
  ctx.beginPath(); roundedRectPath(ctx, px - 7 * scale, cy + 8 * scale - legSwing, legW, legH + legSwing, 2); ctx.fill();
  ctx.beginPath(); roundedRectPath(ctx, px + 2 * scale, cy + 8 * scale + legSwing, legW, legH - legSwing, 2); ctx.fill();

  // body — bean: tall rounded rect with a domed top
  const bw = 18 * scale, bh = 22 * scale;
  const bx = px - bw / 2, by = cy - bh / 2;
  // backpack (drawn first so body covers the seam)
  ctx.fillStyle = shade;
  const packW = 6 * scale, packH = 12 * scale;
  const packX = facingLeft ? bx + bw - 2 * scale : bx - packW + 2 * scale;
  const packY = by + bh * 0.35;
  ctx.beginPath(); roundedRectPath(ctx, packX, packY, packW, packH, 3); ctx.fill();

  // body
  const grd = ctx.createLinearGradient(bx, by, bx, by + bh);
  grd.addColorStop(0, lighten(baseColor, 18));
  grd.addColorStop(0.5, baseColor);
  grd.addColorStop(1, shade);
  ctx.fillStyle = grd;
  ctx.beginPath(); crewmateBodyPath(ctx, bx, by, bw, bh); ctx.fill();
  // body outline
  ctx.lineWidth = isMe ? 2 : 1.4;
  ctx.strokeStyle = isMe ? '#ffffff' : 'rgba(0,0,0,0.55)';
  ctx.beginPath(); crewmateBodyPath(ctx, bx, by, bw, bh); ctx.stroke();

  // visor (curved domed shield with vertical tint, scan-line, and corner shines)
  const vw = 11 * scale, vh = 6 * scale;
  const vx = facingLeft ? (bx + 1.5 * scale) : (bx + bw - vw - 1.5 * scale);
  const vy = by + 4 * scale;
  // Visor glass — vertical gradient (lighter at top)
  const vgrd = ctx.createLinearGradient(vx, vy, vx, vy + vh);
  vgrd.addColorStop(0, lighten(visor, 30));
  vgrd.addColorStop(0.55, visor);
  vgrd.addColorStop(1, visorEdge);
  ctx.fillStyle = vgrd;
  ctx.beginPath(); roundedRectPath(ctx, vx, vy, vw, vh, 2.2 * scale); ctx.fill();
  // Outer edge
  ctx.strokeStyle = visorEdge;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); roundedRectPath(ctx, vx, vy, vw, vh, 2.2 * scale); ctx.stroke();
  // Inner top scan line
  ctx.strokeStyle = `rgba(255,255,255,0.5)`;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(vx + 1.2 * scale, vy + 1.0); ctx.lineTo(vx + vw - 1.2 * scale, vy + 1.0);
  ctx.stroke();
  // Corner shine
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ctx.ellipse(vx + (facingLeft ? vw * 0.7 : vw * 0.3), vy + vh * 0.28, vw * 0.18, vh * 0.18, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Soft secondary highlight
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(vx + vw * 0.5, vy + vh * 0.65, vw * 0.32, vh * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // face expression — drawn into the visor area
  if (!dead) drawFaceOnVisor(ctx, vx, vy, vw, vh, face, facingLeft);

  // accessory — drawn over the body (some sit on the visor, some on the chest)
  if (!dead) drawAccessory(ctx, px, cy, bx, by, bw, bh, vx, vy, vw, vh, accessory, scale, facingLeft);

  // hat — drawn after accessory so it can overlap (e.g. headband + cap)
  if (!dead) drawHat(ctx, px, by, bw, bh, hat, scale, facingLeft, baseColor);

  // pet — small companion, drawn beside the crewmate
  if (!dead) drawPet(ctx, px, cy, bw, bh, pet, scale, facingLeft, phase);

  // dead: replace body with a "ghost" overlay (translucent x's)
  if (dead) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); crewmateBodyPath(ctx, bx, by, bw, bh); ctx.fill();
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(vx + 1, vy + 1); ctx.lineTo(vx + vw - 1, vy + vh - 1);
    ctx.moveTo(vx + vw - 1, vy + 1); ctx.lineTo(vx + 1, vy + vh - 1);
    ctx.stroke();
  }

  // name plate
  if (name) {
    ctx.fillStyle = dead ? '#666' : '#fff';
    ctx.font = `500 ${Math.round(11 * scale * 0.7)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(name + (dead ? ' ✕' : ''), px, cy - bh / 2 - 12 * scale);
  }
}

function drawFaceOnVisor(ctx, vx, vy, vw, vh, face, facingLeft) {
  const cx = vx + vw / 2;
  const cy = vy + vh / 2;
  ctx.save();
  const ink = 'rgba(20, 30, 50, 0.85)';
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  const eyeR = Math.max(0.7, vh * 0.13);
  const eyeOff = vw * 0.22;
  const lw = Math.max(1, vh * 0.16);

  switch (face) {
    case 'tired': {
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(cx - eyeOff - eyeR, cy + 0.4); ctx.lineTo(cx - eyeOff + eyeR, cy + 0.4);
      ctx.moveTo(cx + eyeOff - eyeR, cy + 0.4); ctx.lineTo(cx + eyeOff + eyeR, cy + 0.4);
      ctx.stroke();
      break;
    }
    case 'sharp': {
      ctx.beginPath(); ctx.ellipse(cx - eyeOff, cy, eyeR * 0.7, eyeR * 1.15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + eyeOff, cy, eyeR * 0.7, eyeR * 1.15, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'quiet': {
      ctx.beginPath(); ctx.arc(cx - eyeOff, cy + eyeR * 0.4, eyeR * 0.65, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + eyeOff, cy + eyeR * 0.4, eyeR * 0.65, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'bright': {
      ctx.lineWidth = lw;
      ctx.beginPath(); ctx.arc(cx - eyeOff, cy + 0.6, eyeR * 1.05, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + eyeOff, cy + 0.6, eyeR * 1.05, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      break;
    }
    case 'focused': {
      // Eyebrows down + dots
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(cx - eyeOff - eyeR * 1.2, cy - eyeR * 1.4); ctx.lineTo(cx - eyeOff + eyeR * 0.7, cy - eyeR * 0.5);
      ctx.moveTo(cx + eyeOff + eyeR * 1.2, cy - eyeR * 1.4); ctx.lineTo(cx + eyeOff - eyeR * 0.7, cy - eyeR * 0.5);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - eyeOff, cy + 0.2, eyeR * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + eyeOff, cy + 0.2, eyeR * 0.85, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'dreamy': {
      // Spiraly eyes (just two small circles each, offset)
      ctx.beginPath(); ctx.arc(cx - eyeOff, cy - eyeR * 0.2, eyeR * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + eyeOff + eyeR * 0.4, cy - eyeR * 0.2, eyeR * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = lw * 0.7;
      ctx.beginPath();
      ctx.arc(cx - eyeOff, cy + eyeR * 0.7, eyeR * 0.4, 0, Math.PI * 2); ctx.stroke();
      ctx.arc(cx + eyeOff, cy + eyeR * 0.7, eyeR * 0.4, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'smug': {
      // One narrow eye + one slightly raised
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(cx - eyeOff - eyeR, cy); ctx.lineTo(cx - eyeOff + eyeR, cy);
      ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx + eyeOff, cy - eyeR * 0.2, eyeR * 0.6, eyeR * 1.0, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'worried': {
      // Eyebrows raised inward
      ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - eyeOff + eyeR * 0.4, cy - eyeR * 1.3); ctx.lineTo(cx - eyeOff - eyeR * 1.2, cy - eyeR * 0.6);
      ctx.moveTo(cx + eyeOff - eyeR * 0.4, cy - eyeR * 1.3); ctx.lineTo(cx + eyeOff + eyeR * 1.2, cy - eyeR * 0.6);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - eyeOff, cy, eyeR * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + eyeOff, cy, eyeR * 0.8, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'blank': {
      // No face at all — just a slight tint
      ctx.fillStyle = 'rgba(20, 30, 50, 0.18)';
      ctx.fillRect(vx + vw * 0.3, cy - 0.4, vw * 0.4, 1.2);
      break;
    }
    case 'calm':
    default: {
      ctx.beginPath(); ctx.arc(cx - eyeOff, cy, eyeR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + eyeOff, cy, eyeR, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawHat(ctx, px, by, bw, bh, hat, scale, facingLeft, baseColor) {
  if (!hat || hat === 'none') return;
  ctx.save();
  const cx = px;
  const topY = by - 1;
  const w = bw * 0.95;
  const ink = 'rgba(0,0,0,0.65)';

  if (hat === 'beanie') {
    // Dome with vertical gradient
    const grd = ctx.createLinearGradient(cx, topY - 9 * scale, cx, topY);
    grd.addColorStop(0, '#3d556e');
    grd.addColorStop(0.5, '#2c3e50');
    grd.addColorStop(1, '#1a2530');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(cx, topY - 1, w * 0.46, 8 * scale, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, topY - 1, w * 0.46, 8 * scale, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    // Knit ribbing on the dome — curved vertical lines
    ctx.strokeStyle = 'rgba(0,0,0,0.32)';
    ctx.lineWidth = 0.6;
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      const offset = i * (w * 0.07);
      ctx.beginPath();
      ctx.moveTo(cx + offset, topY - 1);
      ctx.quadraticCurveTo(cx + offset * 0.6, topY - 5 * scale, cx + offset * 0.18, topY - 8 * scale);
      ctx.stroke();
    }
    // Cuff (folded brim) — thicker, lighter, with horizontal ribs
    ctx.fillStyle = '#3a4d62';
    roundRectFill(ctx, cx - w * 0.46, topY - 0.5, w * 0.92, 3.4 * scale, 1.5);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.42)';
    ctx.lineWidth = 0.6;
    for (let i = -5; i <= 5; i++) {
      const x = cx + i * (w * 0.078);
      ctx.beginPath();
      ctx.moveTo(x, topY + 0.2);
      ctx.lineTo(x, topY + 2.8 * scale);
      ctx.stroke();
    }
    // Pom-pom
    const pomY = topY - 9 * scale;
    const pomR = 2.6 * scale;
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.arc(cx, pomY, pomR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // Pom shading + texture
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let i = 0; i < 8; i++) {
      const a = i * (Math.PI / 4) + 0.3;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * pomR * 0.55, pomY + Math.sin(a) * pomR * 0.55, 0.32 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(cx - pomR * 0.4, pomY - pomR * 0.4, pomR * 0.32, 0, Math.PI * 2);
    ctx.fill();

  } else if (hat === 'headphones') {
    // Headband — thick arc with seam line
    ctx.strokeStyle = '#0f0f12';
    ctx.lineWidth = 2.6 * scale * 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, topY + 1.5 * scale, w * 0.46, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    // Headband highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, topY + 1.5 * scale, w * 0.46, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    // Ear cups
    for (const sgn of [-1, 1]) {
      const ex = cx + sgn * w * 0.46;
      const ey = topY + 4.2 * scale;
      // Outer cup
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.ellipse(ex, ey, 3.6 * scale, 4.6 * scale, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // Cushion ring
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath(); ctx.ellipse(ex, ey, 2.6 * scale, 3.4 * scale, 0, 0, Math.PI * 2); ctx.fill();
      // Driver center
      ctx.fillStyle = '#7dd3c0';
      ctx.beginPath(); ctx.arc(ex, ey, 1.6 * scale, 0, Math.PI * 2); ctx.fill();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.arc(ex - 0.5 * scale, ey - 0.7 * scale, 0.5 * scale, 0, Math.PI * 2); ctx.fill();
    }

  } else if (hat === 'cap') {
    // Crown — domed cap with seam
    const grd = ctx.createLinearGradient(cx, topY - 6 * scale, cx, topY);
    grd.addColorStop(0, '#1e7ad6');
    grd.addColorStop(1, '#0d4a92');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(cx, topY - 0.5, w * 0.42, 5.5 * scale, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, topY - 0.5, w * 0.42, 5.5 * scale, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    // Center seam
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(cx, topY - 0.5);
    ctx.lineTo(cx, topY - 5.5 * scale);
    ctx.stroke();
    // Button on top
    ctx.fillStyle = '#1565c0';
    ctx.beginPath(); ctx.arc(cx, topY - 5.5 * scale, 0.8 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.4;
    ctx.stroke();
    // Brim — angled with shadow underneath
    const bSide = facingLeft ? -1 : 1;
    ctx.fillStyle = '#0d4a92';
    ctx.beginPath();
    ctx.ellipse(cx + bSide * w * 0.32, topY + 0.6, w * 0.36, 1.8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Brim shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx + bSide * w * 0.32, topY + 1.6, w * 0.32, 1.0 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    // Front logo dot (small accent)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + bSide * w * 0.18, topY - 2.6 * scale, 0.7 * scale, 0, Math.PI * 2);
    ctx.fill();

  } else if (hat === 'hood') {
    // A substantial hood drape — covers the dome and falls behind the shoulders
    const hoodColor = lighten(baseColor, -28);
    const hoodLight = lighten(baseColor, -14);
    // Outer drape
    ctx.fillStyle = hoodColor;
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.6, topY + bh * 0.2);
    ctx.quadraticCurveTo(cx - bw * 0.7, topY - bh * 0.05, cx - bw * 0.4, topY - 4 * scale);
    ctx.quadraticCurveTo(cx, topY - 9 * scale, cx + bw * 0.4, topY - 4 * scale);
    ctx.quadraticCurveTo(cx + bw * 0.7, topY - bh * 0.05, cx + bw * 0.6, topY + bh * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    // Inner shadow (the dark inside of the hood)
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.34, topY - 0.5 * scale);
    ctx.quadraticCurveTo(cx, topY - 6 * scale, cx + bw * 0.34, topY - 0.5 * scale);
    ctx.quadraticCurveTo(cx, topY + 1 * scale, cx - bw * 0.34, topY - 0.5 * scale);
    ctx.fill();
    // Highlight along the top
    ctx.strokeStyle = hoodLight;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.32, topY - 4 * scale);
    ctx.quadraticCurveTo(cx, topY - 7.5 * scale, cx + bw * 0.32, topY - 4 * scale);
    ctx.stroke();
    // Drawstring eyelets
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(cx - bw * 0.16, topY + 0.3, 0.7 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + bw * 0.16, topY + 0.3, 0.7 * scale, 0, Math.PI * 2); ctx.fill();
    // Drawstrings hanging down
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.16, topY + 0.6); ctx.quadraticCurveTo(cx - bw * 0.13, topY + bh * 0.18, cx - bw * 0.10, topY + bh * 0.32);
    ctx.moveTo(cx + bw * 0.16, topY + 0.6); ctx.quadraticCurveTo(cx + bw * 0.13, topY + bh * 0.18, cx + bw * 0.10, topY + bh * 0.32);
    ctx.stroke();

  } else if (hat === 'flower') {
    const fx = cx + (facingLeft ? -w * 0.26 : w * 0.26);
    const fy = topY - 1.5 * scale;
    // Stem
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(fx, topY + 1 * scale);
    ctx.quadraticCurveTo(fx - 0.6 * scale, fy + 1 * scale, fx, fy);
    ctx.stroke();
    // Tiny leaf on stem
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(fx - 1.1 * scale, fy + 1.4 * scale, 0.9 * scale, 0.5 * scale, -0.6, 0, Math.PI * 2);
    ctx.fill();
    // Five petals
    ctx.fillStyle = '#f48fb1';
    ctx.strokeStyle = '#a93f6a';
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 5; i++) {
      const a = i * (Math.PI * 2 / 5) - Math.PI / 2;
      ctx.save();
      ctx.translate(fx + Math.cos(a) * 1.6 * scale, fy + Math.sin(a) * 1.6 * scale);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.8 * scale, 1.1 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Petal highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.ellipse(-0.4 * scale, -0.2 * scale, 0.6 * scale, 0.25 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f48fb1';
      ctx.restore();
    }
    // Yellow center
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(fx, fy, 1.3 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a47540';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Stamen dots
    ctx.fillStyle = '#a47540';
    for (let i = 0; i < 4; i++) {
      const a = i * (Math.PI / 2) + 0.4;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(a) * 0.6 * scale, fy + Math.sin(a) * 0.6 * scale, 0.22 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (hat === 'halo') {
    const ringX = cx, ringY = topY - 5 * scale;
    const rW = w * 0.42, rH = 1.6 * scale;
    // Outer soft glow
    const glow = ctx.createRadialGradient(ringX, ringY, 0, ringX, ringY, rW * 1.4);
    glow.addColorStop(0, 'rgba(253, 230, 138, 0.55)');
    glow.addColorStop(0.5, 'rgba(253, 230, 138, 0.18)');
    glow.addColorStop(1, 'rgba(253, 230, 138, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ringX, ringY, rW * 1.4, 0, Math.PI * 2);
    ctx.fill();
    // Inner ring
    ctx.fillStyle = 'rgba(253, 230, 138, 0.45)';
    ctx.beginPath();
    ctx.ellipse(ringX, ringY, rW, rH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(ringX, ringY, rW, rH, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Bright top edge
    ctx.strokeStyle = '#fff8d4';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(ringX, ringY - 0.4, rW * 0.95, rH * 0.7, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();

  } else if (hat === 'horns') {
    // Curved demon horns with ridges
    for (const sgn of [-1, 1]) {
      ctx.save();
      const baseX = cx + sgn * w * 0.18;
      const baseY = topY + 0.5;
      ctx.fillStyle = '#3a1010';
      ctx.beginPath();
      ctx.moveTo(baseX - sgn * 1.4 * scale, baseY);
      ctx.quadraticCurveTo(baseX, baseY - 4 * scale, baseX + sgn * 1.6 * scale, baseY - 7 * scale);
      ctx.quadraticCurveTo(baseX + sgn * 1.4 * scale, baseY - 5 * scale, baseX + sgn * 1.4 * scale, baseY);
      ctx.closePath();
      ctx.fill();
      // Lighter accent
      ctx.fillStyle = '#7b1f1f';
      ctx.beginPath();
      ctx.moveTo(baseX - sgn * 1.0 * scale, baseY - 0.3);
      ctx.quadraticCurveTo(baseX + sgn * 0.4 * scale, baseY - 4 * scale, baseX + sgn * 1.5 * scale, baseY - 6.6 * scale);
      ctx.quadraticCurveTo(baseX + sgn * 0.6 * scale, baseY - 4 * scale, baseX - sgn * 0.2 * scale, baseY - 0.3);
      ctx.closePath();
      ctx.fill();
      // Ridges
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 0.5;
      for (let i = 1; i <= 3; i++) {
        const t = i / 4;
        const lx = baseX + sgn * (1.5 * scale * t * 1.1 - 0.5);
        const ly = baseY - 7 * scale * t;
        ctx.beginPath();
        ctx.moveTo(lx - sgn * 1.2 * scale * (1 - t * 0.4), ly + 0.2);
        ctx.lineTo(lx + sgn * 0.3 * scale, ly - 0.2);
        ctx.stroke();
      }
      ctx.strokeStyle = ink;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(baseX - sgn * 1.4 * scale, baseY);
      ctx.quadraticCurveTo(baseX, baseY - 4 * scale, baseX + sgn * 1.6 * scale, baseY - 7 * scale);
      ctx.quadraticCurveTo(baseX + sgn * 1.4 * scale, baseY - 5 * scale, baseX + sgn * 1.4 * scale, baseY);
      ctx.stroke();
      ctx.restore();
    }

  } else if (hat === 'top_hat') {
    const hatW = w * 0.66;
    const hatH = 9 * scale;
    // Brim
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.ellipse(cx, topY + 0.6, w * 0.5, 1.6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.9;
    ctx.stroke();
    // Brim shadow underneath
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, topY + 1.6, w * 0.46, 1.0 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cylinder body with vertical gradient
    const grd = ctx.createLinearGradient(cx - hatW / 2, topY, cx + hatW / 2, topY);
    grd.addColorStop(0, '#0a0a0a');
    grd.addColorStop(0.4, '#222');
    grd.addColorStop(0.6, '#222');
    grd.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = grd;
    ctx.fillRect(cx - hatW / 2, topY - hatH, hatW, hatH);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.9;
    ctx.strokeRect(cx - hatW / 2, topY - hatH, hatW, hatH);
    // Hatband
    ctx.fillStyle = '#7b1f1f';
    ctx.fillRect(cx - hatW / 2, topY - 2.6 * scale, hatW, 1.6 * scale);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - hatW / 2, topY - 2.6 * scale); ctx.lineTo(cx + hatW / 2, topY - 2.6 * scale);
    ctx.moveTo(cx - hatW / 2, topY - 1 * scale);   ctx.lineTo(cx + hatW / 2, topY - 1 * scale);
    ctx.stroke();
    // Buckle
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 1.2 * scale, topY - 2.4 * scale, 2.4 * scale, 1.2 * scale);
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 0.4;
    ctx.strokeRect(cx - 1.2 * scale, topY - 2.4 * scale, 2.4 * scale, 1.2 * scale);
    // Top highlight stripe
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(cx - hatW * 0.35, topY - hatH + 0.5, 0.6 * scale, hatH - 1);

  } else if (hat === 'crown') {
    const baseY = topY;
    // Base band
    ctx.fillStyle = '#fbbf24';
    roundRectFill(ctx, cx - w * 0.42, baseY - 1.2 * scale, w * 0.84, 2.4 * scale, 0.6);
    ctx.strokeStyle = '#7a4f0a';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    // Spikes — five points with gradient
    const grd = ctx.createLinearGradient(cx, baseY - 7 * scale, cx, baseY);
    grd.addColorStop(0, '#fef3c7');
    grd.addColorStop(0.5, '#fbbf24');
    grd.addColorStop(1, '#a47540');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.42, baseY - 1.2 * scale);
    const peaks = [-0.32, -0.16, 0, 0.16, 0.32];
    const heights = [-5, -7, -8, -7, -5];
    for (let i = 0; i < peaks.length; i++) {
      const px2 = cx + w * peaks[i];
      const py2 = baseY + heights[i] * scale;
      ctx.lineTo(px2 - w * 0.04, baseY - 1.2 * scale);
      ctx.lineTo(px2, py2);
      ctx.lineTo(px2 + w * 0.04, baseY - 1.2 * scale);
    }
    ctx.lineTo(cx + w * 0.42, baseY - 1.2 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7a4f0a';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    // Jewels at each peak
    const gemColors = ['#22c55e', '#3b82f6', '#ef4444', '#3b82f6', '#22c55e'];
    for (let i = 0; i < peaks.length; i++) {
      const px2 = cx + w * peaks[i];
      const py2 = baseY + (heights[i] + 1.5) * scale;
      ctx.fillStyle = gemColors[i];
      ctx.beginPath();
      ctx.arc(px2, py2, 0.9 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 0.4;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(px2 - 0.25 * scale, py2 - 0.25 * scale, 0.3 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    // Center jewel on band
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(cx, baseY - 0.2 * scale, 1.0 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a4f0a';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(cx - 0.3 * scale, baseY - 0.5 * scale, 0.3 * scale, 0, Math.PI * 2);
    ctx.fill();

  } else if (hat === 'party') {
    const tipY = topY - 13 * scale;
    // Cone with diagonal gradient
    const grd = ctx.createLinearGradient(cx - w * 0.3, topY, cx + w * 0.3, topY);
    grd.addColorStop(0, '#a83b7a');
    grd.addColorStop(0.5, '#ec4899');
    grd.addColorStop(1, '#a83b7a');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.28, topY);
    ctx.lineTo(cx + w * 0.28, topY);
    ctx.lineTo(cx, tipY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7a1d4d';
    ctx.lineWidth = 1.0;
    ctx.stroke();
    // Diagonal stripes
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.28, topY);
    ctx.lineTo(cx + w * 0.28, topY);
    ctx.lineTo(cx, tipY);
    ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.2;
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.5 + i * 1.4, topY + 1);
      ctx.lineTo(cx - w * 0.5 + i * 1.4 + 8, topY - 14 * scale);
      ctx.stroke();
    }
    ctx.restore();
    // Confetti dots
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.arc(cx - w * 0.12, topY - 4 * scale, 0.7 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.arc(cx + w * 0.10, topY - 7 * scale, 0.7 * scale, 0, Math.PI * 2); ctx.fill();
    // Tassel pom on top
    const t = state.anim || 0;
    const wob = Math.sin(t * 5) * 0.8;
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(cx + wob, tipY - 1.4 * scale, 1.8 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a47540';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Pom strands
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 5; i++) {
      const a = (i / 4) * Math.PI - Math.PI / 2 + 0.2;
      ctx.beginPath();
      ctx.moveTo(cx + wob, tipY - 1.4 * scale);
      ctx.lineTo(cx + wob + Math.cos(a) * 2.8 * scale, tipY - 1.4 * scale + Math.sin(a) * 2.8 * scale);
      ctx.stroke();
    }

  } else if (hat === 'propeller') {
    // Beanie-style cap with two-color panels
    const grd = ctx.createLinearGradient(cx, topY - 6 * scale, cx, topY);
    grd.addColorStop(0, '#1e7ad6');
    grd.addColorStop(1, '#0d4a92');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(cx, topY - 0.5, w * 0.36, 5 * scale, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(cx, topY - 0.5, w * 0.36, 5 * scale, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    // Panel divider
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(cx, topY - 0.5); ctx.lineTo(cx, topY - 5.4 * scale); ctx.stroke();
    // Yellow accent stripe
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - w * 0.36, topY - 0.5, w * 0.72, 1.2 * scale);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(cx - w * 0.36, topY - 0.5, w * 0.72, 1.2 * scale);
    // Stem
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(cx - 0.6, topY - 9 * scale, 1.2, 4 * scale);
    // Cap on stem
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx, topY - 9 * scale, 0.9 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.4;
    ctx.stroke();
    // Spinning propeller (4 blades)
    const t = state.anim || 0;
    const a = t * 8;
    const blade = w * 0.32;
    ctx.save();
    ctx.translate(cx, topY - 9 * scale);
    ctx.rotate(a);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      const bgrd = ctx.createLinearGradient(0, -0.6, 0, 0.6);
      bgrd.addColorStop(0, '#ef4444');
      bgrd.addColorStop(0.5, '#fef3c7');
      bgrd.addColorStop(1, '#7a1010');
      ctx.fillStyle = bgrd;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(blade * 0.5, -0.7, blade, -0.3);
      ctx.quadraticCurveTo(blade * 0.5, 0.2, 0, 0);
      ctx.fill();
    }
    ctx.restore();

  } else if (hat === 'mohawk') {
    // Multiple spike clusters with gradient
    ctx.save();
    const grd = ctx.createLinearGradient(cx, topY - 11 * scale, cx, topY);
    grd.addColorStop(0, '#fb7185');
    grd.addColorStop(0.5, '#ec4899');
    grd.addColorStop(1, '#7a1f4f');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.18, topY);
    // Multiple spikes
    const spikes = [
      { x: -w * 0.13, y: -5 },
      { x: -w * 0.06, y: -9 },
      { x:  0,        y: -11.5 },
      { x:  w * 0.06, y: -9 },
      { x:  w * 0.13, y: -5 }
    ];
    for (let i = 0; i < spikes.length; i++) {
      const s = spikes[i];
      ctx.lineTo(cx + s.x, topY + s.y * scale);
      if (i < spikes.length - 1) {
        const next = spikes[i + 1];
        const mx = (s.x + next.x) / 2;
        const my = (s.y + next.y) / 2 + 1.5;
        ctx.lineTo(cx + mx, topY + my * scale);
      }
    }
    ctx.lineTo(cx + w * 0.18, topY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Strand highlights
    ctx.strokeStyle = 'rgba(255, 240, 250, 0.5)';
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + (i - 1) * 1.2 * scale, topY);
      ctx.lineTo(cx + (i - 1) * 0.6 * scale, topY - 8 * scale);
      ctx.stroke();
    }
    ctx.restore();

  } else if (hat === 'leaf') {
    ctx.save();
    ctx.translate(cx, topY - 1.5 * scale);
    ctx.rotate(-0.35);
    // Leaf body
    const grd = ctx.createLinearGradient(-5 * scale, 0, 5 * scale, 0);
    grd.addColorStop(0, '#15803d');
    grd.addColorStop(0.5, '#22c55e');
    grd.addColorStop(1, '#86efac');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(-5.5 * scale, 0);
    ctx.quadraticCurveTo(-3 * scale, -2.4 * scale, 0, -2 * scale);
    ctx.quadraticCurveTo(3 * scale, -1.4 * scale, 5.5 * scale, 0);
    ctx.quadraticCurveTo(3 * scale, 1.6 * scale, 0, 2 * scale);
    ctx.quadraticCurveTo(-3 * scale, 1.4 * scale, -5.5 * scale, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0c4f25';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // Central vein
    ctx.strokeStyle = '#0c4f25';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-5.2 * scale, 0); ctx.lineTo(5.2 * scale, 0);
    ctx.stroke();
    // Side veins
    ctx.lineWidth = 0.4;
    for (let i = -2; i <= 2; i++) {
      if (!i) continue;
      const x = i * 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x + 0.8 * scale, -1.2 * scale);
      ctx.moveTo(x, 0); ctx.lineTo(x + 0.8 * scale, 1.2 * scale);
      ctx.stroke();
    }
    ctx.restore();

  } else if (hat === 'antenna') {
    const t = state.anim || 0;
    for (const sgn of [-1, 1]) {
      // Bobbing animation
      const wob = Math.sin(t * 3 + (sgn > 0 ? 0.6 : 0)) * 0.6;
      ctx.strokeStyle = '#37474f';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx + sgn * w * 0.18, topY);
      ctx.bezierCurveTo(
        cx + sgn * (w * 0.28 + wob), topY - 4 * scale,
        cx + sgn * (w * 0.20 - wob), topY - 8 * scale,
        cx + sgn * (w * 0.20 + wob * 0.5), topY - 11 * scale
      );
      ctx.stroke();
      // Stem highlight
      ctx.strokeStyle = 'rgba(180, 200, 220, 0.7)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx + sgn * w * 0.18, topY);
      ctx.bezierCurveTo(
        cx + sgn * (w * 0.27 + wob), topY - 4 * scale,
        cx + sgn * (w * 0.19 - wob), topY - 8 * scale,
        cx + sgn * (w * 0.19 + wob * 0.5), topY - 11 * scale
      );
      ctx.stroke();
      // Glowing orb with pulse
      const orbX = cx + sgn * (w * 0.20 + wob * 0.5);
      const orbY = topY - 11.4 * scale;
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);
      const glow = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 4 * scale);
      glow.addColorStop(0, `rgba(168, 193, 255, ${0.6 + 0.3 * pulse})`);
      glow.addColorStop(1, 'rgba(168, 193, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(orbX, orbY, 4 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a8c1ff';
      ctx.beginPath(); ctx.arc(orbX, orbY, 1.5 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(orbX - 0.4 * scale, orbY - 0.4 * scale, 0.6 * scale, 0, Math.PI * 2); ctx.fill();
    }

  } else if (hat === 'fedora') {
    // Brim — wider, with subtle curve up at the back
    const brimGrd = ctx.createLinearGradient(cx, topY - 0.5, cx, topY + 2 * scale);
    brimGrd.addColorStop(0, '#5a3e22');
    brimGrd.addColorStop(1, '#2a1a0a');
    ctx.fillStyle = brimGrd;
    ctx.beginPath();
    ctx.ellipse(cx, topY + 0.6, w * 0.58, 1.8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.9;
    ctx.stroke();
    // Brim shadow under
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, topY + 1.7, w * 0.54, 1.0 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    // Crown — pinched at the top
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.30, topY);
    ctx.bezierCurveTo(
      cx - w * 0.32, topY - 7 * scale,
      cx - w * 0.06, topY - 9 * scale,
      cx - w * 0.04, topY - 8 * scale
    );
    // Pinch at top
    ctx.lineTo(cx, topY - 9.5 * scale);
    ctx.lineTo(cx + w * 0.04, topY - 8 * scale);
    ctx.bezierCurveTo(
      cx + w * 0.06, topY - 9 * scale,
      cx + w * 0.32, topY - 7 * scale,
      cx + w * 0.30, topY
    );
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.9;
    ctx.stroke();
    // Crown highlight
    ctx.strokeStyle = 'rgba(255, 200, 140, 0.4)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.26, topY - 1);
    ctx.bezierCurveTo(cx - w * 0.28, topY - 5 * scale, cx - w * 0.10, topY - 8 * scale, cx - w * 0.06, topY - 7.5 * scale);
    ctx.stroke();
    // Hatband
    ctx.fillStyle = '#1a0e06';
    ctx.fillRect(cx - w * 0.30, topY - 2.4 * scale, w * 0.60, 1.4 * scale);
    // Feather (small accent)
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.18, topY - 2.6 * scale);
    ctx.quadraticCurveTo(cx + w * 0.22, topY - 6 * scale, cx + w * 0.20, topY - 7 * scale);
    ctx.quadraticCurveTo(cx + w * 0.16, topY - 6 * scale, cx + w * 0.16, topY - 2.6 * scale);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawAccessory(ctx, px, cy, bx, by, bw, bh, vx, vy, vw, vh, accessory, scale, facingLeft) {
  if (!accessory || accessory === 'none') return;
  ctx.save();
  const ink = 'rgba(0,0,0,0.7)';

  if (accessory === 'glasses') {
    // Round wire-frame glasses with lens shine
    const r = vh * 0.62;
    const lY = vy + vh * 0.5;
    const lX1 = vx + vw * 0.26, lX2 = vx + vw * 0.74;
    // Lens fill (transparent tint)
    ctx.fillStyle = 'rgba(180, 220, 255, 0.18)';
    ctx.beginPath(); ctx.arc(lX1, lY, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(lX2, lY, r, 0, Math.PI * 2); ctx.fill();
    // Frames
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(lX1, lY, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(lX2, lY, r, 0, Math.PI * 2); ctx.stroke();
    // Inner frame highlight
    ctx.strokeStyle = 'rgba(180, 200, 220, 0.7)';
    ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.arc(lX1, lY, r - 0.7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(lX2, lY, r - 0.7, 0, Math.PI * 2); ctx.stroke();
    // Bridge
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(lX1 + r * 0.95, lY);
    ctx.quadraticCurveTo((lX1 + lX2) / 2, lY - 0.6, lX2 - r * 0.95, lY);
    ctx.stroke();
    // Lens reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath(); ctx.ellipse(lX1 - r * 0.35, lY - r * 0.3, r * 0.35, r * 0.18, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(lX2 - r * 0.35, lY - r * 0.3, r * 0.35, r * 0.18, -0.5, 0, Math.PI * 2); ctx.fill();

  } else if (accessory === 'sunglasses') {
    // Wayfarer-style chunky frames with gradient lenses
    const lY = vy + vh * 0.5;
    const lX1 = vx + vw * 0.04, lX2 = vx + vw * 0.52;
    const lW = vw * 0.44, lH = vh * 0.95;
    // Outer frames (filled rounded rects)
    for (const lx of [lX1, lX2]) {
      // Frame
      ctx.fillStyle = '#1a1a1a';
      roundRectFill(ctx, lx - 0.6, lY - lH / 2 - 0.6, lW + 1.2, lH + 1.2, 2);
      // Lens with vertical gradient
      const grd = ctx.createLinearGradient(lx, lY - lH / 2, lx, lY + lH / 2);
      grd.addColorStop(0, '#3a3a4a');
      grd.addColorStop(1, '#0a0a10');
      ctx.fillStyle = grd;
      roundRectFill(ctx, lx, lY - lH / 2, lW, lH, 1.8);
      // Lens reflection (diagonal)
      ctx.save();
      ctx.beginPath();
      roundedRectPath(ctx, lx, lY - lH / 2, lW, lH, 1.8);
      ctx.clip();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(lx + lW * 0.12, lY - lH * 0.45, lW * 0.18, lH * 0.5);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(lx + lW * 0.45, lY - lH * 0.4, lW * 0.12, lH * 0.7);
      ctx.restore();
    }
    // Bridge
    ctx.fillStyle = '#1a1a1a';
    roundRectFill(ctx, lX1 + lW, lY - 0.8, vw * 0.04, 1.6, 0.5);

  } else if (accessory === 'scarf') {
    // Knitted scarf with wraps and fringe
    const sY = by + bh * 0.5;
    // Back wrap (behind body)
    ctx.fillStyle = '#7b1f1f';
    roundRectFill(ctx, bx + bw * 0.02, sY, bw * 0.96, bh * 0.13, 2);
    // Front wrap
    ctx.fillStyle = '#c62828';
    roundRectFill(ctx, bx + bw * 0.05, sY + bh * 0.04, bw * 0.9, bh * 0.16, 2.5);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Knit stitches
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 0.4;
    for (let i = 0; i < 12; i++) {
      const x = bx + bw * 0.07 + i * (bw * 0.078);
      ctx.beginPath();
      ctx.moveTo(x, sY + bh * 0.05); ctx.lineTo(x, sY + bh * 0.18);
      ctx.stroke();
    }
    // Knot
    ctx.fillStyle = '#a02020';
    ctx.beginPath();
    ctx.arc(bx + bw * (facingLeft ? 0.22 : 0.78), sY + bh * 0.12, bw * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.6;
    ctx.stroke();
    // Hanging tail with fringe
    const tailX = bx + bw * (facingLeft ? 0.12 : 0.78);
    ctx.fillStyle = '#c62828';
    ctx.fillRect(tailX, sY + bh * 0.18, bw * 0.14, bh * 0.36);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.6;
    ctx.strokeRect(tailX, sY + bh * 0.18, bw * 0.14, bh * 0.36);
    // Fringe at the bottom of the tail
    ctx.strokeStyle = '#7b1f1f';
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 5; i++) {
      const fx = tailX + i * (bw * 0.035) + bw * 0.012;
      ctx.beginPath();
      ctx.moveTo(fx, sY + bh * 0.54);
      ctx.lineTo(fx + (i % 2 ? 0.4 : -0.4), sY + bh * 0.62);
      ctx.stroke();
    }

  } else if (accessory === 'bowtie') {
    // Proper bowtie shape — two triangles meeting at a knot
    const btY = by + bh * 0.7;
    const btSize = bw * 0.22;
    // Wings
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(px, btY);
    ctx.bezierCurveTo(px - btSize * 0.6, btY - btSize * 0.6, px - btSize, btY - btSize * 0.5, px - btSize, btY - btSize * 0.05);
    ctx.bezierCurveTo(px - btSize, btY + btSize * 0.55, px - btSize * 0.6, btY + btSize * 0.6, px, btY);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px, btY);
    ctx.bezierCurveTo(px + btSize * 0.6, btY - btSize * 0.6, px + btSize, btY - btSize * 0.5, px + btSize, btY - btSize * 0.05);
    ctx.bezierCurveTo(px + btSize, btY + btSize * 0.55, px + btSize * 0.6, btY + btSize * 0.6, px, btY);
    ctx.fill();
    // Outline
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(px, btY);
    ctx.bezierCurveTo(px - btSize * 0.6, btY - btSize * 0.6, px - btSize, btY - btSize * 0.5, px - btSize, btY - btSize * 0.05);
    ctx.bezierCurveTo(px - btSize, btY + btSize * 0.55, px - btSize * 0.6, btY + btSize * 0.6, px, btY);
    ctx.moveTo(px, btY);
    ctx.bezierCurveTo(px + btSize * 0.6, btY - btSize * 0.6, px + btSize, btY - btSize * 0.5, px + btSize, btY - btSize * 0.05);
    ctx.bezierCurveTo(px + btSize, btY + btSize * 0.55, px + btSize * 0.6, btY + btSize * 0.6, px, btY);
    ctx.stroke();
    // Wing highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(px - btSize * 0.45, btY - btSize * 0.3);
    ctx.lineTo(px - btSize * 0.85, btY - btSize * 0.05);
    ctx.moveTo(px + btSize * 0.45, btY - btSize * 0.3);
    ctx.lineTo(px + btSize * 0.85, btY - btSize * 0.05);
    ctx.stroke();
    // Center knot
    ctx.fillStyle = '#0a0a0a';
    roundRectFill(ctx, px - btSize * 0.18, btY - btSize * 0.32, btSize * 0.36, btSize * 0.64, 1.2);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Knot fold lines
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.7)';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(px - btSize * 0.06, btY - btSize * 0.25); ctx.lineTo(px - btSize * 0.06, btY + btSize * 0.25);
    ctx.moveTo(px + btSize * 0.06, btY - btSize * 0.25); ctx.lineTo(px + btSize * 0.06, btY + btSize * 0.25);
    ctx.stroke();

  } else if (accessory === 'mustache') {
    // Handlebar mustache with curls
    const my = vy + vh + 0.6;
    const mw = vw * 1.05;
    ctx.fillStyle = '#3a2010';
    ctx.beginPath();
    ctx.moveTo(vx + vw * 0.5, my);
    // Left side
    ctx.bezierCurveTo(vx + vw * 0.2, my + 1.5, vx - vw * 0.05, my + 1.0, vx - vw * 0.18, my + 1.5);
    ctx.bezierCurveTo(vx - vw * 0.25, my + 0.8, vx - vw * 0.20, my + 0.2, vx - vw * 0.10, my - 0.4);
    ctx.bezierCurveTo(vx + vw * 0.05, my - 0.1, vx + vw * 0.30, my + 0.2, vx + vw * 0.5, my + 0.4);
    // Right side mirror
    ctx.bezierCurveTo(vx + vw * 0.70, my + 0.2, vx + vw * 0.95, my - 0.1, vx + vw * 1.10, my - 0.4);
    ctx.bezierCurveTo(vx + vw * 1.20, my + 0.2, vx + vw * 1.25, my + 0.8, vx + vw * 1.18, my + 1.5);
    ctx.bezierCurveTo(vx + vw * 1.05, my + 1.0, vx + vw * 0.80, my + 1.5, vx + vw * 0.5, my);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1a0a04';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Hair texture
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.3;
    for (let i = 0; i < 8; i++) {
      const fx = vx + (i / 7) * vw;
      ctx.beginPath();
      ctx.moveTo(fx, my + 0.4);
      ctx.lineTo(fx + 0.2, my + 1.2);
      ctx.stroke();
    }

  } else if (accessory === 'monocle') {
    const r = vh * 0.6;
    const ex = facingLeft ? vx + vw * 0.3 : vx + vw * 0.7;
    const ey = vy + vh * 0.5;
    // Lens fill
    ctx.fillStyle = 'rgba(255, 250, 220, 0.2)';
    ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill();
    // Frame (gold, thick)
    ctx.strokeStyle = '#a47540';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.arc(ex, ey, r - 0.4, 0, Math.PI * 2); ctx.stroke();
    // Inner shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(ex - r * 0.35, ey - r * 0.35, r * 0.3, r * 0.18, -0.5, 0, Math.PI * 2);
    ctx.fill();
    // Chain — small dotted links
    ctx.fillStyle = '#a47540';
    const chainEnd = { x: ex + r * 1.1, y: by + bh * 0.55 };
    const segs = 8;
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const cx2 = ex + r * 0.7 + (chainEnd.x - ex - r * 0.7) * t;
      const cy2 = ey + r * 0.7 + (chainEnd.y - ey - r * 0.7) * t + Math.sin(t * Math.PI) * 0.6;
      ctx.beginPath();
      ctx.arc(cx2, cy2, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (accessory === 'bandana') {
    // Bandana tied around the lower face — triangular drape with knot
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(vx - 1, vy + vh * 0.85);
    ctx.lineTo(vx + vw + 1, vy + vh * 0.85);
    ctx.lineTo(vx + vw + 1, vy + vh + 5 * scale);
    ctx.lineTo(vx + vw * 0.5, vy + vh + 7 * scale);
    ctx.lineTo(vx - 1, vy + vh + 5 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7a0a0a';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // Folded crease
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(vx, vy + vh + 1.4 * scale); ctx.lineTo(vx + vw, vy + vh + 1.4 * scale);
    ctx.stroke();
    // Paisley spots
    ctx.fillStyle = '#fff';
    for (const [sx, sy] of [[0.25, 1.8], [0.55, 3], [0.75, 1.8], [0.4, 4.2]]) {
      ctx.beginPath();
      ctx.arc(vx + vw * sx, vy + vh + sy * scale, 0.55 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#dc2626';
    for (const [sx, sy] of [[0.25, 1.8], [0.55, 3], [0.75, 1.8], [0.4, 4.2]]) {
      ctx.beginPath();
      ctx.arc(vx + vw * sx, vy + vh + sy * scale, 0.22 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    // Knot at side
    const kx = vx + (facingLeft ? -1 * scale : vw + 1 * scale);
    ctx.fillStyle = '#a02020';
    ctx.beginPath();
    ctx.arc(kx, vy + vh + 2 * scale, 1.4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a0a0a';
    ctx.lineWidth = 0.5;
    ctx.stroke();

  } else if (accessory === 'necklace') {
    // Chain with detailed links + heart pendant
    const cy2 = by + bh * 0.62;
    const radius = bw * 0.42;
    // Chain — render as small links
    ctx.strokeStyle = '#a47540';
    ctx.lineWidth = 0.4;
    for (let a = Math.PI * 0.2; a <= Math.PI * 0.8; a += 0.08) {
      const x = px + Math.cos(a) * radius;
      const y = cy2 + Math.sin(a) * radius * 0.5;
      ctx.beginPath();
      ctx.ellipse(x, y, 0.6, 0.4, a - Math.PI / 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Bright top arc
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(px, cy2, radius, Math.PI * 0.2, Math.PI * 0.8, false);
    ctx.stroke();
    // Heart pendant
    const pendY = by + bh * 0.83;
    const pSize = 1.6 * scale;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(px, pendY + pSize);
    ctx.bezierCurveTo(px - pSize * 1.4, pendY, px - pSize, pendY - pSize, px, pendY - pSize * 0.4);
    ctx.bezierCurveTo(px + pSize, pendY - pSize, px + pSize * 1.4, pendY, px, pendY + pSize);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.4;
    ctx.stroke();
    // Heart highlight
    ctx.fillStyle = 'rgba(255, 200, 200, 0.7)';
    ctx.beginPath();
    ctx.arc(px - pSize * 0.4, pendY - pSize * 0.2, pSize * 0.25, 0, Math.PI * 2);
    ctx.fill();

  } else if (accessory === 'badge') {
    // Sheriff-style 5-point gold star
    const cx2 = px + (facingLeft ? -bw * 0.22 : bw * 0.22);
    const cy2 = by + bh * 0.7;
    const r1 = 3 * scale;
    const r2 = 1.4 * scale;
    // Glow
    const glow = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r1 * 1.4);
    glow.addColorStop(0, 'rgba(253, 230, 138, 0.5)');
    glow.addColorStop(1, 'rgba(253, 230, 138, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx2, cy2, r1 * 1.4, 0, Math.PI * 2);
    ctx.fill();
    // Star
    const grd = ctx.createRadialGradient(cx2 - r1 * 0.3, cy2 - r1 * 0.3, 0, cx2, cy2, r1);
    grd.addColorStop(0, '#fef3c7');
    grd.addColorStop(0.5, '#fbbf24');
    grd.addColorStop(1, '#a47540');
    ctx.fillStyle = grd;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a1 = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const a2 = a1 + (Math.PI / 5);
      ctx.lineTo(cx2 + Math.cos(a1) * r1, cy2 + Math.sin(a1) * r1);
      ctx.lineTo(cx2 + Math.cos(a2) * r2, cy2 + Math.sin(a2) * r2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7a4f0a';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // Center pip
    ctx.fillStyle = '#7a4f0a';
    ctx.beginPath(); ctx.arc(cx2, cy2, 0.5 * scale, 0, Math.PI * 2); ctx.fill();
    // Top shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(cx2 - r1 * 0.3, cy2 - r1 * 0.4, r1 * 0.18, r1 * 0.4, -0.5, 0, Math.PI * 2);
    ctx.fill();

  } else if (accessory === 'mask') {
    // Surgical mask covering lower visor + jaw, with ear loops
    const my = vy + vh * 0.65;
    const mw = vw + 2;
    const mh = vh * 0.7 + 5 * scale;
    // Mask body
    ctx.fillStyle = '#f0faff';
    roundRectFill(ctx, vx - 1, my, mw, mh, 2);
    ctx.strokeStyle = '#9bb0c0';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // Pleats
    ctx.strokeStyle = 'rgba(120, 140, 160, 0.6)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      const py2 = my + (i * mh / 4);
      ctx.beginPath();
      ctx.moveTo(vx - 0.5, py2); ctx.lineTo(vx + vw + 0.5, py2);
      ctx.stroke();
    }
    // Nose strip (top center)
    ctx.fillStyle = '#dde6f5';
    ctx.fillRect(vx + vw * 0.3, my + 0.5, vw * 0.4, 0.8);
    // Ear loops
    ctx.strokeStyle = '#cdd6e2';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(vx - 1.5, my + mh / 2, 2, Math.PI * 1.4, Math.PI * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(vx + mw + 0.5, my + mh / 2, 2, Math.PI * 0.4, Math.PI * 1.6);
    ctx.stroke();

  } else if (accessory === 'headband') {
    // Athletic headband across the top of the head
    const hY = by + bh * 0.04;
    const hH = 2.6 * scale;
    const grd = ctx.createLinearGradient(0, hY, 0, hY + hH);
    grd.addColorStop(0, '#ef4444');
    grd.addColorStop(1, '#a02020');
    ctx.fillStyle = grd;
    roundRectFill(ctx, bx + bw * 0.04, hY, bw * 0.92, hH, 1);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.6;
    ctx.stroke();
    // Center stripe (white)
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx + bw * 0.45, hY, bw * 0.1, hH);
    // Side stripes
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(bx + bw * 0.12, hY + hH * 0.35, bw * 0.05, hH * 0.3);
    ctx.fillRect(bx + bw * 0.83, hY + hH * 0.35, bw * 0.05, hH * 0.3);
    // Knot tail
    const kSide = facingLeft ? -1 : 1;
    const kx = bx + (kSide > 0 ? bw * 0.92 : bw * 0.04);
    ctx.fillStyle = '#a02020';
    ctx.beginPath();
    ctx.moveTo(kx, hY);
    ctx.lineTo(kx + kSide * 1.4 * scale, hY - 1.0 * scale);
    ctx.lineTo(kx + kSide * 1.6 * scale, hY + hH + 0.5);
    ctx.lineTo(kx, hY + hH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawPetEyes(ctx, headX, headY, headR, side, scale, glintRight = true) {
  // Standard "cute" eyes — black ovals with white glint highlight, pink blush.
  const eyeR = headR * 0.22;
  const eyeOff = headR * 0.4;
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.ellipse(headX - eyeOff, headY - headR * 0.05, eyeR, eyeR * 1.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headX + eyeOff, headY - headR * 0.05, eyeR, eyeR * 1.2, 0, 0, Math.PI * 2); ctx.fill();
  // Glints
  ctx.fillStyle = '#fff';
  const gx = glintRight ? eyeR * 0.4 : -eyeR * 0.4;
  ctx.beginPath(); ctx.arc(headX - eyeOff + gx, headY - headR * 0.18, eyeR * 0.42, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headX + eyeOff + gx, headY - headR * 0.18, eyeR * 0.42, 0, Math.PI * 2); ctx.fill();
  // Blush
  ctx.fillStyle = 'rgba(255, 145, 165, 0.55)';
  ctx.beginPath(); ctx.ellipse(headX - eyeOff - eyeR * 1.6, headY + headR * 0.25, eyeR * 0.9, eyeR * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headX + eyeOff + eyeR * 1.6, headY + headR * 0.25, eyeR * 0.9, eyeR * 0.55, 0, 0, Math.PI * 2); ctx.fill();
}

function drawPet(ctx, px, cy, bw, bh, pet, scale, facingLeft, phase) {
  if (!pet || pet === 'none') return;
  const side = facingLeft ? 1 : -1;  // pet stands on the trailing side
  const baseX = px + side * (bw * 0.85);
  const baseY = cy + bh * 0.32;
  const t = state.anim || 0;
  const wobble = Math.sin(t * 4 + phase) * 0.6;
  const ink = 'rgba(0,0,0,0.6)';
  ctx.save();

  if (pet === 'cat') {
    // Orange tabby
    const bodyG = ctx.createLinearGradient(baseX, baseY - 4 * scale, baseX, baseY + 4 * scale);
    bodyG.addColorStop(0, '#f59e0b');
    bodyG.addColorStop(1, '#a55a08');
    // Body
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(baseX, baseY + wobble, 5 * scale, 3.4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // Tabby stripes on body
    ctx.strokeStyle = 'rgba(122, 60, 8, 0.6)';
    ctx.lineWidth = 0.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(baseX + i * 1.3 * scale, baseY - 3 * scale + wobble);
      ctx.lineTo(baseX + i * 1.3 * scale + side * 0.6, baseY - 1.5 * scale + wobble);
      ctx.stroke();
    }
    // White belly
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath();
    ctx.ellipse(baseX, baseY + 1.4 * scale + wobble, 3 * scale, 1.6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tail (curls)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.6 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(baseX + side * 4 * scale, baseY + wobble);
    ctx.quadraticCurveTo(baseX + side * 7.5 * scale, baseY - 1 * scale + wobble, baseX + side * 7 * scale, baseY - 4 * scale + wobble);
    ctx.quadraticCurveTo(baseX + side * 6.4 * scale, baseY - 6 * scale + wobble, baseX + side * 7.4 * scale, baseY - 5.4 * scale + wobble);
    ctx.stroke();
    // Tail tip white
    ctx.strokeStyle = '#fff8e7';
    ctx.lineWidth = 1.0 * scale;
    ctx.beginPath();
    ctx.moveTo(baseX + side * 6.6 * scale, baseY - 5.6 * scale + wobble);
    ctx.lineTo(baseX + side * 7.4 * scale, baseY - 5.4 * scale + wobble);
    ctx.stroke();
    // Head
    const headX = baseX - side * 4.2 * scale;
    const headY = baseY - 1.6 * scale + wobble;
    const headR = 2.6 * scale;
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // Ears
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(headX - headR * 0.7, headY - headR * 0.4);
    ctx.lineTo(headX - headR * 1.0, headY - headR * 1.6);
    ctx.lineTo(headX - headR * 0.2, headY - headR * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(headX + headR * 0.7, headY - headR * 0.4);
    ctx.lineTo(headX + headR * 1.0, headY - headR * 1.6);
    ctx.lineTo(headX + headR * 0.2, headY - headR * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.4;
    ctx.stroke();
    // Inner ear pink
    ctx.fillStyle = '#f8bbd0';
    ctx.beginPath();
    ctx.moveTo(headX - headR * 0.55, headY - headR * 0.6);
    ctx.lineTo(headX - headR * 0.85, headY - headR * 1.3);
    ctx.lineTo(headX - headR * 0.35, headY - headR * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(headX + headR * 0.55, headY - headR * 0.6);
    ctx.lineTo(headX + headR * 0.85, headY - headR * 1.3);
    ctx.lineTo(headX + headR * 0.35, headY - headR * 0.9);
    ctx.closePath();
    ctx.fill();
    // Eyes
    drawPetEyes(ctx, headX, headY, headR, side, scale);
    // Pink nose
    ctx.fillStyle = '#f48fb1';
    ctx.beginPath();
    ctx.moveTo(headX, headY + headR * 0.25);
    ctx.lineTo(headX - headR * 0.18, headY + headR * 0.05);
    ctx.lineTo(headX + headR * 0.18, headY + headR * 0.05);
    ctx.closePath();
    ctx.fill();
    // Mouth
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(headX, headY + headR * 0.3);
    ctx.lineTo(headX, headY + headR * 0.45);
    ctx.moveTo(headX, headY + headR * 0.45);
    ctx.quadraticCurveTo(headX - headR * 0.25, headY + headR * 0.65, headX - headR * 0.4, headY + headR * 0.5);
    ctx.moveTo(headX, headY + headR * 0.45);
    ctx.quadraticCurveTo(headX + headR * 0.25, headY + headR * 0.65, headX + headR * 0.4, headY + headR * 0.5);
    ctx.stroke();
    // Whiskers
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.3;
    for (const dy of [-0.1, 0.1]) {
      ctx.beginPath();
      ctx.moveTo(headX - headR * 0.4, headY + headR * (0.2 + dy));
      ctx.lineTo(headX - headR * 1.4, headY + headR * (0.2 + dy * 1.5));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(headX + headR * 0.4, headY + headR * (0.2 + dy));
      ctx.lineTo(headX + headR * 1.4, headY + headR * (0.2 + dy * 1.5));
      ctx.stroke();
    }

  } else if (pet === 'dog') {
    const bodyColor = '#caa674';
    const earColor = '#7a5530';
    const wag = Math.sin(t * 7 + phase) * 1.6;
    // Body
    const bodyG = ctx.createLinearGradient(baseX, baseY - 3 * scale, baseX, baseY + 3 * scale);
    bodyG.addColorStop(0, '#dcc198');
    bodyG.addColorStop(1, '#8a6a3e');
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(baseX, baseY + wobble, 5.2 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // Spot patch on body
    ctx.fillStyle = earColor;
    ctx.beginPath();
    ctx.ellipse(baseX + side * 1.5 * scale, baseY - 1 * scale + wobble, 1.4 * scale, 1 * scale, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Tail wagging
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 1.6 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(baseX + side * 4 * scale, baseY + wobble);
    ctx.quadraticCurveTo(
      baseX + side * 6 * scale, baseY - 2 * scale + wag + wobble,
      baseX + side * 7.5 * scale, baseY - 0.5 * scale + wag + wobble
    );
    ctx.stroke();
    // Head
    const headX = baseX - side * 4.4 * scale;
    const headY = baseY - 0.8 * scale + wobble;
    const headR = 2.5 * scale;
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // Snout
    ctx.fillStyle = '#dcc198';
    ctx.beginPath();
    ctx.ellipse(headX - side * 0.5 * scale, headY + headR * 0.5, headR * 0.7, headR * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Floppy ear
    ctx.fillStyle = earColor;
    ctx.beginPath();
    ctx.ellipse(headX - side * 1.6 * scale, headY + 0.6 * scale, 1.3 * scale, 2.6 * scale, side * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Other ear (smaller, on far side)
    ctx.fillStyle = earColor;
    ctx.beginPath();
    ctx.ellipse(headX + side * 1.4 * scale, headY + 0.4 * scale, 0.8 * scale, 1.6 * scale, -side * 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    drawPetEyes(ctx, headX, headY - headR * 0.1, headR, side, scale);
    // Nose (black)
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.ellipse(headX - side * 0.5 * scale, headY + headR * 0.45, headR * 0.22, headR * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(headX - side * 0.5 * scale - 0.2, headY + headR * 0.4, headR * 0.06, 0, Math.PI * 2);
    ctx.fill();
    // Pink tongue (slightly out, animated)
    const tongueOut = Math.max(0, Math.sin(t * 4)) * 0.6;
    if (tongueOut > 0.1) {
      ctx.fillStyle = '#f48fb1';
      ctx.beginPath();
      ctx.ellipse(headX - side * 0.5 * scale, headY + headR * 0.7 + tongueOut, headR * 0.22, headR * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (pet === 'bird') {
    // Floats above shoulder, flaps wings
    const fly = Math.sin(t * 5) * 1.5;
    const bx = px + side * bw * 0.55;
    const byb = cy - bh * 0.55 + fly;
    // Body — yellow with gradient
    const grd = ctx.createLinearGradient(bx, byb - 2 * scale, bx, byb + 2 * scale);
    grd.addColorStop(0, '#fde68a');
    grd.addColorStop(1, '#d97706');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(bx, byb, 2.6 * scale, 1.8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.6;
    ctx.stroke();
    // Head (slightly larger, sits on top)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(bx - side * 1.8 * scale, byb - 0.6 * scale, 1.7 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Eye
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(bx - side * 2.2 * scale, byb - 0.7 * scale, 0.35 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(bx - side * 2.3 * scale, byb - 0.85 * scale, 0.13 * scale, 0, Math.PI * 2);
    ctx.fill();
    // Beak
    ctx.fillStyle = '#ef6c00';
    ctx.beginPath();
    ctx.moveTo(bx - side * 3.0 * scale, byb - 0.5 * scale);
    ctx.lineTo(bx - side * 4.2 * scale, byb - 0.1 * scale);
    ctx.lineTo(bx - side * 3.0 * scale, byb + 0.4 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.4;
    ctx.stroke();
    // Beak crease
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(bx - side * 3.0 * scale, byb + 0.05 * scale);
    ctx.lineTo(bx - side * 3.9 * scale, byb + 0.05 * scale);
    ctx.stroke();
    // Wings flap
    ctx.fillStyle = '#a47540';
    const flap = Math.cos(t * 12) * 1.0;
    ctx.beginPath();
    ctx.ellipse(bx + side * 0.6 * scale, byb - 0.8 * scale + flap, 1.8 * scale, 0.7 * scale, side * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.4;
    ctx.stroke();
    // Tail feathers
    ctx.fillStyle = '#a47540';
    ctx.beginPath();
    ctx.moveTo(bx + side * 2.6 * scale, byb);
    ctx.lineTo(bx + side * 4 * scale, byb - 0.5 * scale);
    ctx.lineTo(bx + side * 4 * scale, byb + 0.5 * scale);
    ctx.closePath();
    ctx.fill();

  } else if (pet === 'fish') {
    // Fish bowl on the ground
    const bx = baseX, byb = baseY + 1;
    // Bowl glass with inner gradient
    const grd = ctx.createRadialGradient(bx, byb, 0.5 * scale, bx, byb, 4 * scale);
    grd.addColorStop(0, 'rgba(125, 211, 192, 0.5)');
    grd.addColorStop(0.7, 'rgba(125, 211, 192, 0.28)');
    grd.addColorStop(1, 'rgba(125, 211, 192, 0.5)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(bx, byb, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(125, 211, 192, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Inner glass shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(bx - 1.4 * scale, byb - 1.4 * scale, 0.7 * scale, 1.4 * scale, -0.5, 0, Math.PI * 2);
    ctx.fill();
    // Water
    ctx.save();
    ctx.beginPath();
    ctx.arc(bx, byb, 4 * scale - 0.6, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(110, 200, 230, 0.4)';
    ctx.fillRect(bx - 4 * scale, byb - 1.5 * scale, 8 * scale, 6 * scale);
    // Ripples on water surface
    const ripple = Math.sin(t * 2) * 0.4;
    ctx.strokeStyle = 'rgba(180, 220, 240, 0.8)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(bx - 4 * scale, byb - 1.5 * scale + ripple);
    ctx.quadraticCurveTo(bx - 1 * scale, byb - 2.0 * scale + ripple, bx, byb - 1.5 * scale + ripple);
    ctx.quadraticCurveTo(bx + 2 * scale, byb - 1.0 * scale + ripple, bx + 4 * scale, byb - 1.5 * scale + ripple);
    ctx.stroke();
    ctx.restore();
    // Bowl rim
    ctx.strokeStyle = 'rgba(125, 211, 192, 1)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(bx, byb - 3.6 * scale, 1.6 * scale, 0.4 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Fish — orange goldfish swimming back and forth
    const fishSwim = Math.sin(t * 3) * 1.3;
    const fishX = bx + fishSwim;
    const fishY = byb + 0.5;
    const fishDir = Math.sign(Math.cos(t * 3)) || 1;
    ctx.fillStyle = '#ef6c00';
    ctx.beginPath();
    ctx.ellipse(fishX, fishY, 1.3 * scale, 0.8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a3a08';
    ctx.lineWidth = 0.4;
    ctx.stroke();
    // Tail
    ctx.fillStyle = '#ef6c00';
    ctx.beginPath();
    ctx.moveTo(fishX - fishDir * 1.2 * scale, fishY);
    ctx.lineTo(fishX - fishDir * 2.4 * scale, fishY - 0.7 * scale);
    ctx.lineTo(fishX - fishDir * 2.4 * scale, fishY + 0.7 * scale);
    ctx.closePath();
    ctx.fill();
    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(fishX + fishDir * 0.6 * scale, fishY - 0.15 * scale, 0.32 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(fishX + fishDir * 0.7 * scale, fishY - 0.15 * scale, 0.18 * scale, 0, Math.PI * 2);
    ctx.fill();
    // Bubbles
    for (let i = 0; i < 3; i++) {
      const bt = (t * 2 + i * 0.5) % 1;
      const bX = bx + (i - 1) * 0.7 * scale;
      const bY = byb + 1 - bt * 4 * scale;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 - bt * 0.5})`;
      ctx.beginPath();
      ctx.arc(bX, bY, (0.3 + bt * 0.3) * scale, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (pet === 'ghost') {
    const bob2 = Math.sin(t * 2.5) * 1.4;
    const gx = px + side * bw * 0.65, gy = cy - bh * 0.4 + bob2;
    const gr = 3.4 * scale;
    // Soft glow
    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr * 1.6);
    glow.addColorStop(0, 'rgba(220, 230, 255, 0.4)');
    glow.addColorStop(1, 'rgba(220, 230, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(gx, gy, gr * 1.6, 0, Math.PI * 2);
    ctx.fill();
    // Ghost body
    ctx.fillStyle = 'rgba(245, 250, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(gx, gy, gr, Math.PI, Math.PI * 2);
    // Wavy bottom (animated)
    const w1 = Math.sin(t * 3) * 0.4;
    const w2 = Math.cos(t * 3) * 0.4;
    ctx.lineTo(gx + gr, gy + gr * 1.3 + w1);
    ctx.quadraticCurveTo(gx + gr * 0.66, gy + gr + w2, gx + gr * 0.33, gy + gr * 1.3 + w1);
    ctx.quadraticCurveTo(gx, gy + gr + w2, gx - gr * 0.33, gy + gr * 1.3 + w1);
    ctx.quadraticCurveTo(gx - gr * 0.66, gy + gr + w2, gx - gr, gy + gr * 1.3 + w1);
    ctx.lineTo(gx - gr, gy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(140, 160, 200, 0.55)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // Eyes (large + cute)
    ctx.fillStyle = '#1a1f2e';
    const eyeR = gr * 0.22;
    const eyeOff = gr * 0.36;
    ctx.beginPath(); ctx.ellipse(gx - eyeOff, gy - gr * 0.1, eyeR, eyeR * 1.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(gx + eyeOff, gy - gr * 0.1, eyeR, eyeR * 1.2, 0, 0, Math.PI * 2); ctx.fill();
    // Glints
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(gx - eyeOff + 0.3, gy - gr * 0.25, eyeR * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(gx + eyeOff + 0.3, gy - gr * 0.25, eyeR * 0.4, 0, Math.PI * 2); ctx.fill();
    // Cute tiny mouth
    ctx.strokeStyle = '#1a1f2e';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(gx, gy + gr * 0.25, gr * 0.18, 0, Math.PI);
    ctx.stroke();
    // Blush
    ctx.fillStyle = 'rgba(255, 145, 165, 0.5)';
    ctx.beginPath(); ctx.arc(gx - gr * 0.6, gy + gr * 0.15, gr * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(gx + gr * 0.6, gy + gr * 0.15, gr * 0.18, 0, Math.PI * 2); ctx.fill();

  } else if (pet === 'plant') {
    // Terracotta pot with detailed clay + leafy plant + a small flower
    const potX = baseX, potY = baseY + 0.4;
    const potW = 5 * scale, potH = 3.4 * scale;
    // Pot — trapezoid
    const potG = ctx.createLinearGradient(potX - potW / 2, potY, potX + potW / 2, potY);
    potG.addColorStop(0, '#7a3e10');
    potG.addColorStop(0.5, '#a55a25');
    potG.addColorStop(1, '#5a2a08');
    ctx.fillStyle = potG;
    ctx.beginPath();
    ctx.moveTo(potX - potW / 2, potY);
    ctx.lineTo(potX + potW / 2, potY);
    ctx.lineTo(potX + potW / 2 - 0.6, potY + potH);
    ctx.lineTo(potX - potW / 2 + 0.6, potY + potH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // Pot rim
    ctx.fillStyle = '#a55a25';
    roundRectFill(ctx, potX - potW / 2 - 0.4, potY - 0.6, potW + 0.8, 1.0, 0.4);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Soil
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(potX - potW / 2 + 0.4, potY - 0.1, potW - 0.8, 0.6);
    // Stem
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(potX, potY);
    ctx.quadraticCurveTo(potX + 0.2, potY - 1.5 * scale, potX, potY - 3 * scale);
    ctx.stroke();
    // Leaves (3 with subtle sway)
    const sway = Math.sin(t * 1.2) * 0.08;
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.65 + sway + (i - 1) * 0.1;
      ctx.save();
      ctx.translate(potX, potY - 1.5 * scale);
      ctx.rotate(a);
      const leafG = ctx.createLinearGradient(0, -3 * scale, 0, 0);
      leafG.addColorStop(0, '#86efac');
      leafG.addColorStop(1, '#15803d');
      ctx.fillStyle = leafG;
      ctx.beginPath();
      ctx.ellipse(0, -1.8 * scale, 1.3 * scale, 2.6 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0c4f25';
      ctx.lineWidth = 0.4;
      ctx.stroke();
      // Vein
      ctx.strokeStyle = '#0c4f25';
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(0, -3.8 * scale);
      ctx.stroke();
      ctx.restore();
    }
    // Small flower on top
    const flY = potY - 3.2 * scale;
    ctx.fillStyle = '#f48fb1';
    for (let i = 0; i < 5; i++) {
      const a = i * (Math.PI * 2 / 5) - Math.PI / 2;
      ctx.beginPath();
      ctx.ellipse(potX + Math.cos(a) * 0.7 * scale, flY + Math.sin(a) * 0.7 * scale, 0.7 * scale, 0.45 * scale, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(potX, flY, 0.5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function crewmateBodyPath(ctx, x, y, w, h) {
  // Bean: top is a half-circle, sides curve in slightly, bottom is rounded.
  const r = w / 2;
  ctx.moveTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);            // top-left curve
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);    // top-right curve
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.closePath();
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function lighten(hex, amount) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = Math.min(255, parseInt(m[1], 16) + amount);
  const g = Math.min(255, parseInt(m[2], 16) + amount);
  const b = Math.min(255, parseInt(m[3], 16) + amount);
  return `rgb(${r},${g},${b})`;
}

// ---------- tasks ----------

function renderTaskModal(task) {
  if (state.taskOverlay) closeOverlay(state.taskOverlay);
  const ol = openOverlay('tpl-task');
  state.taskOverlay = ol;
  const body = ol.querySelector('#task-body');
  ol.querySelector('[data-close]').addEventListener('click', () => {
    socket.emit('cancel_task');
    closeOverlay(ol);
    state.taskOverlay = null;
  });

  const finish = (payload) => {
    if (payload && (payload.hit || payload.heldFull || payload.success || payload.answer !== undefined || typeof payload.hits === 'number')) {
      const winning = payload.hit || payload.heldFull || payload.success || (typeof payload.hits === 'number' && payload.hits > 0);
      if (winning) audio.good(); else audio.bad();
    }
    socket.emit('complete_task', { taskId: task.id, payload: payload || {} });
    closeOverlay(ol);
    state.taskOverlay = null;
  };

  if (task.kind === 'reaction')         renderReaction(body, task, finish);
  else if (task.kind === 'hold')        renderHold(body, task, finish);
  else if (task.kind === 'statement')   renderStatement(body, task, finish);
  else if (task.kind === 'sequence')    renderSequence(body, task, finish);
  else if (task.kind === 'pour')        renderPour(body, task, finish);
  else if (task.kind === 'rhythm')      renderRhythm(body, task, finish);
  else if (task.kind === 'swipe_card')  renderSwipeCard(body, task, finish);
  else if (task.kind === 'fix_wires')   renderFixWires(body, task, finish);
  else if (task.kind === 'unlock_safe') renderUnlockSafe(body, task, finish);
  else if (task.kind === 'align_engine') renderAlignEngine(body, task, finish);
  else body.innerHTML = '<p>Unknown task.</p>';
}

function renderReaction(body, task, finish) {
  body.innerHTML = `
    <h3>PARK · REACTION</h3>
    <p>tap the shape before it disappears.</p>
    <div class="reaction-field" id="rf"></div>
  `;
  const field = body.querySelector('#rf');
  const shape = document.createElement('div');
  shape.className = 'reaction-shape';
  shape.style.display = 'none';
  field.appendChild(shape);
  let resolved = false;
  const spawn = () => {
    if (resolved) return;
    const rw = field.clientWidth - 80;
    const rh = field.clientHeight - 80;
    shape.style.left = Math.floor(Math.random() * rw) + 'px';
    shape.style.top = Math.floor(Math.random() * rh) + 'px';
    shape.style.display = 'block';
    shape.style.opacity = '1';
    const vanishT = setTimeout(() => {
      if (!resolved) { resolved = true; finish({ hit: false }); }
    }, task.windowMs);
    shape.onclick = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(vanishT);
      finish({ hit: true });
    };
  };
  setTimeout(spawn, task.delayMs);
}

function renderHold(body, task, finish) {
  body.innerHTML = `
    <h3>LIBRARY · HOLD</h3>
    <p>press and hold. don't release.</p>
    <button class="hold-btn" id="hold">hold</button>
    <div class="hold-progress"><div class="fill" id="hold-fill"></div></div>
    <div class="cooldown-note" id="hold-note">0%</div>
  `;
  const btn = body.querySelector('#hold');
  const fill = body.querySelector('#hold-fill');
  const note = body.querySelector('#hold-note');
  let held = false, startedAt = 0, timer = null, resolved = false;
  const start = () => {
    if (resolved) return;
    held = true;
    startedAt = Date.now();
    btn.classList.add('holding');
    timer = setInterval(() => {
      if (!held) return;
      const pct = Math.min(1, (Date.now() - startedAt) / task.holdMs);
      fill.style.width = (pct * 100) + '%';
      note.textContent = Math.round(pct * 100) + '%';
      if (pct >= 1) {
        resolved = true;
        clearInterval(timer);
        finish({ heldFull: true });
      }
    }, 50);
  };
  const end = () => {
    if (resolved) return;
    if (held) {
      held = false;
      clearInterval(timer);
      btn.classList.remove('holding');
      const elapsed = Date.now() - startedAt;
      if (elapsed < task.holdMs) {
        resolved = true;
        finish({ heldFull: false });
      }
    }
  };
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', end);
  btn.addEventListener('pointerleave', end);
  btn.addEventListener('pointercancel', end);
}

function renderStatement(body, task, finish) {
  body.innerHTML = `
    <h3>TRANSIT · READ</h3>
    <p>answer honestly.</p>
    <div class="statement-text">"${escapeHtml(task.statement)}"</div>
    <div class="statement-opts">
      <button class="btn" data-v="true">TRUE</button>
      <button class="btn" data-v="false">FALSE</button>
    </div>
    <div class="statement-timer" id="st">${Math.ceil(task.answerMs / 1000)}s</div>
  `;
  let resolved = false;
  const timerEl = body.querySelector('#st');
  let remaining = task.answerMs;
  const tick = setInterval(() => {
    remaining -= 100;
    timerEl.textContent = Math.max(0, Math.ceil(remaining / 1000)) + 's';
    if (remaining <= 0) {
      clearInterval(tick);
      if (!resolved) { resolved = true; finish({ answer: null }); }
    }
  }, 100);
  for (const b of body.querySelectorAll('.statement-opts .btn')) {
    b.addEventListener('click', () => {
      if (resolved) return;
      resolved = true;
      clearInterval(tick);
      finish({ answer: b.dataset.v === 'true' });
    });
  }
}

function renderSequence(body, task, finish) {
  const COLOR_HEX = { r: '#ef4444', g: '#22c55e', b: '#3b82f6', y: '#facc15' };
  body.innerHTML = `
    <h3>LAB · SEQUENCE</h3>
    <p id="seq-msg">memorize the pattern…</p>
    <div class="seq-pads" id="seq-pads">
      <button class="seq-pad" data-c="r"></button>
      <button class="seq-pad" data-c="g"></button>
      <button class="seq-pad" data-c="b"></button>
      <button class="seq-pad" data-c="y"></button>
    </div>
    <div class="seq-progress" id="seq-prog"></div>
  `;
  const pads = [...body.querySelectorAll('.seq-pad')];
  const msg = body.querySelector('#seq-msg');
  const prog = body.querySelector('#seq-prog');
  for (const p of pads) p.style.background = COLOR_HEX[p.dataset.c];

  let resolved = false;
  let idx = 0;
  let inputEnabled = false;

  const flash = (c) => {
    const pad = pads.find(p => p.dataset.c === c);
    if (!pad) return;
    pad.classList.add('lit');
    audio.beep({ freq: 300 + 'rgby'.indexOf(c) * 90, dur: task.showMs / 1500, type: 'sine', gain: 0.28 });
    setTimeout(() => pad.classList.remove('lit'), task.showMs * 0.7);
  };

  const playback = async () => {
    msg.textContent = 'watch…';
    for (let i = 0; i < task.sequence.length; i++) {
      flash(task.sequence[i]);
      await new Promise(r => setTimeout(r, task.showMs));
    }
    msg.textContent = 'now repeat.';
    inputEnabled = true;
    prog.textContent = '0 / ' + task.sequence.length;
  };

  for (const pad of pads) {
    pad.addEventListener('click', () => {
      if (resolved || !inputEnabled) return;
      const c = pad.dataset.c;
      flash(c);
      if (task.sequence[idx] === c) {
        idx++;
        prog.textContent = idx + ' / ' + task.sequence.length;
        if (idx >= task.sequence.length) {
          resolved = true;
          msg.textContent = 'stable.';
          setTimeout(() => finish({ success: true }), 300);
        }
      } else {
        resolved = true;
        msg.textContent = 'out of phase.';
        setTimeout(() => finish({ success: false }), 400);
      }
    });
  }
  setTimeout(playback, 400);
}

function renderPour(body, task, finish) {
  const targetPct = Math.round(task.target * 100);
  const tolPct = Math.round(task.tolerance * 100);
  body.innerHTML = `
    <h3>CAFÉ · POUR</h3>
    <p>hold to pour. release at the line.</p>
    <div class="pour-glass">
      <div class="pour-fill" id="pour-fill"></div>
      <div class="pour-target" id="pour-target" style="bottom:${targetPct}%"></div>
      <div class="pour-target-band" style="bottom:${targetPct - tolPct}%; height:${2 * tolPct}%;"></div>
    </div>
    <div class="pour-readout" id="pour-read">0 % · target ${targetPct} %</div>
    <button class="btn primary big pour-btn" id="pour-btn">HOLD TO POUR</button>
  `;
  const fill = body.querySelector('#pour-fill');
  const read = body.querySelector('#pour-read');
  const btn = body.querySelector('#pour-btn');

  let resolved = false;
  let pouring = false;
  let level = 0;
  let last = performance.now();
  const ratePerMs = 1 / task.fillMs;
  let pourSoundT = 0;

  const tick = () => {
    if (resolved) return;
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (pouring) {
      level = Math.min(1, level + ratePerMs * dt);
      pourSoundT += dt;
      if (pourSoundT > 110) { audio.pourTone(); pourSoundT = 0; }
    }
    fill.style.height = (level * 100) + '%';
    read.textContent = `${Math.round(level * 100)} % · target ${targetPct} %`;
    if (level >= 1) {
      resolved = true;
      finish({ success: false });
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const start = (e) => { e.preventDefault(); pouring = true; };
  const stop = (e) => {
    if (e) e.preventDefault();
    if (resolved) return;
    if (!pouring) return;
    pouring = false;
    const diff = Math.abs(level - task.target);
    const success = diff <= task.tolerance;
    resolved = true;
    finish({ success });
  };
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointerleave', stop);
  btn.addEventListener('pointercancel', stop);
}

function renderRhythm(body, task, finish) {
  body.innerHTML = `
    <h3>ARCADE · RHYTHM</h3>
    <p>tap on the beat. ${task.count} beats.</p>
    <div class="rhythm-track">
      <div class="rhythm-pulse" id="pulse"></div>
      <div class="rhythm-beats" id="beats"></div>
    </div>
    <button class="btn primary big rhythm-btn" id="rh-tap">TAP</button>
    <div class="rhythm-readout" id="rh-out">0 / ${task.count}</div>
  `;
  const pulse = body.querySelector('#pulse');
  const beatsEl = body.querySelector('#beats');
  const btn = body.querySelector('#rh-tap');
  const out = body.querySelector('#rh-out');

  for (let i = 0; i < task.count; i++) {
    const d = document.createElement('div');
    d.className = 'rhythm-beat';
    d.dataset.idx = i;
    beatsEl.appendChild(d);
  }
  const beats = [...beatsEl.children];

  const startAt = performance.now() + 800;
  let hits = 0;
  let resolved = false;
  const consumed = new Set();

  for (let i = 0; i < task.count; i++) {
    const t = startAt + i * task.intervalMs - performance.now();
    setTimeout(() => {
      if (resolved) return;
      pulse.classList.remove('on');
      void pulse.offsetWidth;
      pulse.classList.add('on');
      audio.beat(i);
      beats[i]?.classList.add('now');
      setTimeout(() => beats[i]?.classList.remove('now'), task.intervalMs * 0.6);
    }, Math.max(0, t));
  }

  const finishWindow = startAt + task.count * task.intervalMs + task.tolerance + 100;
  setTimeout(() => {
    if (!resolved) {
      resolved = true;
      finish({ hits });
    }
  }, Math.max(0, finishWindow - performance.now()));

  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (resolved) return;
    const now = performance.now();
    let bestIdx = -1, bestDiff = Infinity;
    for (let i = 0; i < task.count; i++) {
      if (consumed.has(i)) continue;
      const beatT = startAt + i * task.intervalMs;
      const diff = Math.abs(now - beatT);
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    }
    if (bestIdx >= 0 && bestDiff <= task.tolerance) {
      consumed.add(bestIdx);
      hits++;
      beats[bestIdx]?.classList.add('hit');
      audio.good();
    } else {
      audio.bad();
    }
    out.textContent = `${hits} / ${task.count}`;
  });
}

// WORKSHOP/ARCADE — swipe card. Drag the card across the slot at the right speed.
function renderSwipeCard(body, task, finish) {
  body.innerHTML = `
    <h3>WORKSHOP · SWIPE</h3>
    <p>swipe the card from left to right.</p>
    <div class="swipe-track" id="swipe-track">
      <div class="swipe-slot"></div>
      <div class="swipe-card" id="swipe-card">
        <div class="swipe-stripe"></div>
        <div class="swipe-name">CREW PASS</div>
      </div>
    </div>
    <div class="swipe-status" id="swipe-status">drag the card →</div>
  `;
  const track = body.querySelector('#swipe-track');
  const card = body.querySelector('#swipe-card');
  const status = body.querySelector('#swipe-status');
  let dragging = false, startX = 0, startT = 0, resolved = false;

  const reset = () => { card.style.transform = 'translateX(0)'; };
  const onDown = (e) => {
    e.preventDefault();
    if (resolved) return;
    dragging = true;
    startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    startT = performance.now();
    status.textContent = 'swiping…';
  };
  const onMove = (e) => {
    if (!dragging || resolved) return;
    const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const dx = Math.max(0, x - startX);
    const trackW = track.clientWidth - card.clientWidth;
    const clamped = Math.min(trackW, dx);
    card.style.transform = `translateX(${clamped}px)`;
    if (clamped >= trackW - 4) {
      resolved = true;
      const dur = performance.now() - startT;
      const inWindow = dur >= task.windowLow && dur <= task.windowHigh;
      status.textContent = inWindow ? 'accepted' : (dur < task.windowLow ? 'too fast' : 'too slow');
      setTimeout(() => finish({ success: inWindow }), 450);
    }
  };
  const onUp = () => {
    if (!dragging || resolved) return;
    dragging = false;
    status.textContent = 'try again — swipe all the way across';
    reset();
  };
  card.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  // Cleanup on close
  const obs = new MutationObserver(() => {
    if (!body.isConnected) {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      obs.disconnect();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

// STORAGE/WORKSHOP — fix wires. Tap a left endpoint, then matching colored socket on right.
function renderFixWires(body, task, finish) {
  const COLOR_HEX = { red: '#ef4444', blue: '#3b82f6', yellow: '#facc15', green: '#22c55e' };
  body.innerHTML = `
    <h3>STORAGE · FIX WIRES</h3>
    <p>connect each wire to its matching socket.</p>
    <div class="wires-board">
      <div class="wires-col left" id="wires-left"></div>
      <svg class="wires-svg" id="wires-svg"></svg>
      <div class="wires-col right" id="wires-right"></div>
    </div>
    <div class="wires-status" id="wires-status">0 / 4</div>
  `;
  const leftCol = body.querySelector('#wires-left');
  const rightCol = body.querySelector('#wires-right');
  const svg = body.querySelector('#wires-svg');
  const status = body.querySelector('#wires-status');

  const lefts = task.left || ['red','blue','yellow','green'];
  const rights = task.right || ['red','blue','yellow','green'];

  for (let i = 0; i < 4; i++) {
    const lb = document.createElement('button');
    lb.className = 'wire-end';
    lb.style.background = COLOR_HEX[lefts[i]];
    lb.dataset.color = lefts[i];
    lb.dataset.side = 'left';
    lb.dataset.idx = i;
    leftCol.appendChild(lb);

    const rb = document.createElement('button');
    rb.className = 'wire-end';
    rb.style.background = COLOR_HEX[rights[i]];
    rb.dataset.color = rights[i];
    rb.dataset.side = 'right';
    rb.dataset.idx = i;
    rightCol.appendChild(rb);
  }

  let selected = null;
  const connections = [];  // { color, leftIdx, rightIdx }

  const drawLines = () => {
    svg.innerHTML = '';
    const boardRect = svg.getBoundingClientRect();
    for (const c of connections) {
      const lEl = leftCol.children[c.leftIdx].getBoundingClientRect();
      const rEl = rightCol.children[c.rightIdx].getBoundingClientRect();
      const x1 = lEl.right - boardRect.left, y1 = lEl.top + lEl.height / 2 - boardRect.top;
      const x2 = rEl.left - boardRect.left, y2 = rEl.top + rEl.height / 2 - boardRect.top;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`);
      path.setAttribute('stroke', COLOR_HEX[c.color]);
      path.setAttribute('stroke-width', '4');
      path.setAttribute('fill', 'none');
      svg.appendChild(path);
    }
  };

  let resolved = false;
  const handle = (btn) => {
    if (resolved) return;
    if (!selected) {
      // Only allow selecting a left endpoint that isn't connected yet.
      if (btn.dataset.side !== 'left') return;
      if (connections.find(c => c.leftIdx === Number(btn.dataset.idx))) return;
      selected = btn;
      btn.classList.add('selected');
    } else if (btn === selected) {
      selected.classList.remove('selected');
      selected = null;
    } else if (btn.dataset.side === 'right') {
      if (connections.find(c => c.rightIdx === Number(btn.dataset.idx))) return;
      // Match by color
      if (btn.dataset.color !== selected.dataset.color) {
        // Wrong — flash and clear
        btn.classList.add('wrong');
        setTimeout(() => btn.classList.remove('wrong'), 300);
        selected.classList.remove('selected');
        selected = null;
        audio.bad();
        return;
      }
      connections.push({
        color: btn.dataset.color,
        leftIdx: Number(selected.dataset.idx),
        rightIdx: Number(btn.dataset.idx)
      });
      selected.classList.add('used');
      btn.classList.add('used');
      selected.classList.remove('selected');
      selected = null;
      audio.good();
      drawLines();
      status.textContent = `${connections.length} / 4`;
      if (connections.length >= 4) {
        resolved = true;
        setTimeout(() => finish({ success: true }), 400);
      }
    }
  };

  for (const btn of [...leftCol.children, ...rightCol.children]) {
    btn.addEventListener('click', () => handle(btn));
  }

  // Redraw on resize
  setTimeout(drawLines, 50);
}

// ARCHIVE/LIBRARY — unlock safe. Tap numbers 1..N in order.
function renderUnlockSafe(body, task, finish) {
  body.innerHTML = `
    <h3>ARCHIVE · UNLOCK</h3>
    <p>tap the numbers in order, 1 → ${task.total}.</p>
    <div class="safe-grid" id="safe-grid"></div>
    <div class="safe-status" id="safe-status">next: <strong>1</strong></div>
  `;
  const grid = body.querySelector('#safe-grid');
  const status = body.querySelector('#safe-status');
  const order = task.order;  // shuffled positions e.g. [4,7,2,...]

  for (let i = 0; i < order.length; i++) {
    const b = document.createElement('button');
    b.className = 'safe-num';
    b.textContent = order[i];
    b.dataset.value = order[i];
    grid.appendChild(b);
  }

  let next = 1;
  let resolved = false;
  for (const b of grid.children) {
    b.addEventListener('click', () => {
      if (resolved) return;
      const v = Number(b.dataset.value);
      if (v === next) {
        b.classList.add('done');
        next++;
        status.innerHTML = next > task.total ? 'unlocked' : `next: <strong>${next}</strong>`;
        audio.beep({ freq: 320 + next * 30, dur: 0.06, type: 'sine', gain: 0.22 });
        if (next > task.total) {
          resolved = true;
          setTimeout(() => finish({ success: true }), 400);
        }
      } else {
        b.classList.add('wrong');
        setTimeout(() => b.classList.remove('wrong'), 250);
        for (const c of grid.children) c.classList.remove('done');
        next = 1;
        status.innerHTML = 'reset · next: <strong>1</strong>';
        audio.bad();
      }
    });
  }
}

// LAB/WORKSHOP — align engine. Drag a slider into the target band and hold.
function renderAlignEngine(body, task, finish) {
  body.innerHTML = `
    <h3>LAB · ALIGN</h3>
    <p>drag the slider into the green band, hold steady.</p>
    <div class="align-track" id="align-track">
      <div class="align-band"></div>
      <div class="align-slider" id="align-slider"></div>
    </div>
    <div class="align-progress"><div class="fill" id="align-fill"></div></div>
    <div class="align-status" id="align-status">aligning…</div>
  `;
  const track = body.querySelector('#align-track');
  const slider = body.querySelector('#align-slider');
  const fill = body.querySelector('#align-fill');
  const status = body.querySelector('#align-status');

  let pos = 0;        // 0..1
  let dragging = false;
  let inBand = 0;     // ms accumulated inside the band
  let last = performance.now();
  let resolved = false;

  // Position the band visually (centered around target)
  const band = body.querySelector('.align-band');
  band.style.left = `${(task.target - task.tolerance) * 100}%`;
  band.style.width = `${(task.tolerance * 2) * 100}%`;

  const setPos = (clientX) => {
    const rect = track.getBoundingClientRect();
    pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    slider.style.left = `${pos * 100}%`;
  };

  slider.addEventListener('pointerdown', (e) => {
    e.preventDefault(); dragging = true; setPos(e.clientX);
  });
  track.addEventListener('pointerdown', (e) => {
    e.preventDefault(); dragging = true; setPos(e.clientX);
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging || resolved) return;
    setPos(e.clientX);
  });
  window.addEventListener('pointerup', () => { dragging = false; });

  const tick = () => {
    if (resolved) return;
    const now = performance.now();
    const dt = now - last; last = now;
    const aligned = Math.abs(pos - task.target) <= task.tolerance;
    if (aligned) inBand += dt;
    else inBand = Math.max(0, inBand - dt * 0.5);  // bleed off slowly
    fill.style.width = `${Math.min(100, (inBand / task.holdMs) * 100)}%`;
    status.textContent = aligned ? 'aligned · hold steady' : (inBand > 0 ? 'almost — recalibrate' : 'find the band');
    if (inBand >= task.holdMs) {
      resolved = true;
      finish({ success: true });
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ---------- meeting (Among Us-style) ----------

function renderMeeting() {
  state.view = 'meeting';
  state.myVote = null;
  const node = useTemplate('tpl-meeting');
  const form = node.querySelector('#chat-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = $('#chat-in');
    const text = inp.value.trim();
    if (!text) return;
    socket.emit('meeting_chat', { text });
    inp.value = '';
  });
  updateMeeting();
}

function updateMeeting() {
  if (state.view !== 'meeting' || !state.pub || !state.pub.meeting) return;
  const m = state.pub.meeting;

  // caller — softer "PAUSE" treatment instead of "EMERGENCY MEETING"
  const banner = state.stillOverlay ? null : $('.emergency-title');
  if (banner) banner.textContent = 'PAUSE';
  const cn = $('#caller-name');
  const callerLine = $('.caller-line');
  if (cn && m.caller) {
    cn.textContent = m.caller.name;
    cn.style.color = paletteColor(m.caller.color);
    if (callerLine) {
      callerLine.innerHTML = `called by <span id="caller-name" style="color:${paletteColor(m.caller.color)}">${escapeHtml(m.caller.name)}</span>`;
    }
  }

  // situation moved to a small flavor footer
  const sm = $('#situation-mini');
  if (sm) sm.textContent = m.situation ? `“${m.situation}”` : '';

  // chat
  const chat = $('#chat');
  chat.innerHTML = '';
  for (const msg of m.chat || []) {
    const d = document.createElement('div');
    d.className = 'msg';
    const who = msg.byColor ? `<span class="who" style="color:${paletteColor(msg.byColor)}">${escapeHtml(msg.byName)}:</span>` :
      `<span class="who">${escapeHtml(msg.byName)}:</span>`;
    d.innerHTML = who + escapeHtml(msg.text);
    chat.appendChild(d);
  }
  chat.scrollTop = chat.scrollHeight;

  const chatIn = $('#chat-in');
  const chatForm = $('#chat-form');
  const canChat = m.phase === 'discussion' && state.role === 'player' && state.you && !state.you.eliminated;
  if (chatIn) chatIn.disabled = !canChat;
  if (chatForm) chatForm.style.opacity = canChat ? 1 : 0.4;

  const tEl = $('#meeting-timer');
  if (tEl) {
    const left = Math.max(0, Math.ceil((m.endsAt - Date.now()) / 1000));
    const phaseLabel = m.phase === 'discussion' ? 'DISCUSS' : (m.phase === 'voting' ? 'VOTE' : 'RESOLVED');
    tEl.innerHTML = `<span class="phase ${m.phase}">${phaseLabel}</span><span class="secs">${left}s</span>`;
    if (m.phase !== 'resolved') {
      clearTimeout(state.meetingTimer);
      state.meetingTimer = setTimeout(updateMeeting, 500);
    }
  }

  // crewmate grid (Among Us-style)
  const grid = $('#meeting-grid');
  grid.innerHTML = '';
  const voteCounts = m.phase === 'resolved' ? (m.voteCounts || {}) : {};
  const myId = state.me?.id;
  for (const p of state.pub.players) {
    const card = document.createElement('div');
    card.className = 'crew-card';
    if (p.eliminated) card.classList.add('elim');
    if (m.eliminated && m.eliminated.id === p.id) card.classList.add('ejected');
    if (state.myVote === p.id) card.classList.add('voted-by-me');

    const c = document.createElement('canvas');
    c.width = 96; c.height = 110;
    card.appendChild(c);
    const cctx = c.getContext('2d');
    drawCrewmate(cctx, 48, 60, p.color, { x: 0, y: 1 }, p.eliminated, p.id === myId, 1.7, false, 0, null, p.hat || 'none', p.face || 'calm', false, p.visor || 'sky', p.accessory || 'none', p.pet || 'none');

    const nameEl = document.createElement('div');
    nameEl.className = 'crew-name';
    nameEl.textContent = p.name;
    nameEl.style.color = paletteColor(p.color);
    card.appendChild(nameEl);

    if (voteCounts[p.id]) {
      const v = document.createElement('div');
      v.className = 'crew-votes';
      v.textContent = '× ' + voteCounts[p.id];
      card.appendChild(v);
    }

    if (m.phase === 'voting' && state.role === 'player' && state.you && !state.you.eliminated && !p.eliminated && p.id !== myId) {
      card.classList.add('clickable');
      card.addEventListener('click', () => {
        socket.emit('meeting_vote', { target: p.id });
        state.myVote = p.id;
        toast(`voted for ${p.name}`);
        updateMeeting();
      });
    }
    grid.appendChild(card);
  }

  // vote section
  const vs = $('#vote-section');
  vs.innerHTML = '';
  if (m.phase === 'voting' && state.role === 'player' && state.you && !state.you.eliminated) {
    const sb = document.createElement('button');
    sb.className = 'btn vote-btn ' + (state.myVote === 'skip' ? 'voted' : '');
    sb.textContent = state.myVote === 'skip' ? 'skipped' : 'skip vote';
    sb.addEventListener('click', () => {
      socket.emit('meeting_vote', { target: 'skip' });
      state.myVote = 'skip';
      toast('skipped');
      updateMeeting();
    });
    vs.appendChild(sb);
  }
  if (m.phase === 'resolved') {
    const d = document.createElement('div');
    d.className = 'resolved-banner';
    if (m.eliminated) {
      const wasD = m.eliminated.role === 'distraction';
      d.innerHTML = `<strong style="color:${paletteColor(m.eliminated.color)}">${escapeHtml(m.eliminated.name)}</strong>` +
                    ` was ejected. They were <strong class="rev-${m.eliminated.role}">${m.eliminated.role.toUpperCase()}</strong>` +
                    `<div class="resolved-sub">${wasD ? 'a Distraction has been removed.' : 'an innocent Seeker has been ejected.'}</div>`;
    } else {
      d.textContent = 'no one was ejected.';
      d.classList.add('skip');
    }
    vs.appendChild(d);
  }
}

// ---------- still moment ----------

function showStillQuestion(question, endsAt) {
  if (state.stillOverlay) closeOverlay(state.stillOverlay);
  const ol = openOverlay('tpl-still-question');
  ol.dataset.kind = 'question';
  state.stillOverlay = ol;
  ol.querySelector('#still-q').textContent = question;
  const input = ol.querySelector('#still-in');
  const submitBtn = ol.querySelector('#still-submit');
  const timerEl = ol.querySelector('#still-timer');
  const subEl = ol.querySelector('#still-sub');
  let submitted = false;
  setTimeout(() => input.focus(), 800);
  const doSubmit = () => {
    if (submitted) return;
    const val = input.value.trim();
    if (!val) { toast('one word.'); return; }
    submitted = true;
    audio.click();
    socket.emit('still_answer', { answer: val });
    input.disabled = true;
    submitBtn.disabled = true;
    subEl.textContent = 'submitted';
  };
  submitBtn.addEventListener('click', doSubmit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSubmit(); });
  const tick = setInterval(() => {
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    timerEl.textContent = left + 's';
    if (left <= 0) { clearInterval(tick); }
  }, 200);
  ol._tick = tick;
}

function showStillReveal() {
  const ol = openOverlay('tpl-still-reveal');
  ol.dataset.kind = 'reveal';
  state.stillOverlay = ol;
  updateStillReveal();
}

function updateStillReveal() {
  if (!state.stillOverlay || state.stillOverlay.dataset.kind !== 'reveal') return;
  const reveal = state.pub?.stillMoment?.reveal;
  if (!reveal) return;
  const wrap = state.stillOverlay.querySelector('#still-answers');
  if (!wrap) return;
  if (wrap._populated) return;
  wrap._populated = true;
  wrap.innerHTML = '';
  // Each entry: name + color dot + answer. The mismatched flag is hidden —
  // players have to spot the off-key answer themselves.
  for (const a of reveal.answers) {
    const el = document.createElement('div');
    el.className = 'answer named';
    const color = paletteColor(a.color);
    el.innerHTML =
      `<div class="who"><span class="dot" style="background:${color}"></span>` +
      `<span class="name" style="color:${color}">${escapeHtml(a.name || '—')}</span></div>` +
      `<div class="text">${escapeHtml(a.answer)}</div>`;
    wrap.appendChild(el);
  }
}

// ---------- end ----------

function renderEnd() {
  state.view = 'end';
  const node = useTemplate('tpl-end');
  populateEnd();
  node.querySelector('#play-again').addEventListener('click', () => {
    if (state.role === 'host') socket.emit('restart');
    else toast('host restarts the game.');
  });
}

function populateEnd() {
  if (state.view !== 'end') return;
  const info = state.gameOver;
  const h1 = $('#end-winner');
  if (h1 && info) {
    h1.className = info.winner === 'seekers' ? 'winner-seekers' : 'winner-distraction';
    h1.textContent = info.winner === 'seekers' ? 'CREW WINS' : 'DISTRACTION WINS';
  }
  const reason = $('#end-reason');
  if (reason && info) reason.textContent = info.reason || '';

  const list = $('#reveal-list');
  if (list && info) {
    list.innerHTML = '';
    for (const p of info.reveal) {
      const r = document.createElement('div');
      r.className = 'row';
      const personaText = p.persona && PERSONAS[p.persona] ? `· ${PERSONAS[p.persona].label}` : '';
      r.innerHTML = `
        <span><span class="dot" style="background:${paletteColor(p.color)}"></span>${escapeHtml(p.name)}${p.eliminated ? ' <span style="color:var(--fg-dimmer)">· ejected</span>' : ''}<span class="persona-tag">${escapeHtml(personaText)}</span></span>
        <span class="role-${p.role}">${p.role.toUpperCase()}</span>
      `;
      list.appendChild(r);
    }
  }

  const hist = $('#still-history');
  if (hist && info) {
    hist.innerHTML = '';
    if (!info.stillMoments || !info.stillMoments.length) {
      hist.innerHTML = '<div style="color:var(--fg-dim); font-size:13px;">No Still Moments happened.</div>';
    } else {
      info.stillMoments.forEach((m, idx) => {
        const node = document.createElement('div');
        node.className = 'moment';
        node.innerHTML = `
          <div class="qline">
            <span style="color:var(--fg-dim)">${idx + 1} ·</span>
            <span class="seeker-q">seekers: ${escapeHtml(m.seekerQuestion)}</span>
            <span class="dist-q">distraction: ${escapeHtml(m.distractionQuestion)}</span>
          </div>
          <div class="answers"></div>
        `;
        const aw = node.querySelector('.answers');
        for (const a of m.answers) {
          const cell = document.createElement('div');
          cell.className = 'a' + (a.mismatched ? ' mis' : '');
          cell.innerHTML = `<span class="n">${escapeHtml(a.playerName)}</span>${escapeHtml(a.answer)}`;
          aw.appendChild(cell);
        }
        hist.appendChild(node);
      });
    }
  }
}

// ---------- boot ----------

renderLanding();
