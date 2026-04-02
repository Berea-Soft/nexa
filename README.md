<p align="center">
  <h1 align="center">@bereasoftware/nexa</h1>
  <p align="center">
    Un cliente HTTP moderno y type-safe que combina el poder de <code>fetch</code> con la comodidad de <code>axios</code> — construido sobre principios SOLID.
  </p>
</p>

<p align="center">
  <a href="#tests"><img src="https://img.shields.io/badge/Tests-157_pasando-brightgreen?style=for-the-badge" alt="Tests" /></a>
  <a href="#test-coverage"><img src="https://img.shields.io/badge/Coverage-75.73%25-orange?style=for-the-badge" alt="Coverage" /></a>
  <a href="https://www.npmjs.com/package/@bereasoftware/nexa"><img src="https://img.shields.io/npm/v/@bereasoftware/nexa?style=for-the-badge" alt="NPM Version" /></a>
  <a href="https://bundlephobia.com/package/@bereasoftware/nexa"><img src="https://img.shields.io/bundlephobia/minzip/@bereasoftware/nexa?label=Bundle&style=for-the-badge" alt="Bundle Size" /></a>
  <a href="https://www.npmjs.com/package/@bereasoftware/nexa"><img src="https://img.shields.io/npm/dm/@bereasoftware/nexa?style=for-the-badge" alt="NPM Downloads" /></a>
  <img src="https://img.shields.io/badge/Node-20%2B-success?style=for-the-badge" alt="Node" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Dependencias-Cero-brightgreen?style=for-the-badge" alt="Dependencies" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/Licencia-MIT-yellow?style=for-the-badge" alt="License" /></a>
  <a href="https://github.com/Berea-Soft/nexa"><img src="https://img.shields.io/badge/github-Repositorio-blue?logo=github&style=for-the-badge" alt="Repository" /></a>
</p>

> 📚 **Documentación disponible en otros idiomas:**
>
> - 🇪🇸 **Español** (este archivo - README.md)
> - 🇬🇧 **English** (README.en.md)

---

## ¿Por qué Nexa?

| Característica                             | `fetch` | `axios` | **Nexa** |
| ------------------------------------------ | :-----: | :-----: | :------: |
| Cero dependencias                          |   ✅    |   ❌    |    ✅    |
| Errores type-safe (Result monad)           |   ❌    |   ❌    |    ✅    |
| Serialización automática del body          |   ❌    |   ✅    |    ✅    |
| Interpolación de parámetros en ruta        |   ❌    |   ❌    |    ✅    |
| Estrategias de reintentos (pluggable)      |   ❌    |   ❌    |    ✅    |
| Caché integrado                            |   ❌    |   ❌    |    ✅    |
| Deduplicación de peticiones                |   ❌    |   ❌    |    ✅    |
| Progreso de descarga                       |   ❌    |   ✅    |    ✅    |
| Hooks de ciclo de vida                     |   ❌    |   ❌    |    ✅    |
| Limitación de peticiones concurrentes      |   ❌    |   ❌    |    ✅    |
| Auto-paginación                            |   ❌    |   ❌    |    ✅    |
| Polling inteligente                        |   ❌    |   ❌    |    ✅    |
| Extensión de cliente (`.extend()`)         |   ❌    |   ✅    |    ✅    |
| Disposal de interceptores                  |   ❌    |   ❌    |    ✅    |
| Pipeline de middleware                     |   ❌    |   ❌    |    ✅    |
| Sistema de plugins                         |   ❌    |   ❌    |    ✅    |
| Validadores y transformadores              |   ❌    |   ❌    |    ✅    |
| Tracking de duración de respuesta          |   ❌    |   ❌    |    ✅    |
| Detección inteligente de tipo de respuesta |   ❌    |   ✅    |    ✅    |
| Tree-shakeable                             |   ✅    |   ❌    |    ✅    |

---

## Tabla de Contenidos

- [Instalación](#instalación)
- [Inicio Rápido](#inicio-rápido)
- [Conceptos Fundamentales](#conceptos-fundamentales)
  - [Result Monad (Sin try/catch)](#result-monad)
  - [Creando un Cliente](#creando-un-cliente)
- [Métodos HTTP](#métodos-http)
- [Configuración de Peticiones](#configuración-de-peticiones)
  - [Parámetros de Ruta](#parámetros-de-ruta)
  - [Parámetros de Query](#parámetros-de-query)
  - [Serialización Automática del Body](#serialización-automática-del-body)
  - [Tipos de Respuesta](#tipos-de-respuesta)
  - [Timeout](#timeout)
- [Estrategias de Reintentos](#estrategias-de-reintentos)
  - [Configuración Inline](#configuración-inline)
  - [AggressiveRetry](#aggressiveretry)
  - [ConservativeRetry](#conservativeretry)
  - [CircuitBreakerRetry](#circuitbreakerretry)
  - [Estrategia Personalizada](#estrategia-personalizada)
- [Interceptores](#interceptores)
  - [Interceptores de Petición](#interceptores-de-petición)
  - [Interceptores de Respuesta](#interceptores-de-respuesta)
  - [Disposal de Interceptores](#disposal-de-interceptores)
- [Caché](#caché)
- [Hooks de Ciclo de Vida](#hooks-de-ciclo-de-vida)
- [Progreso de Descarga](#progreso-de-descarga)
- [Limitación de Peticiones Concurrentes](#limitación-de-peticiones-concurrentes)
- [Extensión de Cliente](#extensión-de-cliente)
- [Auto-Paginación](#auto-paginación)
- [Polling Inteligente](#polling-inteligente)
- [Cancelación de Peticiones](#cancelación-de-peticiones)
- [Validadores](#validadores)
- [Transformadores](#transformadores)
- [Pipeline de Middleware](#pipeline-de-middleware)
- [Sistema de Plugins](#sistema-de-plugins)
- [Streaming](#streaming)
- [Generics Tipados](#generics-tipados)
- [Manejo de Errores](#manejo-de-errores)
- [Referencia de API](#referencia-de-api)
- [Formatos de Build](#formatos-de-build)
- [Desarrollo](#desarrollo)
- [Licencia](#licencia)

---

## Instalación

```bash
npm install @bereasoftware/nexa
```

```bash
yarn add @bereasoftware/nexa
```

```bash
pnpm add @bereasoftware/nexa
```

---

## Inicio Rápido

```typescript
import { createHttpClient } from "@bereasoftware/nexa";

const client = createHttpClient({
  baseURL: "https://api.example.com",
});

// Type-safe, sin necesidad de try/catch
const result = await client.get<User>("/users/1");

if (result.ok) {
  console.log(result.value.data); // User
  console.log(result.value.status); // 200
  console.log(result.value.duration); // 42 (ms)
} else {
  console.log(result.error.message); // "Request failed with status 404"
  console.log(result.error.code); // "HTTP_ERROR"
}
```

---

## Conceptos Fundamentales

### Result Monad

Nexa retorna un tipo `Result<T, E>` en lugar de lanzar excepciones. Esto elimina la necesidad de bloques `try/catch` y te da seguridad de tipos completa tanto en el camino de éxito como en el de error.

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

También puedes construir resultados manualmente:

```typescript
import { Ok, Err } from "@bereasoftware/nexa";

const exito = Ok({ name: "John" }); // { ok: true, value: { name: 'John' } }
const fallo = Err({ message: "No encontrado", code: "HTTP_ERROR" });
```

Cada método del cliente retorna `Promise<Result<HttpResponse<T>, HttpErrorDetails>>`:

```typescript
const result = await client.get<User[]>('/users');

if (result.ok) {
  // result.value es HttpResponse<User[]>
  const users: User[] = result.value.data;
  const status: number = result.value.status;
  const duration: number = result.value.duration;
  const headers: Headers = result.value.headers;
} else {
  // result.error es HttpErrorDetails
  const message: string = result.error.message;
  const code: string = result.error.code;       // 'HTTP_ERROR' | 'TIMEOUT' | 'NETWORK_ERROR' | 'ABORTED' | ...
  const status?: number = result.error.status;
}
```

### Creando un Cliente

```typescript
import { createHttpClient } from "@bereasoftware/nexa";

const client = createHttpClient({
  baseURL: "https://api.example.com",
  defaultHeaders: { Authorization: "Bearer token123" },
  defaultTimeout: 10000, // 10s (por defecto: 30s)
  validateStatus: (status) => status < 400, // Validación de status personalizada
  maxConcurrent: 5, // Máximo 5 peticiones simultáneas
  defaultResponseType: "json", // 'json' | 'text' | 'blob' | 'auto' | ...
  defaultHooks: {
    onStart: (req) => console.log("Iniciando:", req.url),
    onFinally: () => console.log("Listo"),
  },
});
```

**Opciones completas de `HttpClientConfig`:**

| Opción                | Tipo                          | Por defecto                              | Descripción                                                  |
| --------------------- | ----------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| `baseURL`             | `string`                      | `''`                                     | URL base que se antepone a todas las peticiones              |
| `defaultHeaders`      | `Record<string, string>`      | `{ 'Content-Type': 'application/json' }` | Headers por defecto para cada petición                       |
| `defaultTimeout`      | `number`                      | `30000`                                  | Timeout por defecto en ms                                    |
| `validateStatus`      | `(status: number) => boolean` | `status >= 200 && status < 300`          | Qué códigos HTTP se consideran exitosos                      |
| `cacheStrategy`       | `CacheStrategy`               | `MemoryCache`                            | Implementación de caché personalizada                        |
| `maxConcurrent`       | `number`                      | `0` (ilimitado)                          | Máximo de peticiones concurrentes                            |
| `defaultResponseType` | `ResponseType`                | `'auto'`                                 | Estrategia de parseo de respuesta por defecto                |
| `defaultHooks`        | `RequestHooks`                | `{}`                                     | Hooks de ciclo de vida por defecto para todas las peticiones |

---

## Métodos HTTP

```typescript
// GET
const result = await client.get<User>("/users/1");

// POST
const result = await client.post<User>("/users", {
  name: "John",
  email: "john@example.com",
});

// PUT
const result = await client.put<User>("/users/1", { name: "John Actualizado" });

// PATCH
const result = await client.patch<User>("/users/1", {
  email: "nuevo@example.com",
});

// DELETE
const result = await client.delete<void>("/users/1");

// HEAD (verificar existencia de recurso)
const result = await client.head("/users/1");

// OPTIONS (preflight CORS, métodos disponibles)
const result = await client.options("/users");
```

Todos los métodos aceptan un objeto de configuración opcional como último parámetro:

```typescript
const result = await client.get<User>("/users/1", {
  timeout: 5000,
  headers: { "X-Custom": "valor" },
  cache: { enabled: true, ttlMs: 60000 },
  retry: { maxAttempts: 3, backoffMs: 1000 },
});
```

---

## Configuración de Peticiones

### Parámetros de Ruta

Nexa soporta interpolación de rutas estilo `:param` con codificación URI automática:

```typescript
const result = await client.get<User>("/users/:id/posts/:postId", {
  params: { id: 42, postId: "hola mundo" },
});
// → GET /users/42/posts/hola%20mundo
```

### Parámetros de Query

```typescript
const result = await client.get<User[]>("/users", {
  query: { page: 1, limit: 20, active: true },
});
// → GET /users?page=1&limit=20&active=true
```

### Serialización Automática del Body

Nexa detecta y serializa automáticamente el cuerpo de la petición:

| Tipo de Body       | Serialización      | Content-Type                        |
| ------------------ | ------------------ | ----------------------------------- |
| `object` / `array` | `JSON.stringify()` | `application/json`                  |
| `string`           | Se envía tal cual  | `text/plain`                        |
| `FormData`         | Se envía tal cual  | Auto (boundary multipart)           |
| `URLSearchParams`  | Se envía tal cual  | `application/x-www-form-urlencoded` |
| `Blob`             | Se envía tal cual  | Tipo del Blob                       |
| `ArrayBuffer`      | Se envía tal cual  | `application/octet-stream`          |
| `ReadableStream`   | Se envía tal cual  | `application/octet-stream`          |

```typescript
// JSON (automático)
await client.post("/users", { name: "John" });

// FormData (content-type automático con boundary)
const form = new FormData();
form.append("file", fileBlob);
await client.post("/upload", form);

// URL-encoded
await client.post(
  "/login",
  new URLSearchParams({ user: "john", pass: "secreto" }),
);
```

### Tipos de Respuesta

Controla cómo se parsea el cuerpo de la respuesta:

```typescript
// Auto-detección basada en el header Content-Type (por defecto)
const result = await client.get("/data", { responseType: "auto" });

// Forzar parseo JSON
const result = await client.get<User>("/user", { responseType: "json" });

// Obtener texto crudo
const result = await client.get<string>("/page", { responseType: "text" });

// Descargar como Blob
const result = await client.get<Blob>("/file.pdf", { responseType: "blob" });

// Obtener ArrayBuffer
const result = await client.get<ArrayBuffer>("/binary", {
  responseType: "arrayBuffer",
});

// Obtener FormData
const result = await client.get<FormData>("/form", {
  responseType: "formData",
});

// Obtener ReadableStream (para streaming manual)
const result = await client.get<ReadableStream>("/stream", {
  responseType: "stream",
});
```

**Lógica de auto-detección:** `application/json` → JSON, `text/*` → texto, `multipart/form-data` → FormData, `application/octet-stream` / `image/*` / `audio/*` / `video/*` → Blob, fallback → intenta JSON luego texto.

### Timeout

```typescript
// Timeout por petición
const result = await client.get("/endpoint-lento", { timeout: 5000 });

// El timeout produce un código de error específico
if (!result.ok && result.error.code === "TIMEOUT") {
  console.log("La petición expiró");
}
```

---

## Estrategias de Reintentos

### Configuración Inline

Reintento simple con backoff exponencial:

```typescript
const result = await client.get("/api-inestable", {
  retry: { maxAttempts: 3, backoffMs: 1000 },
});
// Reintenta hasta 3 veces con backoff exponencial + jitter
```

### AggressiveRetry

Reintenta todos los errores hasta el máximo de intentos con delay mínimo:

```typescript
import { AggressiveRetry } from "@bereasoftware/nexa";

const result = await client.get("/api", {
  retry: new AggressiveRetry(5), // 5 intentos, delay de 50ms * intento
});
```

### ConservativeRetry

Solo reintenta en códigos HTTP específicos (408, 429, 500, 502, 503, 504) y timeouts:

```typescript
import { ConservativeRetry } from "@bereasoftware/nexa";

const result = await client.get("/api", {
  retry: new ConservativeRetry(3), // 3 intentos, backoff exponencial con tope de 10s
});
```

### CircuitBreakerRetry

Patrón fail-fast — deja de reintentar después de un umbral de fallos:

```typescript
import { CircuitBreakerRetry } from "@bereasoftware/nexa";

const breaker = new CircuitBreakerRetry(
  3, // maxAttempts por petición
  5, // failureThreshold antes de abrir el circuito
  60000, // resetTimeMs — el circuito se resetea después de 60s
);

const result = await client.get("/api", { retry: breaker });

// Resetear el circuito manualmente
breaker.reset();
```

### Estrategia Personalizada

Implementa la interfaz `RetryStrategy`:

```typescript
import type { RetryStrategy, HttpErrorDetails } from "@bereasoftware/nexa";

const reintentoCustom: RetryStrategy = {
  shouldRetry(attempt: number, error: HttpErrorDetails): boolean {
    // Solo reintentar errores de red y 503
    return (
      (error.code === "NETWORK_ERROR" || error.status === 503) && attempt < 5
    );
  },
  delayMs(attempt: number): number {
    // Backoff lineal: 500ms, 1000ms, 1500ms...
    return attempt * 500;
  },
};

const result = await client.get("/api", { retry: reintentoCustom });
```

---

## Interceptores

### Interceptores de Petición

Modifica las peticiones antes de que se envíen:

```typescript
client.addRequestInterceptor({
  onRequest(request) {
    // Agregar token de auth a cada petición
    return {
      ...request,
      headers: {
        ...request.headers,
        Authorization: `Bearer ${getToken()}`,
      },
    };
  },
});
```

### Interceptores de Respuesta

Transforma respuestas o maneja errores globalmente:

```typescript
client.addResponseInterceptor({
  onResponse(response) {
    // Loguear todas las respuestas exitosas
    console.log(
      `[${response.status}] ${response.request.url} (${response.duration}ms)`,
    );
    return response;
  },
  onError(error) {
    // Manejar 401 globalmente
    if (error.status === 401) {
      redirigirAlLogin();
    }
    return error;
  },
});
```

### Disposal de Interceptores

Tanto `addRequestInterceptor` como `addResponseInterceptor` retornan una función disposer para remover el interceptor:

```typescript
const dispose = client.addRequestInterceptor({
  onRequest(request) {
    return { ...request, headers: { ...request.headers, "X-Temp": "valor" } };
  },
});

// Después: remover el interceptor
dispose();

// O limpiar todos los interceptores
client.clearInterceptors();
```

---

## Caché

Caché en memoria integrado con soporte TTL. Solo cachea peticiones GET:

```typescript
const result = await client.get<User>("/users/1", {
  cache: { enabled: true, ttlMs: 60000 }, // Cachear por 1 minuto
});

// La segunda llamada retorna la respuesta cacheada instantáneamente
const cached = await client.get<User>("/users/1", {
  cache: { enabled: true, ttlMs: 60000 },
});
```

**Implementación de caché personalizada:**

```typescript
import type { CacheStrategy } from "@bereasoftware/nexa";

const redisCache: CacheStrategy = {
  get(key: string) {
    return redis.get(key);
  },
  set(key: string, value: unknown, ttlMs?: number) {
    redis.set(key, value, "PX", ttlMs);
  },
  has(key: string) {
    return redis.exists(key);
  },
  clear() {
    redis.flushdb();
  },
};

const client = createHttpClient({ cacheStrategy: redisCache });
```

---

## Hooks de Ciclo de Vida

Monitorea el ciclo de vida completo de la petición:

```typescript
const result = await client.get<User>("/users/1", {
  hooks: {
    onStart(request) {
      console.log("Iniciando petición a:", request.url);
    },
    onSuccess(response) {
      console.log("Éxito:", response.status, `(${response.duration}ms)`);
    },
    onError(error) {
      console.error("Falló:", error.message, error.code);
    },
    onRetry(attempt, error) {
      console.warn(`Reintento #${attempt}:`, error.message);
    },
    onFinally() {
      console.log("Petición completada (éxito o fallo)");
    },
  },
});
```

Los hooks por defecto se pueden configurar a nivel de cliente:

```typescript
const client = createHttpClient({
  defaultHooks: {
    onError: (error) => reportarASentry(error),
    onFinally: () => ocultarSpinnerDeCarga(),
  },
});
```

---

## Progreso de Descarga

Trackea el progreso de descarga con un callback:

```typescript
const result = await client.get<Blob>("/archivo-grande.zip", {
  responseType: "blob",
  onDownloadProgress(event) {
    console.log(
      `Descargado: ${event.percent}% (${event.loaded}/${event.total} bytes)`,
    );
    actualizarBarraDeProgreso(event.percent);
  },
});
```

La interfaz `ProgressEvent`:

```typescript
interface ProgressEvent {
  loaded: number; // Bytes descargados hasta ahora
  total: number; // Total de bytes (del header Content-Length)
  percent: number; // 0-100
}
```

---

## Limitación de Peticiones Concurrentes

Limita el número de peticiones simultáneas para no sobrecargar el servidor:

```typescript
const client = createHttpClient({
  baseURL: "https://api.example.com",
  maxConcurrent: 3, // Solo 3 peticiones a la vez
});

// Lanza 10 peticiones — solo 3 corren simultáneamente, el resto se encola automáticamente
const results = await Promise.all(urls.map((url) => client.get(url)));
```

Consultar el estado de la cola:

```typescript
console.log(client.queueStats);
// { active: 3, pending: 7 }

console.log(client.activeRequests);
// 3
```

---

## Extensión de Cliente

Crea clientes hijo que heredan configuración e interceptores:

```typescript
const clienteBase = createHttpClient({
  baseURL: "https://api.example.com",
  defaultHeaders: { "X-App": "MiApp" },
});

clienteBase.addRequestInterceptor({
  onRequest(req) {
    return {
      ...req,
      headers: { ...req.headers, Authorization: "Bearer token" },
    };
  },
});

// El hijo hereda baseURL, headers, interceptores — y agrega header de versión
const clienteV2 = clienteBase.extend({
  defaultHeaders: { "X-API-Version": "2" },
});

// clienteV2 tiene headers: { 'X-App': 'MiApp', 'X-API-Version': '2' }
// clienteV2 también tiene el interceptor de auth del clienteBase
```

---

## Auto-Paginación

Itera a través de APIs paginadas con generadores asíncronos:

```typescript
interface PageResponse {
  items: User[];
  nextCursor: string | null;
}

for await (const users of client.paginate<PageResponse>("/users", {
  getItems: (data) => data.items,
  getNextPage: (data, config) =>
    data.nextCursor
      ? {
          ...config,
          query: { ...(config.query as any), cursor: data.nextCursor },
        }
      : null,
})) {
  console.log("Página con", users.length, "usuarios");
  // Procesar cada página de usuarios
}
```

La paginación se detiene automáticamente cuando `getNextPage` retorna `null` o una petición falla.

---

## Polling Inteligente

Consulta un endpoint repetidamente hasta que se cumpla una condición:

```typescript
interface Job {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
}

const result = await client.poll<Job>("/jobs/abc123", {
  intervalMs: 2000, // Consultar cada 2 segundos
  maxAttempts: 30, // Rendirse después de 30 intentos (0 = ilimitado)
  until: (job) => job.status === "completed" || job.status === "failed",
  onPoll: (job, attempt) => {
    console.log(`Intento ${attempt}: ${job.status}`);
  },
});

if (result.ok) {
  console.log("Job terminado:", result.value.data.result);
} else if (result.error.code === "POLL_EXHAUSTED") {
  console.log("El polling expiró");
}
```

---

## Cancelación de Peticiones

Cancela todas las peticiones pendientes:

```typescript
// Iniciar varias peticiones
const promise1 = client.get("/lento-1");
const promise2 = client.get("/lento-2");

// Cancelar todo
client.cancelAll();

// O usar AbortSignal para peticiones individuales
const controller = new AbortController();
const result = client.get("/data", { signal: controller.signal });
controller.abort();
```

---

## Validadores

Valida los datos de respuesta antes de que lleguen a tu código:

```typescript
import {
  createSchemaValidator,
  createRequiredFieldsValidator,
  validatorIsArray,
  validatorIsObject,
} from "@bereasoftware/nexa";

// Validador de esquema
const userValidator = createSchemaValidator<User>({
  id: (v) => typeof v === "number",
  name: (v) => typeof v === "string" && (v as string).length > 0,
  email: (v) => typeof v === "string" && (v as string).includes("@"),
});

const result = await client.get<User>("/users/1", {
  validate: userValidator,
});
// Si la validación falla: result.error.code === 'VALIDATION_ERROR'

// Validador de campos requeridos
const result = await client.get("/api/data", {
  validate: createRequiredFieldsValidator(["id", "name", "createdAt"]),
});

// Validador de array
const result = await client.get("/users", {
  validate: validatorIsArray,
});

// Validador de objeto
const result = await client.get("/user/1", {
  validate: validatorIsObject,
});
```

---

## Transformadores

Transforma los datos de respuesta después del parseo:

```typescript
import {
  transformSnakeToCamel,
  transformCamelToSnake,
  transformFlatten,
  createProjectionTransformer,
  createWrapperTransformer,
} from "@bereasoftware/nexa";

// Convertir respuestas snake_case de la API a camelCase
const result = await client.get("/users/1", {
  transform: transformSnakeToCamel,
});
// { first_name: 'John' } → { firstName: 'John' }

// Convertir camelCase a snake_case (para enviar datos)
const result = await client.get("/data", {
  transform: transformCamelToSnake,
});

// Aplanar objetos anidados
const result = await client.get("/nested", {
  transform: transformFlatten,
});
// { user: { name: 'John' } } → { 'user.name': 'John' }

// Seleccionar campos específicos
const result = await client.get("/users/1", {
  transform: createProjectionTransformer(["id", "name"]),
});
// Solo mantiene { id, name } de la respuesta

// Envolver datos en un contenedor
const result = await client.get("/items", {
  transform: createWrapperTransformer("data"),
});
// [1, 2, 3] → { data: [1, 2, 3] }
```

---

## Pipeline de Middleware

Pipeline de middleware estilo Express/Koa para procesamiento avanzado de peticiones:

```typescript
import {
  createPipeline,
  createCacheMiddleware,
  createDedupeMiddleware,
  createStreamingMiddleware,
  type HttpContext,
  type Middleware,
} from "@bereasoftware/nexa";

// Crear middleware personalizado
const loggingMiddleware: Middleware<HttpContext> = async (ctx, next) => {
  console.log(`→ ${ctx.request.method} ${ctx.request.url}`);
  const start = Date.now();
  await next();
  console.log(`← ${ctx.response.status} (${Date.now() - start}ms)`);
};

const authMiddleware: Middleware<HttpContext> = async (ctx, next) => {
  ctx.request.headers["Authorization"] = `Bearer ${getToken()}`;
  await next();
};

// Construir y ejecutar pipeline
const pipeline = createPipeline([
  loggingMiddleware,
  authMiddleware,
  createCacheMiddleware({ ttlMs: 30000 }),
  createDedupeMiddleware(),
]);

const ctx: HttpContext = {
  request: { method: "GET", url: "/users", headers: {} },
  response: { status: 0, headers: {} },
  state: {},
};

await pipeline(ctx);
```

**Middleware pre-construidos:**

| Middleware                            | Descripción                                    |
| ------------------------------------- | ---------------------------------------------- |
| `createCacheMiddleware(options?)`     | Cachea respuestas GET con TTL                  |
| `cacheMiddleware`                     | Caché pre-configurado (60s TTL)                |
| `createDedupeMiddleware(options?)`    | Deduplica peticiones concurrentes idénticas    |
| `dedupeMiddleware`                    | Deduplicación pre-configurada para GET         |
| `createStreamingMiddleware(options?)` | Maneja respuestas streaming con progreso       |
| `streamingMiddleware`                 | Streaming pre-configurado con salida a consola |

---

## Sistema de Plugins

Extiende Nexa con una arquitectura de plugins:

```typescript
import {
  PluginManager,
  LoggerPlugin,
  MetricsPlugin,
  CachePlugin,
  DedupePlugin,
} from "@bereasoftware/nexa";

const manager = new PluginManager();

// Registrar plugins
manager
  .register(LoggerPlugin)
  .register(new MetricsPlugin())
  .register(new CachePlugin(30000)) // 30s TTL
  .register(new DedupePlugin());

// Escuchar eventos
manager.on("request:start", (url) => console.log("Petición a:", url));
manager.on("request:success", (url, status) =>
  console.log("Éxito:", url, status),
);

// Obtener métricas
const metrics = (
  manager.getPlugins().find((p) => p.name === "metrics") as MetricsPlugin
).getMetrics();
console.log(metrics); // { requests: 10, errors: 1, totalTime: 4200, avgTime: 420 }
```

**Crear plugins personalizados:**

```typescript
import type { Plugin } from "@bereasoftware/nexa";

const rateLimitPlugin: Plugin = {
  name: "rate-limit",
  setup(client) {
    // Agregar middleware de rate limiting, event listeners, etc.
    const manager = client as PluginManager;
    manager.on("request:start", () => {
      // Lógica de rate limiting personalizada
    });
  },
};

manager.register(rateLimitPlugin);
```

---

## Streaming

Maneja archivos grandes y respuestas streaming:

```typescript
import { handleStream, streamToFile } from "@bereasoftware/nexa";

// Procesamiento de stream manual
const response = await fetch("https://example.com/archivo-grande");
const data = await handleStream(response, {
  onChunk(chunk) {
    console.log("Chunk recibido:", chunk.length, "bytes");
  },
  onProgress(loaded, total) {
    console.log(`Progreso: ${Math.round((loaded / total) * 100)}%`);
  },
});

// Descargar stream a archivo
const response = await fetch("https://example.com/datos.csv");
await streamToFile(response, "salida.csv");
// Funciona tanto en Node.js (fs.writeFile) como en navegador (descarga Blob)
```

---

## Generics Tipados

Utilidades avanzadas type-safe para diseño de clientes API:

### Cliente API Tipado

```typescript
import { createTypedApiClient, type ApiEndpoint } from "@bereasoftware/nexa";

// Define tu esquema API con tipos completos
interface UserApi {
  getUser: ApiEndpoint<void, User>;
  createUser: ApiEndpoint<CreateUserDto, User>;
  listUsers: ApiEndpoint<void, User[]>;
}

const api = createTypedApiClient<UserApi>({
  getUser: { method: "GET", path: "/users/1", response: {} as User },
  createUser: { method: "POST", path: "/users", response: {} as User },
  listUsers: { method: "GET", path: "/users", response: [] as User[] },
});

// Petición totalmente tipada — conoce los tipos de entrada y salida
const user = await api.request(client, "getUser");
const newUser = await api.request(client, "createUser", {
  name: "Ella",
  email: "ella@example.com",
});
```

### Tipos Branded

```typescript
import {
  createUrl,
  createApiUrl,
  type Url,
  type ApiUrl,
  type FileUrl,
} from "@bereasoftware/nexa";

// Las URLs branded previenen mezclar diferentes tipos de URL en tiempo de compilación
const apiUrl: ApiUrl = createApiUrl("/users/1");
const genericUrl: Url = createUrl("https://example.com");
```

### Type Guards

```typescript
import { createTypeGuard } from "@bereasoftware/nexa";

interface User {
  id: number;
  name: string;
}

const asegurarUser = createTypeGuard<User>(
  (value): value is User =>
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value,
);

const user = asegurarUser(datosDesconocidos); // lanza TypeError si es inválido
```

### Patrón Observable

```typescript
import { TypedObservable } from "@bereasoftware/nexa";

const stream = new TypedObservable<User>();

const sub = stream.subscribe(
  (user) => console.log("Usuario:", user.name),
  (err) => console.error("Error:", err),
  () => console.log("Completado"),
);

// Operadores encadenables
const nombres = stream.filter((user) => user.active).map((user) => user.name);

stream.next({ id: 1, name: "John", active: true });
stream.complete();

sub.unsubscribe();
```

### Defer (Promesa Lazy)

```typescript
import { Defer } from "@bereasoftware/nexa";

const deferred = new Defer<string>();

// Pasar la promesa a los consumidores
algunConsumidor(deferred.promise_());

// Resolver después
deferred.resolve("listo");
// O rechazar
deferred.reject(new Error("falló"));
```

---

## Manejo de Errores

### Códigos de Error

| Código             | Descripción                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `HTTP_ERROR`       | Status HTTP no-2xx (configurable vía `validateStatus`)            |
| `TIMEOUT`          | La petición excedió la duración del timeout                       |
| `NETWORK_ERROR`    | Fallo de red (DNS, conexión rechazada, etc.)                      |
| `ABORTED`          | La petición fue cancelada manualmente                             |
| `VALIDATION_ERROR` | Los datos de respuesta no pasaron la validación                   |
| `POLL_EXHAUSTED`   | El polling alcanzó el máximo de intentos sin cumplir la condición |
| `MAX_RETRIES`      | Todos los intentos de reintento agotados                          |
| `UNKNOWN_ERROR`    | Error no clasificado                                              |

### Clase HttpError

```typescript
import { HttpError, isHttpError } from "@bereasoftware/nexa";

// Verificar si un error es un HttpError
if (isHttpError(error)) {
  console.log(error.status); // Código de status HTTP
  console.log(error.code); // Cadena de código de error
}
```

### Patrón: Manejar Diferentes Tipos de Error

```typescript
const result = await client.get<User>("/users/1");

if (!result.ok) {
  switch (result.error.code) {
    case "TIMEOUT":
      mostrarNotificacion("La petición expiró, intenta de nuevo");
      break;
    case "NETWORK_ERROR":
      mostrarNotificacion("Sin conexión a internet");
      break;
    case "HTTP_ERROR":
      if (result.error.status === 404)
        mostrarNotificacion("Usuario no encontrado");
      else if (result.error.status === 403) redirigirAlLogin();
      break;
    case "VALIDATION_ERROR":
      reportarBug("La API retornó un formato de datos inesperado");
      break;
    default:
      reportarError(result.error);
  }
}
```

---

## Referencia de API

### `createHttpClient(config?: HttpClientConfig): HttpClient`

Función factory para crear una nueva instancia del cliente HTTP.

### Métodos de `HttpClient`

| Método                   | Firma                                                                                 | Descripción                              |
| ------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------- |
| `request`                | `<T>(config: HttpRequestConfig) → Promise<Result<HttpResponse<T>, HttpErrorDetails>>` | Método core de petición                  |
| `get`                    | `<T>(url, config?) → Promise<Result<...>>`                                            | Petición GET                             |
| `post`                   | `<T>(url, body?, config?) → Promise<Result<...>>`                                     | Petición POST                            |
| `put`                    | `<T>(url, body?, config?) → Promise<Result<...>>`                                     | Petición PUT                             |
| `patch`                  | `<T>(url, body?, config?) → Promise<Result<...>>`                                     | Petición PATCH                           |
| `delete`                 | `<T>(url, config?) → Promise<Result<...>>`                                            | Petición DELETE                          |
| `head`                   | `(url, config?) → Promise<Result<...>>`                                               | Petición HEAD                            |
| `options`                | `(url, config?) → Promise<Result<...>>`                                               | Petición OPTIONS                         |
| `extend`                 | `(overrides?: HttpClientConfig) → HttpClient`                                         | Crear cliente hijo                       |
| `paginate`               | `<T>(url, options, config?) → AsyncGenerator<T[]>`                                    | Auto-paginación                          |
| `poll`                   | `<T>(url, options, config?) → Promise<Result<...>>`                                   | Polling inteligente                      |
| `addRequestInterceptor`  | `(interceptor) → Disposer`                                                            | Agregar interceptor de petición          |
| `addResponseInterceptor` | `(interceptor) → Disposer`                                                            | Agregar interceptor de respuesta         |
| `clearInterceptors`      | `() → void`                                                                           | Remover todos los interceptores          |
| `cancelAll`              | `() → void`                                                                           | Cancelar todas las peticiones pendientes |
| `activeRequests`         | `number` (getter)                                                                     | Número de peticiones en vuelo            |
| `queueStats`             | `{ active, pending }` (getter)                                                        | Estadísticas de la cola                  |

### Tipos

| Tipo                  | Descripción                                                                       |
| --------------------- | --------------------------------------------------------------------------------- |
| `Result<T, E>`        | Unión discriminada éxito/fallo                                                    |
| `HttpRequest`         | Configuración de petición (url, method, headers, body, query, params)             |
| `HttpResponse<T>`     | Respuesta con data, status, headers, duration                                     |
| `HttpErrorDetails`    | Error con message, code, status, originalError                                    |
| `HttpRequestConfig`   | Config completa de petición (extiende HttpRequest + retry, cache, hooks, etc.)    |
| `HttpClientConfig`    | Configuración a nivel de cliente                                                  |
| `RequestInterceptor`  | Interceptar peticiones salientes                                                  |
| `ResponseInterceptor` | Interceptar respuestas entrantes                                                  |
| `RetryStrategy`       | Interfaz de lógica de reintento personalizada                                     |
| `CacheStrategy`       | Interfaz de implementación de caché personalizada                                 |
| `Validator`           | Interfaz de validación de respuesta                                               |
| `Transformer`         | Interfaz de transformación de respuesta                                           |
| `PaginateOptions<T>`  | Configuración de paginación                                                       |
| `PollOptions<T>`      | Configuración de polling                                                          |
| `RequestHooks<T>`     | Callbacks de hooks de ciclo de vida                                               |
| `ProgressEvent`       | Datos de progreso de descarga                                                     |
| `ResponseType`        | `'json' \| 'text' \| 'blob' \| 'arrayBuffer' \| 'formData' \| 'stream' \| 'auto'` |
| `Disposer`            | Función que remueve un interceptor                                                |

---

## Formatos de Build

Nexa se distribuye en múltiples formatos de módulo:

| Formato   | Archivo                 | Caso de Uso                               |
| --------- | ----------------------- | ----------------------------------------- |
| **ESM**   | `dist/nexa.es.js`       | Bundlers modernos (Vite, Rollup, esbuild) |
| **CJS**   | `dist/nexa.cjs.js`      | Node.js `require()`                       |
| **UMD**   | `dist/nexa.umd.js`      | Universal (AMD, CJS, global)              |
| **IIFE**  | `dist/nexa.iife.js`     | Tags de script (`<script>`)               |
| **Types** | `dist/types/index.d.ts` | Declaraciones de tipos TypeScript         |

---

## Desarrollo

### Pruebas

**157 tests en total**: 88 tests de HTTP Client + 69 tests de utilities

```bash
# Ejecutar todos los tests
npm test

# Watch mode
npm run test:watch

# Test coverage
npm run test:coverage
```

Los tests usan **Vitest** (globals mode) con BDD style (`describe`/`it`/`expect`).

### Build

```bash
# Generar distribución
npm run build
```

**Configuración de build:**

- **Formatos**: ES, CommonJS, UMD, IIFE
- **Minificación**: OXC (ultra-rápido)
- **Type Definitions**: Bundled en `/dist/types`
- **Tree-shakeable**: Solo importa lo que usas
- **Externas**: `fs` (Node.js only para `streamToFile`)

**Output:**

```
dist/
  ├── nexa.es.js        (24.9 KB, gzip: 7.53 KB)
  ├── nexa.cjs.js       (19.9 KB, gzip: 6.68 KB)
  ├── nexa.umd.js       (19.8 KB, gzip: 6.75 KB)
  ├── nexa.iife.js      (19.6 KB, gzip: 6.68 KB)
  └── types/            (Tipo definitivo .d.ts)
```

### Cobertura de Tests

**Cobertura General: 75.73%** — sólida cobertura de tests unitarios con mocking HTTP

| Componente  | Cobertura  | Detalles                          |
| ----------- | ---------- | --------------------------------- |
| HTTP Client | **80.85%** | 81.25% ramas, 73.43% funciones   |
| Types       | **100%**   | Cobertura perfecta de tipos       |
| Utils       | **71.79%** | 66.66% ramas, 81.14% funciones   |

**HTTP Client** (`test/http-client.test.ts`) — **88 tests**:

- ✓ Métodos core: create, GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS (7 tests)
- ✓ Estrategias de reintentos & timeouts (3 tests)
- ✓ Interceptores & disposal (5 tests)
- ✓ Caché & validación (4 tests)
- ✓ Type safety & extensiones (3 tests)
- ✓ Paginación & polling (5 tests)
- ✓ Manejo de tipos de respuesta: 8+ tipos + auto-detección (13 tests)
- ✓ Detección de content-type binario: image/*, audio/*, video/*, octet-stream (5 tests)
- ✓ Serialización de body: JSON, null, strings, Blob, URLSearchParams, ArrayBuffer, TypedArray, FormData, ReadableStream (7 tests)
- ✓ Normalización de errores: TimeoutError, AbortError, TypeError, unknown, NETWORK_ERROR (5+ tests)
- ✓ Gestión de peticiones: activeRequests, cancelAll, clearCache (2 tests)
- ✓ Verificación de exports: todas las 8 categorías de exports (8 tests)
- ✓ Integración de plugins: LoggerPlugin, MetricsPlugin event handlers (7 tests)
- ✓ Configuración avanzada: null body, direct Blob, abort messages (5+ tests)

**Utilities** (`test/utils.test.ts`) — **69 tests**:

- ✓ Validadores: schema, required fields, type checks (4 tests)
- ✓ Transformadores: snake↔camel case, flatten, projection, wrapper (5 tests)
- ✓ Estrategias de Reintentos: Aggressive, Conservative, Circuit Breaker (10 tests)
- ✓ Timeout & Retry: withTimeout, retry function (6 tests)
- ✓ Caché: CacheStore CRUD, TTL expiry (5 tests)
- ✓ Deduplicación: RequestDeduplicator sharing, cleanup (3 tests)
- ✓ Pipeline de Middleware: ordering, next() guard, legacy pipeline (3 tests)
- ✓ Cache Middleware: GET caching, POST bypass (2 tests)
- ✓ Dedup Middleware: GET dedup, POST bypass (2 tests)
- ✓ Generics Tipados: TypedResponse, TypedObservable (map/filter), Defer, type guards, branded types (9 tests)
- ✓ Plugins: PluginManager, LoggerPlugin, MetricsPlugin, CachePlugin, DedupePlugin (5 tests)

### Limitaciones de Cobertura & Techo Realista

La cobertura de tests unitarios se estabiliza alrededor del **75-80%** debido a limitaciones inherentes del mocking:

**¿Por qué no 95%?**
- **Características de streaming** (~3-5% gap): Download progress tracking usa `ReadableStream.getReader()` que requiere HTTP real — no mockeable con `fetch-mock`
- **Ejemplos de utilities** (~5-10% gap): Patrones de middleware y código de referencia no son ejercitados activamente en producción
- **Archivos solo-export** (~2-3% gap): `http-client/index.ts` verificado vía validación de imports, no testeable por unidad

**Máximos realistas:**
- Unit tests + mocks: **~80-85%** techo (actual: 75.73%)
- Tests de integración requeridos: llegaría a 90%+ pero fuera del alcance del proyecto

El 75.73% de cobertura representa testing exhaustivo de todas las **rutas de código de producción** alcanzables vía mocks HTTP.

---

## Licencia

MIT © [John Andrade](mailto:johnandrade@bereasoft.com) — [@bereasoftware](https://github.com/Berea-Soft)
