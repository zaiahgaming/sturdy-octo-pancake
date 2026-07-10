const { test } = require('node:test');
const assert = require('node:assert');
const vm = require('vm');
const fs = require('fs');

// Mock browser environment
const createMockElement = () => ({
    getContext: () => ({
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        closePath: () => {},
        fillText: () => {}
    }),
    addEventListener: () => {},
    style: {},
    appendChild: () => {},
    innerHTML: '',
    innerText: ''
});

const context = {
    window: {
        innerWidth: 800,
        innerHeight: 600,
        addEventListener: () => {},
        AudioContext: class {
            createGain() { return { gain: { value: 0 }, connect: () => {} } }
        }
    },
    document: {
        getElementById: () => createMockElement(),
        createElement: () => createMockElement()
    },
    Math: Math,
    console: console,
};

vm.createContext(context);
let code = fs.readFileSync('./game.js', 'utf8');
code += '\nwindow.Powerup = Powerup; window.ctx = ctx;';
vm.runInContext(code, context);

const Powerup = context.window.Powerup;

test('Powerup initialization', (t) => {
    const typeInfo = { type: 'shield', color: '#00f', text: 'Shield' };
    const p = new Powerup(100, 200, typeInfo);

    assert.strictEqual(p.x, 100);
    assert.strictEqual(p.y, 200);
    assert.strictEqual(p.radius, 10);
    assert.strictEqual(p.type, 'shield');
    assert.strictEqual(p.color, '#00f');
    assert.strictEqual(p.text, 'Shield');
    assert.strictEqual(p.pulse, 0);
});

test('Powerup draw() increments pulse', (t) => {
    const typeInfo = { type: 'rapid', color: '#0f0', text: 'Rapid' };
    const p = new Powerup(0, 0, typeInfo);

    const initialPulse = p.pulse;
    p.draw();

    assert.ok(p.pulse > initialPulse);
    // 0.1 is added due to the pulse increment
    assert.strictEqual(p.pulse.toFixed(1), (initialPulse + 0.1).toFixed(1));
});

test('Powerup update() calls draw and increments pulse', (t) => {
    const typeInfo = { type: 'spread', color: '#ff0', text: 'Spread' };
    const p = new Powerup(0, 0, typeInfo);

    const initialPulse = p.pulse;
    p.update();

    assert.ok(p.pulse > initialPulse);
    assert.strictEqual(p.pulse.toFixed(1), (initialPulse + 0.1).toFixed(1));
});
