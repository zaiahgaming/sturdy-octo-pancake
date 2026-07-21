const { expect } = require('chai');
const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('./index.html', 'utf-8');
const js = fs.readFileSync('./game.js', 'utf-8');

describe('Game UX Improvements', () => {
    let dom;
    let window;
    let document;

    beforeEach(() => {
        dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/' });
        window = dom.window;
        document = window.document;

        // Mock AudioContext
        window.AudioContext = class {
            createGain() {
                return {
                    gain: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
                    connect: () => {}
                };
            }
            createOscillator() {
                return {
                    frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
                    connect: () => {},
                    start: () => {},
                    stop: () => {}
                };
            }
        };
        window.webkitAudioContext = window.AudioContext;

        // Mock requestAnimationFrame to prevent infinite loop in tests
        window.requestAnimationFrame = (callback) => {
            return setTimeout(callback, 0);
        };
        window.cancelAnimationFrame = (id) => {
            clearTimeout(id);
        };

        // Mock matchMedia
        window.matchMedia = window.matchMedia || function(query) {
            return {
                matches: false,
                media: query,
                onchange: null,
                addListener: function() {},
                removeListener: function() {},
                addEventListener: function() {},
                removeEventListener: function() {},
                dispatchEvent: function() {}
            };
        };

        const scriptEl = document.createElement('script');
        scriptEl.textContent = js;
        document.body.appendChild(scriptEl);
    });

    it('should initialize with score 0', () => {
        const scoreEl = document.getElementById('score');
        expect(scoreEl.textContent).to.equal('Score: 0');
    });

    it('should focus the canvas when the start button is clicked', () => {
        const startBtn = document.getElementById('start-btn');
        const canvas = document.getElementById('gameCanvas');
        startBtn.click();
        expect(document.activeElement).to.equal(canvas);
    });

    it('should focus the canvas when the restart button is clicked', () => {
        const restartBtn = document.getElementById('restart-btn');
        const canvas = document.getElementById('gameCanvas');
        restartBtn.click();
        expect(document.activeElement).to.equal(canvas);
    });

    it('should clear announcer text content after a brief delay', (done) => {
        const announcer = document.getElementById('announcer');
        window.eval('announce("Test message")');
        expect(announcer.textContent).to.equal('Test message');
        setTimeout(() => {
            expect(announcer.textContent).to.equal('');
            done();
        }, 1100);
    });

    it('should toggle fullscreen button text and aria-pressed on fullscreenchange', () => {
        const fullscreenBtn = document.getElementById('fullscreen-btn');

        // Simulate entering fullscreen
        document.fullscreenElement = document.documentElement;
        document.dispatchEvent(new window.Event('fullscreenchange'));
        expect(fullscreenBtn.innerText).to.equal('Exit Fullscreen');
        expect(fullscreenBtn.getAttribute('aria-pressed')).to.equal('true');

        // Simulate exiting fullscreen
        document.fullscreenElement = null;
        document.dispatchEvent(new window.Event('fullscreenchange'));
        expect(fullscreenBtn.innerText).to.equal('Fullscreen');
        expect(fullscreenBtn.getAttribute('aria-pressed')).to.equal('false');
    });

    describe('prefers-reduced-motion', () => {
        let originalMatchMedia;
        beforeEach(() => {
            originalMatchMedia = window.matchMedia;
            window.matchMedia = (query) => ({
                matches: query === '(prefers-reduced-motion: reduce)',
                media: query,
                onchange: null,
                addListener: () => {},
                removeListener: () => {},
                addEventListener: () => {},
                removeEventListener: () => {},
                dispatchEvent: () => {},
            });
            // Re-evaluate init block to pick up matchMedia mock
            window.eval('prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches');
        });

        afterEach(() => {
            window.matchMedia = originalMatchMedia;
        });

        it('should bypass screen shake when true', () => {
             window.eval('triggerShake(10, 100)');
             const active = window.eval('screenShake.active');
             expect(active).to.be.false;
        });
    });
});
