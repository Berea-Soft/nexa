# Security Policy

**🇪🇸 Este documento está disponible en inglés. Si prefieres español, por favor solicítalo abriendo un issue.**  
**🇬🇧 This document is available in English. If you prefer Spanish, please request it by opening an issue.**

## Reporting a Vulnerability

We take the security of Nexa seriously. If you believe you have found a security vulnerability, please report it to us following the guidelines below.

### **Do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to **johnandrade@bereasoft.com**.

### What to Include in Your Report

To help us understand and resolve the issue quickly, please include:

1. **Type of vulnerability** (e.g., XSS, CSRF, SSRF, authentication bypass, etc.)
2. **Affected versions** of Nexa
3. **Steps to reproduce** the vulnerability
4. **Potential impact** of the vulnerability
5. **Suggested fix** (if you have one)
6. **Proof of concept** or exploit code (if applicable)

### Response Timeline

- **Initial response**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix development**: Timeline depends on complexity
- **Public disclosure**: After a fix is released and users have had time to update

## Security Considerations for Nexa

Nexa is an HTTP client library that handles network communication. Key security areas include:

### 1. **Transport Security**
   - Always use HTTPS in production
   - Validate SSL certificates (default behavior)
   - Consider implementing certificate pinning for critical applications

### 2. **Authentication & Credentials**
   - Store API keys and tokens securely (not in client-side code)
   - Use environment variables or secure secret management
   - Implement proper authentication flows (OAuth2, JWT, etc.)

### 3. **Input Validation**
   - Validate all inputs before sending requests
   - Sanitize URLs and parameters to prevent injection attacks
   - Use TypeScript types for compile-time validation

### 4. **Error Handling**
   - Avoid exposing sensitive information in error messages
   - Log errors appropriately without leaking credentials
   - Implement circuit breakers to prevent cascading failures

### 5. **Rate Limiting**
   - Use the built-in rate limiting middleware for API protection
   - Implement request queuing for high-volume applications
   - Monitor for abnormal request patterns

### 6. **Real-time Communication**
   - Validate WebSocket/Secure WebSocket (WSS) connections
   - Implement message validation for real-time data
   - Use secure channels for sensitive real-time communication

## Security Features in Nexa

### Built-in Protections
- **Request validation**: TypeScript interfaces for all request/response types
- **Error containment**: `Result<T, E>` monad prevents exception leaks
- **Timeout protection**: Connection and response timeouts
- **Circuit breaker**: Prevents cascading failures
- **Rate limiting**: Built-in middleware for request throttling

### Plugin Security
- **Sandboxed plugins**: Plugins run in controlled environment
- **Middleware pipeline**: Secure request/response transformation
- **Event system**: Controlled event emission between plugins

### Real-time Security
- **Secure WebSocket support**: WSS protocol support
- **Message validation**: Type-safe message handling
- **Connection management**: Secure reconnection logic

### Network Access and Supply Chain Security
- **Built-in modules only**: Nexa uses dynamic imports only for Node.js built-in modules (`http`, `https`, `http2`, `fs`)
- **Optional dependencies**: WebSocket support requires optional `ws` package, which must be explicitly installed by the user
- **No automatic downloads**: Nexa does not download or execute code from external sources at runtime
- **Transparent network access**: As an HTTP client library, Nexa performs network requests as directed by user code

## Best Practices for Users

### Configuration
```typescript
import { createHttpClient } from '@bereasoftware/nexa';

const client = createHttpClient({
  // Always use HTTPS in production
  baseURL: 'https://api.example.com',
  
  // Set reasonable timeouts
  defaultTimeout: 30000,
  
  // Enable debug only in development
  debug: process.env.NODE_ENV === 'development',
  
  // Use secure credentials handling
  credentials: 'same-origin',
});
```

### Authentication
```typescript
// Store tokens securely (not in source code)
const token = process.env.API_TOKEN;

const authenticatedClient = client.extend({
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### Error Handling
```typescript
const result = await client.get('/api/data');

if (!result.ok) {
  // Log error without exposing sensitive data
  console.error('Request failed:', result.error.message);
  // Handle error appropriately
}
```

## Security Updates

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- **Major versions**: May contain breaking changes, security updates
- **Minor versions**: New features, backward-compatible
- **Patch versions**: Bug fixes, security patches

### Update Strategy
- **Critical security fixes**: Released as patch versions
- **Security enhancements**: Released in minor versions
- **Breaking security changes**: Released in major versions with migration guides

## Vulnerability Disclosure Process

1. **Private reporting**: Vulnerability reported via email
2. **Acknowledgement**: We acknowledge receipt within 48 hours
3. **Investigation**: We investigate and confirm the vulnerability
4. **Fix development**: We develop and test a fix
5. **Release**: We release a patched version
6. **Disclosure**: We publicly disclose the vulnerability after users have updated
7. **Credit**: We credit the reporter (if desired)

## Supported Versions

| Version | Supported          | Security Updates Until |
|---------|--------------------|------------------------|
| 1.x.x   | ✅ Yes             | TBD                    |
| < 1.0   | ❌ No              | N/A                    |

## Third-party Dependencies

Nexa has **zero runtime dependencies** for the core HTTP client. However, we use development dependencies:

- **TypeScript**: Compile-time type checking
- **Vitest**: Testing framework
- **Vite**: Build tool
- **vite-plugin-dts**: Type generation

All dependencies are regularly audited and updated.

### Note on npm CLI Vulnerabilities

When running `npm audit` on Nexa, you may see vulnerabilities reported in `node_modules/npm/node_modules/`. These are vulnerabilities in the npm CLI tool itself, not in Nexa's dependencies. Nexa has zero production dependencies, so these vulnerabilities do not affect applications using Nexa.

To address npm CLI vulnerabilities:
1. Update Node.js to the latest LTS version
2. Update npm globally: `npm install -g npm@latest`
3. The CI pipeline for Nexa uses `--audit-level=critical` to ignore non-critical vulnerabilities in development tools

## Contact

- **Security email**: johnandrade@bereasoft.com
- **GitHub Issues**: For non-security related issues
- **Documentation**: [README.md](README.md)

## Acknowledgments

We thank the security researchers and community members who help keep Nexa secure.

---

*This security policy is adapted from best practices in open-source security management.*