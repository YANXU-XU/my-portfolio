(() => {
  'use strict';

  // The motion core is deliberately free of DOM access so it can be sampled in Node.
  const MOTION = (() => {
    const VIEW = { width: 360, height: 440, groundY: 430 };
    const ROOT_X = 180;
    const REST_HIP_Y = 268.5;
    const ANKLE_HEIGHT = 12;
    const HIP_X = 8;
    const SHOULDER_X = 5;
    const SHOULDER_Y = -123;
    const TORSO_LENGTH = 136;
    const HEAD_OFFSET = 34;
    const HEAD_RADIUS = 34;
    const LEG = { thigh: 80, shin: 74 };
    const ARM = { upper: 64, forearm: 58 };
    const RAD = Math.PI / 180;

    const PART_NAMES = [
      'torso', 'head',
      'left-upper-arm', 'left-forearm', 'right-upper-arm', 'right-forearm',
      'left-thigh', 'left-shin', 'right-thigh', 'right-shin'
    ];
    const LIMITS = {
      torso: [-25, 40],
      head: [-45, 35],
      'left-upper-arm': [-175, 175],
      'left-forearm': [-150, 0],
      'right-upper-arm': [-175, 175],
      'right-forearm': [-150, 0],
      'left-thigh': [-95, 95],
      'left-shin': [0, 150],
      'right-thigh': [-95, 95],
      'right-shin': [0, 150]
    };
    const CLIPS = {
      stand: { duration: 4, loop: true },
      walk: { duration: 1, loop: true },
      run: { duration: 0.7, loop: true },
      jump: { duration: 1.8, loop: false },
      swim: { duration: 2.4, loop: true },
      squat: { duration: 2.4, loop: true }
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = (t) => {
      const x = clamp(t, 0, 1);
      return x * x * (3 - 2 * x);
    };
    const normDeg = (value) => ((value + 540) % 360) - 180;
    const rad = (value) => value * RAD;
    const deg = (value) => value / RAD;
    const round = (value, digits = 2) => Number(value.toFixed(digits));

    function rotateVector(x, y, angle) {
      const r = rad(angle);
      const c = Math.cos(r);
      const s = Math.sin(r);
      return { x: x * c - y * s, y: x * s + y * c };
    }

    function pointAt(origin, angle, length) {
      // A segment's local "down" vector rotated by angle degrees.
      return {
        x: origin.x - Math.sin(rad(angle)) * length,
        y: origin.y + Math.cos(rad(angle)) * length
      };
    }

    function boundsOf(points) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      points.forEach((point) => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
      return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }

    function cameraPoint(point, camera) {
      return {
        x: camera.pivot.x + (point.x - camera.pivot.x) * camera.scale,
        y: camera.pivot.y + (point.y - camera.pivot.y) * camera.scale
      };
    }

    function makeBasePose(name, phase, time, clip) {
      return {
        name,
        phase,
        time: round(time, 4),
        playback: clip.loop ? 'loop' : 'once',
        root: { x: ROOT_X, y: REST_HIP_Y },
        bodyRotation: 0,
        parts: Object.fromEntries(PART_NAMES.map((part) => [part, { rotation: 0 }])),
        feet: {
          left: { angle: 0, worldAngle: 0, contact: false, reachable: true },
          right: { angle: 0, worldAngle: 0, contact: false, reachable: true }
        },
        camera: { scale: 1, pivot: { x: VIEW.width / 2, y: 235 } },
        ground: { visible: true, offset: 0, spacing: 32, tickCount: 12 }
      };
    }

    // Analytic two-bone solve. The knee is chosen forward (+x in the side view).
    function solveTwoBone(origin, target, upperLength, lowerLength) {
      const dx = target.x - origin.x;
      const dy = target.y - origin.y;
      const rawDistance = Math.hypot(dx, dy);
      const distance = clamp(rawDistance, Math.abs(upperLength - lowerLength) + 0.001, upperLength + lowerLength - 0.001);
      const baseAngle = Math.atan2(dy, dx);
      const cosine = clamp((upperLength * upperLength + distance * distance - lowerLength * lowerLength) / (2 * upperLength * distance), -1, 1);
      const alpha = Math.acos(cosine);
      const upperAbsolute = baseAngle - alpha;
      const knee = {
        x: origin.x + Math.cos(upperAbsolute) * upperLength,
        y: origin.y + Math.sin(upperAbsolute) * upperLength
      };
      const lowerAbsolute = Math.atan2(target.y - knee.y, target.x - knee.x);
      return {
        thigh: normDeg(deg(upperAbsolute) - 90),
        shin: normDeg(deg(lowerAbsolute - upperAbsolute)),
        knee,
        reachable: Math.abs(rawDistance - distance) < 0.5,
        targetDistance: rawDistance,
        solvedDistance: distance
      };
    }

    function makeLeg(pose, side, targetX, targetY, footWorld, contact) {
      const hipX = ROOT_X + (side === 'left' ? -HIP_X : HIP_X);
      const solution = solveTwoBone(
        { x: hipX, y: pose.root.y },
        { x: targetX, y: targetY },
        LEG.thigh,
        LEG.shin
      );
      const thigh = solution.thigh;
      const shin = solution.shin;
      pose.parts[`${side}-thigh`].rotation = thigh;
      pose.parts[`${side}-shin`].rotation = shin;
      pose.feet[side] = {
        angle: normDeg(footWorld - thigh - shin),
        worldAngle: normDeg(footWorld),
        contact: Boolean(contact) && solution.reachable,
        reachable: solution.reachable,
        targetX,
        targetY
      };
      return solution;
    }

    function footCorners(ankle, worldAngle) {
      const localCorners = [
        { x: -10, y: 0 }, { x: 32, y: 0 },
        { x: 32, y: 12 }, { x: -10, y: 12 }
      ];
      return localCorners.map((corner) => {
        const rotated = rotateVector(corner.x, corner.y, worldAngle);
        return { x: ankle.x + rotated.x, y: ankle.y + rotated.y };
      });
    }

    function computeRig(pose) {
      const points = [];
      const addPoint = (point) => {
        const item = { x: point.x, y: point.y };
        points.push(item);
        return item;
      };
      const addCircle = (center, radius) => {
        addPoint({ x: center.x - radius, y: center.y });
        addPoint({ x: center.x + radius, y: center.y });
        addPoint({ x: center.x, y: center.y - radius });
        addPoint({ x: center.x, y: center.y + radius });
      };
      const root = addPoint(pose.root);
      const body = pose.bodyRotation;
      const torsoCorners = [
        rotateVector(-18, -TORSO_LENGTH, body), rotateVector(18, -TORSO_LENGTH, body),
        rotateVector(18, 0, body), rotateVector(-18, 0, body)
      ].map((offset) => addPoint({ x: root.x + offset.x, y: root.y + offset.y }));

      const neckOffset = rotateVector(0, -TORSO_LENGTH, body);
      const neck = addPoint({ x: root.x + neckOffset.x, y: root.y + neckOffset.y });
      const headAngle = body + pose.parts.head.rotation;
      const headOffset = rotateVector(0, -HEAD_OFFSET, headAngle);
      const head = addPoint({ x: neck.x + headOffset.x, y: neck.y + headOffset.y });
      addCircle(head, HEAD_RADIUS);
      const headFront = rotateVector(40, 0, headAngle);
      const headBack = rotateVector(-34, 0, headAngle);
      addPoint({ x: head.x + headFront.x, y: head.y + headFront.y });
      addPoint({ x: head.x + headBack.x, y: head.y + headBack.y });

      const arms = {};
      ['left', 'right'].forEach((side) => {
        const sign = side === 'left' ? -1 : 1;
        const shoulderOffset = rotateVector(sign * SHOULDER_X, SHOULDER_Y, body);
        const shoulder = addPoint({ x: root.x + shoulderOffset.x, y: root.y + shoulderOffset.y });
        addCircle(shoulder, 7);
        const upperAngle = body + pose.parts[`${side}-upper-arm`].rotation;
        const elbow = addPoint(pointAt(shoulder, upperAngle, ARM.upper));
        addCircle(elbow, 9);
        const forearmAngle = upperAngle + pose.parts[`${side}-forearm`].rotation;
        const hand = addPoint(pointAt(elbow, forearmAngle, ARM.forearm));
        addCircle(hand, 10);
        arms[side] = { shoulder, elbow, hand, upperAngle, forearmAngle };
      });

      const legs = {};
      ['left', 'right'].forEach((side) => {
        const sign = side === 'left' ? -1 : 1;
        const hip = addPoint({ x: root.x + sign * HIP_X, y: root.y });
        addCircle(hip, 7);
        const thighAngle = pose.parts[`${side}-thigh`].rotation;
        const knee = addPoint(pointAt(hip, thighAngle, LEG.thigh));
        addCircle(knee, 9);
        const shinAngle = thighAngle + pose.parts[`${side}-shin`].rotation;
        const ankle = addPoint(pointAt(knee, shinAngle, LEG.shin));
        addCircle(ankle, 6);
        const worldAngle = normDeg(shinAngle + pose.feet[side].angle);
        const corners = footCorners(ankle, worldAngle).map(addPoint);
        const soleY = Math.max(...corners.map((corner) => corner.y));
        legs[side] = { hip, knee, ankle, soleY, thighAngle, shinAngle, worldAngle, corners };
      });

      return {
        root,
        bodyRotation: body,
        torso: { corners: torsoCorners, neck },
        head: { center: head, radius: HEAD_RADIUS, front: headFront, back: headBack },
        arms,
        legs,
        feet: {
          left: { ...legs.left, angle: pose.feet.left.angle, contact: pose.feet.left.contact, reachable: pose.feet.left.reachable },
          right: { ...legs.right, angle: pose.feet.right.angle, contact: pose.feet.right.contact, reachable: pose.feet.right.reachable }
        },
        points,
        bounds: boundsOf(points),
        cameraPoints: points.map((point) => cameraPoint(point, pose.camera)),
        cameraBounds: boundsOf(points.map((point) => cameraPoint(point, pose.camera)))
      };
    }

    function finalizePose(pose) {
      const rig = computeRig(pose);
      ['left', 'right'].forEach((side) => {
        const previous = pose.feet[side];
        const foot = rig.feet[side];
        const onGround = Math.abs(foot.soleY - VIEW.groundY) <= 1.1 && Math.abs(foot.worldAngle) <= 1.2;
        pose.feet[side] = {
          ...previous,
          x: round(foot.ankle.x, 3),
          y: round(foot.ankle.y, 3),
          soleY: round(foot.soleY, 3),
          worldAngle: round(foot.worldAngle, 3),
          contact: Boolean(previous.contact) && onGround && foot.reachable !== false
        };
      });
      return pose;
    }

    function makeStandPose(time) {
      const clip = CLIPS.stand;
      const p = ((time / clip.duration) % 1 + 1) % 1;
      const pose = makeBasePose('stand', p, time, clip);
      pose.root.y = REST_HIP_Y + Math.sin(2 * Math.PI * p) * 1.2;
      pose.bodyRotation = Math.sin(2 * Math.PI * p) * 0.9;
      pose.parts.torso.rotation = pose.bodyRotation;
      pose.parts.head.rotation = -Math.sin(2 * Math.PI * p) * 0.6;
      pose.parts['left-upper-arm'].rotation = 6 + Math.sin(2 * Math.PI * p) * 1.5;
      pose.parts['left-forearm'].rotation = -12 + Math.sin(2 * Math.PI * p + 0.4) * 2;
      pose.parts['right-upper-arm'].rotation = -3 + Math.sin(2 * Math.PI * p + 0.6) * 1.5;
      pose.parts['right-forearm'].rotation = -8 + Math.sin(2 * Math.PI * p + 0.9) * 2;
      makeLeg(pose, 'left', ROOT_X - 14, VIEW.groundY - ANKLE_HEIGHT, 0, true);
      makeLeg(pose, 'right', ROOT_X + 14, VIEW.groundY - ANKLE_HEIGHT, 0, true);
      pose.ground = { visible: true, offset: 0, spacing: 32, tickCount: 12 };
      return finalizePose(pose);
    }

    function makeWalkPose(time) {
      const clip = CLIPS.walk;
      const p = ((time / clip.duration) % 1 + 1) % 1;
      const pose = makeBasePose('walk', p, time, clip);
      const stride = 32;
      const duty = 0.62;
      const cycleDistance = (2 * stride) / duty;
      const footGroundY = VIEW.groundY - ANKLE_HEIGHT;
      pose.root.y = 271.5 + Math.cos(4 * Math.PI * p) * 2.2;
      pose.bodyRotation = 4 - Math.sin(4 * Math.PI * p) * 0.8;
      pose.parts.torso.rotation = pose.bodyRotation;
      pose.parts.head.rotation = -2 + Math.sin(4 * Math.PI * p) * 0.4;
      pose.parts['left-upper-arm'].rotation = Math.cos(2 * Math.PI * p) * 24;
      pose.parts['left-forearm'].rotation = -18 + Math.sin(2 * Math.PI * p) * 8;
      pose.parts['right-upper-arm'].rotation = -Math.cos(2 * Math.PI * p) * 24;
      pose.parts['right-forearm'].rotation = -18 - Math.sin(2 * Math.PI * p) * 8;

      [
        { side: 'left', offset: 0 },
        { side: 'right', offset: 0.5 }
      ].forEach(({ side, offset }) => {
        const local = (p + offset) % 1;
        let x;
        let y = footGroundY;
        let footWorld = 0;
        let contact = false;
        if (local < duty) {
          const u = local / duty;
          x = stride - 2 * stride * u;
          contact = true;
        } else {
          const u = (local - duty) / (1 - duty);
          x = -stride + 2 * stride * smooth(u);
          y = footGroundY - Math.sin(Math.PI * u) * 20;
          footWorld = Math.sin(Math.PI * u) * 12;
        }
        makeLeg(pose, side, ROOT_X + x, y, footWorld, contact);
      });

      pose.ground = {
        visible: true,
        offset: p * cycleDistance,
        spacing: cycleDistance / 8,
        tickCount: 8
      };
      return finalizePose(pose);
    }

    function makeRunPose(time) {
      const clip = CLIPS.run;
      const p = ((time / clip.duration) % 1 + 1) % 1;
      const pose = makeBasePose('run', p, time, clip);
      const stride = 30;
      const duty = 0.35;
      const cycleDistance = (2 * stride) / duty;
      const footGroundY = VIEW.groundY - ANKLE_HEIGHT;
      pose.root.y = 272.5 - Math.sin(2 * Math.PI * p) * 2.5;
      pose.bodyRotation = 11 + Math.sin(4 * Math.PI * p) * 1.2;
      pose.parts.torso.rotation = pose.bodyRotation;
      pose.parts.head.rotation = -6 - Math.sin(4 * Math.PI * p) * 1.2;
      pose.parts['left-upper-arm'].rotation = Math.cos(2 * Math.PI * p) * 52;
      pose.parts['left-forearm'].rotation = -70 + Math.sin(2 * Math.PI * p) * 10;
      pose.parts['right-upper-arm'].rotation = -Math.cos(2 * Math.PI * p) * 52;
      pose.parts['right-forearm'].rotation = -70 - Math.sin(2 * Math.PI * p) * 10;

      [
        { side: 'left', offset: 0 },
        { side: 'right', offset: 0.5 }
      ].forEach(({ side, offset }) => {
        const local = (p + offset) % 1;
        let x;
        let y = footGroundY;
        let footWorld = 0;
        let contact = false;
        if (local < duty) {
          const u = local / duty;
          x = stride - 2 * stride * u;
          contact = true;
        } else {
          const u = (local - duty) / (1 - duty);
          x = -stride + 2 * stride * smooth(u);
          y = footGroundY - Math.sin(Math.PI * u) * 42;
          footWorld = Math.sin(Math.PI * u) * 20;
        }
        makeLeg(pose, side, ROOT_X + x, y, footWorld, contact);
      });

      pose.ground = {
        visible: true,
        offset: p * cycleDistance,
        spacing: cycleDistance / 10,
        tickCount: 10
      };
      return finalizePose(pose);
    }

    function makeSquatPose(time) {
      const clip = CLIPS.squat;
      const p = ((time / clip.duration) % 1 + 1) % 1;
      const pose = makeBasePose('squat', p, time, clip);
      const s = 0.5 - 0.5 * Math.cos(2 * Math.PI * p);
      const footGroundY = VIEW.groundY - ANKLE_HEIGHT;
      pose.root.y = REST_HIP_Y + 32 * s;
      pose.bodyRotation = 30 * s;
      pose.parts.torso.rotation = pose.bodyRotation;
      pose.parts.head.rotation = -18 * s;
      pose.parts['left-upper-arm'].rotation = 6 - 40 * s;
      pose.parts['left-forearm'].rotation = -12 - 60 * s;
      pose.parts['right-upper-arm'].rotation = -3 - 40 * s;
      pose.parts['right-forearm'].rotation = -8 - 60 * s;
      makeLeg(pose, 'left', ROOT_X - 14, footGroundY, 0, true);
      makeLeg(pose, 'right', ROOT_X + 14, footGroundY, 0, true);
      pose.ground = { visible: true, offset: 0, spacing: 32, tickCount: 12 };
      return finalizePose(pose);
    }

    function track(value, keys) {
      if (value <= keys[0][0]) return keys[0][1];
      for (let index = 1; index < keys.length; index += 1) {
        const [end, endValue] = keys[index];
        const [start, startValue] = keys[index - 1];
        if (value <= end) {
          return lerp(startValue, endValue, smooth((value - start) / (end - start)));
        }
      }
      return keys[keys.length - 1][1];
    }

    function makeJumpPose(time) {
      const clip = CLIPS.jump;
      const p = clamp(time / clip.duration, 0, 1);
      const pose = makeBasePose('jump', p, time, clip);
      const footGroundY = VIEW.groundY - ANKLE_HEIGHT;
      const rootY = track(p, [[0, REST_HIP_Y], [0.16, 291], [0.3, 238], [0.55, 218], [0.72, 286], [0.82, 298], [1, REST_HIP_Y]]);
      const body = track(p, [[0, 0], [0.16, 20], [0.3, 8], [0.55, 4], [0.72, 10], [0.82, 24], [1, 0]]);
      const head = track(p, [[0, 0], [0.16, -10], [0.3, 2], [0.55, 0], [0.72, -8], [0.82, -14], [1, 0]]);
      const air = track(p, [[0, 0], [0.16, 0], [0.3, 1], [0.62, 1], [0.78, 0], [1, 0]]);
      pose.root.y = rootY;
      pose.bodyRotation = body;
      pose.parts.torso.rotation = body;
      pose.parts.head.rotation = head;
      pose.parts['left-upper-arm'].rotation = track(p, [[0, 6], [0.16, 45], [0.3, -85], [0.55, -110], [0.72, -50], [0.82, 35], [1, 6]]);
      pose.parts['right-upper-arm'].rotation = track(p, [[0, -3], [0.16, 40], [0.3, -80], [0.55, -105], [0.72, -45], [0.82, 30], [1, -3]]);
      pose.parts['left-forearm'].rotation = track(p, [[0, -11.221], [0.16, -22], [0.3, -32], [0.55, -38], [0.72, -48], [0.82, -60], [1, -11.221]]);
      pose.parts['right-forearm'].rotation = track(p, [[0, -6.433], [0.16, -20], [0.3, -30], [0.55, -36], [0.72, -46], [0.82, -58], [1, -6.433]]);

      ['left', 'right'].forEach((side) => {
        const sign = side === 'left' ? -1 : 1;
        const targetX = ROOT_X + sign * lerp(14, 22, air);
        const targetY = lerp(footGroundY, rootY + 105, air);
        const footWorld = lerp(0, 25, air);
        const contact = air < 0.002 && targetY >= footGroundY - 0.05;
        makeLeg(pose, side, targetX, targetY, footWorld, contact);
      });

      pose.ground = { visible: true, offset: 0, spacing: 32, tickCount: 12 };
      return finalizePose(pose);
    }

    function makeSwimPose(time) {
      const clip = CLIPS.swim;
      const p = ((time / clip.duration) % 1 + 1) % 1;
      const pose = makeBasePose('swim', p, time, clip);
      pose.root.y = 235;
      pose.bodyRotation = 90;
      pose.parts.torso.rotation = 90;
      pose.parts.head.rotation = -10 + Math.sin(2 * Math.PI * p) * 3;
      pose.parts['left-upper-arm'].rotation = 90 + Math.sin(2 * Math.PI * p) * 65;
      pose.parts['left-forearm'].rotation = -40 + Math.sin(2 * Math.PI * p + 0.5) * 18;
      pose.parts['right-upper-arm'].rotation = 90 + Math.sin(2 * Math.PI * p + Math.PI) * 65;
      pose.parts['right-forearm'].rotation = -40 + Math.sin(2 * Math.PI * p + Math.PI + 0.5) * 18;
      ['left', 'right'].forEach((side) => {
        const offset = side === 'left' ? 0 : Math.PI;
        const thigh = 90 + Math.sin(2 * Math.PI * p + offset) * 8;
        const shin = 8 + Math.sin(2 * Math.PI * p + offset + 0.7) * 6;
        pose.parts[`${side}-thigh`].rotation = thigh;
        pose.parts[`${side}-shin`].rotation = shin;
        pose.feet[side] = {
          angle: normDeg(180 - thigh - shin),
          worldAngle: 180,
          contact: false,
          reachable: true
        };
      });
      pose.camera = { scale: 0.7, pivot: { x: VIEW.width / 2, y: 235 } };
      pose.ground = { visible: false, offset: 0, spacing: 32, tickCount: 0 };
      return finalizePose(pose);
    }

    function samplePose(name, time) {
      const clipName = CLIPS[name] ? name : 'stand';
      const clip = CLIPS[clipName];
      const numericTime = Number.isFinite(Number(time)) ? Number(time) : 0;
      if (clipName === 'jump' && numericTime >= clip.duration) {
        const stand = makeStandPose(0);
        return {
          ...stand,
          name: 'jump',
          phase: 1,
          time: clip.duration,
          playback: 'once'
        };
      }
      const safeTime = clip.loop
        ? numericTime
        : clamp(numericTime, 0, clip.duration);
      switch (clipName) {
        case 'walk': return makeWalkPose(safeTime);
        case 'run': return makeRunPose(safeTime);
        case 'jump': return makeJumpPose(safeTime);
        case 'swim': return makeSwimPose(safeTime);
        case 'squat': return makeSquatPose(safeTime);
        default: return makeStandPose(safeTime);
      }
    }

    function getPoseMetrics(pose) {
      const rig = computeRig(pose);
      const allValues = [
        ...rig.points.flatMap((point) => [point.x, point.y]),
        ...PART_NAMES.map((part) => pose.parts[part].rotation),
        pose.bodyRotation,
        pose.root.x,
        pose.root.y,
        pose.feet.left.angle,
        pose.feet.right.angle
      ];
      return {
        name: pose.name,
        phase: pose.phase,
        finite: allValues.every((value) => Number.isFinite(value)),
        bounds: rig.bounds,
        cameraBounds: rig.cameraBounds,
        cameraContained: rig.cameraBounds.minX >= 0 && rig.cameraBounds.maxX <= VIEW.width && rig.cameraBounds.minY >= 0 && rig.cameraBounds.maxY <= VIEW.height,
        knees: {
          left: pose.parts['left-shin'].rotation,
          right: pose.parts['right-shin'].rotation
        },
        elbows: {
          left: pose.parts['left-forearm'].rotation,
          right: pose.parts['right-forearm'].rotation
        },
        feet: {
          left: { ...rig.feet.left, contact: pose.feet.left.contact, reachable: pose.feet.left.reachable !== false },
          right: { ...rig.feet.right, contact: pose.feet.right.contact, reachable: pose.feet.right.reachable !== false }
        },
        contactCount: Number(Boolean(pose.feet.left.contact)) + Number(Boolean(pose.feet.right.contact)),
        contactError: Math.max(
          pose.feet.left.contact ? Math.abs(rig.feet.left.soleY - VIEW.groundY) : 0,
          pose.feet.right.contact ? Math.abs(rig.feet.right.soleY - VIEW.groundY) : 0
        )
      };
    }

    function buildExport(pose, meta = {}) {
      const sourceClip = CLIPS[meta.preset] || CLIPS[pose.name] || CLIPS.stand;
      const parts = Object.fromEntries(PART_NAMES.map((part) => [
        part,
        { rotation: round(pose.parts[part].rotation, 1) }
      ]));
      return {
        version: 5,
        mode: 'side-view-ik-skeleton',
        preset: meta.preset || pose.name,
        phase: round(meta.phase ?? pose.phase, 4),
        playback: meta.playback || pose.playback || (sourceClip.loop ? 'loop' : 'once'),
        root: { x: round(pose.root.x, 1), y: round(pose.root.y, 1) },
        bodyRotation: round(pose.bodyRotation, 1),
        camera: {
          scale: round(pose.camera.scale, 2),
          pivot: { x: round(pose.camera.pivot.x, 1), y: round(pose.camera.pivot.y, 1) }
        },
        ground: {
          visible: pose.ground.visible,
          offset: round(pose.ground.offset, 2),
          spacing: round(pose.ground.spacing, 2)
        },
        parts,
        feet: {
          left: {
            x: round(pose.feet.left.x, 1),
            y: round(pose.feet.left.y, 1),
            rotation: round(pose.feet.left.angle, 1),
            worldAngle: round(pose.feet.left.worldAngle, 1),
            soleY: round(pose.feet.left.soleY, 1),
            contact: Boolean(pose.feet.left.contact)
          },
          right: {
            x: round(pose.feet.right.x, 1),
            y: round(pose.feet.right.y, 1),
            rotation: round(pose.feet.right.angle, 1),
            worldAngle: round(pose.feet.right.worldAngle, 1),
            soleY: round(pose.feet.right.soleY, 1),
            contact: Boolean(pose.feet.right.contact)
          }
        }
      };
    }

    return {
      VERSION: 5,
      VIEW,
      CLIPS,
      LIMITS,
      PART_NAMES,
      ROOT_X,
      REST_HIP_Y,
      LEG,
      ARM,
      samplePose,
      getPoseMetrics,
      computeRig,
      buildExport,
      solveTwoBone
    };
  })();

  if (typeof module !== 'undefined' && module.exports) module.exports = MOTION;
  if (typeof document === 'undefined') return;

  if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug')) {
    globalThis.StickmanMotion = MOTION;
  }

  const stage = document.querySelector('#animator-stage');
  if (!stage) return;

  const skeleton = document.querySelector('#editor-character');
  const cameraGroup = document.querySelector('#editor-camera');
  const upperBody = document.querySelector('#editor-upper-body');
  const groundLayer = document.querySelector('#animator-ground-layer');
  const groundTicks = document.querySelector('#animator-ground-ticks');
  const shadow = document.querySelector('#animator-shadow');
  const pageStatus = document.querySelector('#animator-status');
  const selectedLabel = document.querySelector('#selected-part');
  const angleInput = document.querySelector('#part-angle');
  const angleValue = document.querySelector('#angle-value');
  const inlineAngle = document.querySelector('#inline-angle');
  const inlineAngleValue = document.querySelector('#inline-angle-value');
  const inlineSelected = document.querySelector('#inline-selected');
  const partPicker = document.querySelector('#part-picker');
  const speedInput = document.querySelector('#animator-speed');
  const exportStatus = document.querySelector('#export-status');
  const parts = [...document.querySelectorAll('.rig-part')];
  const partByName = new Map(parts.map((part) => [part.dataset.part, part]));
  const ankles = [...document.querySelectorAll('[data-ankle]')];
  const pickControls = [...document.querySelectorAll('.rig-pick')];
  const presetButtons = [...document.querySelectorAll('.preset-button')];

  const state = {
    mode: 'idle',
    preset: 'stand',
    clipTime: 0,
    speed: Number(speedInput.value) || 1,
    pose: MOTION.samplePose('stand', 0),
    selected: 'torso',
    manual: false,
    raf: 0,
    lastTimestamp: 0,
    drag: null
  };

  const partName = (name) => name.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const normalizeDelta = (angle) => ((angle + 540) % 360) - 180;
  const selectedPart = () => partByName.get(state.selected) || partByName.get('torso');
  const activePreset = () => document.querySelector('.preset-button.is-active')?.dataset.preset || state.preset || 'stand';
  const currentClip = () => MOTION.CLIPS[state.preset] || MOTION.CLIPS.stand;

  const ticks = [];
  for (let index = 0; index < 40; index += 1) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'animator-ground-tick');
    line.setAttribute('y1', String(MOTION.VIEW.groundY));
    line.setAttribute('y2', String(MOTION.VIEW.groundY + 7));
    groundTicks.append(line);
    ticks.push(line);
  }

  function setStatus(text) {
    if (pageStatus) pageStatus.textContent = text;
  }

  function refreshStatus() {
    const label = partName(state.selected);
    const name = state.preset[0].toUpperCase() + state.preset.slice(1);
    const clip = currentClip();
    if (state.mode === 'playing') setStatus(`${name} preset · playing · ${clip.loop ? 'loop' : 'once'}`);
    else if (state.mode === 'finished') setStatus(`${name} preset · finished`);
    else if (state.mode === 'manual') setStatus(`Manual pose · ${label}`);
    else if (state.mode === 'paused') setStatus(`${name} preset · paused`);
    else setStatus(`Ready · ${label} selected`);
  }

  function setActivePreset(name) {
    presetButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.preset === name));
  }

  function partAngle(name) {
    return name === 'torso' ? state.pose.bodyRotation : state.pose.parts[name].rotation;
  }

  function refreshFootData() {
    const rig = MOTION.computeRig(state.pose);
    ['left', 'right'].forEach((side) => {
      const foot = rig.feet[side];
      const onGround = Math.abs(foot.soleY - MOTION.VIEW.groundY) <= 1.1 && Math.abs(foot.worldAngle) <= 1.2;
      state.pose.feet[side] = {
        ...state.pose.feet[side],
        x: foot.ankle.x,
        y: foot.ankle.y,
        soleY: foot.soleY,
        worldAngle: foot.worldAngle,
        contact: state.pose.ground.visible && onGround
      };
    });
  }

  function applyAngle(name, value) {
    const limits = MOTION.LIMITS[name] || [-180, 180];
    const angle = clamp(Number(value) || 0, limits[0], limits[1]);
    if (name === 'torso') {
      state.pose.bodyRotation = angle;
      state.pose.parts.torso.rotation = angle;
    } else {
      state.pose.parts[name].rotation = angle;
      if (name.endsWith('-thigh') || name.endsWith('-shin')) {
        const side = name.split('-')[0];
        const total = state.pose.parts[`${side}-thigh`].rotation + state.pose.parts[`${side}-shin`].rotation;
        state.pose.feet[side].angle = normalizeDelta(-total);
        state.pose.feet[side].worldAngle = 0;
      }
    }
    refreshFootData();
  }

  function syncControls() {
    const name = state.selected;
    const angle = Math.round(partAngle(name));
    const limits = MOTION.LIMITS[name] || [-180, 180];
    if (selectedLabel) selectedLabel.textContent = partName(name);
    if (inlineSelected) inlineSelected.textContent = partName(name);
    if (angleValue) angleValue.textContent = `${angle}°`;
    if (inlineAngleValue) inlineAngleValue.textContent = `${angle}°`;
    [angleInput, inlineAngle].forEach((input) => {
      if (!input) return;
      input.min = String(limits[0]);
      input.max = String(limits[1]);
      input.value = String(angle);
    });
    partPicker?.querySelectorAll('button').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.part === name);
    });
  }

  function selectPart(nameOrElement) {
    const name = typeof nameOrElement === 'string' ? nameOrElement : nameOrElement?.dataset?.part;
    if (!partByName.has(name)) return;
    state.selected = name;
    parts.forEach((part) => part.classList.toggle('is-selected', part.dataset.part === name));
    syncControls();
    refreshStatus();
  }

  function render() {
    const pose = state.pose;
    skeleton.setAttribute('transform', `translate(${pose.root.x} ${pose.root.y})`);
    upperBody.setAttribute('transform', `rotate(${pose.bodyRotation})`);
    parts.forEach((part) => {
      const name = part.dataset.part;
      const angle = name === 'torso' ? 0 : pose.parts[name].rotation;
      const base = part.dataset.base || '';
      part.dataset.angle = String(name === 'torso' ? pose.bodyRotation : angle);
      part.setAttribute('transform', `${base ? `${base} ` : ''}rotate(${angle})`);
    });
    ankles.forEach((group) => {
      const side = group.dataset.ankle;
      const foot = pose.feet[side];
      group.setAttribute('transform', `${group.dataset.base || ''} rotate(${foot.angle})`);
    });
    const camera = pose.camera;
    cameraGroup.setAttribute(
      'transform',
      `translate(${camera.pivot.x} ${camera.pivot.y}) scale(${camera.scale}) translate(${-camera.pivot.x} ${-camera.pivot.y})`
    );
    stage.dataset.motion = pose.name;

    const spacing = Math.max(6, pose.ground.spacing || 32);
    const offset = ((pose.ground.offset || 0) % spacing + spacing) % spacing;
    ticks.forEach((line, index) => {
      const x = 18 + index * spacing - offset;
      if (x < 14 || x > 346) {
        line.setAttribute('visibility', 'hidden');
        return;
      }
      line.setAttribute('visibility', 'visible');
      line.setAttribute('x1', String(x));
      line.setAttribute('x2', String(x));
    });

    groundLayer.setAttribute('visibility', pose.ground.visible ? 'visible' : 'hidden');
    groundLayer.style.display = pose.ground.visible ? '' : 'none';
    const lowestSole = Math.min(pose.feet.left.soleY, pose.feet.right.soleY);
    const lift = Math.max(0, MOTION.VIEW.groundY - lowestSole);
    const shadowScale = clamp(1 - lift / 220, 0.55, 1);
    shadow.setAttribute('cx', String((pose.feet.left.x + pose.feet.right.x) / 2));
    shadow.setAttribute('cy', String(MOTION.VIEW.groundY + 1));
    shadow.setAttribute('rx', String(38 * shadowScale));
    shadow.setAttribute('ry', String(5 * shadowScale));
    shadow.setAttribute('opacity', String(0.14 * shadowScale));
    syncControls();
  }

  function stopRaf() {
    if (state.raf) window.cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  function startPlayback(name, options = {}) {
    const clipName = MOTION.CLIPS[name] ? name : 'walk';
    const fromStart = options.fromStart !== false;
    const canResume = !fromStart && state.mode === 'paused' && state.preset === clipName && !state.manual;
    stopRaf();
    state.preset = clipName;
    state.manual = false;
    state.mode = 'playing';
    if (!canResume) state.clipTime = 0;
    state.pose = MOTION.samplePose(clipName, state.clipTime);
    setActivePreset(clipName);
    render();
    refreshStatus();
    state.lastTimestamp = performance.now();
    state.raf = window.requestAnimationFrame(tick);
  }

  function tick(now) {
    if (state.mode !== 'playing') {
      state.raf = 0;
      return;
    }
    const clip = MOTION.CLIPS[state.preset] || MOTION.CLIPS.stand;
    let delta = (now - state.lastTimestamp) / 1000;
    state.lastTimestamp = now;
    if (!Number.isFinite(delta) || delta < 0) delta = 0;
    delta = Math.min(delta, 0.1);
    state.clipTime += delta * state.speed;
    if (clip.loop) {
      state.clipTime = ((state.clipTime % clip.duration) + clip.duration) % clip.duration;
    } else if (state.clipTime >= clip.duration) {
      state.clipTime = clip.duration;
      state.pose = MOTION.samplePose(state.preset, state.clipTime);
      render();
      state.mode = 'finished';
      state.raf = 0;
      refreshStatus();
      return;
    }
    state.pose = MOTION.samplePose(state.preset, state.clipTime);
    render();
    state.raf = window.requestAnimationFrame(tick);
  }

  function playActivePreset() {
    const name = activePreset();
    const canResume = state.mode === 'paused' && state.preset === name && !state.manual;
    startPlayback(name, { fromStart: !canResume });
  }

  function pausePlayback() {
    if (state.mode === 'playing') {
      stopRaf();
      state.mode = 'paused';
      refreshStatus();
    }
  }

  function resetPose() {
    stopRaf();
    state.mode = 'idle';
    state.preset = 'stand';
    state.clipTime = 0;
    state.manual = false;
    state.drag = null;
    state.selected = 'torso';
    state.pose = MOTION.samplePose('stand', 0);
    setActivePreset('stand');
    render();
    selectPart('torso');
    refreshStatus();
  }

  function pointerAngle(part, event) {
    const matrix = part.getScreenCTM();
    if (!matrix) return 0;
    return Math.atan2(event.clientY - matrix.f, event.clientX - matrix.e) * 180 / Math.PI;
  }

  function beginDrag(name, target, event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const part = partByName.get(name);
    if (!part) return;
    selectPart(name);
    state.drag = {
      name,
      angle: partAngle(name),
      pointer: pointerAngle(part, event),
      active: false
    };
    target.setPointerCapture?.(event.pointerId);
  }

  function updateDrag(name, event) {
    const drag = state.drag;
    if (!drag || drag.name !== name) return;
    event.preventDefault();
    event.stopPropagation();
    const part = partByName.get(name);
    if (!part) return;
    const delta = normalizeDelta(pointerAngle(part, event) - drag.pointer);
    if (!drag.active) {
      if (Math.abs(delta) < 1.5) return;
      drag.active = true;
      drag.angle = partAngle(name);
      if (state.mode === 'playing') stopRaf();
      state.mode = 'manual';
      state.manual = true;
      refreshStatus();
    }
    applyAngle(name, drag.angle + delta);
    render();
  }

  function endDrag() {
    state.drag = null;
  }

  function applyControlAngle(event) {
    if (!state.selected) return;
    if (state.mode === 'playing') {
      stopRaf();
      state.mode = 'paused';
    }
    state.mode = 'manual';
    state.manual = true;
    applyAngle(state.selected, event.target.value);
    render();
    refreshStatus();
  }

  function exportPose() {
    const clip = currentClip();
    const manual = state.mode === 'manual';
    const data = MOTION.buildExport(state.pose, {
      preset: manual ? 'manual' : state.preset,
      phase: manual ? 0 : state.clipTime / clip.duration,
      playback: manual ? 'manual' : clip.loop ? 'loop' : 'once'
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stickman-side-view-v5.json';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    if (exportStatus) exportStatus.textContent = 'Exported side-view skeleton JSON · v5';
  }

  parts.forEach((part) => {
    part.setAttribute('tabindex', '0');
    part.setAttribute('role', 'button');
    part.setAttribute('aria-label', `${partName(part.dataset.part)} segment`);
    part.addEventListener('click', (event) => {
      event.stopPropagation();
      selectPart(part);
    });
    part.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectPart(part);
      }
    });
    part.addEventListener('pointerdown', (event) => beginDrag(part.dataset.part, part, event));
    part.addEventListener('pointermove', (event) => updateDrag(part.dataset.part, event));
    part.addEventListener('pointerup', endDrag);
    part.addEventListener('pointercancel', endDrag);
    part.addEventListener('lostpointercapture', endDrag);
  });

  pickControls.forEach((control) => {
    const name = control.dataset.pick;
    control.addEventListener('pointerdown', (event) => beginDrag(name, control, event));
    control.addEventListener('pointermove', (event) => updateDrag(name, event));
    control.addEventListener('pointerup', endDrag);
    control.addEventListener('pointercancel', endDrag);
    control.addEventListener('lostpointercapture', endDrag);
  });

  MOTION.PART_NAMES.forEach((name) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.part = name;
    button.textContent = partName(name);
    button.addEventListener('click', () => selectPart(name));
    partPicker?.append(button);
  });

  angleInput?.addEventListener('input', applyControlAngle);
  inlineAngle?.addEventListener('input', applyControlAngle);
  document.querySelector('#animator-play')?.addEventListener('click', playActivePreset);
  document.querySelector('#animator-stop')?.addEventListener('click', pausePlayback);
  document.querySelector('#animator-reset')?.addEventListener('click', resetPose);
  document.querySelector('#animator-export')?.addEventListener('click', exportPose);
  speedInput?.addEventListener('change', () => {
    state.speed = Number(speedInput.value) || 1;
    state.lastTimestamp = performance.now();
  });
  presetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setActivePreset(button.dataset.preset);
      startPlayback(button.dataset.preset, { fromStart: true });
    });
  });
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('blur', endDrag);

  setActivePreset('stand');
  state.pose = MOTION.samplePose('stand', 0);
  selectPart('torso');
  render();
  refreshStatus();
})();
