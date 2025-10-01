# Vulnerable HTTP Server - Lab 4

Simple HTTP server demonstrating common security vulnerabilities.

## Installation

```bash
npm install
```

## Running the server

```bash
npm start
```

The server will run on `http://localhost:3000`

## Available Endpoints

- `GET /` - Home page with API information
- `GET /api/user/:id` - Get user by ID
- `GET /api/config` - Get system configuration
- `POST /api/process` - Process user data
- `POST /api/payment` - Process payment

## Testing the endpoints

### Test error handling
```bash
curl http://localhost:3000/api/user/1
```

### Test config endpoint
```bash
curl http://localhost:3000/api/config
```

### Test data processing
```bash
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"name":"John","data":"test"}'
```

### Test payment endpoint
```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"currency":"USD"}'
```
