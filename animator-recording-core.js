// Pure data layer for the animator recorder: snapshots, interpolation, storage
// validation. It never touches the DOM, so it can be required directly in Node.
(() => {
  'use strict';

  const SNAPSHOT_VERSION = 1;
  const STORE_VERSION = 1;
  const PART_ORDER = [
    'torso', 'head',
    'left-upper-arm', 'left-forearm', 'right-upper-arm', 'right-forearm',
    'left-thigh', 'left-shin', 'right-thigh', 'right-shin'
  ];

  const LIMIT = { angle: 720, root: 4000, scaleMin: 0.05, scaleMax: 20, spacing: 400, offset: 1000000 };

  const round = (value, digits = 2) => {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  };
  const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);
  const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));
  const toNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };

  function clonePose(pose) {
    const clone = { ...pose };
    clone.root = { ...(pose.root || {}) };
    clone.parts = {};
    Object.keys(pose.parts || {}).forEach((name) => {
      clone.parts[name] = { ...pose.parts[name] };
    });
    clone.feet = {
      left: { ...((pose.feet && pose.feet.left) || {}) },
      right: { ...((pose.feet && pose.feet.right) || {}) }
    };
    clone.camera = { ...(pose.camera || {}), pivot: { ...((pose.camera && pose.camera.pivot) || {}) } };
    clone.ground = { ...(pose.ground || {}) };
    return clone;
  }

  // Capture the editable parts of a sampled pose. Feet x/y/soleY/contact are
  // derived by the caller through computeRig, so they stay out of a snapshot.
  function toSnapshot(pose) {
    if (!pose || !pose.parts) return null;
    return {
      v: SNAPSHOT_VERSION,
      n: typeof pose.name === 'string' && pose.name ? pose.name : 'stand',
      r: [round(toNumber(pose.root && pose.root.x)), round(toNumber(pose.root && pose.root.y))],
      b: round(toNumber(pose.bodyRotation)),
      p: PART_ORDER.map((name) => round(toNumber(pose.parts[name] && pose.parts[name].rotation))),
      f: ['left', 'right'].map((side) => {
        const foot = (pose.feet && pose.feet[side]) || {};
        return [round(toNumber(foot.angle)), round(toNumber(foot.worldAngle))];
      }),
      c: [
        round(toNumber(pose.camera && pose.camera.scale, 1), 3),
        round(toNumber(pose.camera && pose.camera.pivot && pose.camera.pivot.x)),
        round(toNumber(pose.camera && pose.camera.pivot && pose.camera.pivot.y))
      ],
      g: [
        pose.ground && pose.ground.visible ? 1 : 0,
        round(toNumber(pose.ground && pose.ground.offset)),
        round(toNumber(pose.ground && pose.ground.spacing, 32))
      ]
    };
  }

  // Rebuild a drawable pose from a snapshot using a full pose as structure.
  // Derived foot geometry is refreshed by the caller after this call.
  function fromSnapshot(snapshot, template) {
    if (!template || !isUsableSnapshot(snapshot)) return template;
    const pose = clonePose(template);
    pose.name = snapshot.n;
    pose.root.x = snapshot.r[0];
    pose.root.y = snapshot.r[1];
    pose.bodyRotation = snapshot.b;
    PART_ORDER.forEach((name, index) => {
      if (!pose.parts[name]) pose.parts[name] = { rotation: 0 };
      pose.parts[name].rotation = name === 'torso' ? snapshot.b : snapshot.p[index];
    });
    ['left', 'right'].forEach((side, index) => {
      pose.feet[side] = {
        ...pose.feet[side],
        angle: snapshot.f[index][0],
        worldAngle: snapshot.f[index][1]
      };
    });
    pose.camera.scale = snapshot.c[0];
    pose.camera.pivot.x = snapshot.c[1];
    pose.camera.pivot.y = snapshot.c[2];
    pose.ground.visible = Boolean(snapshot.g[0]);
    pose.ground.offset = snapshot.g[1];
    pose.ground.spacing = snapshot.g[2];
    return pose;
  }

  function snapshotNumbers(snapshot) {
    return [
      snapshot.r[0], snapshot.r[1], snapshot.b,
      ...snapshot.p,
      ...snapshot.f[0], ...snapshot.f[1],
      ...snapshot.c, ...snapshot.g
    ];
  }

  function isUsableSnapshot(value) {
    if (!isPlainObject(value) || value.v !== SNAPSHOT_VERSION) return false;
    if (typeof value.n !== 'string') return false;
    if (!Array.isArray(value.r) || value.r.length !== 2) return false;
    if (!Array.isArray(value.p) || value.p.length !== PART_ORDER.length) return false;
    if (!Array.isArray(value.f) || value.f.length !== 2) return false;
    if (!Array.isArray(value.f[0]) || value.f[0].length !== 2) return false;
    if (!Array.isArray(value.f[1]) || value.f[1].length !== 2) return false;
    if (!Array.isArray(value.c) || value.c.length !== 3) return false;
    if (!Array.isArray(value.g) || value.g.length !== 3) return false;
    if (!snapshotNumbers(value).every(isFiniteNumber)) return false;
    if (Math.abs(value.r[0]) > LIMIT.root || Math.abs(value.r[1]) > LIMIT.root) return false;
    if (Math.abs(value.b) > LIMIT.angle) return false;
    if (value.p.some((angle) => Math.abs(angle) > LIMIT.angle)) return false;
    if (value.f.some((foot) => foot.some((angle) => Math.abs(angle) > LIMIT.angle))) return false;
    if (value.c[0] < LIMIT.scaleMin || value.c[0] > LIMIT.scaleMax) return false;
    if (value.g[2] < 0 || value.g[2] > LIMIT.spacing) return false;
    if (Math.abs(value.g[1]) > LIMIT.offset) return false;
    return true;
  }
  // Tolerant reader: repairs loose numbers and clamps them instead of failing.
  function sanitizeSnapshot(value) {
    if (!isPlainObject(value)) return null;
    const parts = Array.isArray(value.p) ? value.p : [];
    if (parts.length !== PART_ORDER.length) return null;
    const feet = Array.isArray(value.f) ? value.f : [];
    if (feet.length !== 2 || !Array.isArray(feet[0]) || !Array.isArray(feet[1])) return null;
    const root = Array.isArray(value.r) && value.r.length === 2 ? value.r : null;
    const camera = Array.isArray(value.c) && value.c.length === 3 ? value.c : null;
    const ground = Array.isArray(value.g) && value.g.length === 3 ? value.g : null;
    if (!root || !camera || !ground) return null;
    const angle = (input) => clampNumber(toNumber(input), -LIMIT.angle, LIMIT.angle);
    return {
      v: SNAPSHOT_VERSION,
      n: typeof value.n === 'string' && /^[a-z][a-z-]{0,23}$/.test(value.n) ? value.n : 'stand',
      r: [
        round(clampNumber(toNumber(root[0]), -LIMIT.root, LIMIT.root)),
        round(clampNumber(toNumber(root[1]), -LIMIT.root, LIMIT.root))
      ],
      b: round(angle(value.b)),
      p: parts.map((entry) => round(angle(entry))),
      f: feet.map((foot) => [round(angle(foot[0])), round(angle(foot[1]))]),
      c: [
        round(clampNumber(toNumber(camera[0], 1), LIMIT.scaleMin, LIMIT.scaleMax), 3),
        round(clampNumber(toNumber(camera[1]), -LIMIT.root, LIMIT.root)),
        round(clampNumber(toNumber(camera[2]), -LIMIT.root, LIMIT.root))
      ],
      g: [
        toNumber(ground[0]) ? 1 : 0,
        round(clampNumber(toNumber(ground[1]), -LIMIT.offset, LIMIT.offset)),
        round(clampNumber(toNumber(ground[2], 32), 0, LIMIT.spacing))
      ]
    };
  }
  function sameSnapshot(a, b) {
    if (!a || !b) return false;
    if (a.r[0] !== b.r[0] || a.r[1] !== b.r[1] || a.b !== b.b) return false;
    for (let index = 0; index < PART_ORDER.length; index += 1) {
      if (a.p[index] !== b.p[index]) return false;
    }
    for (let side = 0; side < 2; side += 1) {
      if (a.f[side][0] !== b.f[side][0] || a.f[side][1] !== b.f[side][1]) return false;
    }
    for (let index = 0; index < 3; index += 1) {
      if (a.c[index] !== b.c[index] || a.g[index] !== b.g[index]) return false;
    }
    return true;
  }

  const normalize360 = (angle) => ((angle % 360) + 360) % 360;
  // Shortest signed rotation, so 170° -> -170° turns 20° and not 340°.
  function shortestDelta(from, to) {
    return normalize360(to - from + 180) - 180;
  }

  const lerp = (from, to, ratio) => from + (to - from) * ratio;
  const lerpAngle = (from, to, ratio) => round(from + shortestDelta(from, to) * ratio);

  function lerpSnapshot(from, to, ratio) {
    if (!from) return to;
    if (!to) return from;
    const u = clampNumber(toNumber(ratio, 0), 0, 1);
    return {
      v: SNAPSHOT_VERSION,
      n: u < 0.5 ? from.n : to.n,
      r: [round(lerp(from.r[0], to.r[0], u)), round(lerp(from.r[1], to.r[1], u))],
      b: lerpAngle(from.b, to.b, u),
      p: PART_ORDER.map((_, index) => lerpAngle(from.p[index], to.p[index], u)),
      f: [0, 1].map((side) => [
        lerpAngle(from.f[side][0], to.f[side][0], u),
        lerpAngle(from.f[side][1], to.f[side][1], u)
      ]),
      c: [0, 1, 2].map((index) => round(lerp(from.c[index], to.c[index], u), 3)),
      g: [
        u < 0.5 ? from.g[0] : to.g[0],
        round(lerp(from.g[1], to.g[1], u)),
        round(lerp(from.g[2], to.g[2], u))
      ]
    };
  }

  // Frame index whose timestamp is the latest one <= time (binary search).
  function frameIndexAt(frames, time) {
    if (!Array.isArray(frames) || !frames.length) return -1;
    const last = frames.length - 1;
    if (time <= frames[0].t) return 0;
    if (time >= frames[last].t) return last;
    let low = 0;
    let high = last;
    while (low + 1 < high) {
      const mid = (low + high) >> 1;
      if (frames[mid].t <= time) low = mid;
      else high = mid;
    }
    return low;
  }

  function sampleAt(frames, time) {
    const index = frameIndexAt(frames, time);
    if (index < 0) return null;
    const current = frames[index];
    const next = frames[index + 1];
    if (!next || time <= current.t) return current.s;
    const span = next.t - current.t;
    const ratio = span > 0 ? clampNumber((time - current.t) / span, 0, 1) : 1;
    return lerpSnapshot(current.s, next.s, ratio);
  }

  const durationOf = (frames) => (Array.isArray(frames) && frames.length ? frames[frames.length - 1].t : 0);

  function formatDuration(milliseconds) {
    const total = Math.max(0, Math.round(toNumber(milliseconds)));
    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    const tenths = Math.floor((total % 1000) / 100);
    return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
  }

  function formatDate(timestamp) {
    const date = new Date(toNumber(timestamp));
    if (Number.isNaN(date.getTime())) return '';
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function createId(prefix = 'item') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function cleanName(value, fallback) {
    const text = typeof value === 'string' ? value.trim().slice(0, 60) : '';
    return text || fallback;
  }

  function uniqueName(base, names) {
    const clean = cleanName(base, 'item');
    const used = new Set((names || []).map((name) => String(name)));
    if (!used.has(clean)) return clean;
    let index = 2;
    while (used.has(`${clean} (${index})`)) index += 1;
    return `${clean} (${index})`;
  }

  function sanitizePoseItem(value) {
    if (!isPlainObject(value)) return null;
    const pose = sanitizeSnapshot(value.pose);
    if (!pose) return null;
    return {
      id: typeof value.id === 'string' && value.id ? value.id : createId('pose'),
      name: cleanName(value.name, 'Pose'),
      createdAt: isFiniteNumber(value.createdAt) ? value.createdAt : Date.now(),
      pose
    };
  }

  function sanitizeRecording(value) {
    if (!isPlainObject(value)) return null;
    if (!Array.isArray(value.frames)) return null;
    const frames = [];
    value.frames.forEach((frame) => {
      if (!isPlainObject(frame)) return;
      const time = Math.round(toNumber(frame.t, -1));
      const snapshot = sanitizeSnapshot(frame.s);
      if (time < 0 || !snapshot) return;
      const previous = frames[frames.length - 1];
      if (previous && time <= previous.t) return;
      frames.push({ t: time, s: snapshot });
    });
    if (frames.length < 2 || durationOf(frames) <= 0) return null;
    return {
      id: typeof value.id === 'string' && value.id ? value.id : createId('rec'),
      name: cleanName(value.name, 'Recording'),
      createdAt: isFiniteNumber(value.createdAt) ? value.createdAt : Date.now(),
      duration: durationOf(frames),
      frames
    };
  }

  // ok=false means "the stored text is unreadable"; callers must not overwrite
  // it silently. dropped counts entries that were repaired away.
  function parseStore(raw, kind) {
    const result = { ok: false, items: [], dropped: 0 };
    if (typeof raw !== 'string' || !raw.trim()) {
      result.ok = true;
      return result;
    }
    let data;
    try {
      data = JSON.parse(raw);
    } catch (error) {
      return result;
    }
    if (!isPlainObject(data) || data.version !== STORE_VERSION || !Array.isArray(data.items)) return result;
    const sanitize = kind === 'recordings' ? sanitizeRecording : sanitizePoseItem;
    data.items.forEach((item) => {
      const clean = sanitize(item);
      if (clean) result.items.push(clean);
      else result.dropped += 1;
    });
    result.ok = true;
    return result;
  }

  function serializeStore(kind, items) {
    return JSON.stringify({
      version: STORE_VERSION,
      kind: kind === 'recordings' ? 'recordings' : 'poses',
      items: Array.isArray(items) ? items : []
    });
  }

  const api = {
    SNAPSHOT_VERSION,
    STORE_VERSION,
    PART_ORDER,
    toSnapshot,
    fromSnapshot,
    isUsableSnapshot,
    sanitizeSnapshot,
    sameSnapshot,
    shortestDelta,
    lerpSnapshot,
    frameIndexAt,
    sampleAt,
    durationOf,
    formatDuration,
    formatDate,
    createId,
    uniqueName,
    sanitizePoseItem,
    sanitizeRecording,
    parseStore,
    serializeStore
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof globalThis !== 'undefined') globalThis.StickmanRecordingCore = api;
})();
