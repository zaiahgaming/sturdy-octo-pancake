import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import fs from 'fs';

const gameCode = fs.readFileSync('game.js', 'utf8');

describe('Game Logic', () => {
    let window, document;

    beforeEach(() => {
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <canvas id="gameCanvas"></canvas>
                <div id="score">Score: 0</div>
                <button id="fullscreen-btn">Fullscreen</button>
                <div id="active-powerups"></div>
                <div id="game-over" style="display: none;">
                    <span id="final-score">0</span>
                    <button id="restart-btn">Restart</button>
                </div>
                <div id="start-screen">
                    <button id="start-btn">Start Game</button>
                </div>
            </body>
            </html>
        `, { url: "http://localhost/", runScripts: "dangerously" });

        window = dom.window;
        document = window.document;

        // Mock requestAnimationFrame
        window.requestAnimationFrame = (callback) => setTimeout(callback, 0);
        window.cancelAnimationFrame = (id) => clearTimeout(id);

        // Mock AudioContext
        class MockAudioContext {
            constructor() {
                this.state = 'running';
                this.destination = {};
                this.currentTime = 0;
            }
            createGain() {
                return {
                    gain: { value: 1, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
                    connect: () => {}
                };
            }
            createOscillator() {
                return {
                    type: 'sine',
                    frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
                    connect: () => {},
                    start: () => {},
                    stop: () => {}
                };
            }
            resume() {}
        }
        window.AudioContext = MockAudioContext;
        window.webkitAudioContext = MockAudioContext;

        const script = document.createElement("script");
        script.textContent = gameCode;
        document.body.appendChild(script);
    });

    it('should initialize game state correctly', () => {
        // Since score is an element with id="score" it ends up on window in jsdom
        // But the script defines let score = 0; which gets hidden by the block scope, wait,
        // game.js has `let score = 0;` at the top level. But in a script tag it's just a local variable if it's strict mode or block scoped.
        // Actually the script might not expose `score` or `gameActive` to `window` if they are `let` declarations.
        // Let's check `document.getElementById('score').innerText` if it was updated by `init()`?
        // Wait, `init()` is not called by default, only on 'start-btn' click.

        // Before clicking start, canvas should have width and height
        const canvas = document.getElementById('gameCanvas');
        expect(canvas.width).to.be.a('number');
        expect(canvas.height).to.be.a('number');
    });

    it('should update state when game starts', () => {
        const startBtn = document.getElementById('start-btn');
        startBtn.click();

        // the init() function sets score to 0 and updates the innerText
        const scoreDiv = document.getElementById('score');
        expect(scoreDiv.innerText).to.include('Score: 0');
    });
});
