const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

let joueurs = {};
let pellets = [];

const MAP_WIDTH = 1600;
const MAP_HEIGHT = 900;

function creerPellets(nombre) {
  pellets = [];
  for (let i = 0; i < nombre; i++) {
    pellets.push({
      id: i,
      x: Math.random() * MAP_WIDTH,
      y: Math.random() * MAP_HEIGHT,
      taille: 5,
      couleur: '#' + Math.floor(Math.random() * 16777215).toString(16),
    });
  }
}

creerPellets(50);

function verifCollision(circle1, circle2) {
  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < circle1.taille + circle2.taille;
}

function mangerPellets(player) {
  const pelletsmanges = [];
  pellets = pellets.filter((pellet) => {
    if (verifCollision(player, pellet)) {
      player.taille += 1;
      pelletsmanges.push(pellet.id);
      //creerPellets(1);

      //bug sur l'ajout de pellet quand un est mangé (peut etre au lieu de generer un nouveau pellet, modifier le pellet mangé)
      const newPellet = {
        id: pellets.length + Math.random(),
        x: Math.random() * MAP_WIDTH,
        y: Math.random() * MAP_HEIGHT,
        taille: 5,
        couleur: '#' + Math.floor(Math.random() * 16777215).toString(16),
      };
      pellets.push(newPellet);

      console.log('nouvo pellet:', newPellet);
      console.log('der pellet:', pellets[pellets.length - 1]);

      return false;
    }

    //io.emit('pelletsFini', pelletsmanges);
    io.emit('PelletsMAJ', pellets);
    return true;
  });
}

function mangerJoueur(player) {
  for (const id in joueurs) {
    const autrejoueur = joueurs[id];
    if (
      autrejoueur.id !== player.id &&
      autrejoueur.taille < player.taille &&
      verifCollision(player, autrejoueur)
    ) {

      player.taille += autrejoueur.taille * 0.5;
      io.to(autrejoueur.id).emit('tmort');

      delete joueurs[autrejoueur.id];
      io.emit('joueurDeco', autrejoueur.id);
    }
  }
}

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log(`joueur join: ${socket.id}`);

  joueurs[socket.id] = {
    id: socket.id,
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    taille: 20,
    couleur: '#' + Math.floor(Math.random() * 16777215).toString(16),
  };

  socket.emit('init', { joueurs, pellets, map: { width: MAP_WIDTH, height: MAP_HEIGHT } });

  socket.broadcast.emit('nouvoJoueur', joueurs[socket.id]);

  socket.on('move', (data) => {
    if (joueurs[socket.id]) {
      joueurs[socket.id].x = data.x;
      joueurs[socket.id].y = data.y;

      mangerPellets(joueurs[socket.id]);
      mangerJoueur(joueurs[socket.id]);

      io.emit('joueurMove', joueurs[socket.id]);
    }
  });

  socket.on('disconnect', () => {
    console.log(`a quitter: ${socket.id}`);
    delete joueurs[socket.id];

    io.emit('joueurDeco', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`lien : http://localhost:${PORT}`);
});
