const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

let animationId;
let gameActive = false;
let score = 0;

// Input state
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    isDown: false
};

// Game entities arrays
let player;
let projectiles = [];
let enemies = [];
let particles = [];
let enemyProjectiles = [];

function init() {
    score = 0;
    document.getElementById('score').innerText = `Score: ${score}`;

    player = new Player(canvas.width / 2, canvas.height / 2);

    projectiles = [];
    enemies = [];
    particles = [];
    enemyProjectiles = [];

    spawnEnemies();
}


function animate() {
    if (!gameActive) return;
    animationId = requestAnimationFrame(animate);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Trailing effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    player.update();
    handleShooting();

    // Update particles
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    // Update enemy projectiles
    enemyProjectiles.forEach((projectile, index) => {
        projectile.update();

        // Remove off-screen projectiles
        if (projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height) {
            enemyProjectiles.splice(index, 1);
            return;
        }

        // Collision with player
        const dist = Math.hypot(player.x - projectile.x, player.y - projectile.y);
        if (dist - projectile.radius - player.radius < 0) {
            gameOver();
        }
    });

    // Update player projectiles
    projectiles.forEach((projectile, index) => {
        projectile.update();

        // Remove off-screen projectiles
        if (projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height) {
            projectiles.splice(index, 1);
        }
    });

    // Update enemies
    enemies.forEach((enemy, enemyIndex) => {
        enemy.update();

        // Collision with player
        const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);

        // Adjust hitbox based on enemy type
        let hitBoxRadius = enemy.radius;
        if (enemy.type === 'shooter') hitBoxRadius *= 1.2; // Approximate square hitbox

        if (distToPlayer - hitBoxRadius - player.radius < 0) {
            gameOver();
        }

        // Collision with projectiles
        projectiles.forEach((projectile, projectileIndex) => {
            const distToProjectile = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

            if (distToProjectile - hitBoxRadius - projectile.radius < 0) {
                // Create explosions
                createExplosion(projectile.x, projectile.y, enemy.radius, enemy.color);

                // Remove enemy and projectile
                setTimeout(() => {
                    enemies.splice(enemyIndex, 1);
                    projectiles.splice(projectileIndex, 1);
                }, 0);

                // Update score
                score += enemy.type === 'shooter' ? 150 : 100;
                document.getElementById('score').innerText = `Score: ${score}`;
            }
        });
    });
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    if (enemySpawnInterval) clearInterval(enemySpawnInterval);

    createExplosion(player.x, player.y, player.radius * 2, player.color);

    // Draw final frame of player explosion
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => p.draw());

    setTimeout(() => {
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('final-score').innerText = score;
    }, 500);
}



// Event Listeners
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = false;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => mouse.isDown = true);
canvas.addEventListener('mouseup', () => mouse.isDown = false);

document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    gameActive = true;
    init();
    animate();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    gameActive = true;
    init();
    animate();
});

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.color = '#fff';
        this.velocity = { x: 0, y: 0 };
        this.speed = 0.5;
        this.friction = 0.92;
        this.maxSpeed = 5;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0; // Reset shadow for other elements

        // Draw aim indicator
        ctx.beginPath();
        const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        const endX = this.x + Math.cos(angle) * (this.radius + 10);
        const endY = this.y + Math.sin(angle) * (this.radius + 10);
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
    }

    update() {
        // Movement logic
        if (keys.w) this.velocity.y -= this.speed;
        if (keys.s) this.velocity.y += this.speed;
        if (keys.a) this.velocity.x -= this.speed;
        if (keys.d) this.velocity.x += this.speed;

        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        // Limit speed
        const speed = Math.hypot(this.velocity.x, this.velocity.y);
        if (speed > this.maxSpeed) {
            const ratio = this.maxSpeed / speed;
            this.velocity.x *= ratio;
            this.velocity.y *= ratio;
        }

        // Apply velocity
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Boundary collision
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.velocity.x *= -0.5;
        }
        if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.velocity.x *= -0.5;
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.velocity.y *= -0.5;
        }
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.velocity.y *= -0.5;
        }

        this.draw();
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;
    }

    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

// Shooting cooldown
let lastShotTime = 0;
const fireRate = 150; // ms

function handleShooting() {
    if (mouse.isDown) {
        const currentTime = Date.now();
        if (currentTime - lastShotTime > fireRate) {
            const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
            const speed = 10;
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };

            projectiles.push(new Projectile(
                player.x,
                player.y,
                5,
                '#0ff',
                velocity
            ));

            lastShotTime = currentTime;
        }
    }
}

class Enemy {
    constructor(x, y, radius, color, speed, type) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.type = type; // 'chaser' or 'shooter'
        this.lastShotTime = Date.now() + Math.random() * 2000;
    }

    draw() {
        ctx.beginPath();
        if (this.type === 'shooter') {
            // Draw square for shooter
            ctx.rect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        } else {
            // Draw circle for chaser
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        }
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;
    }

    update() {
        this.draw();

        // Calculate direction to player
        const angle = Math.atan2(player.y - this.y, player.x - this.x);

        if (this.type === 'chaser') {
            // Move towards player
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        } else if (this.type === 'shooter') {
            // Keep some distance from player
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            if (dist > 200) {
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
            } else if (dist < 150) {
                this.x -= Math.cos(angle) * this.speed;
                this.y -= Math.sin(angle) * this.speed;
            }

            // Shoot at player
            const currentTime = Date.now();
            if (currentTime - this.lastShotTime > 1500) {
                const speed = 4;
                const velocity = {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                };

                enemyProjectiles.push(new Projectile(
                    this.x,
                    this.y,
                    4,
                    '#f00',
                    velocity
                ));

                this.lastShotTime = currentTime;
            }
        }
    }
}

let enemySpawnInterval;

function spawnEnemies() {
    // Clear any existing interval
    if (enemySpawnInterval) clearInterval(enemySpawnInterval);

    enemySpawnInterval = setInterval(() => {
        if (!gameActive) return;

        const radius = Math.random() * (20 - 10) + 10;
        let x, y;

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const type = Math.random() < 0.3 && score > 500 ? 'shooter' : 'chaser';
        const color = type === 'shooter' ? '#f0f' : `hsl(${Math.random() * 360}, 50%, 50%)`;
        const speed = (Math.random() * 1.5 + 0.5) * (1 + score / 5000); // Speed increases with score

        enemies.push(new Enemy(x, y, radius, color, speed, type));
    }, Math.max(500, 1500 - score / 10)); // Spawn rate increases with score
}

class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
        this.friction = 0.98;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.02;
    }
}

function createExplosion(x, y, radius, color) {
    const particleCount = radius * 2;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(
            x,
            y,
            Math.random() * 3,
            color,
            {
                x: (Math.random() - 0.5) * (Math.random() * 8),
                y: (Math.random() - 0.5) * (Math.random() * 8)
            }
        ));
    }
}
