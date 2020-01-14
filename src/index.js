import "./index.css";

import Vector2 from "./vector2";

const loadImage = url =>
  new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.src = url;
  });

const splitImage = (image, row, col) => {
  const { width, height } = image;
  const colSize = width / col;
  const rowSize = height / row;

  const subImages = [];
  for (let y = 0; y < row; y++) {
    for (let x = 0; x < col; x++) {
      subImages.push({
        image,
        width: colSize,
        height: rowSize,
        x: colSize * x,
        y: rowSize * y
      });
    }
  }
  return subImages;
};

const init = async () => {
  const canvas = document.getElementById("main");
  const info = document.getElementById("info");

  canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    players[0].target.set(e.clientX - rect.left, e.clientY - rect.top);
  });

  canvas.addEventListener("mousedown", () => (players[0].shooting = true));
  canvas.addEventListener("mouseup", () => (players[0].shooting = false));

  const { width, height } = canvas;

  const players = [
    {
      hp: 100,
      position: new Vector2(100, 100),
      target: new Vector2(100, 100),
      cooldown: 0,
      delay: 1,
      radius: 20,
      speed: 100,
      shooting: false
    },
    {
      hp: 100,
      position: new Vector2(500, 300),
      target: new Vector2(500, 300),
      cooldown: 0,
      delay: 1 / 6,
      radius: 30,
      speed: 100,
      shooting: false
    }
  ];

  const BULLET_SPEED = 300;
  const bullets = [];

  const createBullet = (from, to, playerIndex) => {
    bullets.push({
      radius: 10,
      damage: 10,
      position: new Vector2(from.x, from.y),
      velocity: new Vector2(to.x, to.y)
        .subVector(from)
        .nor()
        .scale(BULLET_SPEED),
      playerIndex
    });
  };

  const context = canvas.getContext("2d");
  const clear = () => context.clearRect(0, 0, width, height);

  const tmp = new Vector2();
  const processPlayer = (player, playerIndex, delta) => {
    if (player.cooldown !== 0) {
      player.cooldown = Math.max(0, player.cooldown - delta);
    }
    if (!player.shooting) {
      tmp
        .setVector(player.target)
        .subVector(player.position)
        .nor()
        .scale(player.speed * delta);

      if (player.target.distanceSqr(player.position) <= tmp.len2()) {
        player.position.setVector(player.target);
      } else {
        player.position.addVector(tmp);
      }
    } else {
      if (player.cooldown === 0) {
        createBullet(player.position, player.target, playerIndex);
        player.cooldown = player.delay;
      }
    }
  };

  const processBullet = (bullet, delta) => {
    tmp.setVector(bullet.velocity).scale(delta);
    bullet.position.addVector(tmp);
  };

  const drawCircle = (pos, radius) => {
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    context.fill();
  };

  const update = delta => {
    clear();
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      processPlayer(player, i, delta);
    }
    for (let bullet of bullets) {
      processBullet(bullet, delta);
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      const x = bullet.position.x;
      const y = bullet.position.y;

      if (x < 0 || y < 0 || x > width || y > height) {
        bullets.splice(i, 1);
      }
    }

    for (let player of players) {
      drawCircle(player.position, player.radius);
      context.fillStyle = "white";
      context.fillRect(
        player.position.x - 25,
        player.position.y + player.radius + 10,
        50,
        7
      );
      context.fillStyle = player.cooldown < 0.05 ? "lime" : "orange";
      const readyRatio = (player.delay - player.cooldown) / player.delay;
      context.fillRect(
        player.position.x - 24,
        player.position.y + player.radius + 11,
        48 * readyRatio,
        5
      );
    }

    for (let bullet of bullets) {
      drawCircle(bullet.position, bullet.radius);
    }
  };

  let lastUpdate = Date.now();
  let fps = 0;

  setInterval(() => {
    info.innerHTML = `FPS: ${fps} - Bullets: ${bullets.length}`;
  }, 1000);

  (function loop() {
    const delta = Date.now() - lastUpdate;
    lastUpdate = Date.now();
    fps = Math.floor(1000 / delta);
    update(delta / 1000);
    requestAnimationFrame(loop);
  })();
};

init();
