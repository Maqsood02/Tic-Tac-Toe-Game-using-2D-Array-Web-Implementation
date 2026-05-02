const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const PORT = 3000;

const server = http.createServer((req, res) => {
    const url = req.url;

    // CORS headers just in case
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Static files routing
    if (req.method === 'GET') {
        let filePath = path.join(__dirname, url === '/' ? 'index.html' : url);
        
        // Ensure that file paths don't escape out of directory (basic safety check)
        if (!filePath.startsWith(__dirname)) {
            res.writeHead(403);
            res.end('Access denied');
            return;
        }

        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 Not Found');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Server Error');
                }
            } else {
                let contentType = 'text/html';
                if (filePath.endsWith('.css')) contentType = 'text/css';
                if (filePath.endsWith('.js')) contentType = 'application/javascript';
                if (filePath.endsWith('.json')) contentType = 'application/json';

                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    } else if (req.method === 'POST' && url === '/api/move') {
        // Read JSON payload
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { board, symbol, move } = data;

                if (typeof board !== 'string' || typeof symbol !== 'string' || typeof move !== 'number') {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid payload parameters.' }));
                    return;
                }

                // Call C executable with parameters
                const exePath = path.join(__dirname, 'tictactoe.exe');
                execFile(exePath, [board, symbol, String(move)], (error, stdout, stderr) => {
                    if (error) {
                        console.error('C executable error:', error);
                        console.error('Stderr:', stderr);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal executable error.' }));
                        return;
                    }

                    try {
                        const parsedStdout = JSON.parse(stdout.trim());
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(parsedStdout));
                    } catch (parseError) {
                        console.error('Failed to parse stdout:', stdout);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to parse game output.' }));
                    }
                });

            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON format.' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
