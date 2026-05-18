# AGENTS.md

## AI Agent Guidelines

This file provides guidance for AI coding agents working on the `@bereasoftware/nexa` codebase.

## Project Overview

- **Name:** `@bereasoftware/nexa`
- **Type:** TypeScript HTTP client library
- **Runtime:** Node.js 20+, browsers (fetch API)
- **Package Manager:** npm
- **Build Tool:** Vite
- **Test Framework:** Vitest (globals mode, BDD style)
- **TypeScript:** ~6.0.2 (strict mode)

## Code Conventions

### Language
- Source code: English (comments, variable names, types)
- Documentation: Spanish (README.md) and English (README.en.md)

### Style
- 2-space indentation
- Semicolons required
- Single quotes for strings
- `camelCase` for variables/functions
- `PascalCase` for types/interfaces
- `kebab-case` for filenames

### Imports
- Use `import type` for type-only imports
- Named imports preferred
- Group: external → internal → types

### No Comments
- Do not add comments unless explicitly requested
- Code should be self-documenting

## Commands

```bash
# Development
npm run dev              # Start dev server

# Build
npm run build            # TypeScript check + Vite build

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:ui          # Vitest UI

# Linting
npm run lint             # TypeScript type check (tsc --noEmit)
```

## Architecture Quick Reference

### Core Files
- `src/index.ts` — Entry point, all exports
- `src/http-client/http-client.ts` — Main HttpClient class
- `src/http-client/types.ts` — Core type definitions
- `src/http-client/errors.ts` — HttpError class

### Key Patterns
- **Result Monad:** `{ ok: true, value: T } | { ok: false, error: E }`
- **Factory:** `createHttpClient(config)` not `new HttpClient()`
- **Strategies:** Implement interfaces (`RetryStrategy`, `CacheStrategy`)
- **Interceptors:** Return disposer function for cleanup
- **Plugins:** `{ name: string, setup(client): void }`

### Test Conventions
- Globals mode: `describe`, `it`, `expect` available without import
- BDD style: `describe('feature', () => { it('should...', () => {}) })`
- Mock fetch with `fetch-mock` or manual mocking
- Test files: `test/*.test.ts`

## Making Changes

### Adding a Feature
1. Read `ARCHITECTURE.md` to understand the system
2. Follow existing patterns in similar code
3. Add tests in `test/`
4. Update README.md and README.en.md
5. Run `npm test && npm run lint` before submitting

### Fixing a Bug
1. Write a failing test that reproduces the bug
2. Fix the bug
3. Ensure all tests pass
4. Run `npm run lint`

### Adding Tests
1. Place in appropriate file under `test/`
2. Follow existing test structure
3. Use descriptive test names: `it('should handle X when Y')`
4. Cover success and error paths

## Important Constraints

- **Zero dependencies** — Do not add any runtime dependencies
- **TypeScript strict** — All code must pass `tsc --noEmit`
- **Tree-shakeable** — New exports should not break tree-shaking
- **Backwards compatible** — Do not break existing public API
- **Coverage target** — Maintain ~75%+ coverage

## Git Conventions

### Commit Messages
Follow Conventional Commits format:
```
type(scope): description

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Branching
- Feature branches: `feat/description`
- Bug fixes: `fix/description`
- Do not commit to main directly

## Documentation Updates

When making changes, update relevant docs:
- **API changes** → README.md, README.en.md
- **Architecture changes** → ARCHITECTURE.md
- **Design decisions** → DESIGN.md
- **Security implications** → SECURITY.md
