import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('./index.html', 'utf-8');
const js = fs.readFileSync('./game.js', 'utf-8');

describe('Game UX Improvements', () => {
    let dom;
    let window;
    let document;

    beforeEach(() => {
        dom = new JSDOM(html, { runScripts: 'dangerously' });
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
});
