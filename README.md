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
