const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});


let animationId;
let gameActive = false;
let score = 0;

let prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    prefersReducedMotion = e.matches;
});


function announce(message) {
    const announcer = document.getElementById('announcer');
    if (!announcer) return;
    announcer.textContent = message;
    setTimeout(() => {
        if (announcer.textContent === message) {
            announcer.textContent = '';
        }
    }, 1000);
}

// Virtual Joystick state
const joystickLeft = { active: false, id: null, originX: 0, originY: 0, x: 0, y: 0 };
const joystickRight = { active: false, id: null, originX: 0, originY: 0, x: 0, y: 0 };

// Input state
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ' ': false
};

const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    isDown: false
};

class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playOscillator(type, freq, time, endFreq, vol = 1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (endFreq) {
            osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + time);
        }

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + time);

        osc.start();
        osc.stop(this.ctx.currentTime + time);
    }

    shoot() {
        this.resume();
        this.playOscillator('square', 800, 0.1, 300, 0.5);
    }

    explosion() {
        this.resume();
        this.playOscillator('sawtooth', 100, 0.3, 20, 0.8);
    }

    powerup() {
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.1);
        osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    dash() {
        this.resume();
        this.playOscillator('triangle', 600, 0.2, 100, 0.6);
    }

    damage() {
        this.resume();
        this.playOscillator('sawtooth', 200, 0.2, 50, 1.0);
    }
}

const sounds = new SoundManager();

// Game entities arrays
let player;
let projectiles = [];
let enemies = [];
let particles = [];
let enemyProjectiles = [];
let powerups = [];

const powerupTypes = [
    { type: 'spread', color: '#ff0', text: 'Spread Shot' },
    { type: 'rapid', color: '#0f0', text: 'Rapid Fire' },
    { type: 'shield', color: '#00f', text: 'Shield' }
];

let activePowerups = {
    spread: 0,
    rapid: 0,
    shield: false
};

class Powerup {
    constructor(x, y, typeInfo) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.type = typeInfo.type;
        this.color = typeInfo.color;
        this.text = typeInfo.text;
        this.pulse = 0;
    }

    draw() {
        this.pulse += 0.1;
        const currentRadius = prefersReducedMotion ? this.radius : this.radius + Math.sin(this.pulse) * 2;

        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y - 15);
    }

    update() {
        this.draw();
    }
}

function updatePowerupUI() {
    const container = document.getElementById('active-powerups');
    container.innerHTML = '';

    if (activePowerups.spread > 0) {
        const el = document.createElement('div');
        el.className = 'powerup-indicator';
        el.style.color = '#ff0';
        el.innerText = `Spread: ${Math.ceil(activePowerups.spread / 60)}s`;
        container.appendChild(el);
    }
    if (activePowerups.rapid > 0) {
        const el = document.createElement('div');
        el.className = 'powerup-indicator';
        el.style.color = '#0f0';
        el.innerText = `Rapid: ${Math.ceil(activePowerups.rapid / 60)}s`;
        container.appendChild(el);
    }
    if (activePowerups.shield) {
        const el = document.createElement('div');
        el.className = 'powerup-indicator';
        el.style.color = '#00f';
        el.innerText = `Shield Active`;
        container.appendChild(el);
    }
}

// Screen shake state
let screenShake = {
    active: false,
    intensity: 0,
    duration: 0,
    startTime: 0
};

function triggerShake(intensity, duration) {
    if (prefersReducedMotion) return;
    screenShake.active = true;
    screenShake.intensity = intensity;
    screenShake.duration = duration;
    screenShake.startTime = Date.now();
}

function applyScreenShake() {
    if (!screenShake.active) return;

    const elapsed = Date.now() - screenShake.startTime;
    if (elapsed > screenShake.duration) {
        screenShake.active = false;
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        return;
    }

    const dampening = 1 - (elapsed / screenShake.duration);
    const currentIntensity = screenShake.intensity * dampening;

    const dx = (Math.random() - 0.5) * 2 * currentIntensity;
    const dy = (Math.random() - 0.5) * 2 * currentIntensity;

    ctx.setTransform(1, 0, 0, 1, dx, dy);
}

// Background Grid
let gridOffset = 0;
function drawBackground() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    const gridSize = 50;
    if (!prefersReducedMotion) {
        gridOffset = (gridOffset + 0.5) % gridSize;
    }

    ctx.beginPath();
    for(let x = 0; x < canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for(let y = gridOffset; y < canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
}

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

    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before clearing

    // Replace old trail effect with dynamic grid background
    drawBackground();

    // Apply optional trailing effect over grid
    ctx.fillStyle = 'rgba(10, 10, 26, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    applyScreenShake();

    updatePowerupTimers();

    player.update();
    handleShooting();

    // Update powerups
    powerups.forEach((powerup, index) => {
        powerup.update();
        const dx = player.x - powerup.x;
        const dy = player.y - powerup.y;
        const distSq = dx * dx + dy * dy;
        const radii = powerup.radius + player.radius;
        if (distSq < radii * radii) {
            sounds.powerup();
            if (powerup.type === 'spread') {
                activePowerups.spread = 600; // 10 seconds
                announce('Spread Shot Acquired');
            }
            if (powerup.type === 'rapid') {
                activePowerups.rapid = 600;
                announce('Rapid Fire Acquired');
            }
            if (powerup.type === 'shield') {
                activePowerups.shield = true;
                announce('Shield Acquired');
            }
            powerups.splice(index, 1);
            updatePowerupUI();
        }
    });

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
        const dx = player.x - projectile.x;
        const dy = player.y - projectile.y;
        const distSq = dx * dx + dy * dy;
        const radii = projectile.radius + player.radius;
        if (distSq < radii * radii) {
            if (player.invulnerable) return;
            if (activePowerups.shield) {
                activePowerups.shield = false;
                announce('Shield Depleted');
                player.invulnerable = true;
                setTimeout(() => player.invulnerable = false, 1000);
                enemyProjectiles.splice(index, 1);
                updatePowerupUI();
                sounds.damage();
                return;
            }
            sounds.damage();
            triggerShake(15, 300);
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

    drawJoysticks();

    // Update enemies
    enemies.forEach((enemy, enemyIndex) => {
        enemy.update();

        // Collision with player
        const dxPlayer = player.x - enemy.x;
        const dyPlayer = player.y - enemy.y;
        const distSqToPlayer = dxPlayer * dxPlayer + dyPlayer * dyPlayer;

        // Adjust hitbox based on enemy type
        let hitBoxRadius = enemy.radius;
        if (enemy.type === 'shooter') hitBoxRadius *= 1.2; // Approximate square hitbox

        const triggerBomberExplosion = (ex, ey) => {
            createExplosion(ex, ey, 50, '#f50');
            sounds.explosion();
            triggerShake(10, 200);

            // Check if player is caught in bomber blast
            const bdx = player.x - ex;
            const bdy = player.y - ey;
            const blastDistSq = bdx * bdx + bdy * bdy;
            if (blastDistSq < 3600) { // 60 * 60
                if (player.invulnerable) return;
                if (activePowerups.shield) {
                    activePowerups.shield = false;
                    announce('Shield Depleted');
                    player.invulnerable = true;
                    setTimeout(() => player.invulnerable = false, 1000);
                    updatePowerupUI();
                    sounds.damage();
                    return;
                }
                sounds.damage();
                triggerShake(20, 400);
                gameOver();
            }
        };

        const radiiSumPlayer = hitBoxRadius + player.radius;
        if (distSqToPlayer < radiiSumPlayer * radiiSumPlayer) {
            if (enemy.type === 'bomber') {
                triggerBomberExplosion(enemy.x, enemy.y);
                enemies.splice(enemyIndex, 1);
                return;
            }

            if (player.invulnerable) return;
            if (activePowerups.shield) {
                activePowerups.shield = false;
                announce('Shield Depleted');
                player.invulnerable = true;
                setTimeout(() => player.invulnerable = false, 1000);
                enemies.splice(enemyIndex, 1);
                updatePowerupUI();
                sounds.damage();
                return;
            }
            sounds.damage();
            triggerShake(15, 300);
            gameOver();
        }

        // Collision with projectiles
        projectiles.forEach((projectile, projectileIndex) => {
            const dxProj = projectile.x - enemy.x;
            const dyProj = projectile.y - enemy.y;
            const distSqToProj = dxProj * dxProj + dyProj * dyProj;
            const radiiSumProj = hitBoxRadius + projectile.radius;

            if (distSqToProj < radiiSumProj * radiiSumProj) {
                // Create explosions
                createExplosion(projectile.x, projectile.y, enemy.radius, enemy.color);
                sounds.explosion();
                triggerShake(3, 100);

                if (enemy.type === 'bomber') {
                    triggerBomberExplosion(enemy.x, enemy.y);
                }

                // Drop powerup
                if (Math.random() < 0.1 && enemy.type !== 'bomber') {
                    const pType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
                    powerups.push(new Powerup(enemy.x, enemy.y, pType));
                }

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
        document.getElementById('restart-btn').focus();
    }, 500);
}



// Event Listeners

const fullscreenBtn = document.getElementById('fullscreen-btn');
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        fullscreenBtn.innerText = 'Exit Fullscreen';
        fullscreenBtn.setAttribute('aria-pressed', 'true');
    } else {
        fullscreenBtn.innerText = 'Fullscreen';
        fullscreenBtn.setAttribute('aria-pressed', 'false');
    }
});

window.addEventListener('keydown', (e) => {
    if (Object.prototype.hasOwnProperty.call(keys, e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (Object.prototype.hasOwnProperty.call(keys, e.key.toLowerCase())) {
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

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.clientX < window.innerWidth / 2) {
            // Left half of screen
            joystickLeft.active = true;
            joystickLeft.id = touch.identifier;
            joystickLeft.originX = touch.clientX;
            joystickLeft.originY = touch.clientY;
            joystickLeft.x = touch.clientX;
            joystickLeft.y = touch.clientY;
        } else {
            // Right half of screen
            joystickRight.active = true;
            joystickRight.id = touch.identifier;
            joystickRight.originX = touch.clientX;
            joystickRight.originY = touch.clientY;
            joystickRight.x = touch.clientX;
            joystickRight.y = touch.clientY;
        }
    }
}, {passive: false});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (joystickLeft.active && touch.identifier === joystickLeft.id) {
            joystickLeft.x = touch.clientX;
            joystickLeft.y = touch.clientY;
        }
        if (joystickRight.active && touch.identifier === joystickRight.id) {
            joystickRight.x = touch.clientX;
            joystickRight.y = touch.clientY;
        }
    }
}, {passive: false});

function handleTouchEnd(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (joystickLeft.active && touch.identifier === joystickLeft.id) {
            joystickLeft.active = false;
            joystickLeft.id = null;
        }
        if (joystickRight.active && touch.identifier === joystickRight.id) {
            joystickRight.active = false;
            joystickRight.id = null;
        }
    }
}

canvas.addEventListener('touchend', handleTouchEnd, {passive: false});
canvas.addEventListener('touchcancel', handleTouchEnd, {passive: false});


document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    gameActive = true;
    init();
    animate();
    canvas.focus();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    gameActive = true;
    init();
    animate();
    canvas.focus();
});

// Decrease powerup timers
function updatePowerupTimers() {
    let uiNeedsUpdate = false;
    if (activePowerups.spread > 0) {
        activePowerups.spread--;
        if (activePowerups.spread % 60 === 0) uiNeedsUpdate = true;
    }
    if (activePowerups.rapid > 0) {
        activePowerups.rapid--;
        if (activePowerups.rapid % 60 === 0) uiNeedsUpdate = true;
    }
    if (uiNeedsUpdate) updatePowerupUI();
}

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
        this.dashCooldown = 0;
        this.dashDuration = 0;
        this.invulnerable = false;
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
        let angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);

        if (joystickRight.active) {
            const dx = joystickRight.x - joystickRight.originX;
            const dy = joystickRight.y - joystickRight.originY;
            if (dx * dx + dy * dy > 100) {
                 angle = Math.atan2(dy, dx);
            }
        }

        const endX = this.x + Math.cos(angle) * (this.radius + 10);
        const endY = this.y + Math.sin(angle) * (this.radius + 10);
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();

        // Draw shield if active
        if (activePowerups.shield) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 15, 0, Math.PI * 2);
            ctx.strokeStyle = '#00f';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        }
    }

    update() {
        // Dash logic
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.dashDuration > 0) {
            this.dashDuration--;
            this.invulnerable = true;
            // Spawn dash particles
            particles.push(new Particle(this.x, this.y, 5, '#0ff', { x: 0, y: 0 }));
            if (this.dashDuration === 0) {
                this.invulnerable = false;
                this.maxSpeed = 5;
            }
        } else if (keys[' '] && this.dashCooldown === 0) {
            sounds.dash();
            this.dashDuration = 15;
            this.dashCooldown = 120; // 2 seconds at 60fps
            this.maxSpeed = 15;

            // Apply immediate burst of speed in current movement direction
            const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            if (speed > 0) {
                this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
                this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
            }
        }

        // Joystick movement logic
        if (joystickLeft.active) {
            const dx = joystickLeft.x - joystickLeft.originX;
            const dy = joystickLeft.y - joystickLeft.originY;
            const maxRadius = 50;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // normalized vector
            let nx = dx / dist;
            let ny = dy / dist;
            if (dist === 0) { nx = 0; ny = 0; }

            const strength = Math.min(dist / maxRadius, 1);

            this.velocity.x += nx * this.speed * strength * 2; // multiply by 2 for snappier mobile feel
            this.velocity.y += ny * this.speed * strength * 2;
        }

        // Movement logic
        if (keys.w) this.velocity.y -= this.speed;
        if (keys.s) this.velocity.y += this.speed;
        if (keys.a) this.velocity.x -= this.speed;
        if (keys.d) this.velocity.x += this.speed;

        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        // Limit speed
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
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
    let shouldShoot = false;
    let angle = 0;

    if (mouse.isDown) {
        shouldShoot = true;
        angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    } else if (joystickRight.active) {
        const dx = joystickRight.x - joystickRight.originX;
        const dy = joystickRight.y - joystickRight.originY;
        const distSq = dx * dx + dy * dy;

        // Only shoot if pulled far enough
        if (distSq > 100) {
            shouldShoot = true;
            angle = Math.atan2(dy, dx);
        }
    }

    if (shouldShoot) {
        const currentTime = Date.now();
        const currentFireRate = activePowerups.rapid > 0 ? fireRate / 2 : fireRate;
        if (currentTime - lastShotTime > currentFireRate) {
            const speed = 10;
            sounds.shoot();

            const createProj = (ang) => {
                return new Projectile(
                    player.x,
                    player.y,
                    5,
                    '#0ff',
                    {
                        x: Math.cos(ang) * speed,
                        y: Math.sin(ang) * speed
                    }
                );
            };

            if (activePowerups.spread > 0) {
                projectiles.push(createProj(angle));
                projectiles.push(createProj(angle - 0.2));
                projectiles.push(createProj(angle + 0.2));
            } else {
                projectiles.push(createProj(angle));
            }

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
        } else if (this.type === 'bomber') {
            // Draw triangle for bomber
            ctx.moveTo(this.x, this.y - this.radius);
            ctx.lineTo(this.x + this.radius, this.y + this.radius);
            ctx.lineTo(this.x - this.radius, this.y + this.radius);
            ctx.closePath();

            // Flash color
            if (Date.now() % 200 < 100) {
                ctx.fillStyle = '#fff';
            } else {
                ctx.fillStyle = this.color;
            }
        } else {
            // Draw circle for chaser
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        }

        if (this.type !== 'bomber' || Date.now() % 200 >= 100) {
            ctx.fillStyle = this.color;
        }
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;
    }

    update() {
        this.draw();

        // Calculate direction to player
        const dirX = player.x - this.x;
        const dirY = player.y - this.y;
        let dist = Math.sqrt(dirX * dirX + dirY * dirY);
        if (dist === 0) dist = 1; // Prevent division by zero
        const nx = dirX / dist;
        const ny = dirY / dist;

        if (this.type === 'chaser' || this.type === 'bomber') {
            // Move towards player
            this.x += nx * this.speed;
            this.y += ny * this.speed;
        } else if (this.type === 'shooter') {
            // Keep some distance from player
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distSq = dx * dx + dy * dy;
            if (distSq > 40000) { // 200 * 200
                this.x += nx * this.speed;
                this.y += ny * this.speed;
            } else if (distSq < 22500) { // 150 * 150
                this.x -= nx * this.speed;
                this.y -= ny * this.speed;
            }

            // Shoot at player
            const currentTime = Date.now();
            if (currentTime - this.lastShotTime > 1500) {
                const speed = 4;
                const velocity = {
                    x: nx * speed,
                    y: ny * speed
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


function drawJoysticks() {
    ctx.lineWidth = 2;

    if (joystickLeft.active) {
        // Base
        ctx.beginPath();
        ctx.arc(joystickLeft.originX, joystickLeft.originY, 50, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.stroke();

        // Stick
        ctx.beginPath();

        const dx = joystickLeft.x - joystickLeft.originX;
        const dy = joystickLeft.y - joystickLeft.originY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = 50;

        let drawX = joystickLeft.x;
        let drawY = joystickLeft.y;

        if (dist > maxRadius) {
            drawX = joystickLeft.originX + (dx/dist) * maxRadius;
            drawY = joystickLeft.originY + (dy/dist) * maxRadius;
        }

        ctx.arc(drawX, drawY, 25, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    }

    if (joystickRight.active) {
        // Base
        ctx.beginPath();
        ctx.arc(joystickRight.originX, joystickRight.originY, 50, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.stroke();

        // Stick
        ctx.beginPath();

        const dx = joystickRight.x - joystickRight.originX;
        const dy = joystickRight.y - joystickRight.originY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = 50;

        let drawX = joystickRight.x;
        let drawY = joystickRight.y;

        if (dist > maxRadius) {
            drawX = joystickRight.originX + (dx/dist) * maxRadius;
            drawY = joystickRight.originY + (dy/dist) * maxRadius;
        }

        ctx.arc(drawX, drawY, 25, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.fill();
    }
}

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

        let type = 'chaser';
        let color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        let speed = (Math.random() * 1.5 + 0.5) * (1 + score / 5000);

        if (score > 500 && Math.random() < 0.3) {
            type = 'shooter';
            color = '#f0f';
        } else if (score > 1000 && Math.random() < 0.2) {
            type = 'bomber';
            color = '#f50';
            speed *= 1.5; // Bombers are fast
        }

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
