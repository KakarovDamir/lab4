const http = require('http');
const url = require('url');
const fs = require('fs');

const DB_PASSWORD = 'SuperSecret123!';
const API_KEY = 'sk_live_51234567890abcdefghijklmnop';
const JWT_SECRET = 'my-super-secret-jwt-key-12345';

const dbConfig = {
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: DB_PASSWORD,
    database: 'production_db'
};

const PORT = 3000;

function connectToDatabase() {
    console.log(`Connecting to database at ${dbConfig.host}:${dbConfig.port}`);
    return {
        query: (sql) => {
            if (sql.includes('undefined_column')) {
                throw new Error(`Column 'undefined_column' does not exist in table 'users'`);
            }
            return { rows: [] };
        }
    };
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            message: 'Welcome to the Vulnerable API',
            endpoints: [
                '/api/user/:id',
                '/api/config',
                '/api/process',
                '/api/payment'
            ]
        }));
    }

    else if (pathname.startsWith('/api/user/') && req.method === 'GET') {
        try {
            const userId = pathname.split('/')[3];
            const db = connectToDatabase();

            const result = db.query(`SELECT undefined_column FROM users WHERE id = ${userId}`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ user: result.rows[0] }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: error.message,
                stack: error.stack,
                dbConfig: dbConfig,
                nodeVersion: process.version,
                platform: process.platform,
                cwd: process.cwd()
            }));
        }
    }

    else if (pathname === '/api/config' && req.method === 'GET') {
        try {
            // Reading config file with secrets
            const configPath = './config.json';
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                message: 'System configuration',
                config: config,
                environment: process.env
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Failed to read config file',
                message: error.message,
                path: error.path,
                code: error.code,
                stack: error.stack
            }));
        }
    }

    else if (pathname === '/api/process' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);

                // Process data without validation
                const result = processUserData(data);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'JSON parsing failed',
                    message: error.message,
                    stack: error.stack,
                    receivedData: body,
                    apiKey: API_KEY
                }));
            }
        });
    }

    else if (pathname === '/api/payment' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const paymentData = JSON.parse(body);

                console.log(`Processing payment with API key: ${API_KEY}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Payment processed',
                    apiKey: API_KEY,
                    jwtSecret: JWT_SECRET
                }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: error.message,
                    stack: error.stack
                }));
            }
        });
    }

    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Route not found',
            requestedPath: pathname,
            serverPath: __dirname,
            serverFile: __filename
        }));
    }
});

function processUserData(data) {
    return {
        processed: true,
        data: data,
        dbPassword: DB_PASSWORD
    };
}

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database password: ${DB_PASSWORD}`);
    console.log(`API Key: ${API_KEY}`);
});
