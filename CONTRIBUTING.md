# Contributing

Thank you for your interest in contributing to `@bereasoftware/nexa`! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

## Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/nexa.git
cd nexa
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Branch

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 4. Make Changes

Follow the conventions in [AGENTS.md](AGENTS.md) for code style and architecture guidelines.

### 5. Run Tests

```bash
npm test              # Run all tests
npm run test:coverage # Check coverage
npm run lint          # Type check
```

### 6. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add custom retry strategy
fix: handle timeout error in polling
docs: update API reference
test: add edge case for cache TTL
```

### 7. Push and Create a Pull Request

```bash
git push origin feat/your-feature-name
```

Then open a PR on GitHub.

## Pull Request Guidelines

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] Type check passes (`npm run lint`)
- [ ] Coverage is maintained or improved
- [ ] Documentation is updated (README.md, README.en.md)
- [ ] Commit messages follow Conventional Commits

### PR Description

Include:

1. **What** — Summary of changes
2. **Why** — Motivation and context
3. **How** — Implementation details (if non-obvious)
4. **Testing** — How to verify the changes
5. **Breaking Changes** — Any API changes

### Review Process

1. PR is reviewed by maintainers
2. Feedback is provided (if needed)
3. Changes are made and pushed
4. PR is merged

## What We're Looking For

### Bug Fixes

- Clear description of the bug
- Reproduction steps
- Test case that fails before fix
- Test case that passes after fix

### Features

- Clear use case and motivation
- Proposed API design
- Implementation
- Tests
- Documentation updates

### Documentation

- Typos and grammar fixes
- Clarification of existing docs
- New examples and guides
- Translations

### Performance

- Benchmark before/after
- Clear explanation of improvement
- No regression in functionality

## Development Workflow

### Project Structure

```
src/
├── http-client/      # Core HTTP client
├── utils/            # Utility functions
└── index.ts          # Entry point
test/
├── http-client.test.ts
└── utils.test.ts
```

### Adding a New Feature

1. **Design** — Think about the API and how it fits with existing patterns
2. **Implement** — Write the code following existing conventions
3. **Test** — Add comprehensive tests
4. **Document** — Update README.md and README.en.md
5. **Review** — Self-review before submitting PR

### Adding a New Export

1. Export from the appropriate module file
2. Re-export in `src/index.ts`
3. Add to the exports verification test
4. Document in README.md

## Coding Standards

### TypeScript

- Strict mode enabled
- No `any` — use `unknown` if necessary
- Prefer `interface` over `type` for object shapes
- Use generics for type-safe APIs

### Testing

- BDD style with `describe`/`it`/`expect`
- Test both success and error paths
- Use descriptive test names
- Mock external dependencies

### Documentation

- Examples should be copy-paste runnable
- Show both basic and advanced usage
- Include error handling examples
- Keep descriptions concise

## Reporting Issues

### Bug Reports

Include:
- Nexa version
- Node.js version
- Minimal reproduction
- Expected vs actual behavior

### Feature Requests

Include:
- Use case
- Proposed API
- Alternatives considered

## Release Process

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) for automated versioning and publishing.

Commit messages determine the version bump:

- `fix:` → PATCH bump
- `feat:` → MINOR bump
- `feat!:` or `BREAKING CHANGE:` → MAJOR bump

## Questions?

- Check [SUPPORT.md](SUPPORT.md) for help resources
- Open a [GitHub Discussion](https://github.com/Berea-Soft/nexa/discussions)
- Email: [johnandrade@bereasoft.com](mailto:johnandrade@bereasoft.com)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
