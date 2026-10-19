/* Move & Help Kids (demo). Seed content. All copy is local; nothing is fetched. */
(function () {
  'use strict';
  var ALL = ['5-7', '8-10', '11-12'];
  var OLDER = ['8-10', '11-12'];

  var moves = [
    { id: 'jacks', icon: '🤸', anim: 'jump', secs: 30, stars: 1,
      name: { en: 'Jumping Jacks', es: 'Saltos de tijera' },
      steps: { en: ['Jump and open arms and legs.', 'Jump back together.'],
               es: ['Salta y abre brazos y piernas.', 'Salta y vuelve a juntarlos.'] } },
    { id: 'bear', icon: '🐻', anim: 'crawl', secs: 30, stars: 2,
      name: { en: 'Bear Crawl', es: 'Paso de oso' },
      steps: { en: ['Hands and feet on the floor.', 'Walk slowly like a bear.'],
               es: ['Manos y pies en el piso.', 'Camina despacio como un oso.'] } },
    { id: 'frog', icon: '🐸', anim: 'jump', secs: 30, stars: 2,
      name: { en: 'Frog Jumps', es: 'Saltos de rana' },
      steps: { en: ['Squat down low.', 'Jump up and land soft.'],
               es: ['Agáchate bien abajo.', 'Salta y cae suave.'] } },
    { id: 'flamingo', icon: '🦩', anim: 'wobble', secs: 40, stars: 1, cue: 'switch',
      name: { en: 'Flamingo Balance', es: 'Equilibrio de flamenco' },
      steps: { en: ['Stand on one foot.', 'Switch feet halfway.'],
               es: ['Párate en un pie.', 'Cambia de pie a la mitad.'] } },
    { id: 'star', icon: '⭐', anim: 'spin', secs: 30, stars: 1,
      name: { en: 'Star Jumps', es: 'Saltos de estrella' },
      steps: { en: ['Crouch down small.', 'Jump big like a star!'],
               es: ['Hazte bolita.', '¡Salta grande como una estrella!'] } },
    { id: 'march', icon: '🥁', anim: 'march', secs: 45, stars: 1,
      name: { en: 'March in Place', es: 'Marcha en tu lugar' },
      steps: { en: ['Lift your knees high.', 'Swing your arms.'],
               es: ['Sube las rodillas.', 'Mueve los brazos.'] } },
    { id: 'crab', icon: '🦀', anim: 'side', secs: 30, stars: 2,
      name: { en: 'Crab Walk', es: 'Paso de cangrejo' },
      steps: { en: ['Sit with hands behind you.', 'Lift your hips and walk.'],
               es: ['Siéntate con las manos atrás.', 'Sube la cadera y camina.'] } },
    { id: 'arms', icon: '💫', anim: 'spin', secs: 30, stars: 1,
      name: { en: 'Arm Circles', es: 'Círculos con los brazos' },
      steps: { en: ['Arms out wide.', 'Small circles, then big ones.'],
               es: ['Brazos bien abiertos.', 'Círculos chicos y luego grandes.'] } },
    { id: 'freeze', icon: '🎵', anim: 'dance', secs: 60, stars: 2, cue: 'freeze',
      name: { en: 'Freeze Dance', es: 'Baila y haz la estatua' },
      steps: { en: ['Dance when you see DANCE.', 'Freeze like a statue on FREEZE!'],
               es: ['Baila cuando veas BAILA.', '¡Quieto como estatua en ESTATUA!'] } },
    { id: 'reach', icon: '🙆', anim: 'grow', secs: 30, stars: 1,
      name: { en: 'Sky Reach Stretch', es: 'Estírate al cielo' },
      steps: { en: ['Reach up high.', 'Breathe slow and stand tall.'],
               es: ['Estira los brazos hacia arriba.', 'Respira lento y crece alto.'] } }
  ];

  var chores = [
    { id: 'bed', icon: '🛏️', stars: 2, ages: ALL, name: { en: 'Make your bed', es: 'Tiende tu cama' } },
    { id: 'toys', icon: '🧸', stars: 1, ages: ALL, name: { en: 'Put toys away', es: 'Guarda tus juguetes' } },
    { id: 'pet', icon: '🐶', stars: 2, ages: ALL, name: { en: 'Feed the pet', es: 'Dale de comer a la mascota' } },
    { id: 'table', icon: '🍽️', stars: 2, ages: ALL, name: { en: 'Set the table', es: 'Pon la mesa' } },
    { id: 'plants', icon: '🌱', stars: 1, ages: ALL, name: { en: 'Water the plants', es: 'Riega las plantas' } },
    { id: 'bag', icon: '🎒', stars: 1, ages: ALL, name: { en: 'Pack your school bag', es: 'Prepara tu mochila' } },
    { id: 'clothes', icon: '👕', stars: 2, ages: OLDER, name: { en: 'Put clean clothes away', es: 'Guarda tu ropa limpia' } },
    { id: 'laundry', icon: '🧺', stars: 2, ages: OLDER, name: { en: 'Sort the laundry', es: 'Separa la ropa sucia' } },
    { id: 'recycle', icon: '♻️', stars: 2, ages: OLDER, name: { en: 'Take out the recycling', es: 'Saca el reciclaje' } },
    { id: 'dishes', icon: '🧽', stars: 3, ages: ['11-12'], name: { en: 'Help wash the dishes', es: 'Ayuda a lavar los platos' } }
  ];

  var rewards = [
    { id: 'allowance', icon: '💵', cost: 10, name: { en: 'Allowance money ($1)', es: 'Mesada ($1)' } },
    { id: 'game', icon: '🎲', cost: 8, name: { en: 'Game with a grown-up', es: 'Juego con un adulto' } },
    { id: 'movie', icon: '🎬', cost: 12, name: { en: 'Family movie night', es: 'Noche de película en familia' } },
    { id: 'dinner', icon: '🍕', cost: 15, name: { en: 'Pick what is for dinner', es: 'Elige la cena' } },
    { id: 'park', icon: '🌳', cost: 20, name: { en: 'Park trip', es: 'Paseo al parque' } }
  ];

  var cheek = '<circle cx="31" cy="66" r="5" fill="#FF8FA8" opacity=".75"/><circle cx="69" cy="66" r="5" fill="#FF8FA8" opacity=".75"/>';
  var smile = '<path d="M44 74 Q50 80 56 74" stroke="#2B1B14" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
  var eyes = '<circle cx="38" cy="54" r="4.6" fill="#2B1B14"/><circle cx="62" cy="54" r="4.6" fill="#2B1B14"/><circle cx="39.5" cy="52.5" r="1.4" fill="#fff"/><circle cx="63.5" cy="52.5" r="1.4" fill="#fff"/>';

  var avatars = {
    fox: { bg: '#FFE3CC', name: { en: 'Fox', es: 'Zorro' }, svg:
      '<path d="M14 12 L44 36 L20 54Z" fill="#E8692B"/><path d="M86 12 L56 36 L80 54Z" fill="#E8692B"/>' +
      '<path d="M20 22 L36 36 L23 46Z" fill="#FFD3B0"/><path d="M80 22 L64 36 L77 46Z" fill="#FFD3B0"/>' +
      '<ellipse cx="50" cy="58" rx="34" ry="30" fill="#F07F3C"/>' +
      '<ellipse cx="36" cy="72" rx="15" ry="11" fill="#fff"/><ellipse cx="64" cy="72" rx="15" ry="11" fill="#fff"/>' +
      eyes + '<ellipse cx="50" cy="68" rx="5" ry="4" fill="#2B1B14"/>' + smile },
    cat: { bg: '#E3E6F5', name: { en: 'Cat', es: 'Gato' }, svg:
      '<path d="M18 16 L42 34 L18 50Z" fill="#8D93AE"/><path d="M82 16 L58 34 L82 50Z" fill="#8D93AE"/>' +
      '<path d="M23 25 L35 34 L23 42Z" fill="#FFB3C6"/><path d="M77 25 L65 34 L77 42Z" fill="#FFB3C6"/>' +
      '<circle cx="50" cy="58" r="32" fill="#A3A9C4"/>' + cheek + eyes +
      '<path d="M46 64 L54 64 L50 69Z" fill="#FF7A9C"/>' + smile +
      '<path d="M22 64 L36 66 M22 72 L36 70 M78 64 L64 66 M78 72 L64 70" stroke="#4A4F66" stroke-width="2" stroke-linecap="round"/>' },
    bear: { bg: '#F3E1CF', name: { en: 'Bear', es: 'Oso' }, svg:
      '<circle cx="24" cy="28" r="14" fill="#9A5B32"/><circle cx="76" cy="28" r="14" fill="#9A5B32"/>' +
      '<circle cx="24" cy="28" r="7" fill="#E8B98F"/><circle cx="76" cy="28" r="7" fill="#E8B98F"/>' +
      '<circle cx="50" cy="56" r="34" fill="#B5733F"/>' + cheek + eyes +
      '<ellipse cx="50" cy="69" rx="14" ry="10" fill="#E8C39E"/><ellipse cx="50" cy="65" rx="5.5" ry="4" fill="#2B1B14"/>' + smile },
    bunny: { bg: '#FFE0EA', name: { en: 'Bunny', es: 'Conejo' }, svg:
      '<ellipse cx="37" cy="24" rx="9" ry="22" fill="#fff" stroke="#D9CFE3" stroke-width="2"/><ellipse cx="63" cy="24" rx="9" ry="22" fill="#fff" stroke="#D9CFE3" stroke-width="2"/>' +
      '<ellipse cx="37" cy="26" rx="4" ry="15" fill="#FFB3C6"/><ellipse cx="63" cy="26" rx="4" ry="15" fill="#FFB3C6"/>' +
      '<circle cx="50" cy="62" r="30" fill="#fff" stroke="#D9CFE3" stroke-width="2"/>' +
      '<circle cx="31" cy="70" r="5" fill="#FF8FA8" opacity=".75"/><circle cx="69" cy="70" r="5" fill="#FF8FA8" opacity=".75"/>' +
      '<circle cx="39" cy="58" r="4.6" fill="#2B1B14"/><circle cx="61" cy="58" r="4.6" fill="#2B1B14"/>' +
      '<ellipse cx="50" cy="67" rx="4" ry="3" fill="#FF7A9C"/><path d="M44 74 Q50 79 56 74" stroke="#2B1B14" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<rect x="47" y="76" width="6" height="5" rx="1.5" fill="#fff" stroke="#D9CFE3"/>' },
    panda: { bg: '#DDF3E4', name: { en: 'Panda', es: 'Panda' }, svg:
      '<circle cx="25" cy="30" r="13" fill="#262626"/><circle cx="75" cy="30" r="13" fill="#262626"/>' +
      '<circle cx="50" cy="58" r="33" fill="#fff" stroke="#262626" stroke-width="2"/>' +
      '<ellipse cx="37" cy="55" rx="9" ry="11" fill="#262626" transform="rotate(-20 37 55)"/><ellipse cx="63" cy="55" rx="9" ry="11" fill="#262626" transform="rotate(20 63 55)"/>' +
      '<circle cx="38" cy="54" r="3.4" fill="#fff"/><circle cx="62" cy="54" r="3.4" fill="#fff"/>' + cheek +
      '<ellipse cx="50" cy="67" rx="5" ry="3.6" fill="#262626"/>' + smile },
    frog: { bg: '#E2F6D8', name: { en: 'Frog', es: 'Rana' }, svg:
      '<circle cx="32" cy="34" r="15" fill="#4FAE58"/><circle cx="68" cy="34" r="15" fill="#4FAE58"/>' +
      '<ellipse cx="50" cy="62" rx="38" ry="27" fill="#5DBB63"/>' +
      '<circle cx="32" cy="33" r="9" fill="#fff"/><circle cx="68" cy="33" r="9" fill="#fff"/>' +
      '<circle cx="33" cy="34" r="4.6" fill="#1F2A1F"/><circle cx="67" cy="34" r="4.6" fill="#1F2A1F"/>' +
      '<circle cx="26" cy="66" r="5" fill="#FF8FA8" opacity=".75"/><circle cx="74" cy="66" r="5" fill="#FF8FA8" opacity=".75"/>' +
      '<path d="M34 66 Q50 80 66 66" stroke="#1F4A23" stroke-width="3" fill="none" stroke-linecap="round"/>' },
    owl: { bg: '#ECE2FA', name: { en: 'Owl', es: 'Búho' }, svg:
      '<path d="M18 20 L36 30 L22 40Z" fill="#6E4FA0"/><path d="M82 20 L64 30 L78 40Z" fill="#6E4FA0"/>' +
      '<circle cx="50" cy="57" r="34" fill="#8B6BB8"/>' +
      '<circle cx="36" cy="50" r="13" fill="#fff"/><circle cx="64" cy="50" r="13" fill="#fff"/>' +
      '<circle cx="36" cy="51" r="6" fill="#231A30"/><circle cx="64" cy="51" r="6" fill="#231A30"/>' +
      '<circle cx="38" cy="49" r="1.8" fill="#fff"/><circle cx="66" cy="49" r="1.8" fill="#fff"/>' +
      '<path d="M44 62 L56 62 L50 71Z" fill="#F5A623"/>' +
      '<path d="M36 78 Q40 74 44 78 Q48 74 52 78 Q56 74 60 78 Q64 74 68 78" stroke="#D9C9F0" stroke-width="2.4" fill="none"/>' },
    lion: { bg: '#FFF1C2', name: { en: 'Lion', es: 'León' }, svg:
      '<circle cx="50" cy="55" r="42" fill="#C9741E"/>' +
      '<circle cx="28" cy="30" r="8" fill="#F5C04A"/><circle cx="72" cy="30" r="8" fill="#F5C04A"/>' +
      '<circle cx="50" cy="57" r="29" fill="#F5C04A"/>' + cheek + eyes +
      '<ellipse cx="50" cy="69" rx="12" ry="8" fill="#FFE39A"/><path d="M45 64 L55 64 L50 69Z" fill="#7A3E12"/>' + smile }
  };

  window.MHK_DATA = { moves: moves, chores: chores, rewards: rewards, avatars: avatars, ages: ALL };
})();
