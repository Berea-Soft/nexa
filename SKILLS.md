# Skills

This document outlines the key skills and competencies demonstrated or required when working with the `@bereasoftware/nexa` codebase.

## Core Development Skills

### TypeScript Mastery
- Advanced generics and conditional types
- Branded types for type safety
- Type guards and runtime validation
- Module design and exports optimization

### HTTP Protocol Expertise
- REST API patterns and conventions
- Request/response lifecycle understanding
- Content negotiation and MIME types
- CORS, preflight, and browser security
- Streaming and chunked transfer encoding

### Functional Programming
- Result/Either monad pattern
- Discriminated unions for error handling
- Pure functions and immutability
- Function composition and pipelines

### Design Patterns
- Strategy pattern (retry, cache)
- Observer pattern (hooks, events)
- Factory pattern (client creation)
- Middleware pipeline (Koa-style)
- Plugin architecture
- Builder pattern (request configuration)

## Architecture Skills

### SOLID Principles
- Single Responsibility: Focused modules
- Open/Closed: Extensible via interfaces
- Liskov Substitution: Compatible strategies
- Interface Segregation: Minimal contracts
- Dependency Inversion: Abstraction over implementation

### API Design
- Fluent and intuitive interfaces
- Consistent naming conventions
- Sensible defaults with override capability
- Progressive disclosure of complexity

### Performance Optimization
- Tree-shaking optimization
- Zero-dependency architecture
- Request deduplication
- Concurrent request limiting
- Efficient caching with TTL

## Testing Skills

### Unit Testing (Vitest)
- Mocking fetch API
- Async test patterns
- Coverage analysis and interpretation
- BDD-style test organization

### Test Strategy
- Core path testing
- Edge case identification
- Error scenario coverage
- Integration vs unit test boundaries

## DevOps & Tooling

### Build System
- Vite configuration and optimization
- Multi-format output (ESM, CJS, UMD, IIFE)
- TypeScript declaration bundling
- Minification with OXC

### CI/CD
- Semantic release automation
- Automated changelog generation
- NPM publishing workflow
- Version management

### Code Quality
- TypeScript strict mode
- Type checking as linting
- Code coverage targets
- Documentation standards

## Soft Skills

### Communication
- Bilingual documentation (ES/EN)
- Clear API documentation
- Comprehensive examples
- Developer experience focus

### Problem Solving
- Identifying realistic coverage ceilings
- Balancing features with complexity
- Making pragmatic trade-offs
- Understanding user needs

## Learning Path

### For New Contributors

1. **Start with:** Read `README.md` and `ARCHITECTURE.md`
2. **Understand:** The Result monad pattern and why it's used
3. **Explore:** `src/http-client/http-client.ts` — the core class
4. **Practice:** Write a custom retry strategy
5. **Contribute:** Fix a bug or add a small feature

### For Advanced Users

1. **Study:** The interceptor pipeline implementation
2. **Extend:** Create a custom plugin
3. **Optimize:** Profile and improve performance
4. **Integrate:** Build framework-specific adapters

## Competency Matrix

| Level | Skills |
|-------|--------|
| Beginner | Basic HTTP requests, Result pattern, simple config |
| Intermediate | Interceptors, retry strategies, caching, validation |
| Advanced | Custom strategies, plugins, middleware pipeline, pagination |
| Expert | Architecture decisions, performance optimization, API design |
