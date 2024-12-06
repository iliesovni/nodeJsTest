const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1600;
canvas.height = 900;

const socket = io();

let joueurs = {};
let pellets = [];
let thisJoueur = null;
let map = { width: 1600, height: 900 };

let targetX = 0;
let targetY = 0;

const vitesset = 5;

socket.on('init', (data) => {
  joueurs = data.joueurs;
  pellets = data.pellets;
  map = data.map;
  thisJoueur = joueurs[socket.id];
  targetX = thisJoueur.x;
  targetY = thisJoueur.y;
});

socket.on('nouvoJoueur', (player) => {
  joueurs[player.id] = player;
});

socket.on('joueurMove', (player) => {
  if (joueurs[player.id]) {
    joueurs[player.id] = player;
  }
});

socket.on('joueurDeco', (id) => {
  delete joueurs[id];
});

//socket.on('pelletsFini', (PelletFiniIds) => {
//  pellets = pellets.filter((pellet) => !PelletFiniIds.includes(pellet.id));
//});

socket.on('tmort', () => {
  alert('mort');
  location.reload();
});

window.addEventListener('mousemove', (e) => {
  if (thisJoueur) {
    const ScaleX = map.width / canvas.width;
    const ScaleY = map.height / canvas.height;

    targetX = e.clientX * ScaleX;
    targetY = e.clientY * ScaleY;
  }
});

function mouvement() {
  if (!thisJoueur) return;

  const dx = targetX - thisJoueur.x;
  const dy = targetY - thisJoueur.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < vitesset) {
    thisJoueur.x = targetX;
    thisJoueur.y = targetY;
  } else {
    thisJoueur.x += (dx / distance) * vitesset;
    thisJoueur.y += (dy / distance) * vitesset;
  }

  socket.emit('move', { x: thisJoueur.x, y: thisJoueur.y });
}

function dessinePellets() {
  for (const pellet of pellets) {
    ctx.beginPath();
    ctx.arc(pellet.x, pellet.y, pellet.taille, 0, Math.PI * 2);
    ctx.fillStyle = pellet.couleur;
    ctx.fill();
  }
}

function dessineJoueurs() {
  for (const id in joueurs) {
    const player = joueurs[id];
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.taille, 0, Math.PI * 2);
    ctx.fillStyle = player.couleur;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dessinePellets();
  dessineJoueurs();
  mouvement();
  requestAnimationFrame(gameLoop);
}

socket.on('PelletsMAJ', (updatedPellets) => {
  pellets = updatedPellets;
  dessinePellets();
});

gameLoop();
