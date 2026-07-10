const { expect } = require('chai');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

describe('Game Unit Tests', () => {
    let dom;
    let window;
    let document;

    beforeEach(() => {
        dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously" });
        window = dom.window;
        document = window.document;

        // Mock window properties
        window.requestAnimationFrame = (callback) => {
            // Prevent recursive animation loop in tests
            return 0;
        };
        window.cancelAnimationFrame = (id) => {
        };

        // Mock setTimeout and setInterval if they are causing issues
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = (cb, time) => {
            if (time > 0) return originalSetTimeout(cb, time);
            cb();
            return 0;
        }

        window.setInterval = (cb, time) => {
            // Do not actually start intervals during tests to prevent hangs
            return 1;
        }

        // Ensure localStorage is mocked if not present in JSDOM
        if (!window.localStorage) {
             let store = {};
             window.localStorage = {
                getItem: (key) => store[key] || null,
                setItem: (key, value) => { store[key] = value.toString(); },
                clear: () => { store = {}; }
            };
        }

        class MockGainNode {
            constructor() {
                this.gain = {
                    value: 0.3,
                    setValueAtTime: () => {},
                    exponentialRampToValueAtTime: () => {}
                };
            }
            connect() {}
        }

        class MockOscillator {
            constructor() {
                this.frequency = {
                    setValueAtTime: () => {},
                    exponentialRampToValueAtTime: () => {},
                    linearRampToValueAtTime: () => {}
                };
            }
            connect() {}
            start() {}
            stop() {}
        }

        // Mock AudioContext
        class MockAudioContext {
            constructor() {
                this.state = 'running';
                this.currentTime = 0;
                this.destination = {};
            }
            createGain() { return new MockGainNode(); }
            createOscillator() { return new MockOscillator(); }
            resume() { this.state = 'running'; }
        }

        window.AudioContext = MockAudioContext;
        window.webkitAudioContext = MockAudioContext;

        const scriptContent = fs.readFileSync(path.resolve(__dirname, '../game.js'), 'utf8');
        const scriptElement = document.createElement('script');
        scriptElement.textContent = scriptContent;
        document.body.appendChild(scriptElement);

    });

    afterEach(() => {
        window.localStorage.clear();
        if (window.enemySpawnInterval) {
            window.clearInterval(window.enemySpawnInterval);
        }
    });

    it('should toggle mute correctly', () => {
        const muteBtn = document.getElementById('mute-btn');
        // Retrieve the globally scoped sounds object initialized in the script
        const sounds = window.sounds || dom.window.sounds;

        // Workaround since `const sounds = new SoundManager()` does not attach to `window`
        // We will execute a script to test it instead.
        const gainValueBefore = window.eval('sounds.masterGain.gain.value');

        expect(gainValueBefore).to.equal(0.3);

        muteBtn.click();
        const gainValueAfter = window.eval('sounds.masterGain.gain.value');
        expect(gainValueAfter).to.equal(0);
        expect(muteBtn.textContent).to.equal('Unmute');

        muteBtn.click();
        const gainValueFinal = window.eval('sounds.masterGain.gain.value');
        expect(gainValueFinal).to.equal(0.3);
        expect(muteBtn.textContent).to.equal('Mute');
    });

    it('should load high score correctly in init()', () => {
        window.localStorage.setItem('neonSurvivorHighScore', '150');

        // calling init
        window.eval('init()');

        const highScoreDisplay = document.getElementById('high-score');
        expect(highScoreDisplay.textContent).to.equal('High Score: 150');
    });

    it('should save and display high score correctly in gameOver()', (done) => {
        window.localStorage.setItem('neonSurvivorHighScore', '150');

        window.eval(`
            score = 200;
            player = { x: 0, y: 0, radius: 10, color: 'white' };
            gameOver();
        `);

        setTimeout(() => {
            const storedHighScore = window.localStorage.getItem('neonSurvivorHighScore');
            expect(storedHighScore).to.equal('200');

            const gameOverHighScoreDisplay = document.getElementById('game-over-high-score');
            expect(gameOverHighScoreDisplay.textContent).to.equal('200');
            done();
        }, 600); // Wait for the setTimeout in gameOver
    });

    it('should focus start button on load', () => {
        const startBtn = document.getElementById('start-btn');
        document.dispatchEvent(new window.Event('DOMContentLoaded'));
        expect(document.activeElement).to.equal(startBtn);
    });

    it('should focus restart button on gameOver()', (done) => {
        window.eval(`
            player = { x: 0, y: 0, radius: 10, color: 'white' };
            gameOver();
        `);

        setTimeout(() => {
            const restartBtn = document.getElementById('restart-btn');
            expect(document.activeElement).to.equal(restartBtn);
            done();
        }, 600); // Wait for the setTimeout in gameOver
    });

});
