const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = {
    innerWidth: 800,
    innerHeight: 600,
    addEventListener: jest.fn(),
    AudioContext: class {
        createGain() { return { gain: { value: 0 }, connect: jest.fn() }; }
    },
    webkitAudioContext: class {
        createGain() { return { gain: { value: 0 }, connect: jest.fn() }; }
    }
};

const mockElements = {
    'gameCanvas': {
        getContext: () => ({
            beginPath: jest.fn(),
            arc: jest.fn(),
            fillStyle: '',
            shadowColor: '',
            shadowBlur: 0,
            fill: jest.fn(),
            closePath: jest.fn()
        }),
        width: 800,
        height: 600,
        addEventListener: jest.fn()
    },
    'active-powerups': { innerHTML: '' },
    'score': { innerText: '' },
    'game-over': { style: { display: 'none' } },
    'final-score': { innerText: '' },
    'fullscreen-btn': { addEventListener: jest.fn() },
    'start-btn': { addEventListener: jest.fn() },
    'start-screen': { style: { display: 'block' } },
    'restart-btn': { addEventListener: jest.fn() }
};

global.document = {
    getElementById: jest.fn((id) => mockElements[id] || { addEventListener: jest.fn(), style: {} }),
    addEventListener: jest.fn(),
    createElement: jest.fn(() => ({ style: {} })),
    body: { appendChild: jest.fn(), removeChild: jest.fn() }
};

global.requestAnimationFrame = jest.fn();
const originalMathRandom = global.Math.random;

// Load game code
const gameCodePath = path.resolve(__dirname, 'game.js');
const gameCode = fs.readFileSync(gameCodePath, 'utf8');

const script = `
${gameCode}
global.Player = Player;
global.ctx = ctx; // Expose ctx for mock verification
`;

eval(script);

describe('Player', () => {
    beforeEach(() => {
        global.Math.random = () => 0.5; // Mock random if needed
    });

    afterEach(() => {
        global.Math.random = originalMathRandom;
    });

    test('should initialize with correct default values', () => {
        const player = new global.Player(100, 200);

        // Position
        expect(player.x).toBe(100);
        expect(player.y).toBe(200);

        // Visuals
        expect(player.radius).toBe(15);
        expect(player.color).toBe('#fff');

        // Movement
        expect(player.velocity).toEqual({ x: 0, y: 0 });
        expect(player.speed).toBe(0.5);
        expect(player.friction).toBe(0.92);
        expect(player.maxSpeed).toBe(5);

        // Abilities/Status
        expect(player.dashCooldown).toBe(0);
        expect(player.dashDuration).toBe(0);
        expect(player.invulnerable).toBe(false);
    });
});
