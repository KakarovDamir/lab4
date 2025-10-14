# Vulnerable HTTP Server - Lab 4

Simple HTTP server demonstrating common security vulnerabilities and their fixes.

## Security Vulnerabilities Demonstrated

This project was created to demonstrate the following security issues:

### 1. **Hardcoded Secrets** ❌
- API keys, passwords, and JWT secrets hardcoded in source code
- Located in: `server.js` (lines 5-7) and `config.json`

### 2. **Information Exposure via Error Messages** ❌
- Stack traces exposed to users
- Database configuration leaked in error responses
- File system paths and Node.js version exposed
- Located in: `server.js` error handlers

### 3. **Configuration File with Secrets in Repository** ❌
- `config.json` committed to GitHub with real credentials
- No `.gitignore` protection for sensitive files

### 4. **Unsafe Deserialization** ❌
- No input validation on JSON data
- No size limits (vulnerable to DoS attacks)
- Located in: `/api/process` and `/api/payment` endpoints

## Installation (Vulnerable Version on `main` branch)

```bash
npm install
npm start
```

## Installation (Secure Version on `security-fixes` branch)

```bash
# Switch to security-fixes branch
git checkout security-fixes

# Copy environment variables template
cp .env.example .env

# Edit .env file with your actual secrets
nano .env

# Start the server
npm start
```

## Security Fixes Applied

### ✅ Fix #1: Remove Hardcoded Secrets
**Before:**
```javascript
const DB_PASSWORD = 'SuperSecret123!';
const API_KEY = 'sk_live_51234567890abcdefghijklmnop';
```

**After:**
```javascript
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const API_KEY = process.env.API_KEY || '';
```

**Impact:** Secrets are now stored in environment variables, not in source code.

---

### ✅ Fix #2: Secure Error Handling
**Before:**
```javascript
catch (error) {
    res.end(JSON.stringify({
        error: error.message,
        stack: error.stack,
        dbConfig: dbConfig,
        nodeVersion: process.version
    }));
}
```

**After:**
```javascript
catch (error) {
    logError(error, 'GET /api/user'); // Log server-side only
    sendGenericError(res, 500); // Generic message to client
}
```

**Impact:**
- Stack traces logged server-side only
- Users receive generic error messages
- No internal information leaked

---

### ✅ Fix #3: Protect Configuration Files
**Changes:**
- Added `.env` and `config.json` to `.gitignore`
- Created `.env.example` and `config.json.example` as templates
- Original `config.json` will be removed from repository

**Impact:** Secrets are never committed to version control.

---

### ✅ Fix #4: Safe Deserialization with Validation
**Before:**
```javascript
const data = JSON.parse(body); // No validation
const result = processUserData(data);
```

**After:**
```javascript
// Size limit check
if (bodySize > MAX_BODY_SIZE) {
    res.writeHead(413, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Request entity too large' }));
    return;
}

const data = JSON.parse(body);
validateUserData(data); // Validation before processing
```

**Impact:**
- Protection against DoS attacks via large payloads
- Input validation prevents malicious data processing
- 100KB size limit enforced

---

### ✅ Fix #5: Remove Dangerous Endpoints
**Removed:** `/api/config` endpoint that exposed all configuration

**Impact:** Configuration is never accessible via API.

---

## Available Endpoints

### Vulnerable Version (`main` branch):
- `GET /` - Home page with API information
- `GET /api/user/:id` - Get user by ID (exposes stack traces)
- `GET /api/config` - Get system configuration (exposes secrets!)
- `POST /api/process` - Process user data (no validation)
- `POST /api/payment` - Process payment (exposes API keys!)

### Secure Version (`security-fixes` branch):
- `GET /` - Home page with API information
- `GET /api/user/:id` - Get user by ID (secure error handling)
- `POST /api/process` - Process user data (with validation)
- `POST /api/payment` - Process payment (secure, no exposure)

## Testing the Vulnerable Endpoints (main branch)

### Test error exposure:
```bash
curl http://localhost:3000/api/user/1
```
**Result:** Full stack trace, database config, file paths exposed

### Test config exposure:
```bash
curl http://localhost:3000/api/config
```
**Result:** All secrets from config.json exposed!

### Test unsafe deserialization:
```bash
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"name":"John","nested":{"deep":{"very":{"deep":"data"}}}}'
```
**Result:** No validation, accepts any data

### Test secret exposure:
```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{"amount":100}'
```
**Result:** API keys and JWT secrets exposed in response!

## Testing the Secure Version (security-fixes branch)

Same commands as above, but with secure responses:
- Generic error messages only
- No stack traces
- No secrets exposed
- Input validation enforced
- Size limits applied

## Environment Variables Required

See `.env.example` for all required variables:
- `DB_PASSWORD` - Database password
- `API_KEY` - Payment API key (e.g., Stripe)
- `JWT_SECRET` - JWT signing secret
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME` - Database configuration
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Security Best Practices Applied

1. ✅ **Never hardcode secrets** - Use environment variables
2. ✅ **Show generic error messages** - Log details server-side only
3. ✅ **Never expose stack traces** in production
4. ✅ **Validate all inputs** - Size limits, type checking
5. ✅ **Use .gitignore** - Never commit secrets to Git
6. ✅ **Limit request size** - Prevent DoS attacks
7. ✅ **Remove dangerous endpoints** - Don't expose configuration

## References

Based on OWASP guidelines:
- [OWASP: Information Exposure Through Error Messages](https://owasp.org/www-community/Improper_Error_Handling)
- [OWASP: Hardcoded Passwords](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password)
- [OWASP: Deserialization](https://owasp.org/www-community/vulnerabilities/Deserialization_of_untrusted_data)

## License

ISC - For educational purposes only
