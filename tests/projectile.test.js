const fs = require('fs');
const { expect } = require('chai');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

// Read the game source code
const code = fs.readFileSync('game.js', 'utf8');

describe('Projectile', function() {
    let Projectile;

    before(function() {
        const virtualConsole = new jsdom.VirtualConsole();
        virtualConsole.on("error", function() { console.error("VC Error", arguments); });

        // Setup JSDOM to mock the browser environment
        const dom = new JSDOM(`<!DOCTYPE html><html><body><canvas id="gameCanvas"></canvas><div id="active-powerups"></div><div id="score"></div><div id="game-over"><div id="final-score"></div></div><button id="fullscreen-btn"></button><button id="start-btn"></button><button id="restart-btn"></button><div id="start-screen"></div></body></html>`, {
            runScripts: "dangerously",
            virtualConsole
        });

        const window = dom.window;
        const document = window.document;

        // Mock canvas context
        const canvas = document.getElementById('gameCanvas');
        canvas.getContext = () => ({
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            closePath: () => {},
            fillStyle: '',
            shadowColor: '',
            shadowBlur: 0
        });

        class DummyAudioContext {
            createGain() { return { gain: { value: 0 }, connect: () => {} }; }
            createOscillator() { return { type: '', frequency: { setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
            currentTime = 0;
        }
        window.AudioContext = DummyAudioContext;
        window.webkitAudioContext = DummyAudioContext;
        window.requestAnimationFrame = () => {};

        // Execute the game code in this JSDOM context and expose Projectile
        const scriptEl = document.createElement("script");
        scriptEl.textContent = code + "\n window.Projectile = Projectile;";
        document.body.appendChild(scriptEl);

        Projectile = window.Projectile;
        if (!Projectile) throw new Error("Could not find Projectile class in JSDOM context");
    });

    it('should initialize with correct properties', function() {
        const p = new Projectile(100, 200, 5, "red", { x: 2, y: -3 });

        expect(p.x).to.equal(100);
        expect(p.y).to.equal(200);
        expect(p.radius).to.equal(5);
        expect(p.color).to.equal("red");
        expect(p.velocity.x).to.equal(2);
        expect(p.velocity.y).to.equal(-3);
    });

    it('should update x and y based on positive velocity', function() {
        const p = new Projectile(100, 200, 5, "red", { x: 2, y: 3 });
        p.update();

        expect(p.x).to.equal(102);
        expect(p.y).to.equal(203);
    });

    it('should update x and y based on negative velocity', function() {
        const p = new Projectile(100, 200, 5, "red", { x: -2, y: -3 });
        p.update();

        expect(p.x).to.equal(98);
        expect(p.y).to.equal(197);
    });

    it('should not change x and y if velocity is zero', function() {
        const p = new Projectile(100, 200, 5, "red", { x: 0, y: 0 });
        p.update();

        expect(p.x).to.equal(100);
        expect(p.y).to.equal(200);
    });

    it('should handle floating point velocity', function() {
        const p = new Projectile(10, 10, 5, "blue", { x: 1.5, y: -2.25 });
        p.update();

        expect(p.x).to.equal(11.5);
        expect(p.y).to.equal(7.75);
    });

    it('should handle multiple updates correctly', function() {
        const p = new Projectile(0, 0, 5, "green", { x: 1, y: 1 });
        p.update();
        p.update();
        p.update();

        expect(p.x).to.equal(3);
        expect(p.y).to.equal(3);
    });
});
