# Migration Guide

This guide helps you migrate from other HTTP clients to `@bereasoftware/nexa`.

## Package Manager

The project standard is `pnpm`. For new integrations and local verification, prefer:

```bash
pnpm add @bereasoftware/nexa
```

If you are migrating from axios, a common first step is:

```bash
pnpm remove axios
pnpm add @bereasoftware/nexa
```

## From `fetch`

### Basic GET Request

**Before (fetch):**
```typescript
try {
  const response = await fetch('https://api.example.com/users/1');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const user = await response.json();
  console.log(user);
} catch (error) {
  console.error('Failed:', error);
}
```

**After (Nexa):**
```typescript
import { createHttpClient } from '@bereasoftware/nexa';

const client = createHttpClient({ baseURL: 'https://api.example.com' });
const result = await client.get<User>('/users/1');

if (result.ok) {
  console.log(result.value.data);
} else {
  console.error('Failed:', result.error.message);
}
```

### POST with JSON Body

**Before (fetch):**
```typescript
const response = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' }),
});
const user = await response.json();
```

**After (Nexa):**
```typescript
const result = await client.post<User>('/users', {
  name: 'John',
  email: 'john@example.com',
});
// Body serialization and Content-Type are automatic
```

### With Timeout

**Before (fetch):**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('Request timed out');
  }
}
```

**After (Nexa):**
```typescript
const result = await client.get('/data', { timeout: 5000 });

if (!result.ok && result.error.code === 'TIMEOUT') {
  console.error('Request timed out');
}
```

## From `axios`

### Basic Usage

**Before (axios):**
```typescript
import axios from 'axios';

try {
  const response = await axios.get<User>('https://api.example.com/users/1');
  console.log(response.data);
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error(`HTTP ${error.response?.status}: ${error.message}`);
  }
}
```

**After (Nexa):**
```typescript
import { createHttpClient } from '@bereasoftware/nexa';

const client = createHttpClient({ baseURL: 'https://api.example.com' });
const result = await client.get<User>('/users/1');

if (result.ok) {
  console.log(result.value.data);
} else {
  console.error(`HTTP ${result.error.status}: ${result.error.message}`);
}
```

### Creating a Client

**Before (axios):**
```typescript
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: { Authorization: 'Bearer token' },
});
```

**After (Nexa):**
```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  defaultTimeout: 10000,
  defaultHeaders: { Authorization: 'Bearer token' },
});
```

### Interceptors

**Before (axios):**
```typescript
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);
```

**After (Nexa):**
```typescript
client.addRequestInterceptor({
  onRequest(request) {
    return {
      ...request,
      headers: { ...request.headers, Authorization: `Bearer ${getToken()}` },
    };
  },
});

client.addResponseInterceptor({
  onResponse(response) {
    return response;
  },
  onError(error) {
    if (error.status === 401) {
      redirectToLogin();
    }
    return error;
  },
});
```

### Retries

**Before (axios):**
```typescript
// Requires axios-retry plugin
import axiosRetry from 'axios-retry';

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: axiosRetry.isNetworkOrIdempotentRequestError,
});
```

**After (Nexa):**
```typescript
import { ConservativeRetry } from '@bereasoftware/nexa';

const result = await client.get('/api', {
  retry: new ConservativeRetry(3),
});
// Built-in, no plugin needed
```

### File Upload

**Before (axios):**
```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

await axios.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (event) => {
    console.log(`Progress: ${Math.round((event.loaded / event.total) * 100)}%`);
  },
});
```

**After (Nexa):**
```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const result = await client.post('/upload', formData);
// Content-Type is set automatically with boundary
```

## Key Differences Summary

| Feature | axios | fetch | Nexa |
|---------|-------|-------|------|
| Error handling | try/catch | try/catch | Result monad |
| Auto JSON parse | Yes | No | Yes |
| Auto body serialization | Yes | No | Yes |
| Retries | Plugin needed | Manual | Built-in |
| Caching | Plugin needed | Manual | Built-in |
| Interceptors | Yes | No | Yes + disposal |
| TypeScript | Good | Basic | Excellent |
| Bundle size | ~13KB | 0KB | ~7KB gzipped |
| Dependencies | 1 (follow-redirects) | 0 | 0 |

## Migration Checklist

- [ ] Install Nexa with `pnpm add @bereasoftware/nexa`
- [ ] Remove legacy client dependencies you no longer use (for example `pnpm remove axios`)
- [ ] Replace `axios` imports with `createHttpClient`
- [ ] Convert try/catch blocks to Result pattern
- [ ] Replace `axios.create()` with `createHttpClient()`
- [ ] Update interceptors to use `addRequestInterceptor`/`addResponseInterceptor`
- [ ] Replace retry plugins with built-in `RetryStrategy`
- [ ] Update response access: `response.data` → `result.value.data`
- [ ] Update error access: `error.response?.status` → `result.error.status`
- [ ] Test all API calls after migration
- [ ] Verify the integration locally with `pnpm test` and `pnpm build`
- [ ] Update TypeScript types if needed
