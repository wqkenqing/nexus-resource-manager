
const http = require('http');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PORT = 3001;

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-project-id, x-folder-name');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // --- UPLOAD FILE ---
    if (req.url === '/api/upload' && req.method === 'POST') {
        const projectId = decodeURIComponent(req.headers['x-project-id'] || 'default');
        const folderName = decodeURIComponent(req.headers['x-folder-name'] || 'general');

        let body = [];
        req.on('data', (chunk) => body.push(chunk));
        req.on('end', () => {
            const buffer = Buffer.concat(body);
            const contentType = req.headers['content-type'];
            if (!contentType || !contentType.includes('boundary=')) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Missing boundary' }));
                return;
            }

            const boundary = contentType.split('; ')[1].split('=')[1];
            const contentString = buffer.toString('binary');
            const parts = contentString.split('--' + boundary);

            for (let part of parts) {
                if (part.includes('filename=')) {
                    const filenameMatch = part.match(/filename="(.+?)"/);
                    if (filenameMatch) {
                        const filename = filenameMatch[1];
                        const headerEndIndex = part.indexOf('\r\n\r\n') + 4;
                        const fileDataString = part.substring(headerEndIndex, part.lastIndexOf('\r\n'));
                        const fileBuffer = Buffer.from(fileDataString, 'binary');

                        const projectPath = path.join(UPLOADS_DIR, projectId);
                        const folderPath = path.join(projectPath, folderName);

                        if (!fs.existsSync(projectPath)) fs.mkdirSync(projectPath);
                        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

                        fs.writeFileSync(path.join(folderPath, filename), fileBuffer);

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, filename }));
                        return;
                    }
                }
            }
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'No file found' }));
        });
    }
    // --- DOWNLOAD / DELETE FILE ---
    else if (req.url.startsWith('/api/files/') && (req.method === 'GET' || req.method === 'DELETE')) {
        const pathParts = req.url.split('/api/files/')[1].split('/').map(decodeURIComponent);
        const filePath = path.join(UPLOADS_DIR, ...pathParts);
        const filename = pathParts[pathParts.length - 1];

        if (!fs.existsSync(filePath)) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        if (req.method === 'GET') {
            const stat = fs.statSync(filePath);
            res.writeHead(200, {
                'Content-Type': 'application/octet-stream',
                'Content-Length': stat.size,
                'Content-Disposition': `attachment; filename="${filename}"`
            });
            fs.createReadStream(filePath).pipe(res);
        } else {
            // DELETE FILE
            fs.unlinkSync(filePath);
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
        }
    }
    // --- DELETE FOLDER ---
    else if (req.url.startsWith('/api/folders/') && req.method === 'DELETE') {
        const pathParts = req.url.split('/api/folders/')[1].split('/').map(decodeURIComponent);
        const folderPath = path.join(UPLOADS_DIR, ...pathParts);

        if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true });
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(404);
            res.end('Folder not found');
        }
    }
    // --- DELETE PROJECT ---
    else if (req.url.startsWith('/api/projects/') && req.method === 'DELETE') {
        const projectId = decodeURIComponent(req.url.split('/api/projects/')[1]);
        const projectPath = path.join(UPLOADS_DIR, projectId);

        if (fs.existsSync(projectPath)) {
            fs.rmSync(projectPath, { recursive: true, force: true });
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(404);
            res.end('Project not found');
        }
    }
    // --- RENAME FILE ---
    else if (req.url === '/api/rename' && req.method === 'POST') {
        let body = [];
        req.on('data', (chunk) => body.push(chunk));
        req.on('end', () => {
            try {
                const data = JSON.parse(Buffer.concat(body).toString());
                const { projectId, folderName, oldFileName, newFileName } = data;

                if (!projectId || !folderName || !oldFileName || !newFileName) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Missing parameters' }));
                    return;
                }

                const oldPath = path.join(UPLOADS_DIR, projectId, folderName, oldFileName);
                const newPath = path.join(UPLOADS_DIR, projectId, folderName, newFileName);

                if (!fs.existsSync(oldPath)) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Source file not found' }));
                    return;
                }

                fs.renameSync(oldPath, newPath);
                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    }
    else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Hierarchical Storage Server with Delete Support running at http://localhost:${PORT}`);
});
