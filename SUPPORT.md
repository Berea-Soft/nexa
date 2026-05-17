# Support

## Getting Help

### Documentation

- **[README.md](README.md)** — Complete usage guide (Spanish)
- **[README.en.md](README.en.md)** — Complete usage guide (English)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — System architecture overview
- **[API Reference](README.md#referencia-de-api)** — Full API reference

### Community & Issues

- **[GitHub Issues](https://github.com/Berea-Soft/nexa/issues)** — Bug reports and feature requests
- **[GitHub Discussions](https://github.com/Berea-Soft/nexa/discussions)** — Questions and community support

### Direct Contact

- **Email:** [johnandrade@bereasoft.com](mailto:johnandrade@bereasoft.com)
- **Organization:** [Berea Software](https://github.com/Berea-Soft)

## Support Tiers

### Free Support

- Bug reports via GitHub Issues
- Feature requests via GitHub Issues
- Community discussions
- Documentation improvements

### Priority Support

For priority support, commercial licensing, or consulting services, contact us directly at [johnandrade@bereasoft.com](mailto:johnandrade@bereasoft.com).

## Reporting Issues

Before opening an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Check the latest version** — the bug may already be fixed
3. **Read the documentation** — the behavior may be intentional

### Bug Report Template

When reporting a bug, include:

- **Nexa version** (from `package.json` or `npm list @bereasoftware/nexa`)
- **Node.js version** (`node --version`)
- **TypeScript version** (`tsc --version`)
- **Environment** (browser, Node.js, Deno, etc.)
- **Minimal reproduction** code snippet
- **Expected behavior** vs **actual behavior**
- **Error messages** or stack traces

### Feature Request Template

When requesting a feature, include:

- **Use case** — What problem does this solve?
- **Proposed API** — How would you expect to use it?
- **Alternatives considered** — What have you tried?
- **Additional context** — Any relevant examples from other libraries?

## Compatibility

### Supported Runtimes

| Runtime | Minimum Version |
|---------|----------------|
| Node.js | 20.18.0+ |
| npm     | 10.8.2+ |
| Browsers | Last 2 versions (not IE 11) |

### Framework Compatibility

Nexa works with any JavaScript/TypeScript framework:

- React / Next.js
- Vue / Nuxt
- Angular
- Svelte / SvelteKit
- Express / Fastify (Node.js)
- Any vanilla JS/TS project

## FAQ

### Q: Why use Result instead of try/catch?

A: The Result monad provides type-safe error handling. The compiler forces you to handle both success and error cases, preventing uncaught exceptions and making error paths explicit.

### Q: Can I use Nexa in the browser?

A: Yes! Nexa works in any environment that supports the `fetch` API, including all modern browsers and Node.js 20+.

### Q: How do I migrate from axios?

A: The API is similar but uses Result instead of try/catch. Replace `try { const res = await axios... } catch (e) {}` with `const result = await client...; if (result.ok) { ... } else { ... }`.

### Q: Is Nexa production-ready?

A: Yes. Nexa has 157 passing tests, 75.73% code coverage, and is used in production environments.

### Q: How do I contribute?

A: See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Response Times

| Channel | Expected Response Time |
|---------|----------------------|
| GitHub Issues | 1-3 business days |
| Email | 1-2 business days |
| Security Reports | 48 hours |

## Version Support

We support the latest major version. Please upgrade to the latest version before reporting issues.

| Version | Status |
|---------|--------|
| 1.x.x | Active |
| 0.x.x | End of Life |
