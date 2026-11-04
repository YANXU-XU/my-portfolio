const animatorStage = document.querySelector('#animator-stage');

if (animatorStage) {
  const parts = [...document.querySelectorAll('.rig-part')];
  const pickControls = [...document.querySelectorAll('.rig-pick')];
  const status = document.querySelector('#animator-status');
  const selectedLabel = document.querySelector('#selected-part');
  const angleInput = document.querySelector('#part-angle');
  const angleValue = document.querySelector('#angle-value');
  const inlineAngle = document.querySelector('#inline-angle');
  const inlineAngleValue = document.querySelector('#inline-angle-value');
  const inlineSelected = document.querySelector('#inline-selected');
  const speedInput = document.querySelector('#animator-speed');
  const partPicker = document.querySelector('#part-picker');
  const skeleton = document.querySelector('#editor-character');
  const angleOf = (part) => Number(part.dataset.angle || 0);
  const partName = (part) => part.dataset.part.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  let selected = null;
  let playbackFrame = 0;
  let playbackName = '';
  let playbackStartedAt = 0;
  let dragStart = null;

  const presetFrames = {
    stand: [{ head: 0, torso: 0, 'left-upper-arm': 0, 'left-forearm': 0, 'right-upper-arm': 0, 'right-forearm': 0, 'left-thigh': 0, 'left-shin': 0, 'right-thigh': 0, 'right-shin': 0 }, { head: 2, torso: 1, 'left-upper-arm': 2, 'left-forearm': -2, 'right-upper-arm': -2, 'right-forearm': 2, 'left-thigh': 1, 'left-shin': -1, 'right-thigh': -1, 'right-shin': 1 }],
    walk: [{ head: 0, torso: -3, 'left-upper-arm': -38, 'left-forearm': 32, 'right-upper-arm': 38, 'right-forearm': -32, 'left-thigh': 30, 'left-shin': -18, 'right-thigh': -28, 'right-shin': 22 }, { head: 1, torso: 3, 'left-upper-arm': 38, 'left-forearm': -25, 'right-upper-arm': -38, 'right-forearm': 25, 'left-thigh': -28, 'left-shin': 22, 'right-thigh': 30, 'right-shin': -18 }],
    run: [{ head: -6, torso: -8, 'left-upper-arm': -58, 'left-forearm': 42, 'right-upper-arm': 48, 'right-forearm': -35, 'left-thigh': 48, 'left-shin': -40, 'right-thigh': -44, 'right-shin': 48 }, { head: -4, torso: -3, 'left-upper-arm': 44, 'left-forearm': -34, 'right-upper-arm': -56, 'right-forearm': 45, 'left-thigh': -42, 'left-shin': 46, 'right-thigh': 50, 'right-shin': -38 }],
    jump: [{ head: 0, torso: 0, 'left-upper-arm': -70, 'left-forearm': 25, 'right-upper-arm': 70, 'right-forearm': -25, 'left-thigh': -38, 'left-shin': 28, 'right-thigh': 38, 'right-shin': -28 }, { head: 0, torso: 0, 'left-upper-arm': -55, 'left-forearm': 8, 'right-upper-arm': 55, 'right-forearm': -8, 'left-thigh': -20, 'left-shin': 12, 'right-thigh': 20, 'right-shin': -12 }],
    swim: [{ head: 0, torso: 90, 'left-upper-arm': 145, 'left-forearm': 45, 'right-upper-arm': 20, 'right-forearm': -45, 'left-thigh': 145, 'left-shin': 30, 'right-thigh': 25, 'right-shin': -30 }, { head: 3, torso: 90, 'left-upper-arm': 115, 'left-forearm': 20, 'right-upper-arm': 55, 'right-forearm': -20, 'left-thigh': 115, 'left-shin': 10, 'right-thigh': 55, 'right-shin': -10 }],
    squat: [{ head: -4, torso: 8, 'left-upper-arm': -35, 'left-forearm': 20, 'right-upper-arm': 35, 'right-forearm': -20, 'left-thigh': 55, 'left-shin': -38, 'right-thigh': -55, 'right-shin': 38 }, { head: -2, torso: 4, 'left-upper-arm': -30, 'left-forearm': 12, 'right-upper-arm': 30, 'right-forearm': -12, 'left-thigh': 42, 'left-shin': -28, 'right-thigh': -42, 'right-shin': 28 }]
  };

  function setAngle(part, angle) {
    const value = Math.max(-180, Math.min(180, Number(angle)));
    part.dataset.angle = value;
    if (part.dataset.part === 'torso') {
      skeleton.setAttribute('transform', `translate(180 180) rotate(${value})`);
      part.setAttribute('transform', 'rotate(0)');
      return;
    }
    part.setAttribute('transform', `${part.dataset.base ? `${part.dataset.base} ` : ''}rotate(${value})`);
  }

  function syncSelectionControls(part) {
    const value = Math.round(angleOf(part));
    selectedLabel.textContent = partName(part);
    inlineSelected.textContent = partName(part);
    status.textContent = `Selected · ${partName(part)}`;
    angleInput.value = value;
    angleValue.textContent = `${value}°`;
    inlineAngle.value = value;
    inlineAngleValue.textContent = `${value}°`;
  }

  function selectPart(part) {
    parts.forEach((item) => item.classList.toggle('is-selected', item === part));
    partPicker?.querySelectorAll('button').forEach((button) => button.classList.toggle('is-active', button.dataset.part === part.dataset.part));
    selected = part;
    syncSelectionControls(part);
  }

  function stopPreview() {
    playbackName = '';
    window.cancelAnimationFrame(playbackFrame);
    playbackFrame = 0;
    status.textContent = selected ? `Selected · ${partName(selected)}` : 'Ready · select a segment';
  }

  function playPreset(name) {
    stopPreview();
    const frames = presetFrames[name];
    const duration = 1200 / Number(speedInput.value);
    playbackName = name;
    playbackStartedAt = performance.now();
    const tick = (now) => {
      if (!playbackName) return;
      const progress = ((now - playbackStartedAt) % (duration * 2)) / duration;
      const phase = progress <= 1 ? progress : 2 - progress;
      parts.forEach((part) => {
        const from = frames[0][part.dataset.part] ?? angleOf(part);
        const to = frames[1][part.dataset.part] ?? from;
        setAngle(part, from + (to - from) * phase);
      });

      playbackFrame = window.requestAnimationFrame(tick);
    };
    playbackFrame = window.requestAnimationFrame(tick);
    status.textContent = `${name[0].toUpperCase() + name.slice(1)} preset · playing`;
  }

  parts.forEach((part) => {
    part.setAttribute('tabindex', '0');
    part.setAttribute('role', 'button');
    part.setAttribute('aria-label', `${partName(part)} segment`);
    part.addEventListener('click', (event) => {
      event.stopPropagation();
      selectPart(part);
    });
    part.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectPart(part); }
    });
    part.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      stopPreview();
      selectPart(part);
      dragStart = { x: event.clientX, angle: angleOf(part) };
      part.setPointerCapture(event.pointerId);
    });
    part.addEventListener('pointermove', (event) => {
      if (dragStart && selected === part) {
        setAngle(part, dragStart.angle + (event.clientX - dragStart.x) * .7);
        syncSelectionControls(part);
      }
    });
    part.addEventListener('pointerup', () => { dragStart = null; });
  });

  parts.forEach((part) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.part = part.dataset.part;
    button.textContent = partName(part);
    button.addEventListener('click', () => selectPart(part));
    partPicker?.append(button);
  });
  pickControls.forEach((control) => {
    const part = parts.find((item) => item.dataset.part === control.dataset.pick);
    if (!part) return;
    control.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      stopPreview();
      selectPart(part);
      dragStart = { x: event.clientX, angle: angleOf(part) };
      control.setPointerCapture(event.pointerId);
    });
    control.addEventListener('pointermove', (event) => {
      if (dragStart && selected === part) {
        setAngle(part, dragStart.angle + (event.clientX - dragStart.x) * .7);
        syncSelectionControls(part);
      }
    });
    control.addEventListener('pointerup', () => { dragStart = null; });
  });
  document.querySelectorAll('.preset-button').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.preset-button').forEach((item) => item.classList.toggle('is-active', item === button));
    playPreset(button.dataset.preset);
  }));
  angleInput.addEventListener('input', (event) => { if (selected) { stopPreview(); setAngle(selected, event.target.value); selectPart(selected); } });
  inlineAngle.addEventListener('input', (event) => { if (selected) { stopPreview(); setAngle(selected, event.target.value); selectPart(selected); } });
  document.querySelector('#animator-play').addEventListener('click', () => playPreset(document.querySelector('.preset-button.is-active')?.dataset.preset || 'walk'));
  document.querySelector('#animator-stop').addEventListener('click', stopPreview);
  document.querySelector('#animator-reset').addEventListener('click', () => {
    stopPreview();
    parts.forEach((part) => setAngle(part, presetFrames.stand[0][part.dataset.part] ?? 0));
    selectPart(parts.find((part) => part.dataset.part === 'torso'));
  });
  speedInput.addEventListener('change', () => { const active = document.querySelector('.preset-button.is-active'); if (active) playPreset(active.dataset.preset); });
  document.querySelector('#animator-export').addEventListener('click', () => {
    const data = { version: 4, mode: 'connected-skeleton', parts: Object.fromEntries(parts.map((part) => [part.dataset.part, { rotation: Math.round(angleOf(part)) }])) };
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    link.download = 'stickman-connected-skeleton.json';
    link.click();
    URL.revokeObjectURL(link.href);
    document.querySelector('#export-status').textContent = 'Exported connected skeleton JSON';
  });
  parts.forEach((part) => setAngle(part, angleOf(part)));
  selectPart(parts.find((part) => part.dataset.part === 'torso'));
}
