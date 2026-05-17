# Contributing to Nexa

**🇪🇸 Este documento está disponible en inglés. Si prefieres español, por favor solicítalo abriendo un issue.**  
**🇬🇧 This document is available in English. If you prefer Spanish, please request it by opening an issue.**

Thank you for your interest in contributing to Nexa! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm 10 or later
- TypeScript 6.0 or later

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/Berea-Soft/nexa.git
   cd nexa
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Project Structure

```
src/
├── http-client/         # HTTP client implementation
│   ├── http-client.ts   # Main HTTP client class
│   ├── node-http-adapter.ts # Node.js transport adapters
│   └── index.ts         # Public exports
├── realtime/            # Real-time communication (WebSocket/SSE)
│   ├── websocket-client.ts
│   ├── sse-client.ts
│   ├── plugin.ts
│   └── index.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utilities, middleware, plugin system
│   └── index.ts
├── testing/             # Testing utilities
│   └── mock-client.ts
└── index.ts             # Main entry point
```

## Development Workflow

### Running Tests

We use Vitest for testing. Run tests with:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Type Checking

```bash
npm run lint
```

### Building

```bash
npm run build
```

This will generate the following files in `dist/`:
- `nexa.es.js` (ESM)
- `nexa.cjs.js` (CommonJS)
- `nexa.umd.js` (UMD)
- `nexa.iife.js` (IIFE)
- `types/` (TypeScript declarations)

## Making Changes

### Code Style Guidelines

1. **TypeScript**: Use strict TypeScript with explicit types
2. **Imports**: Use ES module syntax (`import/export`)
3. **Naming**:
   - Interfaces: `IHttpClient`, `IRealtimeClient`
   - Classes: `HttpClient`, `WebSocketClient`
   - Functions: `createHttpClient`, `isHttpError`
   - Variables: `camelCase`
   - Constants: `UPPER_SNAKE_CASE`
4. **Error Handling**: Use `Result<T, E>` monad pattern instead of exceptions
5. **Documentation**: Add JSDoc comments for public APIs

### Adding New Features

1. **Check for existing issues** or create a new one to discuss the feature
2. **Write tests** for your feature
3. **Implement the feature** following the existing architecture
4. **Update documentation** (README.md, examples, type definitions)
5. **Ensure all tests pass** and linting succeeds

### Fixing Bugs

1. **Reproduce the bug** with a failing test
2. **Fix the bug** and ensure the test passes
3. **Add additional tests** for edge cases

### Adding Examples

Examples go in the `examples/` directory. Each example should:
- Demonstrate a specific feature or use case
- Be self-contained and runnable
- Include comments explaining the code

## Pull Request Process

1. **Ensure your code passes** all tests and linting
2. **Update documentation** as needed
3. **Write a clear PR description**:
   - What changes were made
   - Why they were made
   - Any breaking changes
   - Related issues
4. **Use conventional commits** in your PR (see below)
5. **Request review** from maintainers

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(http): add WebSocket client with auto-reconnection
fix(cache): handle cache invalidation on POST requests
docs: update README with new features
```

## Plugin Development

Nexa has a plugin system. When creating plugins:

1. **Extend the `Plugin` interface** from `src/utils/index.ts`
2. **Register middleware** through the `PluginManager`
3. **Emit events** for plugin communication
4. **Add tests** for your plugin
5. **Document** configuration options and usage

Example plugin structure:
```typescript
export class MyPlugin implements Plugin {
  name = 'my-plugin';
  
  setup(manager: PluginManager): void {
    manager.addMiddleware(createMyMiddleware());
    manager.on('some-event', this.handleEvent.bind(this));
  }
}
```

## Real-time Features

When adding real-time features (WebSocket/SSE):
- Follow the existing `IRealtimeClient` interface
- Implement automatic reconnection
- Add heartbeat support
- Integrate with the plugin system
- Support multiple environments (Browser, Node.js, Deno, Bun, Cloudflare)

## Testing Guidelines

- **Unit tests**: Test individual functions and classes
- **Integration tests**: Test HTTP client with mock server
- **Edge cases**: Test error conditions and boundary cases
- **Performance**: Consider adding benchmarks for critical paths

Use the existing mock client for HTTP testing:
```typescript
import { createMockClient } from '@bereasoftware/nexa/testing';

const mockClient = createMockClient();
mockClient.mockResponse('/api/users', { users: [] });
```

## Documentation

- **README.md**: Primary documentation (Spanish)
- **README.en.md**: English documentation
- **JSDoc comments**: All public APIs
- **Examples**: Practical usage examples
- **Type definitions**: Self-documenting through TypeScript

## Questions or Need Help?

- **Open an issue** for bugs or feature requests
- **Start a discussion** for questions about implementation
- **Email**: johnandrade@bereasoft.com

Thank you for contributing to Nexa! 🚀