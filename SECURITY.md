# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of `@bereasoftware/nexa` seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Reporting Process

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

- **John Andrade** — [johnandrade@bereasoft.com](mailto:johnandrade@bereasoft.com)

You should receive a response within **48 hours**. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information:

- Type of issue (e.g., buffer overflow, XSS, SSRF, dependency confusion, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **48 hours** — Initial acknowledgment
- **7 days** — Preliminary assessment and status update
- **30 days** — Patch development and release (for critical issues)

### Disclosure Policy

- We will confirm receipt of your report within 48 hours
- We will keep you informed of the progress toward a fix
- We will coordinate with you on the disclosure timeline
- We prefer to fully disclose the vulnerability as soon as possible once a fix is available
- We request that you respect our users' need for a patch before any public disclosure

### Security Best Practices for Users

When using Nexa in your applications:

1. **Always validate untrusted input** before including it in requests (URLs, headers, body)
2. **Use HTTPS** for all production API communications
3. **Set appropriate timeouts** to prevent resource exhaustion
4. **Implement rate limiting** on the client side for untrusted APIs
5. **Keep Nexa updated** to the latest version for security patches
6. **Never expose sensitive headers** (Authorization tokens) in client-side code accessible to end users
7. **Use the Result monad pattern** to handle errors gracefully without leaking sensitive information

### Scope

This security policy applies to:

- The core HTTP client functionality
- Interceptor system
- Cache mechanisms
- Retry strategies
- Plugin architecture
- All exported utilities

### Out of Scope

- Vulnerabilities in dependencies (report to the respective projects)
- Issues in development tooling (Vite, Vitest, etc.)
- Problems related to the user's implementation or configuration
