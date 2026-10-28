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
  let current = 0;

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
      list.forEach((item, index) => item.classList.toggle('is-selected', index === current));
    }, 220);
  }

  stage.addEventListener('click', () => {
    let next = Math.floor(Math.random() * motions.length);
    if (motions.length > 1 && next === current) next = (next + 1) % motions.length;
    showMotion(next);
  });
  list.forEach((item, index) => item.addEventListener('click', () => showMotion(index)));
  let seconds = 4;
  window.setInterval(() => {
    seconds -= 1;
    if (countdown) countdown.textContent = seconds;
    if (seconds === 0) {
      let next = (current + 1) % motions.length;
      showMotion(next);
      seconds = 4;
    }
  }, 1000);
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

// The Bubble Machine exists only on the homepage and never enters document flow.
const homeCanvas = document.querySelector('.home-page .home-canvas');
if (homeCanvas) {
  const machineColors = ['var(--tomato)', 'var(--orange)', 'var(--yellow)', 'var(--green)', 'var(--cobalt)', 'var(--purple)'];
  const maxMachineBubbles = 8;

  function isMachineSafeZone(x, y) {
    const portrait = homeCanvas.querySelector('.portrait-wrap').getBoundingClientRect();
    const title = homeCanvas.querySelector('#home-title').getBoundingClientRect();
    const canvas = homeCanvas.getBoundingClientRect();
    const pointX = canvas.left + x;
    const pointY = canvas.top + y;
    const inside = (rect) => pointX >= rect.left - 38 && pointX <= rect.right + 38
      && pointY >= rect.top - 38 && pointY <= rect.bottom + 38;
    return inside(portrait) || inside(title);
  }

  homeCanvas.addEventListener('click', (event) => {
    if (event.target.closest('.bubble')) return;
    if (homeCanvas.querySelectorAll('.machine-bubble').length >= maxMachineBubbles) return;

    const canvas = homeCanvas.getBoundingClientRect();
    const x = event.clientX - canvas.left;
    const y = event.clientY - canvas.top;
    if (isMachineSafeZone(x, y)) return;

    const bubble = document.createElement('span');
    const size = Math.floor(Math.random() * 51) + 40;
    bubble.className = 'machine-bubble';
    bubble.setAttribute('aria-hidden', 'true');
    bubble.style.setProperty('--bubble-size', `${size}px`);
    bubble.style.setProperty('--bubble-x', `${x - size / 2}px`);
    bubble.style.setProperty('--bubble-y', `${y - size / 2}px`);
    bubble.style.backgroundColor = machineColors[Math.floor(Math.random() * machineColors.length)];
    homeCanvas.appendChild(bubble);
    bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
  });
}
