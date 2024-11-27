/** Canvas setting */
const canvas = document.getElementById("canvas");
canvas.width = 800;
canvas.height = 500;
const ctx = canvas.getContext("2d");

/** Game status variables */
let gameStarted = false;
const BG_MOVING_SPEED = 3;
let bgX = 0;
let scoreText = document.getElementById("score");
let score = 0;

/** Game variables */
let timer = 0; // obstacle timer
let obstacleArray = [];
let gameOver = false;
let jump = false;
let jumpSpeed = 3;

/** Audios */
const jumpSound = new Audio();
jumpSound.src = "./sounds/jump.mp3";
const bgmSound = new Audio();
bgmSound.src = "./sounds/bgm.mp3";
const scoreSound = new Audio();
scoreSound.src = "./sounds/score.mp3";
const defeatSound = new Audio();
defeatSound.src = "./sounds/defeat1.mp3";

/** Images */
const bgImage = new Image();
bgImage.src = "./images/background.png";

const startImage = new Image();
startImage.src = "./images/gamestart.png";

const gameoverImage = new Image();
gameoverImage.src = "./images/gameover.png";

const restartImage = new Image();
restartImage.src = "./images/restart.png";

const rtanAImage = new Image();
rtanAImage.src = "./images/rtan_running_a.png";

const rtanBImage = new Image();
rtanBImage.src = "./images/rtan_running_b.png";

const rtanCrashImage = new Image();
rtanCrashImage.src = "./images/rtan_crash.png";

const obstacleImage = new Image();
obstacleImage.src = "./images/obstacle1.png";

/** 1-1 Draw rtan */
const RTAN_WIDTH = 100;
const RTAN_HEIGHT = 100;
const RTAN_X = 10;
const RTAN_Y = 400;

/** Define rtan */
const rtan = {
  x: RTAN_X,
  y: RTAN_Y,
  width: RTAN_WIDTH,
  height: RTAN_HEIGHT,
  draw() {
    if (gameOver) {
      ctx.drawImage(rtanCrashImage, this.x, this.y, this.width, this.height);
    } else {
      if (timer % 60 > 30) {
        ctx.drawImage(rtanAImage, this.x, this.y, this.width, this.height);
      } else {
        ctx.drawImage(rtanBImage, this.x, this.y, this.width, this.height);
      }
    }
  },
};
/** end of 1-1 */

/** 2-1 Obstacle setting */
const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT = 50;
const OBSTACLE_FREQUENCY = 90;
const OBSTACLE_SPEED = 4;

class Obstacle {
  constructor() {
    this.x = canvas.width;
    this.y =
      Math.floor(Math.random() * (canvas.height - OBSTACLE_HEIGHT - 30)) + 30; // 장애물이 canvas의 상단과 하단에서 30px 이내에 생성되지 않도록 조정
    this.width = OBSTACLE_WIDTH;
    this.height = OBSTACLE_HEIGHT;
  }
  draw() {
    ctx.drawImage(obstacleImage, this.x, this.y, this.width, this.height); // 장애물 이미지 그리기
  }
}
/** end of 2-1 */

/** 3-1 Draw background */
function backgroundImg(bgX) {
  ctx.drawImage(bgImage, bgX, 0, canvas.width, canvas.height);
}

function drawStartScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  backgroundImg(0);
  const imageWidth = 473;
  const imageHeight = 316;
  const imageX = canvas.width / 2 - imageWidth / 2;
  const imageY = canvas.height / 2 - imageHeight / 2;
  ctx.drawImage(startImage, imageX, imageY, imageWidth, imageHeight);
}

function drawGameOverScreen() {
  ctx.drawImage(
    gameoverImage,
    canvas.width / 2 - 100,
    canvas.height / 2 - 50,
    200,
    100
  );
  ctx.drawImage(
    restartImage,
    canvas.width / 2 - 50,
    canvas.height / 2 + 50,
    100,
    50
  );
}

let bgImageLoaded = new Promise((resolve) => {
  bgImage.onload = resolve;
});

let startImageLoaded = new Promise((resolve) => {
  startImage.onload = resolve;
});

Promise.all([bgImageLoaded, startImageLoaded]).then(drawStartScreen);
/** end of 3-1 */

/** Game animation */
function animate() {
  /** 2-3 Game over */
  if (gameOver) {
    drawGameOverScreen();
    return;
  }
  /** end of 2-3 */

  // Increase timer & request next frame
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  timer++;

  // 3-1 Draw infinite scroll background
  backgroundImg(bgX);
  backgroundImg(bgX + canvas.width);
  bgX -= BG_MOVING_SPEED;
  if (bgX < -canvas.width) bgX = 0;
  bgmSound.play();

  /**-- obstacle --*/
  /** 2-2 Move obstacle */
  if (timer % OBSTACLE_FREQUENCY === 0) {
    const obstacle = new Obstacle();
    obstacleArray.push(obstacle);
  }

  obstacleArray.forEach((obstacle) => {
    obstacle.draw();
    obstacle.x -= OBSTACLE_SPEED; // move obstacle to the left
    /** end of 2-2 */

    /** 2-3 obstacle setting (collision) */
    // remove obstacle out of screen & increase score
    if (obstacle.x < -OBSTACLE_WIDTH) {
      obstacleArray.shift(); // remove obstacle
      score += 10; // increase score
      scoreText.innerHTML = "Score : " + score;
      scoreSound.pause();
      scoreSound.currentTime = 0;
      scoreSound.play();
    }

    // check collision
    if (collision(rtan, obstacle)) {
      timer = 0;
      gameOver = true;
      jump = false;
      bgmSound.pause();
      defeatSound.play();
    }
  });
  /** end of 2-3 */
  /** end of obstacle */

  /**-- rtan --*/
  rtan.draw();

  if (jump) {
    rtan.y -= 3; // reduce y when pressing spacebar
    if (rtan.y < 20) rtan.y = 20; // not exceed the canvas top
  } else {
    if (rtan.y < RTAN_Y) {
      rtan.y += 3; // increase y when not pressing spacebar
      if (rtan.y > RTAN_Y) rtan.y = RTAN_Y; // not go below the initial position
    }
  }
  /** end of rtan */
}
/** end of animation */

/** 1-3 rtan jump */
// Keyboard Event (Spacebar)
document.addEventListener("keydown", function (e) {
  if (e.code === "Space" && !jump) {
    jump = true; // Keep jump when pressing spacebar
    jumpSound.play();
  }
});

document.addEventListener("keyup", function (e) {
  if (e.code === "Space") {
    jump = false;
  }
});
/** end of 1-3 */

/** 2-3 collision */
function collision(rtan, obstacle) {
  return !(
    rtan.x > obstacle.x + obstacle.width ||
    rtan.x + rtan.width < obstacle.x ||
    rtan.y > obstacle.y + obstacle.height ||
    rtan.y + rtan.height < obstacle.y
  );
}
/** end of 2-3 */

/** 3-3 Game start setting */
canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (
    !gameStarted &&
    x >= 0 &&
    x <= canvas.width &&
    y >= 0 &&
    y <= canvas.height
  ) {
    gameStarted = true;
    animate();
  }

  if (
    gameOver &&
    x >= canvas.width / 2 - 50 &&
    x <= canvas.width / 2 + 50 &&
    y >= canvas.height / 2 + 50 &&
    y <= canvas.height / 2 + 100
  ) {
    restartGame();
  }
});

function restartGame() {
  gameOver = false;
  obstacleArray = [];
  timer = 0;
  score = 0;
  scoreText.innerHTML = "Score : " + score;
  // reset rtan when game over
  rtan.x = 10;
  rtan.y = 400;
  animate();
}
/** end of 3-3 */

/** 4. Styling */
/** Mouse Event (Cursor) */
canvas.addEventListener("mousemove", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (
    gameOver &&
    x >= canvas.width / 2 - 50 &&
    x <= canvas.width / 2 + 50 &&
    y >= canvas.height / 2 + 50 &&
    y <= canvas.height / 2 + 100
  ) {
    canvas.style.cursor = "pointer";
  } else if (
    !gameStarted &&
    x >= 0 &&
    x <= canvas.width &&
    y >= 0 &&
    y <= canvas.height
  ) {
    canvas.style.cursor = "pointer";
  } else {
    canvas.style.cursor = "default";
  }
});
/** end of 4 */
