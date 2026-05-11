// DOLCE — a social deduction game built around the Still Moment.
// All game state lives in-memory, keyed by 4-letter room code.

const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { MEETING_SITUATIONS, STILL_MOMENTS, TRANSIT_STATEMENTS } = require('./content');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

// ---------- map ----------
// 13 rooms + a central CAFETERIA hub, organized into a top deck (6 rooms),
// mid deck (5 rooms), and a southern garden tier (2 rooms). Corridors wind
// between them. SAUNA, OBSERVATORY, and SNOWY STREET come straight out of
// Boris's polyphony piece — places where stillness happens differently.

const MAP_W = 2200;
const MAP_H = 1500;

const LOCATIONS = [
  // Top deck (y=80–360) — six rooms, with CAFETERIA as the central plaza below.
  { id: 'archive',     name: 'ARCHIVE',     x: 60,   y: 80,   w: 220, h: 280, theme: 'archive'     },
  { id: 'library',     name: 'LIBRARY',     x: 340,  y: 80,   w: 220, h: 280, theme: 'library'     },
  { id: 'sauna',       name: 'SAUNA',       x: 620,  y: 80,   w: 220, h: 280, theme: 'sauna'       },
  { id: 'observatory', name: 'OBSERVATORY', x: 1240, y: 80,   w: 280, h: 280, theme: 'observatory' },
  { id: 'arcade',      name: 'ARCADE',      x: 1580, y: 80,   w: 220, h: 280, theme: 'arcade'      },
  { id: 'workshop',    name: 'WORKSHOP',    x: 1860, y: 80,   w: 220, h: 280, theme: 'workshop'    },
  // Mid deck (y=560–840)
  { id: 'lab',     name: 'LAB',     x: 60,   y: 560,  w: 220, h: 280, theme: 'lab'     },
  { id: 'cafe',    name: 'CAFÉ',    x: 340,  y: 560,  w: 220, h: 280, theme: 'cafe'    },
  { id: 'storage', name: 'STORAGE', x: 620,  y: 560,  w: 460, h: 280, theme: 'storage' },
  { id: 'lounge',  name: 'LOUNGE',  x: 1380, y: 560,  w: 220, h: 280, theme: 'lounge'  },
  { id: 'transit', name: 'TRANSIT', x: 1660, y: 560,  w: 220, h: 280, theme: 'transit' },
  // South tier (y=1080–1340) — contemplative spaces
  { id: 'park',   name: 'PARK',         x: 660,  y: 1080, w: 320, h: 280, theme: 'park'   },
  { id: 'street', name: 'SNOWY STREET', x: 1040, y: 1080, w: 320, h: 280, theme: 'street' }
];
// CAFETERIA: central hub. No task; safe spawn point.
const PLAZA = { id: 'cafeteria', name: 'CAFETERIA', x: 900, y: 80, w: 280, h: 280, theme: 'cafeteria' };

// Corridors — narrow walkable strips bridging the rooms. Branching topology
// rather than a strict grid, so the map feels like a place you can lose
// yourself in.
const CORRIDORS = [
  // Top deck horizontal bridges
  { x: 280,  y: 200, w: 60, h: 60 },   // archive → library
  { x: 560,  y: 200, w: 60, h: 60 },   // library → sauna
  { x: 840,  y: 200, w: 60, h: 60 },   // sauna → cafeteria
  { x: 1180, y: 200, w: 60, h: 60 },   // cafeteria → observatory
  { x: 1520, y: 200, w: 60, h: 60 },   // observatory → arcade
  { x: 1800, y: 200, w: 60, h: 60 },   // arcade → workshop
  // Mid deck horizontal bridges
  { x: 280,  y: 680, w: 60, h: 60 },   // lab → cafe
  { x: 560,  y: 680, w: 60, h: 60 },   // cafe → storage
  { x: 1080, y: 680, w: 300, h: 60 },  // storage → lounge (long bridge across the south spur)
  { x: 1600, y: 680, w: 60, h: 60 },   // lounge → transit
  // Vertical (top deck → mid deck)
  { x: 130,  y: 360, w: 80, h: 200 },  // archive → lab
  { x: 410,  y: 360, w: 80, h: 200 },  // library → cafe
  { x: 700,  y: 360, w: 80, h: 200 },  // sauna → storage (left side)
  { x: 1000, y: 360, w: 80, h: 200 },  // cafeteria → storage (center)
  { x: 1340, y: 360, w: 80, h: 200 },  // observatory → lounge
  { x: 1700, y: 360, w: 80, h: 200 },  // arcade → transit (slightly diagonal feel)
  { x: 1940, y: 360, w: 80, h: 200 },  // workshop → transit (right)
  // South spurs
  { x: 760,  y: 840, w: 80, h: 240 },  // storage → park
  { x: 1140, y: 840, w: 80, h: 240 },  // storage → snowy street
  { x: 980,  y: 1180, w: 60, h: 80 }   // park ↔ snowy street short bridge
];

// Vents — eight, distributed across both decks. Sparse enough that the
// Distraction has to think about routing rather than teleport everywhere.
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
const VENT_RADIUS = 28;

const WALKABLE = [...LOCATIONS, PLAZA, ...CORRIDORS];
const SPAWN = { x: 1040, y: 200 };  // middle of the cafeteria

function walkable(x, y) {
  for (const r of WALKABLE) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
  }
  return false;
}
function locationAt(x, y) {
  for (const l of LOCATIONS) {
    if (x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h) return l;
  }
  return null;
}
function ventAt(x, y) {
  for (const v of VENTS) {
    if (Math.abs(x - v.x) <= VENT_RADIUS && Math.abs(y - v.y) <= VENT_RADIUS) return v;
  }
  return null;
}
function ventById(id) { return VENTS.find(v => v.id === id) || null; }
function locMeta(id) { return LOCATIONS.find(l => l.id === id); }

// ---------- task pool ----------
// Each Seeker is dealt 4 tasks at game start. They can only do their own
// assigned tasks — walking into a room without a pending task there gives a
// "no task here for you" toast. Calm fills as crew completes assigned tasks.
const TASK_POOL = [
  { id: 't_archive_hold',     kind: 'hold',         locationId: 'archive',     label: 'study the archive'        },
  { id: 't_archive_safe',     kind: 'unlock_safe',  locationId: 'archive',     label: 'unlock the records safe'  },
  { id: 't_library_hold',     kind: 'hold',         locationId: 'library',     label: 'read in silence'          },
  { id: 't_library_safe',     kind: 'unlock_safe',  locationId: 'library',     label: 'find the catalog code'    },
  { id: 't_sauna_hold',       kind: 'hold',         locationId: 'sauna',       label: 'sit in the heat'          },
  { id: 't_sauna_state',      kind: 'statement',    locationId: 'sauna',       label: 'breathe steady'           },
  { id: 't_lab_seq',          kind: 'sequence',     locationId: 'lab',         label: 'align distributor signal' },
  { id: 't_lab_engine',       kind: 'align_engine', locationId: 'lab',         label: 'tune the resonator'       },
  { id: 't_arcade_rhythm',    kind: 'rhythm',       locationId: 'arcade',      label: 'play the rhythm machine'  },
  { id: 't_arcade_swipe',     kind: 'swipe_card',   locationId: 'arcade',      label: 'top up the arcade card'   },
  { id: 't_observatory_hold', kind: 'hold',         locationId: 'observatory', label: 'watch the sky'            },
  { id: 't_observatory_seq',  kind: 'sequence',     locationId: 'observatory', label: 'trace the constellation'  },
  { id: 't_workshop_swipe',   kind: 'swipe_card',   locationId: 'workshop',    label: 'swipe in for shift'       },
  { id: 't_workshop_engine',  kind: 'align_engine', locationId: 'workshop',    label: 'align engine output'      },
  { id: 't_workshop_wires',   kind: 'fix_wires',    locationId: 'workshop',    label: 'rewire the lathe'         },
  { id: 't_cafe_pour',        kind: 'pour',         locationId: 'cafe',        label: 'pour the espresso'        },
  { id: 't_cafe_react',       kind: 'reaction',     locationId: 'cafe',        label: 'catch the falling cup'    },
  { id: 't_park_react',       kind: 'reaction',     locationId: 'park',        label: 'water the tulips'         },
  { id: 't_park_hold',        kind: 'hold',         locationId: 'park',        label: 'sit on the bench'         },
  { id: 't_street_hold',      kind: 'hold',         locationId: 'street',      label: 'stand in the snow'        },
  { id: 't_street_state',     kind: 'statement',    locationId: 'street',      label: 'reflect under the lamp'   },
  { id: 't_storage_wires',    kind: 'fix_wires',    locationId: 'storage',     label: 'fix the breaker box'      },
  { id: 't_storage_swipe',    kind: 'swipe_card',   locationId: 'storage',     label: 'sign the manifest'        },
  { id: 't_transit_state',    kind: 'statement',    locationId: 'transit',     label: 'read the timetable'       },
  { id: 't_transit_seq',      kind: 'sequence',     locationId: 'transit',     label: 'reset the platform alarm' },
  { id: 't_lounge_rhythm',    kind: 'rhythm',       locationId: 'lounge',      label: 'pour cocktails to beat'   },
  { id: 't_lounge_pour',      kind: 'pour',         locationId: 'lounge',      label: 'fill the highball'        }
];

const TASKS_PER_SEEKER = 5;

function assignTasks(count = TASKS_PER_SEEKER) {
  // Bias: prefer variety across rooms — try not to give the same seeker
  // multiple tasks in one location unless we run out of variety.
  const pool = shuffle(TASK_POOL.slice());
  const picked = [];
  const seenLocs = new Set();
  for (const t of pool) {
    if (picked.length >= count) break;
    if (seenLocs.has(t.locationId) && Math.random() < 0.65) continue;
    picked.push({ id: t.id, kind: t.kind, locationId: t.locationId, label: t.label, completed: false });
    seenLocs.add(t.locationId);
  }
  // Top up if variety bias starved us.
  for (const t of pool) {
    if (picked.length >= count) break;
    if (picked.find(p => p.id === t.id)) continue;
    picked.push({ id: t.id, kind: t.kind, locationId: t.locationId, label: t.label, completed: false });
  }
  return picked.slice(0, count);
}

function pickAssignedTaskForLocation(player, locationId) {
  return (player.assignedTasks || []).find(t => !t.completed && t.locationId === locationId) || null;
}

// ---------- player palette + customization ----------

const PLAYER_COLORS = [
  { id: 'red',     hex: '#c62828' },
  { id: 'blue',    hex: '#1565c0' },
  { id: 'green',   hex: '#2e7d32' },
  { id: 'pink',    hex: '#ec407a' },
  { id: 'orange',  hex: '#ef6c00' },
  { id: 'yellow',  hex: '#fbc02d' },
  { id: 'cyan',    hex: '#26c6da' },
  { id: 'lime',    hex: '#9ccc65' },
  { id: 'purple',  hex: '#8e24aa' },
  { id: 'brown',   hex: '#6d4c41' },
  { id: 'white',   hex: '#eceff1' },
  { id: 'black',   hex: '#37474f' },
  { id: 'tan',     hex: '#d7ccc8' },
  { id: 'gray',    hex: '#90a4ae' },
  { id: 'rose',    hex: '#f8bbd0' },
  { id: 'mint',    hex: '#a5d6a7' },
  { id: 'lavender',hex: '#b39ddb' },
  { id: 'maroon',  hex: '#7b1f1f' },
  { id: 'gold',    hex: '#c19a3a' },
  { id: 'teal',    hex: '#00897b' }
];

const HATS = [
  { id: 'none',       label: 'no hat' },
  { id: 'beanie',     label: 'beanie' },
  { id: 'headphones', label: 'headphones' },
  { id: 'cap',        label: 'cap' },
  { id: 'hood',       label: 'hood' },
  { id: 'flower',     label: 'flower' },
  { id: 'halo',       label: 'halo' },
  { id: 'horns',      label: 'horns' },
  { id: 'top_hat',    label: 'top hat' },
  { id: 'crown',      label: 'crown' },
  { id: 'party',      label: 'party hat' },
  { id: 'propeller',  label: 'propeller' },
  { id: 'mohawk',     label: 'mohawk' },
  { id: 'leaf',       label: 'leaf' },
  { id: 'antenna',    label: 'antenna' },
  { id: 'fedora',     label: 'fedora' }
];

const FACES = [
  { id: 'calm',    label: 'calm'    },
  { id: 'tired',   label: 'tired'   },
  { id: 'sharp',   label: 'sharp'   },
  { id: 'quiet',   label: 'quiet'   },
  { id: 'bright',  label: 'bright'  },
  { id: 'focused', label: 'focused' },
  { id: 'dreamy',  label: 'dreamy'  },
  { id: 'smug',    label: 'smug'    },
  { id: 'worried', label: 'worried' },
  { id: 'blank',   label: 'blank'   }
];

const VISORS = [
  { id: 'sky',     hex: '#bfe9ff' },
  { id: 'mint',    hex: '#a5e8d6' },
  { id: 'amber',   hex: '#ffd494' },
  { id: 'rose',    hex: '#ffc1d8' },
  { id: 'lilac',   hex: '#d9c2ff' },
  { id: 'mirror',  hex: '#e5e7eb' },
  { id: 'dark',    hex: '#1f2937' },
  { id: 'gold',    hex: '#fde68a' }
];

const ACCESSORIES = [
  { id: 'none',      label: 'none' },
  { id: 'glasses',   label: 'glasses' },
  { id: 'sunglasses',label: 'sunglasses' },
  { id: 'scarf',     label: 'scarf' },
  { id: 'bowtie',    label: 'bowtie' },
  { id: 'mustache',  label: 'mustache' },
  { id: 'monocle',   label: 'monocle' },
  { id: 'bandana',   label: 'bandana' },
  { id: 'necklace',  label: 'necklace' },
  { id: 'badge',     label: 'badge' },
  { id: 'mask',      label: 'face mask' },
  { id: 'headband',  label: 'headband' }
];

const PETS = [
  { id: 'none',  label: 'no pet' },
  { id: 'cat',   label: 'cat' },
  { id: 'dog',   label: 'dog' },
  { id: 'bird',  label: 'bird' },
  { id: 'fish',  label: 'fish bowl' },
  { id: 'ghost', label: 'ghost' },
  { id: 'plant', label: 'plant' }
];

function nextAvailableColor(game) {
  const taken = new Set(Object.values(game.players).map(p => p.color));
  return (PLAYER_COLORS.find(c => !taken.has(c.id)) || PLAYER_COLORS[0]).id;
}

// ---------- personas ----------
// Three voices from Boris's polyphony piece, given mechanical form. Up to
// three random Seekers get one of these; the rest are vanilla.
const PERSONAS = {
  authoritarian: {
    id: 'authoritarian',
    label: 'THE AUTHORITARIAN',
    tagline: 'discipline first.',
    flavor: 'Tasks finish 30% faster. But one extra task on the list.',
    power: 'Tasks resolve faster — the timer moves with you.',
    weakness: 'You carry one extra assignment.'
  },
  board: {
    id: 'board',
    label: 'THE BOARD',
    tagline: 'open it. close it. open it again.',
    flavor: 'Once a minute, you can teleport to any room you have a task in.',
    power: 'JUMP — once a minute, leap to any unfinished task room.',
    weakness: 'Every Still Moment, your typing feels heavier (extra 2s).'
  },
  observer: {
    id: 'observer',
    label: 'THE OBSERVER',
    tagline: 'just watching.',
    flavor: 'Every 30 seconds, you glimpse the Distraction\'s position — for one second.',
    power: 'GLIMPSE — every 30s the map shows the Distraction for 1 second.',
    weakness: 'Your vote in meetings counts as half.'
  }
};

function assignPersonas(seekers) {
  // Randomly hand out up to 3 personas to seekers.
  const picks = shuffle(seekers).slice(0, Math.min(3, seekers.length));
  const list = ['authoritarian', 'board', 'observer'];
  picks.forEach((p, i) => { p.persona = list[i]; });
}

// ---------- tuning ----------

const SABOTAGE_COOLDOWN_MS = 11000;
const DRIFT_DURATION_MS = 14000;
const FOG_DURATION_MS = 8000;
const STUN_DURATION_MS = 8000;
const STUN_RANGE = 130;
const KILL_RANGE = 90;
const REPORT_RANGE = 110;
const KILL_COOLDOWN_MS = 25000;
const KILL_OPENING_GRACE_MS = 10000;
const VENT_COOLDOWN_MS = 1500;
const MEETINGS_ALLOWED = 2;
const STILL_INTERVAL_MS = parseInt(process.env.STILL_INTERVAL_MS || '', 10) || 90 * 1000;
const STILL_ANSWER_MS = 10 * 1000;
const STILL_REVEAL_MS = 12 * 1000;
const MEETING_DISCUSS_MS = 60 * 1000;
const MEETING_VOTE_MS = 30 * 1000;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 20;
const GAME_DURATION_MS = parseInt(process.env.GAME_DURATION_MS || '', 10) || 10 * 60 * 1000;
const BOARD_JUMP_COOLDOWN_MS = 60 * 1000;
const OBSERVER_GLIMPSE_INTERVAL_MS = 30 * 1000;
const OBSERVER_GLIMPSE_MS = 1000;

function distractionCount(n) {
  return Math.max(1, Math.floor(n / 5));
}

// ---------- helpers ----------

function code4() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- game state ----------

const games = {};

function newGame(code, hostSocketId) {
  return {
    code,
    hostSocketId,
    phase: 'lobby',
    players: {},
    bodies: [],
    meetingsLeft: MEETINGS_ALLOWED,
    meeting: null,
    stillMoment: null,
    stillMomentHistory: [],
    stillTimerHandle: null,
    driftUntil: 0,
    fogUntil: 0,
    transitTally: {},
    log: [],
    startedAt: null,
    endsAt: null,
    winner: null,
    glimpseUntil: 0   // observer glimpse window
  };
}

function newPlayer(socketId, name, color) {
  const jx = (Math.random() - 0.5) * 240;
  const jy = (Math.random() - 0.5) * 200;
  return {
    id: socketId,
    name,
    color,
    hat: 'none',
    face: 'calm',
    visor: 'sky',
    accessory: 'none',
    pet: 'none',
    role: null,
    persona: null,
    x: SPAWN.x + jx,
    y: SPAWN.y + jy,
    locationId: 'cafeteria',
    activeTask: null,
    assignedTasks: [],
    eliminated: false,
    joinedAt: Date.now(),
    sabotageCooldownUntil: 0,
    ventCooldownUntil: 0,
    stunUntil: 0,
    killCooldownUntil: 0,
    boardJumpCooldownUntil: 0,
    taskFailCooldownUntil: 0,
    tasksDone: 0
  };
}

function playerPublic(p) {
  return {
    id: p.id, name: p.name, color: p.color,
    hat: p.hat, face: p.face, visor: p.visor, accessory: p.accessory, pet: p.pet,
    x: p.x, y: p.y, locationId: p.locationId,
    eliminated: p.eliminated,
    stunned: p.stunUntil > Date.now()
  };
}

// Calm is computed from task progress: total completed across alive Seekers
// divided by their total assignments. Single bar, no Chaos counterweight.
function computeCalm(game) {
  const seekers = Object.values(game.players).filter(p => p.role === 'seeker' && !p.eliminated);
  if (!seekers.length) return 0;
  let done = 0, total = 0;
  for (const s of seekers) {
    total += (s.assignedTasks || []).length;
    done += (s.assignedTasks || []).filter(t => t.completed).length;
  }
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

function computeTasks(game) {
  const seekers = Object.values(game.players).filter(p => p.role === 'seeker' && !p.eliminated);
  let done = 0, total = 0;
  for (const s of seekers) {
    total += (s.assignedTasks || []).length;
    done += (s.assignedTasks || []).filter(t => t.completed).length;
  }
  return { done, total };
}

function timeLeftMs(game) {
  if (!game.endsAt) return null;
  return Math.max(0, game.endsAt - Date.now());
}

function publicState(game) {
  const tasks = computeTasks(game);
  const showGlimpse = game.glimpseUntil > Date.now();
  return {
    code: game.code,
    phase: game.phase,
    calm: computeCalm(game),
    meetingsLeft: game.meetingsLeft,
    driftActive: game.driftUntil > Date.now(),
    fogUntil: game.fogUntil,
    tasksDone: tasks.done,
    tasksTotal: tasks.total,
    timeLeftMs: timeLeftMs(game),
    gameDurationMs: GAME_DURATION_MS,
    glimpseActive: showGlimpse,
    glimpseUntil: game.glimpseUntil,
    distractionPositions: showGlimpse
      ? Object.values(game.players)
          .filter(p => p.role === 'distraction' && !p.eliminated)
          .map(p => ({ id: p.id, x: p.x, y: p.y }))
      : [],
    players: Object.values(game.players).map(playerPublic),
    bodies: (game.bodies || []).map(b => ({
      id: b.id, name: b.name, color: b.color, hat: b.hat, face: b.face,
      x: b.x, y: b.y, locationId: b.locationId
    })),
    meeting: game.meeting ? {
      situation: game.meeting.situation,
      caller: game.meeting.caller,
      chat: game.meeting.chat,
      endsAt: game.meeting.endsAt,
      phase: game.meeting.phase,
      eliminated: game.meeting.eliminated || null,
      voteCounts: game.meeting.phase === 'resolved' ? voteTally(game.meeting.votes) : null
    } : null,
    stillMoment: game.stillMoment ? {
      phase: game.stillMoment.phase,
      endsAt: game.stillMoment.endsAt,
      submittedCount: Object.keys(game.stillMoment.answers || {}).length,
      totalActive: game.stillMoment.activePlayerIds.length,
      reveal: game.stillMoment.phase === 'reveal' ? game.stillMoment.revealData : null
    } : null,
    log: game.log.slice(-8),
    winner: game.winner
  };
}

function voteTally(votes) {
  const t = {};
  for (const v of Object.values(votes || {})) {
    if (typeof v === 'object' && v && 'target' in v) {
      const w = v.weight || 1;
      t[v.target] = (t[v.target] || 0) + w;
    } else {
      t[v] = (t[v] || 0) + 1;
    }
  }
  return t;
}

function privateStateFor(game, socketId) {
  const me = game.players[socketId];
  if (!me) return null;
  return {
    id: me.id,
    name: me.name,
    color: me.color,
    hat: me.hat,
    face: me.face,
    visor: me.visor,
    accessory: me.accessory,
    pet: me.pet,
    role: me.role,
    persona: me.persona,
    x: me.x,
    y: me.y,
    locationId: me.locationId,
    activeTask: me.activeTask,
    assignedTasks: me.assignedTasks,
    eliminated: me.eliminated,
    sabotageCooldownUntil: me.sabotageCooldownUntil,
    ventCooldownUntil: me.ventCooldownUntil,
    stunUntil: me.stunUntil,
    killCooldownUntil: me.killCooldownUntil || 0,
    boardJumpCooldownUntil: me.boardJumpCooldownUntil,
    onVent: ventAt(me.x, me.y)?.id || null,
    tasksDone: me.tasksDone
  };
}

function broadcast(game) {
  const pub = publicState(game);
  io.to(game.code).emit('state', pub);
  if (game.hostSocketId) io.to(game.hostSocketId).emit('state', pub);
  for (const p of Object.values(game.players)) {
    io.to(p.id).emit('you', privateStateFor(game, p.id));
  }
}

function logEvent(game, text) {
  game.log.push({ t: Date.now(), text });
  if (game.log.length > 60) game.log.shift();
}

// ---------- game lifecycle ----------

function startGame(game) {
  const n = Object.values(game.players).length;
  if (n < MIN_PLAYERS) {
    io.to(game.hostSocketId).emit('err', { msg: `Need at least ${MIN_PLAYERS} players.` });
    return;
  }
  if (n > MAX_PLAYERS) {
    io.to(game.hostSocketId).emit('err', { msg: `Max ${MAX_PLAYERS} players.` });
    return;
  }
  const dCount = distractionCount(n);
  const ordered = shuffle(Object.values(game.players));
  for (let i = 0; i < dCount; i++) ordered[i].role = 'distraction';
  for (let i = dCount; i < ordered.length; i++) ordered[i].role = 'seeker';

  game.phase = 'playing';
  game.meetingsLeft = MEETINGS_ALLOWED;
  game.stillMomentHistory = [];
  game.transitTally = {};
  game.driftUntil = 0;
  game.fogUntil = 0;
  game.glimpseUntil = 0;
  game.winner = null;
  game.startedAt = Date.now();
  game.endsAt = Date.now() + GAME_DURATION_MS;
  game.bodies = [];

  for (const p of Object.values(game.players)) {
    p.x = SPAWN.x + (Math.random() - 0.5) * 220;
    p.y = SPAWN.y + (Math.random() - 0.5) * 180;
    p.locationId = 'cafeteria';
    p.activeTask = null;
    p.eliminated = false;
    p.persona = null;
    p.sabotageCooldownUntil = 0;
    p.ventCooldownUntil = 0;
    p.stunUntil = 0;
    p.killCooldownUntil = (p.role === 'distraction') ? Date.now() + KILL_OPENING_GRACE_MS : 0;
    p.boardJumpCooldownUntil = 0;
    p.taskFailCooldownUntil = 0;
    p.tasksDone = 0;
  }

  // Personas: distribute among seekers (up to 3). Authoritarian gets +1 task.
  const seekers = Object.values(game.players).filter(p => p.role === 'seeker');
  for (const s of seekers) {
    s.assignedTasks = assignTasks(TASKS_PER_SEEKER);
  }
  assignPersonas(seekers);
  for (const s of seekers) {
    if (s.persona === 'authoritarian') {
      // add one extra task
      s.assignedTasks = s.assignedTasks.concat(assignTasks(1)).slice(0, TASKS_PER_SEEKER + 1);
    }
  }

  logEvent(game, 'The game begins.');

  for (const p of Object.values(game.players)) {
    let note;
    if (p.role === 'distraction') {
      note = dCount === 1
        ? "You are The Distraction. Vent between rooms, sabotage tasks, stun nearby Seekers, or get close enough to KILL — 30s cooldown. 12s grace at game start before you can kill."
        : `You are one of ${dCount} Distractions. You don't know who the others are — act like you don't. Vent, sabotage, stun, kill, run the clock.`;
    } else {
      const persona = PERSONAS[p.persona];
      const personaLine = persona ? `\n\nYou are ${persona.label}. ${persona.flavor}` : '';
      note = dCount === 1
        ? `You are a Seeker. Complete your personal tasks across the rooms — together you fill the Calm bar before time runs out.${personaLine}`
        : `You are a Seeker. There are ${dCount} Distractions hiding among you. Finish your tasks and watch for tonal mismatches.${personaLine}`;
    }
    io.to(p.id).emit('role_reveal', { role: p.role, persona: p.persona, note });
  }
  broadcast(game);
  scheduleNextStillMoment(game);
  scheduleObserverGlimpse(game);
}

function endGame(game, winner, reason) {
  if (game.phase === 'ended') return;
  game.phase = 'ended';
  game.winner = winner;
  clearTimers(game);
  logEvent(game, `${winner === 'seekers' ? 'Crew' : 'The Distraction'} wins. ${reason}`);
  const reveal = Object.values(game.players).map(p => ({
    id: p.id, name: p.name, color: p.color, hat: p.hat, face: p.face,
    role: p.role, persona: p.persona, eliminated: p.eliminated
  }));
  io.to(game.code).emit('game_over', {
    winner, reason, reveal,
    stillMoments: game.stillMomentHistory
  });
  broadcast(game);
}

function clearTimers(game) {
  if (game.stillTimerHandle) clearTimeout(game.stillTimerHandle);
  game.stillTimerHandle = null;
  if (game._meetingTimer1) clearTimeout(game._meetingTimer1);
  if (game._meetingTimer2) clearTimeout(game._meetingTimer2);
  if (game._stillAnswerTimer) clearTimeout(game._stillAnswerTimer);
  if (game._stillRevealTimer) clearTimeout(game._stillRevealTimer);
  if (game._gameTimer) clearTimeout(game._gameTimer);
  if (game._glimpseTimer) clearTimeout(game._glimpseTimer);
}

function checkWinConditions(game) {
  if (game.phase === 'ended') return;
  if (computeCalm(game) >= 100) return endGame(game, 'seekers', 'All crew tasks complete.');
  // Time runs out → Distraction wins
  if (game.endsAt && Date.now() >= game.endsAt) {
    return endGame(game, 'distraction', 'Time ran out before the crew could finish.');
  }
  const seekers = Object.values(game.players).filter(p => p.role === 'seeker');
  const aliveSeekers = seekers.filter(p => !p.eliminated).length;
  if (aliveSeekers === 0) return endGame(game, 'distraction', 'No Seekers remain.');
  const distractions = Object.values(game.players).filter(p => p.role === 'distraction');
  if (distractions.length > 0 && distractions.every(d => d.eliminated)) {
    return endGame(game, 'seekers', distractions.length === 1 ? 'The Distraction was voted out.' : 'All Distractions were voted out.');
  }
}

function scheduleGameClock(game) {
  if (game._gameTimer) clearTimeout(game._gameTimer);
  if (!game.endsAt) return;
  const ms = Math.max(50, game.endsAt - Date.now());
  game._gameTimer = setTimeout(() => checkWinConditions(game), ms + 200);
}

// ---------- Still Moment ----------

function scheduleNextStillMoment(game, delay = STILL_INTERVAL_MS) {
  if (game.stillTimerHandle) clearTimeout(game.stillTimerHandle);
  game.stillTimerHandle = setTimeout(() => tryStartStillMoment(game), delay);
}

function tryStartStillMoment(game) {
  if (game.phase === 'ended') return;
  if (game.phase === 'playing') return startStillMoment(game);
  scheduleNextStillMoment(game, 15000);
}

function startStillMoment(game) {
  const pair = pick(STILL_MOMENTS);
  const active = Object.values(game.players).filter(p => !p.eliminated);
  const distractionIds = active.filter(p => p.role === 'distraction').map(p => p.id);
  const questionsByPlayer = {};
  for (const p of active) {
    questionsByPlayer[p.id] = (p.role === 'distraction') ? pair.distraction : pair.seeker;
  }
  // Board persona: extra time on still moment (heavier typing).
  let answerMs = STILL_ANSWER_MS;
  game.stillMoment = {
    phase: 'question',
    pair,
    distractionIds,
    activePlayerIds: active.map(p => p.id),
    questionsByPlayer,
    answers: {},
    endsAt: Date.now() + answerMs,
    revealData: null
  };
  for (const p of Object.values(game.players)) {
    if (p.activeTask) {
      io.to(p.id).emit('task_cancel', { reason: 'still' });
      p.activeTask = null;
    }
  }
  game.phase = 'still_moment';
  logEvent(game, 'A Still Moment.');
  broadcast(game);
  for (const p of active) {
    const extraMs = (p.persona === 'board') ? 2000 : 0;
    const personalEnds = game.stillMoment.endsAt + extraMs;
    io.to(p.id).emit('still_question', { question: questionsByPlayer[p.id], endsAt: personalEnds });
  }
  game._stillAnswerTimer = setTimeout(() => finishStillAnswering(game), answerMs + 2200);
}

function finishStillAnswering(game) {
  if (!game.stillMoment || game.stillMoment.phase !== 'question') return;
  const sm = game.stillMoment;
  const answers = sm.activePlayerIds.map(pid => {
    const p = game.players[pid];
    const ans = (sm.answers[pid] || '').trim() || '—';
    const question = sm.questionsByPlayer[pid];
    return {
      playerId: pid,
      playerName: p ? p.name : 'unknown',
      question,
      answer: ans,
      mismatched: sm.distractionIds.includes(pid)
    };
  });
  const revealOrder = shuffle(answers.map(a => ({
    name:   a.playerName,
    color:  game.players[a.playerId]?.color || 'gray',
    answer: a.answer
  })));
  game.stillMomentHistory.push({
    seekerQuestion: sm.pair.seeker,
    distractionQuestion: sm.pair.distraction,
    distractionIds: sm.distractionIds,
    answers
  });
  sm.revealData = { question: sm.pair.seeker, answers: revealOrder };
  sm.phase = 'reveal';
  sm.endsAt = Date.now() + STILL_REVEAL_MS;
  broadcast(game);
  game._stillRevealTimer = setTimeout(() => endStillMoment(game), STILL_REVEAL_MS);
}

function endStillMoment(game) {
  if (!game.stillMoment) return;
  game.stillMoment = null;
  if (game.phase !== 'ended') {
    game.phase = 'playing';
    logEvent(game, 'The world resumes.');
    scheduleNextStillMoment(game, STILL_INTERVAL_MS);
  }
  broadcast(game);
  checkWinConditions(game);
}

// ---------- meetings ----------

function callMeeting(game, byId, opts = {}) {
  if (game.phase !== 'playing') return;
  // Body reports always get a meeting (don't consume the emergency button).
  if (!opts.body && game.meetingsLeft <= 0) return;
  const caller = game.players[byId];
  if (!caller || caller.eliminated) return;
  // Emergency meetings can only be called from the cafeteria (main room).
  if (!opts.body && caller.locationId !== 'cafeteria') {
    io.to(caller.id).emit('toast', { msg: 'Go to the cafeteria to call a meeting.' });
    return;
  }

  if (!opts.body) game.meetingsLeft -= 1;
  const situation = pick(MEETING_SITUATIONS);
  game.meeting = {
    calledBy: byId,
    caller: { id: caller.id, name: caller.name, color: caller.color, hat: caller.hat, face: caller.face },
    body: opts.body || null,
    situation,
    chat: [],
    votes: {},
    endsAt: Date.now() + MEETING_DISCUSS_MS,
    phase: 'discussion',
    eliminated: null
  };
  game.phase = 'meeting';
  // All bodies clear once a meeting begins.
  game.bodies = [];
  for (const p of Object.values(game.players)) {
    if (p.activeTask) {
      io.to(p.id).emit('task_cancel', { reason: 'meeting' });
      p.activeTask = null;
    }
  }
  if (opts.body) logEvent(game, `${caller.name} reported ${opts.body.name}'s body.`);
  else           logEvent(game, `${caller.name} called a meeting.`);
  broadcast(game);
  game._meetingTimer1 = setTimeout(() => startVoting(game), MEETING_DISCUSS_MS);
}

// ---------- kill / bodies / report ----------

function applyKill(game, actor, targetId) {
  if (game.phase !== 'playing') return;
  if (!actor || actor.role !== 'distraction' || actor.eliminated) return;
  if ((actor.killCooldownUntil || 0) > Date.now()) {
    io.to(actor.id).emit('toast', { msg: 'Kill on cooldown.' });
    return;
  }
  const target = game.players[targetId];
  if (!target || target.eliminated || target.role !== 'seeker') return;
  const dx = target.x - actor.x, dy = target.y - actor.y;
  if (dx * dx + dy * dy > KILL_RANGE * KILL_RANGE) {
    io.to(actor.id).emit('toast', { msg: 'Out of range.' });
    return;
  }
  // Kill: target is eliminated, body remains, actor stands over body.
  target.eliminated = true;
  if (target.activeTask) {
    io.to(target.id).emit('task_cancel', { reason: 'killed' });
    target.activeTask = null;
  }
  game.bodies = game.bodies || [];
  game.bodies.push({
    id: 'b_' + Math.random().toString(36).slice(2),
    victimId: target.id,
    name: target.name, color: target.color, hat: target.hat, face: target.face,
    x: target.x, y: target.y, locationId: target.locationId,
    killedAt: Date.now()
  });
  actor.x = target.x;
  actor.y = target.y;
  actor.locationId = target.locationId;
  actor.killCooldownUntil = Date.now() + KILL_COOLDOWN_MS;
  io.to(actor.id).emit('snap_to', { x: actor.x, y: actor.y });
  io.to(target.id).emit('killed');
  logEvent(game, `${target.name} is dead.`);
  broadcast(game);
  checkWinConditions(game);
}

function applyReport(game, actor) {
  if (game.phase !== 'playing') return;
  if (!actor || actor.eliminated) return;
  const bodies = game.bodies || [];
  if (!bodies.length) return;
  let best = null, bestD = REPORT_RANGE * REPORT_RANGE;
  for (const b of bodies) {
    const dx = b.x - actor.x, dy = b.y - actor.y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= bestD) { bestD = d2; best = b; }
  }
  if (!best) {
    io.to(actor.id).emit('toast', { msg: 'No body in range.' });
    return;
  }
  callMeeting(game, actor.id, { body: best });
}

function startVoting(game) {
  if (!game.meeting || game.meeting.phase !== 'discussion') return;
  game.meeting.phase = 'voting';
  game.meeting.endsAt = Date.now() + MEETING_VOTE_MS;
  broadcast(game);
  game._meetingTimer2 = setTimeout(() => resolveMeeting(game), MEETING_VOTE_MS);
}

function resolveMeeting(game) {
  if (!game.meeting || game.meeting.phase === 'resolved') return;
  const counts = voteTally(game.meeting.votes);
  let top = null, topCount = 0, tie = false;
  for (const [k, v] of Object.entries(counts)) {
    if (v > topCount) { top = k; topCount = v; tie = false; }
    else if (v === topCount) tie = true;
  }
  let eliminated = null;
  if (top && top !== 'skip' && !tie) {
    const p = game.players[top];
    if (p) {
      p.eliminated = true;
      eliminated = { id: p.id, name: p.name, color: p.color, role: p.role, persona: p.persona };
      logEvent(game, `${p.name} was ejected. They were ${p.role}.`);
    }
  } else {
    logEvent(game, 'The meeting ended without a decision.');
  }
  game.meeting.phase = 'resolved';
  game.meeting.eliminated = eliminated;
  broadcast(game);
  setTimeout(() => {
    game.meeting = null;
    if (game.phase !== 'ended') {
      game.phase = 'playing';
      // Crew snaps back to cafeteria.
      for (const p of Object.values(game.players)) {
        if (p.eliminated) continue;
        p.x = SPAWN.x + (Math.random() - 0.5) * 220;
        p.y = SPAWN.y + (Math.random() - 0.5) * 180;
        p.locationId = 'cafeteria';
        io.to(p.id).emit('snap_to', { x: p.x, y: p.y });
      }
      broadcast(game);
    }
    checkWinConditions(game);
  }, 6000);
}

// ---------- tasks ----------

function driftModifier(game) {
  return game.driftUntil > Date.now() ? 0.5 : 1.0;
}

function authoritarianBonus(player) {
  // Authoritarian: tasks resolve 30% faster (durations shorter).
  return player.persona === 'authoritarian' ? 0.7 : 1.0;
}

const SEQUENCE_COLORS = ['r', 'g', 'b', 'y'];

function makeTask(kind, locationId, game, assignedId, player) {
  const id = Math.random().toString(36).slice(2);
  const base = { id, kind, locationId, assignedId, startedAt: Date.now() };
  const mod = driftModifier(game) / authoritarianBonus(player);
  switch (kind) {
    case 'reaction': {
      return { ...base, delayMs: 400 + Math.floor(Math.random() * 1500), windowMs: Math.round(900 * mod) };
    }
    case 'hold': {
      return { ...base, holdMs: Math.round(7500 / mod * authoritarianBonus(player)) };
    }
    case 'statement': {
      const idx = Math.floor(Math.random() * TRANSIT_STATEMENTS.length);
      return { ...base, statementIdx: idx, statement: TRANSIT_STATEMENTS[idx], answerMs: Math.round(3500 * mod) };
    }
    case 'sequence': {
      const len = 4 + Math.floor(Math.random() * 3);
      const seq = [];
      for (let i = 0; i < len; i++) seq.push(pick(SEQUENCE_COLORS));
      return { ...base, sequence: seq, showMs: Math.round(450 * mod) };
    }
    case 'pour': {
      return { ...base, target: 0.55 + Math.random() * 0.3, tolerance: 0.045, fillMs: Math.round(3000 * mod) };
    }
    case 'rhythm': {
      return { ...base, count: 6, intervalMs: Math.round(560 * mod), tolerance: Math.round(180 * mod) };
    }
    case 'swipe_card': {
      return { ...base, idealMs: Math.round(1500 * mod), windowLow: Math.round(900 * mod), windowHigh: Math.round(2300 * mod) };
    }
    case 'fix_wires': {
      const colors = ['red', 'blue', 'yellow', 'green'];
      const left = shuffle(colors);
      const right = shuffle(colors);
      return { ...base, left, right };
    }
    case 'unlock_safe': {
      const order = shuffle(Array.from({ length: 10 }, (_, i) => i + 1));
      return { ...base, order, total: 10 };
    }
    case 'align_engine': {
      return { ...base, holdMs: Math.round(1400 / mod * authoritarianBonus(player)), target: 0.5, tolerance: 0.1 };
    }
  }
  return null;
}

function onTaskComplete(game, player, taskId, payload) {
  if (!player.activeTask || player.activeTask.id !== taskId) return;
  const task = player.activeTask;
  let success = false;

  if (task.kind === 'reaction') {
    success = !!(payload && payload.hit);
  } else if (task.kind === 'hold') {
    success = !!(payload && payload.heldFull);
  } else if (task.kind === 'statement') {
    const answer = payload && (payload.answer === true ? 'true' : payload.answer === false ? 'false' : null);
    if (answer) {
      const tally = game.transitTally[task.statementIdx] || { true: 0, false: 0 };
      tally[answer] += 1;
      game.transitTally[task.statementIdx] = tally;
      const other = (tally.true + tally.false) - 1;
      if (other < 2) success = true;
      else {
        const majority = tally.true > tally.false ? 'true' : (tally.false > tally.true ? 'false' : null);
        success = !!(majority && majority === answer);
      }
    }
  } else if (task.kind === 'sequence' || task.kind === 'pour' ||
             task.kind === 'swipe_card' || task.kind === 'fix_wires' ||
             task.kind === 'unlock_safe' || task.kind === 'align_engine') {
    success = !!(payload && payload.success);
  } else if (task.kind === 'rhythm') {
    const hits = Math.max(0, Math.min(task.count, Number(payload?.hits || 0)));
    success = (hits / task.count) >= 0.7;
  }

  if (success && task.assignedId) {
    const a = (player.assignedTasks || []).find(t => t.id === task.assignedId);
    if (a && !a.completed) {
      a.completed = true;
      player.tasksDone += 1;
    }
  } else if (!success) {
    // Brief "task fumble" cooldown — can't immediately retry the room. Stings
    // a little so the Seeker can't just spam-redo the task.
    player.taskFailCooldownUntil = Date.now() + 3500;
    io.to(player.id).emit('toast', { msg: 'Task failed — wait 3s.' });
  }

  player.activeTask = null;
  broadcast(game);
  checkWinConditions(game);
}

// ---------- sabotages (interruptions, no kill) ----------

function applySabotage(game, actor, kind) {
  if (actor.role !== 'distraction' || actor.eliminated) return;
  if (actor.sabotageCooldownUntil && actor.sabotageCooldownUntil > Date.now()) {
    io.to(actor.id).emit('toast', { msg: 'Cooldown.' });
    return;
  }
  const seekers = Object.values(game.players).filter(p => p.role === 'seeker' && !p.eliminated);

  if (kind === 'intrude') {
    const candidates = seekers.filter(p => p.activeTask);
    if (!candidates.length) {
      io.to(actor.id).emit('toast', { msg: 'No one has a task in progress.' });
      return;
    }
    const target = pick(candidates);
    const newTask = makeTask(target.activeTask.kind, target.activeTask.locationId, game, target.activeTask.assignedId, target);
    target.activeTask = newTask;
    io.to(target.id).emit('task_start', newTask);
    io.to(target.id).emit('toast', { msg: 'Something intruded.' });
    logEvent(game, 'INTRUDE');
  } else if (kind === 'drift') {
    game.driftUntil = Date.now() + DRIFT_DURATION_MS;
    logEvent(game, 'DRIFT — timers warp for 12s.');
  } else if (kind === 'stun') {
    // Stun: nearest seeker within range is frozen for 6s. Cancels their task.
    let best = null, bestD = STUN_RANGE * STUN_RANGE;
    for (const s of seekers) {
      const dx = s.x - actor.x, dy = s.y - actor.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= bestD) { bestD = d2; best = s; }
    }
    if (!best) {
      io.to(actor.id).emit('toast', { msg: 'No one in range.' });
      return;
    }
    best.stunUntil = Date.now() + STUN_DURATION_MS;
    if (best.activeTask) {
      io.to(best.id).emit('task_cancel', { reason: 'stunned' });
      best.activeTask = null;
    }
    io.to(best.id).emit('toast', { msg: 'You were stunned.' });
    io.to(best.id).emit('stunned', { until: best.stunUntil });
    logEvent(game, `${best.name} was stunned.`);
  } else if (kind === 'fog') {
    game.fogUntil = Date.now() + FOG_DURATION_MS;
    for (const s of seekers) {
      if (s.activeTask && (s.activeTask.kind === 'reaction' || s.activeTask.kind === 'sequence' || s.activeTask.kind === 'unlock_safe')) {
        io.to(s.id).emit('task_cancel', { reason: 'fog' });
        s.activeTask = null;
      }
    }
    logEvent(game, 'FOG — vision drops for 7s.');
  } else {
    return;
  }
  actor.sabotageCooldownUntil = Date.now() + SABOTAGE_COOLDOWN_MS;
  broadcast(game);
  checkWinConditions(game);
}

// ---------- vents ----------

function applyVentTo(game, actor, ventId) {
  if (actor.role !== 'distraction' || actor.eliminated) return;
  if (game.phase !== 'playing') return;
  if (actor.ventCooldownUntil > Date.now()) return;
  const here = ventAt(actor.x, actor.y);
  const there = ventById(ventId);
  if (!here || !there) {
    io.to(actor.id).emit('toast', { msg: 'You must be on a vent to vent.' });
    return;
  }
  if (here.id === there.id) return;
  actor.x = there.x;
  actor.y = there.y;
  actor.locationId = there.roomId;
  actor.ventCooldownUntil = Date.now() + VENT_COOLDOWN_MS;
  if (actor.activeTask) { io.to(actor.id).emit('task_cancel', { reason: 'vented' }); actor.activeTask = null; }
  io.to(actor.id).emit('snap_to', { x: actor.x, y: actor.y });
  io.to(actor.id).emit('toast', { msg: '— vented —' });
  broadcast(game);
}

// ---------- persona powers ----------

function applyBoardJump(game, actor, locationId) {
  if (actor.role !== 'seeker' || actor.persona !== 'board') return;
  if (actor.eliminated) return;
  if (game.phase !== 'playing') return;
  if ((actor.boardJumpCooldownUntil || 0) > Date.now()) {
    io.to(actor.id).emit('toast', { msg: 'JUMP on cooldown.' });
    return;
  }
  // Must be a room you have an unfinished task in.
  const valid = (actor.assignedTasks || []).find(t => !t.completed && t.locationId === locationId);
  if (!valid) {
    io.to(actor.id).emit('toast', { msg: 'No task waiting there.' });
    return;
  }
  const loc = locMeta(locationId);
  if (!loc) return;
  actor.x = loc.x + loc.w / 2;
  actor.y = loc.y + loc.h / 2;
  actor.locationId = loc.id;
  actor.boardJumpCooldownUntil = Date.now() + BOARD_JUMP_COOLDOWN_MS;
  if (actor.activeTask) { io.to(actor.id).emit('task_cancel', { reason: 'jumped' }); actor.activeTask = null; }
  io.to(actor.id).emit('snap_to', { x: actor.x, y: actor.y });
  io.to(actor.id).emit('toast', { msg: '— jumped —' });
  broadcast(game);
}

function scheduleObserverGlimpse(game) {
  if (game._glimpseTimer) clearTimeout(game._glimpseTimer);
  game._glimpseTimer = setTimeout(() => doObserverGlimpse(game), OBSERVER_GLIMPSE_INTERVAL_MS);
}

function doObserverGlimpse(game) {
  if (game.phase === 'ended') return;
  game.glimpseUntil = Date.now() + OBSERVER_GLIMPSE_MS;
  // Notify only the observer client(s) that the glimpse is on.
  for (const p of Object.values(game.players)) {
    if (p.role === 'seeker' && p.persona === 'observer' && !p.eliminated) {
      io.to(p.id).emit('glimpse', { until: game.glimpseUntil });
    }
  }
  broadcast(game);
  scheduleObserverGlimpse(game);
}

// ---------- socket handlers ----------

io.on('connection', (socket) => {
  let currentCode = null;
  let currentRole = null;

  socket.on('host_create', (_, ack) => {
    let code;
    do { code = code4(); } while (games[code]);
    const game = newGame(code, socket.id);
    games[code] = game;
    socket.join(code);
    currentCode = code;
    currentRole = 'host';
    ack && ack({
      ok: true, code,
      palette: PLAYER_COLORS, hats: HATS, faces: FACES,
      visors: VISORS, accessories: ACCESSORIES, pets: PETS
    });
    broadcast(game);
  });

  socket.on('player_join', ({ code, name }, ack) => {
    const game = games[code];
    if (!game) return ack && ack({ ok: false, msg: 'No such room.' });
    if (game.phase !== 'lobby') return ack && ack({ ok: false, msg: 'Game already started.' });
    if (Object.keys(game.players).length >= MAX_PLAYERS) return ack && ack({ ok: false, msg: 'Room is full.' });
    const cleanName = String(name || '').trim().slice(0, 16) || 'anon';
    const color = nextAvailableColor(game);
    const p = newPlayer(socket.id, cleanName, color);
    game.players[socket.id] = p;
    socket.join(code);
    currentCode = code;
    currentRole = 'player';
    ack && ack({
      ok: true, code,
      you: { id: p.id, name: p.name, color: p.color, hat: p.hat, face: p.face, visor: p.visor, accessory: p.accessory, pet: p.pet },
      palette: PLAYER_COLORS, hats: HATS, faces: FACES,
      visors: VISORS, accessories: ACCESSORIES, pets: PETS
    });
    logEvent(game, `${p.name} joined.`);
    broadcast(game);
  });

  socket.on('change_color', ({ color }) => {
    const game = games[currentCode];
    if (!game || game.phase !== 'lobby') return;
    const p = game.players[socket.id];
    if (!p) return;
    if (!PLAYER_COLORS.find(c => c.id === color)) return;
    const taken = Object.values(game.players).some(other => other.id !== p.id && other.color === color);
    if (taken) {
      io.to(socket.id).emit('toast', { msg: 'Color taken.' });
      return;
    }
    p.color = color;
    broadcast(game);
  });

  socket.on('change_hat', ({ hat }) => {
    const game = games[currentCode];
    if (!game) return;
    const p = game.players[socket.id];
    if (!p) return;
    if (!HATS.find(h => h.id === hat)) return;
    p.hat = hat;
    broadcast(game);
  });

  socket.on('change_face', ({ face }) => {
    const game = games[currentCode];
    if (!game) return;
    const p = game.players[socket.id];
    if (!p) return;
    if (!FACES.find(f => f.id === face)) return;
    p.face = face;
    broadcast(game);
  });

  socket.on('change_visor', ({ visor }) => {
    const game = games[currentCode];
    if (!game) return;
    const p = game.players[socket.id];
    if (!p) return;
    if (!VISORS.find(v => v.id === visor)) return;
    p.visor = visor;
    broadcast(game);
  });

  socket.on('change_accessory', ({ accessory }) => {
    const game = games[currentCode];
    if (!game) return;
    const p = game.players[socket.id];
    if (!p) return;
    if (!ACCESSORIES.find(a => a.id === accessory)) return;
    p.accessory = accessory;
    broadcast(game);
  });

  socket.on('change_pet', ({ pet }) => {
    const game = games[currentCode];
    if (!game) return;
    const p = game.players[socket.id];
    if (!p) return;
    if (!PETS.find(pp => pp.id === pet)) return;
    p.pet = pet;
    broadcast(game);
  });

  socket.on('start_game', () => {
    const game = games[currentCode];
    if (!game) return;
    if (socket.id !== game.hostSocketId) return;
    startGame(game);
  });

  socket.on('move', ({ x, y }) => {
    const game = games[currentCode];
    if (!game) return;
    if (game.phase !== 'playing') return;
    const p = game.players[socket.id];
    if (!p || p.eliminated) return;
    // Stunned players can't move.
    if (p.stunUntil && p.stunUntil > Date.now()) return;
    const nx = Math.max(0, Math.min(MAP_W, Number(x) || p.x));
    const ny = Math.max(0, Math.min(MAP_H, Number(y) || p.y));

    let fx = nx, fy = ny;
    if (!walkable(fx, fy)) {
      if (walkable(p.x, fy))      fx = p.x;
      else if (walkable(fx, p.y)) fy = p.y;
      else { fx = p.x; fy = p.y; }
    }
    p.x = fx; p.y = fy;

    const prev = p.locationId;
    const loc = locationAt(fx, fy);
    p.locationId = loc ? loc.id : 'cafeteria';
    if (prev !== p.locationId) {
      if (p.activeTask) {
        io.to(p.id).emit('task_cancel', { reason: 'moved' });
        p.activeTask = null;
      }
    }
    io.to(p.id).emit('you', privateStateFor(game, p.id));
  });

  socket.on('start_task', () => {
    const game = games[currentCode];
    if (!game || game.phase !== 'playing') return;
    const p = game.players[socket.id];
    if (!p || p.eliminated || p.role !== 'seeker') return;
    if (p.stunUntil && p.stunUntil > Date.now()) {
      io.to(p.id).emit('toast', { msg: 'You are stunned.' });
      return;
    }
    if (p.taskFailCooldownUntil && p.taskFailCooldownUntil > Date.now()) {
      const left = Math.ceil((p.taskFailCooldownUntil - Date.now()) / 1000);
      io.to(p.id).emit('toast', { msg: `Shake it off (${left}s).` });
      return;
    }
    if (p.activeTask) return;
    const assigned = pickAssignedTaskForLocation(p, p.locationId);
    if (!assigned) {
      io.to(p.id).emit('toast', { msg: 'No task here for you.' });
      return;
    }
    const task = makeTask(assigned.kind, assigned.locationId, game, assigned.id, p);
    if (!task) return;
    task.label = assigned.label;
    p.activeTask = task;
    io.to(p.id).emit('task_start', task);
  });

  socket.on('complete_task', ({ taskId, payload }) => {
    const game = games[currentCode];
    if (!game) return;
    const p = game.players[socket.id];
    if (!p) return;
    onTaskComplete(game, p, taskId, payload || {});
  });

  socket.on('cancel_task', () => {
    const game = games[currentCode];
    if (!game) return;
    const p = game.players[socket.id];
    if (!p || !p.activeTask) return;
    p.activeTask = null;
    broadcast(game);
  });

  socket.on('sabotage', ({ kind }) => {
    const game = games[currentCode];
    if (!game || game.phase !== 'playing') return;
    const p = game.players[socket.id];
    if (!p) return;
    applySabotage(game, p, kind);
  });

  socket.on('vent_to', ({ ventId }) => {
    const game = games[currentCode];
    if (!game) return;
    const p = game.players[socket.id];
    if (!p) return;
    applyVentTo(game, p, ventId);
  });

  socket.on('kill', ({ targetId }) => {
    const game = games[currentCode];
    if (!game) return;
    const p = game.players[socket.id];
    if (!p) return;
    applyKill(game, p, targetId);
  });

  socket.on('board_jump', ({ locationId }) => {
    const game = games[currentCode];
    if (!game) return;
    const p = game.players[socket.id];
    if (!p) return;
    applyBoardJump(game, p, locationId);
  });

  socket.on('call_meeting', () => {
    const game = games[currentCode];
    if (!game) return;
    callMeeting(game, socket.id);
  });

  socket.on('report_body', () => {
    const game = games[currentCode];
    if (!game) return;
    const p = game.players[socket.id];
    if (!p) return;
    applyReport(game, p);
  });

  socket.on('meeting_chat', ({ text }) => {
    const game = games[currentCode];
    if (!game || game.phase !== 'meeting' || !game.meeting) return;
    if (game.meeting.phase !== 'discussion') return;
    const p = game.players[socket.id];
    if (!p || p.eliminated) return;
    const clean = String(text || '').slice(0, 140).trim();
    if (!clean) return;
    game.meeting.chat.push({ by: p.id, byName: p.name, byColor: p.color, text: clean, t: Date.now() });
    broadcast(game);
  });

  socket.on('meeting_vote', ({ target }) => {
    const game = games[currentCode];
    if (!game || game.phase !== 'meeting' || !game.meeting) return;
    if (game.meeting.phase !== 'voting') return;
    const p = game.players[socket.id];
    if (!p || p.eliminated) return;
    if (target !== 'skip' && !game.players[target]) return;
    // Observer vote weight = 0.5
    const weight = (p.persona === 'observer') ? 0.5 : 1;
    game.meeting.votes[p.id] = { target, weight };
    const aliveVoters = Object.values(game.players).filter(pp => !pp.eliminated).length;
    if (Object.keys(game.meeting.votes).length >= aliveVoters) {
      resolveMeeting(game);
    } else {
      broadcast(game);
    }
  });

  socket.on('still_answer', ({ answer }) => {
    const game = games[currentCode];
    if (!game || !game.stillMoment) return;
    if (game.stillMoment.phase !== 'question') return;
    const p = game.players[socket.id];
    if (!p || p.eliminated) return;
    const clean = String(answer || '').trim().slice(0, 24);
    if (!clean) return;
    game.stillMoment.answers[p.id] = clean;
    const total = game.stillMoment.activePlayerIds.length;
    if (Object.keys(game.stillMoment.answers).length >= total) {
      if (game._stillAnswerTimer) clearTimeout(game._stillAnswerTimer);
      finishStillAnswering(game);
    } else {
      broadcast(game);
    }
  });

  socket.on('restart', () => {
    const game = games[currentCode];
    if (!game) return;
    if (socket.id !== game.hostSocketId) return;
    clearTimers(game);
    game.phase = 'lobby';
    game.meetingsLeft = MEETINGS_ALLOWED;
    game.meeting = null; game.stillMoment = null;
    game.stillMomentHistory = []; game.log = [];
    game.driftUntil = 0; game.fogUntil = 0; game.transitTally = {};
    game.glimpseUntil = 0;
    game.bodies = [];
    game.startedAt = null; game.endsAt = null;
    game.winner = null;
    for (const p of Object.values(game.players)) {
      p.role = null;
      p.persona = null;
      p.eliminated = false;
      p.locationId = 'cafeteria';
      p.x = SPAWN.x + (Math.random() - 0.5) * 220;
      p.y = SPAWN.y + (Math.random() - 0.5) * 180;
      p.activeTask = null;
      p.assignedTasks = [];
      p.sabotageCooldownUntil = 0;
      p.ventCooldownUntil = 0;
      p.stunUntil = 0;
      p.killCooldownUntil = 0;
      p.boardJumpCooldownUntil = 0;
      p.taskFailCooldownUntil = 0;
      p.tasksDone = 0;
    }
    logEvent(game, 'A new round begins.');
    broadcast(game);
  });

  socket.on('disconnect', () => {
    const game = games[currentCode];
    if (!game) return;
    if (currentRole === 'host') return;
    if (game.players[socket.id]) {
      const name = game.players[socket.id].name;
      delete game.players[socket.id];
      logEvent(game, `${name} left.`);
      broadcast(game);
      if (game.phase === 'playing' || game.phase === 'meeting' || game.phase === 'still_moment') {
        checkWinConditions(game);
      }
    }
  });
});

// ---------- ticks ----------

setInterval(() => {
  for (const game of Object.values(games)) {
    if (game.phase !== 'playing' && game.phase !== 'meeting' && game.phase !== 'still_moment') continue;
    const payload = Object.values(game.players).map(p => ({
      id: p.id, x: p.x, y: p.y, locationId: p.locationId,
      eliminated: p.eliminated, name: p.name, color: p.color,
      hat: p.hat, face: p.face, visor: p.visor, accessory: p.accessory, pet: p.pet,
      stunned: p.stunUntil > Date.now()
    }));
    io.to(game.code).emit('positions', payload);

    // End-of-time check (independent of any timer firing).
    if (game.phase === 'playing' && game.endsAt && Date.now() >= game.endsAt) {
      checkWinConditions(game);
    }
  }
}, 120);

// ---------- cleanup ----------

setInterval(() => {
  const now = Date.now();
  for (const [code, game] of Object.entries(games)) {
    const empty = Object.keys(game.players).length === 0;
    const stale = game.startedAt && now - game.startedAt > 60 * 60 * 1000;
    if (empty && !io.sockets.adapter.rooms.get(code)) {
      clearTimers(game);
      delete games[code];
    } else if (stale) {
      clearTimers(game);
      delete games[code];
    }
  }
}, 60 * 1000);

// ---------- server ----------

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`DOLCE running at http://localhost:${PORT}`);
});
