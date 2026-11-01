// One shared sequence keeps the stage, dialogue, list, and auto tour in sync.
const motions = [
  { name: 'Stand', dialogue: 'Just hanging around, admiring the art.', art: '<rect fill="#2148d8" x="136" y="106" width="28" height="111"/><path fill="#f04438" d="M136 125 82 159l10 17 44-23zM164 125l54 34-10 17-44-23z"/><path fill="#58c637" d="m136 210-38 78 18 9 48-70zM164 210l38 78-18 9-48-70z"/><rect fill="#8b42d8" x="78" y="288" width="34" height="12"/><rect fill="#ff8a26" x="198" y="288" width="34" height="12"/>' },
  { name: 'Walk', dialogue: 'Strolling slowly through the gallery.', art: '<path fill="#2148d8" d="M142 105h28v110h-28z"/><path fill="#ff8a26" d="m142 127-60 26 8 19 52-17z"/><path fill="#f04438" d="m170 127 64 9-3 20-61-4z"/><path fill="#58c637" d="m142 207-65 59 13 14 69-49z"/><path fill="#8b42d8" d="m170 207 54 46-13 15-61-45z"/><rect fill="#ff8a26" x="73" y="271" width="38" height="12"/><rect fill="#2148d8" x="207" y="261" width="38" height="12"/>' },
  { name: 'Run', dialogue: 'Hurry! The good show is about to end.', art: '<path fill="#2148d8" d="m138 104 28 3-10 111-28-3z"/><path fill="#f04438" d="m143 126-75-34 9-18 76 52z"/><path fill="#ff8a26" d="m164 128 72 45-11 17-73-39z"/><path fill="#58c637" d="m129 210-83 25 6 20 85-22z"/><path fill="#8b42d8" d="m156 210 83 68-14 16-83-60z"/><rect fill="#ff8a26" x="35" y="246" width="42" height="12"/><rect fill="#2148d8" x="224" y="288" width="42" height="12"/>' },
  { name: 'Jump', dialogue: 'This artwork makes me want to jump!', art: '<rect fill="#2148d8" x="136" y="105" width="28" height="94"/><path fill="#f04438" d="m136 130-65-51 12-15 69 47z"/><path fill="#58c637" d="m164 130 65-57 13 15-70 60z"/><path fill="#8b42d8" d="m136 193-71 76 14 13 75-70z"/><path fill="#ff8a26" d="m164 193 71 71-14 14-75-71z"/><rect fill="#ff8a26" x="48" y="48" width="36" height="12"/><rect fill="#f04438" x="226" y="53" width="36" height="12"/>' },
  { name: 'Wave', dialogue: 'Hello there, fellow art lover.', art: '<rect fill="#2148d8" x="136" y="105" width="28" height="111"/><path fill="#ff8a26" d="m136 130-69-41 10-18 69 40z"/><path fill="#f04438" d="m164 130 56-63 16 14-51 66z"/><circle fill="#ff8a26" cx="230" cy="58" r="13"/><path fill="#58c637" d="m136 210-38 78 18 9 48-70zM164 210l38 78-18 9-48-70z"/><rect fill="#8b42d8" x="78" y="288" width="34" height="12"/><rect fill="#2148d8" x="198" y="288" width="34" height="12"/>' },
  { name: 'Squat', dialogue: 'Getting down to check the tiny details.', art: '<path fill="#2148d8" d="m137 104 29 5 18 72-28 7z"/><path fill="#f04438" d="m151 130-72 26 7 19 73-25z"/><path fill="#ff8a26" d="m166 132 72 6-2 20-72-6z"/><path fill="#58c637" d="m176 178-79 54 11 17 82-49z"/><path fill="#8b42d8" d="m176 178 79 46-10 18-84-39z"/><rect fill="#ff8a26" x="71" y="241" width="42" height="12"/><rect fill="#2148d8" x="241" y="236" width="42" height="12"/>' },
  { name: 'Swim', dialogue: 'Diving away from too many art talks.', art: '<path fill="#2148d8" d="m136 126 78 25-8 26-78-25z"/><path fill="#f04438" d="m135 133-82-32 8-20 84 32z"/><path fill="#ff8a26" d="m205 151 68-37 10 18-68 39z"/><path fill="#58c637" d="m136 168-80 32 8 20 82-32z"/><path fill="#8b42d8" d="m210 171 78 28-7 20-79-27z"/><circle fill="#ff8a26" cx="43" cy="91" r="12"/><circle fill="#f04438" cx="287" cy="213" r="12"/>' }
];

const stage = document.querySelector('#motion-stage');
if (stage) {
  const pose = document.querySelector('#motion-pose');
  const name = document.querySelector('#motion-name');
  const badge = document.querySelector('#motion-badge');
  const list = [...document.querySelectorAll('#motion-list li')];
  const dialogue = document.querySelector('#motion-dialogue');
  const countdown = document.querySelector('#countdown');
  const progress = document.querySelector('#motion-progress');
  const tourToggle = document.querySelector('#tour-toggle');
  const nextMotion = document.querySelector('#next-motion');
  const tempoSelect = document.querySelector('#tempo-select');
  const tourStatus = document.querySelector('#tour-status');
  let current = 0;
  let seconds = 4;
  let isTourPaused = false;
  let timer;

  function showMotion(nextIndex) {
    pose.classList.add('is-changing');
    window.setTimeout(() => {
      pose.innerHTML = motions[nextIndex].art.replaceAll('#ff8a26', '#ff8a26');
      pose.classList.remove('is-changing');
      pose.classList.add('is-new');
      window.setTimeout(() => pose.classList.remove('is-new'), 400);
      current = nextIndex;
      name.textContent = motions[current].name;
      dialogue.textContent = motions[current].dialogue;
      badge.textContent = `${String(current + 1).padStart(2, '0')} / 07`;
      if (progress) progress.style.width = `${((current + 1) / motions.length) * 100}%`;
      list.forEach((item, index) => {
        item.classList.toggle('is-selected', index === current);
        item.setAttribute('aria-current', index === current ? 'true' : 'false');
      });
      seconds = Number(tempoSelect.value);
      if (countdown) countdown.textContent = seconds;
    }, 220);
  }

  function nextPose() {
    showMotion((current + 1) % motions.length);
  }

  function resetTimer() {
    window.clearInterval(timer);
    timer = window.setInterval(() => {
      if (isTourPaused) return;
      seconds -= 1;
      if (countdown) countdown.textContent = seconds;
      if (seconds <= 0) nextPose();
    }, 1000);
  }

  function setTourPaused(paused) {
    isTourPaused = paused;
    tourToggle.setAttribute('aria-pressed', String(paused));
    tourToggle.textContent = paused ? 'Resume tour' : 'Pause tour';
    tourStatus.textContent = paused ? 'Auto tour is paused' : 'Auto tour is on';
  }

  stage.addEventListener('click', () => {
    let next = Math.floor(Math.random() * motions.length);
    if (motions.length > 1 && next === current) next = (next + 1) % motions.length;
    showMotion(next);
  });
  list.forEach((item, index) => {
    item.addEventListener('click', () => showMotion(index));
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showMotion(index);
      }
    });
  });
  nextMotion.addEventListener('click', nextPose);
  tourToggle.addEventListener('click', () => setTourPaused(!isTourPaused));
  tempoSelect.addEventListener('change', () => {
    seconds = Number(tempoSelect.value);
    countdown.textContent = seconds;
  });
  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input, select, textarea')) return;
    if (event.key === ' ') {
      event.preventDefault();
      setTourPaused(!isTourPaused);
    } else if (event.key === 'ArrowRight') {
      nextPose();
    } else if (event.key === 'ArrowLeft') {
      showMotion((current - 1 + motions.length) % motions.length);
    }
  });
  resetTimer();
}

const homeDialogue = document.querySelector('#home-dialogue');
const homeNotes = [...document.querySelectorAll('.home-page .bubble-note')];
if (homeDialogue && homeNotes.length) {
  const homeMessage = homeDialogue.querySelector('strong');
  homeNotes.forEach((note) => {
    note.addEventListener('click', () => {
      homeDialogue.classList.add('is-changing');
      window.setTimeout(() => {
        homeMessage.textContent = `“${note.dataset.message}”`;
        homeDialogue.classList.remove('is-changing');
      }, 220);
    });
  });
}

const soundToggle = document.querySelector('#sound-toggle');
const galleryCards = [...document.querySelectorAll('.motion-card')];
let soundEnabled = true;
let audioContext;

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  audioContext = audioContext || new AudioContext();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function playUiSound() {
  if (!soundEnabled) return;
  const context = getAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = 'triangle';
  oscillator.frequency.value = 520;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.07);
}

function playMotionSound(motion) {
  if (!soundEnabled) return;
  const context = getAudioContext();
  if (!context) return;

  const patterns = {
    stand: [[220, 0, .14]],
    walk: [[260, 0, .08], [320, .1, .08]],
    run: [[360, 0, .06], [460, .08, .06], [360, .16, .06]],
    jump: [[280, 0, .1], [560, .12, .16]],
    wave: [[440, 0, .1], [660, .13, .14]],
    squat: [[180, 0, .18]],
    swim: [[300, 0, .1], [240, .13, .1]]
  };
  const now = context.currentTime;
  patterns[motion].forEach(([frequency, offset, duration]) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = motion === 'swim' ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.07, now + offset + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + duration);
  });
}

document.addEventListener('click', (event) => {
  if (event.target.closest('button')) playUiSound();
}, true);
document.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('button')) {
    if (event.target.closest('[role="button"]')) playUiSound();
  }
}, true);

if (soundToggle) {
  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    soundToggle.textContent = soundEnabled ? 'Sound on' : 'Sound off';
    if (soundEnabled) playMotionSound('stand');
  });
}

galleryCards.forEach((card) => {
  const playButton = card.querySelector('.motion-play');
  if (!playButton) return;
  playButton.addEventListener('click', () => {
    const isPlaying = card.classList.toggle('is-playing');
    playButton.setAttribute('aria-pressed', String(isPlaying));
    playButton.textContent = isPlaying ? 'Pause motion' : 'Play motion';
    if (isPlaying) playMotionSound(card.dataset.motion);
  });
});
