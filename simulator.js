// Page-specific Motion Echo game. script.js and animator.js stay untouched.
(() => {
  const game = document.querySelector('#echo-game');
  if (!game || document.documentElement.dataset.echoGame === 'ready') return;

  if (typeof motions === 'undefined' || !Array.isArray(motions)) {
    const message = document.querySelector('#echo-message');
    if (message) {
      message.textContent = window.StickmanI18n?.t(
        'simulator.message.missingData',
        null,
        'The motion data did not load. Refresh the page.'
      ) ?? 'The motion data did not load. Refresh the page.';
    }
    return;
  }

  document.documentElement.dataset.echoGame = 'ready';

  const motionById = new Map(
    motions.map((motion) => [motion.name.toLowerCase(), motion])
  );
  const motionIds = [...motionById.keys()];
  const tr = (key, params, fallback) => window.StickmanI18n?.t(key, params, fallback) ?? fallback;
  const motionLabel = (id) => tr(`motions.${id}.label`, null, motionById.get(id)?.name || motions[0].name);
  const roundLengths = [3, 4, 5, 6, 7];
  const startingLives = 3;
  const pointsPerMove = 10;
  const roundBonus = 25;
  const poseHold = 680;
  const poseGap = 150;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const els = {
    stage: document.querySelector('#echo-stage'),
    pose: document.querySelector('#echo-pose'),
    stageLabel: document.querySelector('#echo-motion-label'),
    state: document.querySelector('#echo-state'),
    round: document.querySelector('#echo-round'),
    score: document.querySelector('#echo-score'),
    lives: document.querySelector('#echo-lives'),
    reset: document.querySelector('#echo-reset'),
    howto: document.querySelector('#echo-howto'),
    message: document.querySelector('#echo-message'),
    progress: document.querySelector('#echo-progress'),
    primary: document.querySelector('#echo-primary'),
    replay: document.querySelector('#echo-replay'),
    keypad: document.querySelector('#echo-keypad'),
    stageCaption: document.querySelector('#echo-stage-caption'),
    stickman: document.querySelector('#echo-stickman')
  };

  if (Object.values(els).some((element) => !element)) return;

  const keys = [...els.keypad.querySelectorAll('.echo-key')];
  const phaseLabels = {
    idle: ['simulator.state.idle', 'Ready'],
    watching: ['simulator.state.watching', 'Watch'],
    input: ['simulator.state.input', 'Your turn'],
    clear: ['simulator.state.clear', 'Clear'],
    over: ['simulator.state.over', 'Game over'],
    victory: ['simulator.state.victory', 'Victory']
  };

  let phase = 'idle';
  let roundIndex = 0;
  let score = 0;
  let lives = startingLives;
  let sequence = [];
  let cursor = 0;
  let playbackToken = 0;
  let feedbackTimer = 0;
  let currentMotionId = 'stand';
  let messageState = {
    key: 'simulator.message.ready',
    params: {},
    tone: 'info',
    fallback: 'Press Start game when you are ready.',
    detail: null
  };
  let captionState = {
    key: 'simulator.caption.initial',
    params: {},
    fallback: 'Watch the stage, then repeat the phrase.'
  };
  let progressState = { length: 0, filled: 0, mode: 'idle' };
  let primaryState = { action: 'start' };

  function sleep(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function paddedScore(value) {
    return String(value).padStart(3, '0');
  }

  function randomMotion(excludeId) {
    let id = motionIds[Math.floor(Math.random() * motionIds.length)];
    while (motionIds.length > 1 && id === excludeId) {
      id = motionIds[Math.floor(Math.random() * motionIds.length)];
    }
    return id;
  }

  function buildSequence(length) {
    const next = [];
    for (let index = 0; index < length; index += 1) {
      next.push(randomMotion(next[index - 1]));
    }
    return next;
  }

  function resolveParams(params = {}) {
    const resolved = { ...params };
    if (params.motionId) resolved.motion = motionLabel(params.motionId);
    if (params.pressedId) resolved.pressed = motionLabel(params.pressedId);
    if (params.expectedId) resolved.expected = motionLabel(params.expectedId);
    if (params.remaining !== undefined && !params.unit) {
      resolved.unit = params.remaining === 1
        ? tr('simulator.unit.move', null, 'move')
        : tr('simulator.unit.moves', null, 'moves');
    }
    return resolved;
  }

  function renderMessage() {
    let text = tr(messageState.key, resolveParams(messageState.params), messageState.fallback);
    if (messageState.detail) {
      const detail = tr(
        messageState.detail.key,
        resolveParams(messageState.detail.params),
        messageState.detail.fallback
      );
      if (detail) text += ` ${detail}`;
    }
    els.message.textContent = text;
    els.message.dataset.tone = messageState.tone;
  }

  function setMessage(key, params = {}, tone = 'info', fallback = '', detail = null) {
    messageState = { key, params, tone, fallback, detail };
    renderMessage();
  }

  function renderCaption() {
    els.stageCaption.textContent = tr(captionState.key, resolveParams(captionState.params), captionState.fallback);
  }

  function setCaption(key, params = {}, fallback = '') {
    captionState = { key, params, fallback };
    renderCaption();
  }

  function setPhase(nextPhase) {
    phase = nextPhase;
    game.dataset.state = nextPhase;
    els.state.dataset.state = nextPhase;
    const [key, fallback] = phaseLabels[nextPhase] || phaseLabels.idle;
    els.state.textContent = tr(key, null, fallback);
  }

  function updateHud() {
    els.round.textContent = String(roundIndex + 1).padStart(2, '0');
    els.score.textContent = paddedScore(score + (phase === 'input' ? cursor * pointsPerMove : 0));
    els.lives.textContent = '●'.repeat(lives) + '○'.repeat(startingLives - lives);
    const unit = lives === 1
      ? tr('simulator.lifeOne', null, 'life')
      : tr('simulator.lifeMany', null, 'lives');
    els.lives.setAttribute('aria-label', tr('simulator.livesAria', { count: lives, unit }, `${lives} ${unit} left`));
  }

  function setKeysEnabled(enabled) {
    keys.forEach((button) => {
      button.disabled = !enabled;
      button.setAttribute('aria-disabled', String(!enabled));
    });
  }

  const primaryLabels = {
    start: ['simulator.actions.start', 'Start game'],
    next: ['simulator.actions.next', 'Next round'],
    'play-again': ['simulator.actions.playAgain', 'Play again']
  };

  function renderPrimary() {
    const [key, fallback] = primaryLabels[primaryState.action] || primaryLabels.start;
    els.primary.textContent = tr(key, null, fallback);
  }

  function showPrimary(action) {
    els.primary.hidden = false;
    els.primary.dataset.action = action;
    primaryState = { action };
    renderPrimary();
  }

  function hidePrimary() {
    els.primary.hidden = true;
  }

  function showReplay() {
    els.replay.hidden = false;
  }

  function hideReplay() {
    els.replay.hidden = true;
  }

  function refreshKeyLabels() {
    keys.forEach((button, index) => {
      const id = button.dataset.motion;
      const label = motionLabel(id);
      const name = button.querySelector('.echo-key-name');
      if (name) name.textContent = label;
      button.setAttribute('aria-label', tr('simulator.key.aria', { number: index + 1, motion: label }, `Move ${index + 1}: ${motionFor(id).name}`));
    });
  }

  function refreshLanguage() {
    renderMessage();
    renderCaption();
    renderProgress();
    setPhase(phase);
    updateHud();
    renderPrimary();
    refreshKeyLabels();
    if (currentMotionId) {
      const label = motionLabel(currentMotionId);
      els.stageLabel.textContent = label;
      els.stickman.setAttribute('aria-label', tr('motions.simAria', { motion: label }, `Stickman performing ${label}`));
    }
  }

  function renderProgress() {
    const { length, filled, mode } = progressState;
    let label = tr('simulator.progress.none', null, 'No moves entered');
    if (mode === 'watch') {
      label = filled
        ? tr('simulator.progress.watchingMove', { filled, length }, `Watching move ${filled} of ${length}`)
        : tr('simulator.progress.watching', { length }, `Watching ${length} moves`);
    } else if (mode !== 'idle') {
      label = tr('simulator.progress.repeated', { filled, length }, `${filled} of ${length} moves repeated`);
    }
    els.progress.dataset.mode = mode;
    els.progress.setAttribute('aria-label', label);
    if (!length) {
      els.progress.replaceChildren();
      return;
    }
    els.progress.replaceChildren(
      ...Array.from({ length }, (_, index) => {
        const pip = document.createElement('span');
        pip.className = 'echo-pip';
        if (index < filled) pip.classList.add('is-filled');
        if (mode === 'watch' && index === filled - 1) pip.classList.add('is-current');
        return pip;
      })
    );
  }

  function setProgress(length, filled = 0, mode = 'input') {
    progressState = { length, filled, mode };
    renderProgress();
  }

  function resetProgress() {
    progressState = { length: 0, filled: 0, mode: 'idle' };
    renderProgress();
  }

  function motionFor(id) {
    return motionById.get(id) || motions[0];
  }

  function renderMotion(id) {
    const motion = motionFor(id);
    currentMotionId = id;
    const label = motionLabel(id);
    els.stage.dataset.motion = id;
    els.pose.innerHTML = motion.art;
    els.stageLabel.textContent = label;
    els.stickman.setAttribute('aria-label', tr('motions.simAria', { motion: label }, `Stickman performing ${motion.name}`));

    if (reduceMotion.matches) return;
    els.pose.classList.remove('is-pop');
    void els.pose.offsetWidth;
    els.pose.classList.add('is-pop');
    window.setTimeout(() => els.pose.classList.remove('is-pop'), 380);
  }

  function setFeedback(kind, duration = 0) {
    const classes = ['is-watching', 'is-correct', 'is-wrong', 'is-clear', 'is-over'];
    window.clearTimeout(feedbackTimer);
    els.stage.classList.remove(...classes);
    if (!kind) return;
    const className = `is-${kind}`;
    els.stage.classList.add(className);
    if (duration) {
      feedbackTimer = window.setTimeout(() => els.stage.classList.remove(className), duration);
    }
  }

  function playTone(id) {
    if (typeof playMotionSound === 'function') playMotionSound(id);
  }

  async function playSequence(token) {
    setPhase('watching');
    setKeysEnabled(false);
    hidePrimary();
    hideReplay();
    setFeedback('watching');
    setCaption('simulator.caption.watchCount', { count: sequence.length }, `Watch ${sequence.length} moves.`);
    setProgress(sequence.length, 0, 'watch');

    for (let index = 0; index < sequence.length; index += 1) {
      if (token !== playbackToken) return false;
      const id = sequence[index];
      renderMotion(id);
      setProgress(sequence.length, index + 1, 'watch');
      setCaption('simulator.caption.watchMove', { index: index + 1, total: sequence.length }, `Watch move ${index + 1} of ${sequence.length}.`);
      playTone(id);
      await sleep(poseHold);
      if (token !== playbackToken) return false;
      if (index < sequence.length - 1) await sleep(poseGap);
    }

    if (token !== playbackToken) return false;
    beginInput();
    return true;
  }

  function beginInput() {
    setPhase('input');
    cursor = 0;
    updateHud();
    setFeedback(null);
    setKeysEnabled(true);
    showReplay();
    setCaption('simulator.caption.yourTurn', { count: sequence.length }, `Your turn: repeat ${sequence.length} moves.`);
    setMessage('simulator.message.yourTurn', { count: sequence.length }, 'info', `Your turn — repeat all ${sequence.length} moves from the start.`);
    setProgress(sequence.length, 0, 'input');
    const firstKey = keys.find((button) => !button.disabled);
    if (firstKey) firstKey.focus({ preventScroll: true });
  }

  function beginRound() {
    sequence = buildSequence(roundLengths[roundIndex]);
    cursor = 0;
    updateHud();
    setMessage('simulator.message.round', { round: roundIndex + 1, count: sequence.length }, 'info', `Round ${roundIndex + 1}: watch ${sequence.length} moves.`);
    setCaption('simulator.caption.watchClosely', {}, 'Watch closely. The phrase is about to begin.');
    resetProgress();
    const token = ++playbackToken;
    playSequence(token);
  }

  function replayCurrentSequence() {
    if (phase !== 'input' || !sequence.length) return;
    cursor = 0;
    updateHud();
    setMessage('simulator.message.replay', {}, 'info', 'Watching the same phrase again. No try is lost.');
    const token = ++playbackToken;
    playSequence(token);
  }

  function handleCorrect(id) {
    cursor += 1;
    updateHud();
    renderMotion(id);
    setFeedback('correct', 320);
    setProgress(sequence.length, cursor, 'input');
    playTone(id);

    if (cursor >= sequence.length) {
      completeRound();
      return;
    }

    const motion = motionFor(id);
    const remaining = sequence.length - cursor;
    setCaption('simulator.caption.good', { cursor, total: sequence.length }, `Good — ${cursor} of ${sequence.length}.`);
    setMessage(
      'simulator.message.good',
      { motionId: id, remaining },
      'good',
      `Good — ${motion.name}. ${remaining} ${remaining === 1 ? 'move' : 'moves'} to go.`
    );
  }

  function handleWrong(id) {
    const expectedIndex = cursor;
    const pressed = motionFor(id);
    const expected = motionFor(sequence[expectedIndex]);
    lives = Math.max(0, lives - 1);
    cursor = 0;
    updateHud();
    renderMotion(id);
    setFeedback('wrong', 650);
    setProgress(sequence.length, 0, 'input');
    setCaption('simulator.caption.notQuite', { pressedId: id }, `Not quite — ${pressed.name} was not the next move.`);

    if (lives === 0) {
      endGame({
        key: 'simulator.detail.lastInput',
        params: { pressedId: id, expectedId: sequence[expectedIndex] },
        fallback: `The last input was ${pressed.name}; the phrase needed ${expected.name}.`
      });
      return;
    }

    setPhase('input');
    setKeysEnabled(true);
    showReplay();
    setMessage(
      'simulator.message.wrong',
      { pressedId: id, step: expectedIndex + 1, expectedId: sequence[expectedIndex] },
      'bad',
      `Not quite — you pressed ${pressed.name}. At step ${expectedIndex + 1}, the phrase was ${expected.name}. The sequence is reset: watch again or try from the start.`
    );
  }

  function completeRound() {
    setKeysEnabled(false);
    hideReplay();
    setFeedback('clear');
    const points = sequence.length * pointsPerMove + roundBonus;
    cursor = 0;
    score += points;
    updateHud();
    setProgress(sequence.length, sequence.length, 'clear');

    if (roundIndex === roundLengths.length - 1) {
      endVictory(points);
      return;
    }

    setPhase('clear');
    setCaption('simulator.caption.roundClear', { round: roundIndex + 1 }, `Round ${roundIndex + 1} clear.`);
    setMessage(
      'simulator.message.roundClear',
      { round: roundIndex + 1, points },
      'good',
      `Round ${roundIndex + 1} clear. +${points} points. Take a breath, then choose Next round.`
    );
    showPrimary('next');
    els.primary.focus({ preventScroll: true });
  }

  function endVictory(points) {
    setPhase('victory');
    setKeysEnabled(false);
    hideReplay();
    setFeedback('clear');
    setCaption('simulator.caption.victory', {}, 'All five rounds echoed.');
    setMessage(
      'simulator.message.victory',
      { points, score },
      'good',
      `Round 5 clear. +${points} points. Final score: ${score}. You echoed every phrase.`
    );
    showPrimary('play-again');
    els.primary.focus({ preventScroll: true });
  }

  function endGame(detail = null) {
    setPhase('over');
    setKeysEnabled(false);
    hideReplay();
    setFeedback('over');
    setCaption('simulator.caption.gameOver', { round: roundIndex + 1 }, `The run ends in round ${roundIndex + 1}.`);
    setMessage(
      'simulator.message.gameOver',
      { score, round: roundIndex + 1, total: roundLengths.length },
      'bad',
      `Game over — final score ${score}. You reached round ${roundIndex + 1} of ${roundLengths.length}.`,
      detail
    );
    showPrimary('play-again');
    els.primary.focus({ preventScroll: true });
  }

  function startGame() {
    playbackToken += 1;
    roundIndex = 0;
    score = 0;
    lives = startingLives;
    sequence = [];
    cursor = 0;
    updateHud();
    els.howto.hidden = true;
    hideReplay();
    setFeedback(null);
    resetProgress();
    renderMotion('stand');
    beginRound();
  }

  function resetGame() {
    playbackToken += 1;
    roundIndex = 0;
    score = 0;
    lives = startingLives;
    sequence = [];
    cursor = 0;
    updateHud();
    els.howto.hidden = false;
    hideReplay();
    setFeedback(null);
    resetProgress();
    renderMotion('stand');
    setPhase('idle');
    setKeysEnabled(false);
    showPrimary('start');
    setCaption('simulator.caption.initial', {}, 'Watch the stage, then repeat the phrase.');
    setMessage('simulator.message.ready', {}, 'info', 'Press Start game when you are ready.');
    refreshKeyLabels();
  }

  function pressMotion(id) {
    if (phase !== 'input' || !sequence.length) return;
    if (!motionById.has(id)) return;
    if (id === sequence[cursor]) {
      handleCorrect(id);
    } else {
      handleWrong(id);
    }
  }

  function nextRound() {
    if (phase !== 'clear') return;
    roundIndex += 1;
    beginRound();
  }

  els.primary.addEventListener('click', () => {
    const action = els.primary.dataset.action;
    if (action === 'start' || action === 'play-again') {
      startGame();
    } else if (action === 'next') {
      nextRound();
    }
  });

  els.replay.addEventListener('click', replayCurrentSequence);
  els.reset.addEventListener('click', resetGame);

  els.keypad.addEventListener('click', (event) => {
    const key = event.target.closest('.echo-key');
    if (!key || key.disabled) return;
    pressMotion(key.dataset.motion);
  });

  document.addEventListener('keydown', (event) => {
    if (phase !== 'input' || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (
      target instanceof HTMLElement
      && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
    ) {
      return;
    }
    const index = Number(event.key) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= motionIds.length) return;
    event.preventDefault();
    pressMotion(motionIds[index]);
  });

  document.addEventListener('languagechange', refreshLanguage);
  resetGame();
})();
