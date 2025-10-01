const http = require('http');
const url = require('url');

// FIXED: Use environment variables instead of hardcoded secrets
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const API_KEY = process.env.API_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || '';

// Check if required environment variables are set
if (!DB_PASSWORD || !API_KEY || !JWT_SECRET) {
    console.error('ERROR: Required environment variables are not set!');
    console.error('Please set DB_PASSWORD, API_KEY, and JWT_SECRET');
    process.exit(1);
}

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'admin',
    password: DB_PASSWORD,
    database: process.env.DB_NAME || 'production_db'
};

const PORT = process.env.PORT || 3000;
const MAX_BODY_SIZE = 1024 * 100; // 100KB limit

// Helper function to log errors securely (server-side only)
function logError(error, context) {
    console.error(`[ERROR] ${context}:`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
}

// Helper function to send generic error to client
function sendGenericError(res, statusCode = 500) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        error: 'An error occurred while processing your request',
        message: 'Please try again later or contact support'
    }));
}

// Helper function to validate input data
function validateUserData(data) {
    if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid data format');
    }

    // Limit object depth and size to prevent DoS
    const jsonString = JSON.stringify(data);
    if (jsonString.length > MAX_BODY_SIZE) {
        throw new Error('Data too large');
    }

    return true;
}

// Database connection simulation
function connectToDatabase() {
    // In production, don't log connection details
    console.log('Connecting to database...');
    return {
        query: (sql) => {
            if (sql.includes('undefined_column')) {
                throw new Error('Database query failed');
            }
            return { rows: [] };
        }
    };
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Route 1: Home page
    if (pathname === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            message: 'Welcome to the Secure API',
            endpoints: [
                '/api/user/:id',
                '/api/process',
                '/api/payment'
            ]
        }));
    }

    // Route 2: FIXED - Secure error handling without information leakage
    else if (pathname.startsWith('/api/user/') && req.method === 'GET') {
        try {
            const userId = pathname.split('/')[3];

            // Validate user ID
            if (!userId || !/^\d+$/.test(userId)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Invalid user ID'
                }));
                return;
            }

            const db = connectToDatabase();
            const result = db.query(`SELECT * FROM users WHERE id = ${userId}`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                user: result.rows[0] || null
            }));
        } catch (error) {
            // FIXED: Log error server-side, send generic message to client
            logError(error, 'GET /api/user');
            sendGenericError(res, 500);
        }
    }

    // Route 3: REMOVED - /api/config endpoint completely removed
    // Configuration should never be exposed via API

    // Route 4: FIXED - Safe deserialization with validation
    else if (pathname === '/api/process' && req.method === 'POST') {
        let body = '';
        let bodySize = 0;

        req.on('data', chunk => {
            bodySize += chunk.length;

            // FIXED: Prevent DoS with size limit
            if (bodySize > MAX_BODY_SIZE) {
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Request entity too large'
                }));
                req.connection.destroy();
                return;
            }

            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);

                // FIXED: Validate input data
                validateUserData(data);

                // Process data safely
                const result = processUserData(data);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                // FIXED: No stack trace, no received data, no secrets
                logError(error, 'POST /api/process');

                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Invalid request data'
                }));
            }
        });
    }

    // Route 5: FIXED - Payment processing without exposing secrets
    else if (pathname === '/api/payment' && req.method === 'POST') {
        let body = '';
        let bodySize = 0;

        req.on('data', chunk => {
            bodySize += chunk.length;

            if (bodySize > MAX_BODY_SIZE) {
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Request entity too large'
                }));
                req.connection.destroy();
                return;
            }

            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const paymentData = JSON.parse(body);

                // Validate payment data
                if (!paymentData.amount || typeof paymentData.amount !== 'number') {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Invalid payment amount'
                    }));
                    return;
                }

                // FIXED: Use API key internally, but don't log or expose it
                // In production: const paymentResult = paymentAPI.charge(API_KEY, paymentData);
                console.log('Processing payment...');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Payment processed successfully'
                    // FIXED: No secrets exposed
                }));
            } catch (error) {
                logError(error, 'POST /api/payment');
                sendGenericError(res, 500);
            }
        });
    }

    // FIXED: Generic 404 handler without internal information
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Route not found'
            // FIXED: No serverPath, serverFile, or other internal info
        }));
    }
});

function processUserData(data) {
    // FIXED: No secrets in response
    return {
        processed: true,
        status: 'success'
    };
}

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // FIXED: Don't log secrets to console
    console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
});
