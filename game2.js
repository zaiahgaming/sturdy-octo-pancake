const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');

let score = 0;
let gameState = 'start'; // start, playing, gameover
let lastTime = 0;
let animationId;

let snake = [];
let food = {};
let dx = 0;
let dy = 0;
const gridSize = 20;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function initGame() {
    score = 0;
    updateScore();
    snake = [
        {x: Math.floor(canvas.width / 2 / gridSize) * gridSize, y: Math.floor(canvas.height / 2 / gridSize) * gridSize},
        {x: Math.floor(canvas.width / 2 / gridSize) * gridSize - gridSize, y: Math.floor(canvas.height / 2 / gridSize) * gridSize},
        {x: Math.floor(canvas.width / 2 / gridSize) * gridSize - gridSize * 2, y: Math.floor(canvas.height / 2 / gridSize) * gridSize}
    ];
    dx = gridSize;
    dy = 0;
    spawnFood();
    gameState = 'playing';
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    lastTime = performance.now();

    if (animationId) cancelAnimationFrame(animationId);
    gameLoop(lastTime);
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
        y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
    };
}

function updateScore() {
    scoreElement.textContent = `Score: ${score}`;
}

function gameOver() {
    gameState = 'gameover';
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'block';
    if (animationId) cancelAnimationFrame(animationId);
}

function update() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};

    // Wall collision
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        gameOver();
        return;
    }

    // Self collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        spawnFood();
    } else {
        snake.pop();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? '#0ff' : '#0a0'; // Head cyan, body green
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(snake[i].x, snake[i].y, gridSize - 2, gridSize - 2);
    }

    // Draw food
    ctx.fillStyle = '#f0f';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f0f';
    ctx.beginPath();
    ctx.arc(food.x + gridSize / 2, food.y + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow for next frame
}

let dropCounter = 0;
let dropInterval = 100; // ms per move

function gameLoop(timestamp) {
    if (gameState !== 'playing') return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        update();
        dropCounter = 0;
    }

    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// Input handling
document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing') return;

    if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && dy === 0) {
        dx = 0;
        dy = -gridSize;
    } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && dy === 0) {
        dx = 0;
        dy = gridSize;
    } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && dx === 0) {
        dx = -gridSize;
        dy = 0;
    } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && dx === 0) {
        dx = gridSize;
        dy = 0;
    }
});

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
});
