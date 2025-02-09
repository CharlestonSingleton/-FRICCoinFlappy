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
  gravity: 0.10,
  lift: -4,
  velocity: 0,
  image: fric2
};

const pipes = [];
const pipeWidth = 60;
let pipeGap = 250; // Starting gap size
const minPipeGap = 150; // Minimum gap size
const gapReductionRate = 2; // Gap reduction amount per pipe
const pipeFrequency = 180;
const baseSpeed = 3;
const particles = [];

function pipeShrink() {
  const pipeShrinkSmoother = 1.01; // the closer to 1 the more smoothing
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
  bird.y -= 100; // Spawn bird slightly higher
  gameLoop();
}

function drawBird() {
  ctx.drawImage(bird.image, bird.x - bird.radius, bird.y - bird.radius, bird.radius * 2, bird.radius * 2);
}
function drawPipes() {
  pipes.forEach(pipe => {
    // ---- TOP PIPE (Red) ----
    ctx.fillStyle = "red";
    // Draw the top pipe candlestick (50px tall, centered)
    ctx.fillRect(
      pipe.x + ((1 - 1/10) * pipeWidth / 2),
      0,
      pipeWidth / 10,
      50
    );
    // Draw the main body of the top pipe immediately below the candlestick
    ctx.fillRect(
      pipe.x,
      50,
      pipeWidth,
      pipe.top
    );

    // ---- BOTTOM PIPE (Green) ----
    ctx.fillStyle = "green";
    // Draw the main body of the bottom pipe.
    // Its x-position is offset by pipe.stagger.
    ctx.fillRect(
      pipe.x + pipe.stagger,
      canvas.height - pipe.bottom,
      pipeWidth,
      pipe.bottom - 50
    );
    // Draw the bottom pipe candlestick (50px tall, centered)
    ctx.fillRect(
      pipe.x + pipe.stagger + ((1 - 1/10) * pipeWidth / 2),
      canvas.height - 50,
      pipeWidth / 10,
      50
    );
  });
}

function createParticles() {
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: bird.x - bird.radius/2,
      y: bird.y,
      vx: -Math.random() * 2,
      vy: (Math.random() - 0.5) * 4,
      life: 1
    });
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  const hue = (score * 5) % 360;
  gradient.addColorStop(0, `hsl(${hue}, 70%, 80%)`);
  gradient.addColorStop(1, `hsl(${hue + 60}, 70%, 60%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function updatePipes() {
  if (frame % pipeFrequency === 0) {
    // Dynamically adjust the gap between pipes based on score.
    pipeGap = Math.max(minPipeGap, 250 - score * 5);

    // Determine the top pipe height (and thus the bottom pipe height)
    const top = Math.random() * (canvas.height - pipeGap - 100) + 50;
    const bottom = canvas.height - top - pipeGap;

    // Set a fixed horizontal offset for the bottom pipe.
    // (You can also randomize this value if desired.)
    const stagger = 0; // Adjust this value to change the horizontal offset

    // Add the new pipe object with the stagger property.
    pipes.push({ x: canvas.width, top, bottom, stagger });
  }

  // Move each pipe leftward with increasing speed
  const currentSpeed = baseSpeed + (score * 0.1);
  pipes.forEach(pipe => {
    pipe.x -= currentSpeed;
  });

  // Remove off-screen pipes and update the score.
  if (pipes.length > 0 && pipes[0].x + pipeWidth < 0) {
    pipes.shift();
    score++;
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    
    ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
}

function checkCollision() {
  if (bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0) {
    gameOver = true;
    screenShake();
  }

  pipes.forEach(pipe => {
    // --- Check collision for the TOP pipe (red) ---
    if (
      bird.x + bird.radius > pipe.x &&
      bird.x - bird.radius < pipe.x + pipeWidth &&
      // The top pipe's collision region is from 0 to pipe.top + 50 (candlestick included)
      bird.y - bird.radius < pipe.top + 50
    ) {
      gameOver = true;
      screenShake();
    } 

    // --- Check collision for the BOTTOM pipe (green) ---
    if (
      bird.x + bird.radius > pipe.x + pipe.stagger &&
      bird.x - bird.radius < pipe.x + pipe.stagger + pipeWidth &&
      // The bottom pipe's collision region starts at canvas.height - pipe.bottom
      bird.y + bird.radius > canvas.height - pipe.bottom
    ) {
      gameOver = true;
      screenShake();
    }
  });
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "bold 32px Arial"; // Bigger & bold font
  ctx.textAlign = "center"; // Center the score
  ctx.fillText(`Score: ${score}`, canvas.width / 2, 50); // Centered at top

  // Add a shadow for better visibility
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillText(`Score: ${score}`, canvas.width / 2 + 2, 52);
}

function screenShake() {
  const intensity = 15;
  const shake = {
    x: (Math.random() - 0.5) * intensity,
    y: (Math.random() - 0.5) * intensity
  };
  canvas.style.transform = `translate(${shake.x}px, ${shake.y}px)`;
  
  // Add stronger vibration feedback for game over
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]); // Pattern: vibrate, pause, vibrate
  }
  
  setTimeout(() => {
    canvas.style.transform = 'translate(0px, 0px)';
  }, 100);
}

function gameLoop() {
  if (gameOver) {
    finalScore.innerHTML = `
      <h2 style="
        font-size: 36px; 
        font-weight: bold;
        text-align: center;
        margin-bottom: 10px;">
        Game Over
      </h2>
      <p style="
        font-size: 24px; 
        font-weight: bold;
        text-align: center;
        margin: 0;">
        Final Score:
      </p>
      <p style="
        font-size: 30px; 
        font-weight: bold;
        color: #a5b994;
        text-shadow: 
          -2px -2px 0 #5c736b,  
          2px -2px 0 #5c736b,  
          -2px  2px 0 #5c736b,  
          2px  2px 0 #5c736b; /* Works in all browsers */
        text-align: center;
        margin-top: 5px;">
        ${score}
      </p>
    `;

    gameOverScreen.style.display = 'flex';
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  drawBackground();  // Add background
  updatePipes();
  drawPipes();
  updateParticles();  // Add particles
  drawBird();
  drawScore();
  checkCollision();

  frame++;
  requestAnimationFrame(gameLoop);
}

// Centralized input handler for both touch and keyboard
function handleInput() {
  if (!gameStarted) {
    titleScreen.style.display = 'none';
    bird.y -= 50;
    gameStarted = true;
    gameLoop();
  } else if (gameOver) {
    resetGame();
  }

  if (!gameOver) {
    bird.velocity = bird.lift;
    bird.image = fric1;
    createParticles();
    
    // Add vibration feedback (short pulse)
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
    
    setTimeout(() => (bird.image = fric2), 300);
  }
}

// Add touch support for mobile
canvas.addEventListener('touchstart', (event) => {
  event.preventDefault(); // Prevent default scrolling behavior
  handleInput();
});

// Start or restart game when Spacebar is pressed
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    handleInput();
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

// some s@#$ for the random image in the
// construction site

// Array of random image URLs
const randomImages = [
  "angry.gif",
  "coffee.gif",
  "love1.gif",
  "sunglasses.gif"
];

// Select the <img> element
const imgElement = document.getElementById("randomImage");

// Choose a random image from the array
const randomIndex = Math.floor(Math.random() * randomImages.length);
imgElement.src = randomImages[randomIndex];
