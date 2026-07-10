const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

async function run() {
    // Start local server to serve the files
    const server = http.createServer((req, res) => {
        let filePath = '.' + req.url;
        if (filePath == './') {
            filePath = './index.html';
        }

        const extname = String(path.extname(filePath)).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
            '.woff': 'application/font-woff',
            '.ttf': 'application/font-ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.otf': 'application/font-otf',
            '.wasm': 'application/wasm'
        };

        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(filePath, function(error, content) {
            if (error) {
                if(error.code == 'ENOENT') {
                    res.writeHead(404);
                    res.end('File not found\n');
                } else {
                    res.writeHead(500);
                    res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    });

    server.listen(8080);
    console.log("Server listening on http://localhost:8080");

    const browser = await chromium.launch();
    const context = await browser.newContext({
        recordVideo: {
            dir: 'videos/'
        }
    });

    const page = await context.newPage();

    await page.goto('http://localhost:8080');

    // Wait for the UI layer and start button
    await page.waitForSelector('#start-btn');

    // Capture screenshot of start screen
    await page.screenshot({ path: 'start-screen.png' });

    // Start the game
    await page.click('#start-btn');

    // Check if the mute button works
    await page.waitForSelector('#mute-btn');
    await page.click('#mute-btn');
    await page.waitForTimeout(500);
    await page.click('#mute-btn'); // Unmute again

    // Wait for some game time
    await page.waitForTimeout(1000);

    // Take an in-game screenshot
    await page.screenshot({ path: 'in-game.png' });

    // Play until game over (should happen quickly as enemies spawn)
    // Actually let's manually trigger it via console or just wait
    // We can just call gameOver() if it's exposed, but we can't. Just wait.
    await page.waitForSelector('#game-over', { state: 'visible', timeout: 30000 });

    // Take game over screenshot
    await page.screenshot({ path: 'game-over.png' });

    // Click restart
    await page.click('#restart-btn');
    await page.waitForTimeout(500);

    // Final screenshot
    await page.screenshot({ path: 'restarted.png' });

    await context.close();
    await browser.close();

    server.close();
    console.log("Verification script complete.");
}

run().catch(console.error);