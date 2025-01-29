const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const titleScreen = document.getElementById('titleScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScore = document.getElementById('finalScore');

const fric1 = new Image();
fric1.src = 'fric1.png';
const fric2 = new Image();
fric2.src = 'fric2.png';

const bird = {
  x: 50,
  y: canvas.height / 2,
  radius: 25,
  gravity: 0.18, // was .08 
  lift: -5.5,
  velocity: 0,
  image: fric2
};

const pipes = [];
const pipeWidth = 60;
let pipeGap = 200; // Starting gap size
const minPipeGap = 100; // Minimum gap size
const gapReductionRate = 2; // Gap reduction amount per pipe
const pipeFrequency = 180;

function pipeShrink() {
  const pipeShrinkSmoother = 2; // the closer to 1 the more smoothing
  const pipeShrinkMultiplier = 100;
  const result = pipeShrinkMultiplier * Math.pow(pipeShrinkSmoother, -Math.pow(score, 2));
  return result;
}
let frame = 0;
let score = 0;
let gameOver = false;
let gameStarted = false;

function resetGame() {
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  pipes.length = 0;
  pipeGap = 200; // Reset the gap size
  frame = 0;
  score = 0;
  gameOver = false;
  gameOverScreen.style.display = 'none';
  gameStarted = true;
  bird.y -= 50; // Spawn bird slightly higher
  gameLoop();
}

function drawBird() {
  ctx.drawImage(bird.image, bird.x - bird.radius, bird.y - bird.radius, bird.radius * 2, bird.radius * 2);
}

function drawPipes() {
  pipes.forEach(pipe => {
    ctx.fillStyle = "red";
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);

    ctx.fillStyle = "green";
    ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipeWidth, pipe.bottom);
  });
}

function updatePipes() {
  if (frame % pipeFrequency === 0) {
    const top = Math.random() * (canvas.height - pipeShrink(score) - 100) + 50;
    let bottom = canvas.height - top - pipeGap;
    if (bottom <= 0) {
      bottom = Math.random() * 10;
      top = bottom + pipeGap;
  }
    pipes.push({ x: canvas.width, top, bottom });

    // Decrease the pipe gap dynamically, but ensure it doesn't go below the minimum
    if (pipeGap > minPipeGap) {
      pipeGap -= gapReductionRate;
    }
  }

  pipes.forEach(pipe => {
    pipe.x -= 2;
  });

  if (pipes.length > 0 && pipes[0].x + pipeWidth < 0) {
    pipes.shift();
    score++;
  }
}

function checkCollision() {
  if (bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0) {
    gameOver = true;
  }

  pipes.forEach(pipe => {
    if (
      bird.x + bird.radius > pipe.x &&
      bird.x - bird.radius < pipe.x + pipeWidth &&
      (bird.y - bird.radius < pipe.top || bird.y + bird.radius > canvas.height - pipe.bottom)
    ) {
      gameOver = true;
    }
  });
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
}

function gameLoop() {
  if (gameOver) {
    finalScore.textContent = `Final Score: ${score}`;
    gameOverScreen.style.display = 'flex';
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  updatePipes();
  drawPipes();
  drawBird();
  drawScore();
  checkCollision();

  frame++;
  requestAnimationFrame(gameLoop);
}

// Start or restart game when Spacebar is pressed
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    if (!gameStarted) {
      titleScreen.style.display = 'none';
      bird.y -= 50; // Spawn bird slightly higher when the game starts
      gameStarted = true;
      gameLoop();
    } else if (gameOver) {
      resetGame(); // Restart the game from the game over screen
    }

    if (!gameOver) {
      bird.velocity = bird.lift;
      bird.image = fric1;
      setTimeout(() => (bird.image = fric2), 300);
    }
  }
});

// Start the game when the button is clicked
startButton.addEventListener('click', () => {
  if (!gameStarted) {
    titleScreen.style.display = 'none';
    bird.y -= 50; // Spawn bird slightly higher when the game starts
    gameStarted = true;
    gameLoop();
  }
});

// Restart the game when the restart button is clicked
restartButton.addEventListener('click', resetGame);
