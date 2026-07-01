# Nexa Backlog

## Feature: método HTTP QUERY (2026-07-01)

**Hecho**: se agregó soporte para el método HTTP `QUERY` (propuesta IETF: seguro, idempotente, cacheable como `GET`, pero con body JSON — para búsquedas/filtros complejos que no entran en una URL).

- `client.query<T>(url, body?, config?)` en `HttpClient` (mirror de `post`, pero method `'QUERY'`).
- `IHttpClient.query()` agregado a la interfaz pública.
- `'QUERY'` sumado al union de `HttpRequest.method` y `ApiEndpoint.method`.
- Caché habilitada para `QUERY` igual que `GET` (`isCacheableMethod()`), con el body incluido en `getCacheKey()` — dos bodies distintos a la misma URL no colisionan en caché.
- `node-http-adapter.ts` no necesitó cambios: el método se pasa como string crudo a `http.request()`/`session.request()` y el body se escribe según su presencia, no según el método. Verificado con test de integración real (`test/node-adapters.test.ts`) contra un servidor Node real.
- `createTypedRequest`/`createTypedApiClient` (`utils/index.ts`) soportan `method: 'QUERY'`.
- `mock-client.ts`: nuevo `onQuery(urlPattern)` en `MockAdapter`.
- **Bonus** (pedido explícito del usuario: "todo lo que mejore la librería de lo propuesto"): se mejoró la serialización de `config.query` — antes solo soportaba `Record<string, string|number|boolean>` vía `String(value)` plano. Ahora (`buildQueryString()` en `http-client.ts`):
  - Arrays → claves repetidas (`?tag=a&tag=b`)
  - Un nivel de objetos anidados → notación de corchetes (`?filter[status]=active`)
  - `null`/`undefined` → se omiten (antes se serializaban como la cadena literal `"null"`/`"undefined"`)
- Documentado en README.md y README.en.md (sección de métodos HTTP + parámetros de query).
- Tests: `http-client.test.ts` (método QUERY básico, caché keyed por body, serialización de arrays/objetos anidados/null), `mock-client.test.ts` (`onQuery`), `utils.test.ts` (`createTypedRequest` con QUERY), `node-adapters.test.ts` (integración real HTTP/1.1).
- **No incluido**: HTTP/2 no tiene un test de integración dedicado para QUERY con body (el servidor de test HTTP/2 no tiene ruta echo) — cubierto indirectamente por el mismo code path que ya prueba FormData/URLSearchParams en HTTP/2.

## Milestone sugerido: v1.7.0 (auditoría de código 2026-07-01)

**Estado**: 17/17 hechos (5/5 P0, 6/6 P1, 6/6 P2). Todos los fixes de código tienen test de regresión, salvo el escenario exacto de "stream error a mitad de body" (ver nota, deuda de test aceptada). Type-check, lint, prettier y suite completa (257/257) en verde.

**Cambio de API pública (breaking, no publicado aún)**: `IRealtimeClient.send()` y `IWebSocketClient.sendJson()` ahora devuelven `Result<void, RealtimeSendError>` en vez de lanzar. Ver CHANGELOG.md.

### P0

- [x] `fix(dev-overlay): escape untrusted request data before rendering via innerHTML`
  Objetivo: evitar XSS cuando una URL, header o body de una request contiene HTML/JS malicioso.
  Criterio de aceptación: `overlay.ts` escapa toda cadena proveniente de red antes de insertarla en el DOM (`r.url`, `request.url`, `formatJson(body/headers)`); existe test que verifica que un payload `<img onerror=...>` se renderiza como texto plano.
  Hecho: se agregó `escapeHtml()` en `overlay.ts` y se aplicó en los 5 puntos de inyección. Tests en `test/dev-overlay.test.ts` (lista de requests y vista de detalle con body/headers maliciosos).

- [x] `fix(node-http-adapter): handle response stream 'error' event`
  Objetivo: evitar que una promesa quede colgada indefinidamente si el stream de respuesta falla a mitad de body.
  Criterio de aceptación: `createResponse` escucha `'error'` en `nodeRes` y rechaza la promesa; existe test que simula un error de stream.
  Hecho: `createResponse` ahora rechaza la promesa en `nodeRes.on('error', reject)`. **Pendiente real**: no se agregó un test que reproduzca el escenario exacto de socket destruido a mitad de body — es frágil de reproducir de forma determinista entre versiones de Node con un servidor HTTP real; queda como deuda de test.

- [x] `test(node-http-adapter): add coverage for retry, timeout, abort and HTTP/2 pool`
  Objetivo: cubrir las ~500 líneas de `node-http-adapter.ts` que hoy no tienen ningún test.
  Criterio de aceptación: existe `node-http-adapter.test.ts` cubriendo `nodeHttpAdapter`, `nodeHttp2Adapter` y `Http2SessionPool` (idle cleanup, error/close eviction, abort/timeout races).
  Hecho: `node-adapters.test.ts` ya cubría timeout/abort/errores HTTP/POST body para HTTP/1.1 y HTTP/2; se agregaron tests de rechazo de `FormData`/`URLSearchParams`. `http2-session-pool.test.ts` ya cubre idle cleanup, eviction por request count, stats y `closeAll`. Sin cubrir: el escenario de stream-error (ver punto anterior).

- [x] `fix(realtime): clean up native listeners on SSE/WebSocket reconnect`
  Objetivo: evitar fugas de memoria y entrega duplicada de eventos al reconectar repetidamente.
  Criterio de aceptación: `onEvent` en `sse-client.ts` y `startHeartbeat` en `websocket-client.ts` remueven el listener nativo anterior antes de registrar uno nuevo; hay test que verifica que tras N reconexiones solo hay un listener activo.
  Hecho: `sse-client.ts` trackea listeners nativos por evento y los re-adjunta en cada reconexión; `websocket-client.ts` desuscribe el listener de pong anterior en cada `startHeartbeat`. Tests nuevos en `test/realtime.test.ts` con `EventSource`/`WebSocket` fake.

- [x] `fix(realtime): implement or explicitly disable NodeSSEClient support`
  Objetivo: dejar de exportar `createSSEClient` como si funcionara en Node cuando `connect()` siempre lanza "requiere un polyfill".
  Criterio de aceptación: o se implementa un parser SSE real basado en streams de Node, o se documenta explícitamente que el cliente SSE es browser-only y se lanza un error claro y temprano (no en tiempo de conexión).
  Hecho: se optó por la opción "explícita" — `NodeSSEClient` ahora lanza en el constructor (no en `connect()`) con un mensaje claro de que es browser-only. Test en `test/realtime.test.ts`. No se implementó un parser SSE real para Node (queda como feature separada si se decide abordarla).

### P1

- [x] `fix(http-client): remove stale abort listener after each retry attempt`
  Objetivo: evitar acumulación de listeners en `config.signal` a través de reintentos.
  Criterio de aceptación: el listener se captura y remueve en el `finally` de cada intento; test verifica que tras varios retries solo queda un listener registrado.
  Hecho: `finally` por intento que remueve el listener de `config.signal`. Test en `http-client.test.ts` que espía `addEventListener`/`removeEventListener` del signal y verifica 1:1 por intento.

- [x] `fix(dev-overlay): track retry as a new request instead of mutating the original`
  Objetivo: reportar correctamente la duración y el estado real del retry en vez de sobreescribir el request original.
  Criterio de aceptación: `retrySelected` crea una nueva entrada vía `tracker.track()` en lugar de mutar `selectedRequest`.
  Hecho: `retrySelected` ahora llama `tracker.track()` con el resultado del retry (éxito o error de red) y muestra la nueva entrada. Test en `test/dev-overlay.test.ts` que simula el click en "Retry" y verifica que el original queda intacto y aparece una entrada nueva.

- [x] `fix(node-http-adapter): reject explicitly for unsupported body types`
  Objetivo: evitar que `FormData`, `URLSearchParams` o `ReadableStream` se envíen como body vacío sin avisar.
  Criterio de aceptación: escribir el body lanza/rechaza con un error claro para tipos no soportados, en vez de enviar una request vacía silenciosamente.
  Hecho: `getUnsupportedBodyType()` detecta `FormData`/`URLSearchParams`/`Blob`/`ReadableStream` y rechaza con mensaje explícito en ambos adapters (HTTP/1.1 y HTTP/2). Tests en `node-adapters.test.ts`.

- [x] `fix(testing): make mock-client .timeout() exceed the configured timeout`
  Objetivo: que los tests contra el mock ejerciten el mismo path de `TimeoutError` que el cliente real.
  Criterio de aceptación: `.timeout()` retrasa la respuesta más allá del timeout configurado en vez de devolver un 408 instantáneo.
  Hecho: `.timeout()` ahora usa un delay de ~24.8 días (`MAX_MOCK_DELAY_MS`) para que el `AbortController` del cliente dispare primero. Se actualizaron los 2 tests existentes que dependían del 408 instantáneo (`mock-client.test.ts`, `test/examples/vitest.integration.test.ts`) para pasar `{ timeout: 20 }` y esperar `code: 'TIMEOUT'`.

- [x] `fix(http-client): fix duration calculation in fast-path catch block`
  Objetivo: reportar duración real en vez de un valor cercano a 0.
  Criterio de aceptación: la rama catch usa `performance.now() - startTime`, igual que la rama de éxito.
  Hecho: `startTime` se movió fuera del `try` para que sea visible en el `catch`. Test en `http-client.test.ts` con un `devTracker` que verifica que la duración reportada es ≥ al delay real del fetch fallido.

- [x] `fix(utils): guard schema/required-field validators against non-object input`
  Objetivo: evitar que `validate(null)` o `validate(42)` lance una excepción no controlada.
  Criterio de aceptación: los validadores devuelven un `Err` tipado para input no-objeto en vez de lanzar.
  Hecho: ambos validadores retornan `Err({ code: 'VALIDATION_ERROR' })` para `null`/no-objeto antes de tocar `Object.entries`/`in`. Tests en `utils.test.ts`.

- [x] `fix(utils): make flatten() handle nested arrays consistently`
  Objetivo: eliminar la asimetría entre arrays top-level (explotados en `[0]`, `[1]`) y arrays anidados dentro de objetos (dejados como valor crudo).
  Criterio de aceptación: `flatten()` aplica la misma lógica de recursión a arrays sin importar su profundidad, con test de cobertura.
  Hecho: se removió la exclusión `!Array.isArray(value)` en la rama de objetos. Test en `utils.test.ts` que compara el flatten de un array top-level vs. uno anidado.

### P2

- [x] `refactor(dev-overlay): split overlay.ts into smaller modules`
  Objetivo: reducir la complejidad del archivo de 1510 líneas que mezcla estilos, DOM, eventos y lógica de negocio.
  Criterio de aceptación: `STYLES`/`ICONS`/`COLORS` y funciones de render (`renderRequestList`, `renderMetrics`, `showDetail`) viven en módulos separados y testeables.
  Hecho: `overlay.ts` bajó de ~1535 a 819 líneas. Nuevos módulos: `theme.ts` (ICONS/COLORS/STYLES, 548 líneas de datos puros), `env.ts` (`isDevelopmentEnv`), `format.ts` (`escapeHtml`/`truncateUrl`/`formatJson`), `render.ts` (`filterRequests`/`renderRequestListHtml`/`renderMetricsHtml`/`renderDetailHtml` — funciones puras que reciben datos y devuelven HTML, sin `this` ni DOM). La clase `DevOverlayUI` quedó como orquestador delgado (query DOM + wiring de eventos + llamado a las funciones puras). Verificado sin regresiones: 257/257 tests en verde.

- [x] `perf(dev-overlay): use a ring buffer for tracker history`
  Objetivo: evitar el costo O(n) de `unshift`/`pop` en cada request trackeada.
  Criterio de aceptación: `RequestTracker` mantiene `maxHistory` con complejidad O(1) amortizada por inserción.
  Hecho: `tracker.ts` reemplazó el array + `unshift`/`pop` por un ring buffer (`buffer`/`writeIndex`/`count`) con inserción O(1). `updateConfig()` redimensiona el buffer preservando las entradas más recientes cuando `maxHistory` cambia. Tests en `test/dev-overlay.test.ts` (eviction, resize hacia arriba y hacia abajo).

- [x] `fix(dev-overlay): return a copy from getHistory()`
  Objetivo: evitar que consumidores muten el estado interno del tracker por referencia.
  Criterio de aceptación: `getHistory()` devuelve un array copiado o congelado.
  Hecho: resuelto junto con el ring buffer — `getHistory()` reconstruye un array nuevo (newest-first) en cada llamada, ya no expone el array interno. Test que muta el resultado y verifica que el estado interno no cambia.

- [x] `feat(realtime): add jitter to reconnect backoff`
  Objetivo: evitar thundering herd cuando muchos clientes reconectan a la vez.
  Criterio de aceptación: el backoff exponencial de SSE/WebSocket incluye jitter, igual que el retry del http-client.
  Hecho: `scheduleReconnect()` en `sse-client.ts` y `websocket-client.ts` agrega hasta un 10% de jitter sobre el backoff exponencial (mismo patrón que `ExponentialBackoffRetry` de `http-client.ts`). Tests en `test/realtime.test.ts` que verifican el rango del delay vía spy de `setTimeout`.

- [x] `refactor(realtime): use Result<T,E> pattern in send() instead of throwing`
  Objetivo: mantener consistencia de manejo de errores con el resto de la librería.
  Criterio de aceptación: `send()` en `sse-client.ts`/`websocket-client.ts` devuelve `Result<T,E>` en vez de lanzar.
  Hecho: **breaking change de API pública** (proyecto en 1.6.0, aceptado explícitamente). Se agregó `RealtimeSendError` (`types/index.ts`) y `IRealtimeClient.send()`/`IWebSocketClient.sendJson()` ahora devuelven `Result<void, RealtimeSendError>`. `BrowserSSEClient.send()` devuelve `Err({code:'UNSUPPORTED'})`; `BrowserWebSocketClient.send()` devuelve `Err({code:'NOT_CONNECTED'})` o `Err({code:'SEND_FAILED'})`, u `Ok(undefined)`. El heartbeat interno (`checkPong`) ya no depende de que `send()` lance — emite `websocket:heartbeat:send-failed` si falla. README.md actualizado. Tests en `test/realtime.test.ts`. Documentado en CHANGELOG.md.

- [x] `test(realtime): add coverage for sse-client, websocket-client and plugin`
  Objetivo: cubrir reconexión/backoff, heartbeat ping/pong, cierre por código y fallback en Node.
  Criterio de aceptación: existen archivos de test para los tres módulos, hoy sin ninguna cobertura.
  Hecho: `test/realtime.test.ts` cubre: re-adjuntado de listeners en reconexión (SSE y WS), fail-fast de `NodeSSEClient`, jitter del backoff (SSE y WS), timeout de heartbeat disparando `disconnect()`, pong recibido manteniendo la conexión viva, contrato `Result` de `send()`/`sendJson()`, y `RealtimePlugin` (namespace `realtime:*`). 12 tests en total. No cubierto: parsing real de SSE en Node (no aplica, `NodeSSEClient` es fail-fast) ni `NodeWebSocketClient` (requiere el paquete opcional `ws`).

- [x] `test(utils): add coverage for createTypedApiClient/createTypedRequest`
  Objetivo: cubrir ~60 líneas sin ningún test que hoy dependen solo de casts sin validación runtime.
  Criterio de aceptación: existen tests que ejercitan un `IHttpClient` mockeado a través de ambas funciones.
  Hecho: al escribir los tests se encontró y corrigió un bug real — `createTypedRequest` nunca desenvolvía el `Result<HttpResponse<T>, HttpErrorDetails>` que devuelve `IHttpClient`, sino que casteaba el wrapper completo como si fuera la respuesta (`response as TResponse`). Ahora desenvuelve correctamente: devuelve `result.value.data` en éxito y lanza `Error(result.error.message)` en fallo. 4 tests en `utils.test.ts` (unwrap de éxito, throw en error, body pass-through, y `createTypedApiClient` con múltiples endpoints).

## Milestone sugerido: v1.4.0

### P0

- [x] `fix(dev-overlay): remove global listeners on destroy`
  Objetivo: evitar listeners duplicados y fugas al crear/destruir el overlay varias veces.
  Criterio de aceptación: abrir, destruir y recrear el overlay no duplica atajos ni eventos globales.

- [x] `fix(dev-overlay): guard browser-only APIs for SSR and Node environments`
  Objetivo: impedir que el overlay rompa en SSR o Node por uso directo de `document`, `window` o `requestAnimationFrame`.
  Criterio de aceptación: importar Nexa en entornos sin DOM no falla por el overlay.

- [x] `fix(dev-overlay): replace hardcoded repo asset path with inline or configurable icon`
  Objetivo: eliminar la dependencia de `/src/assets/faviconNew.png` dentro del paquete publicado.
  Criterio de aceptación: el overlay renderiza su identidad visual correctamente desde npm.

- [x] `test(dev-overlay): add tracker and lifecycle coverage`
  Objetivo: agregar tests para `RequestTracker`, singleton overlay y cleanup.
  Criterio de aceptación: el overlay tiene cobertura base y pasa en CI.

### P1

- [x] `refactor(esm): normalize root exports to explicit ESM-compatible paths`
  Objetivo: unificar el patrón de imports/exports del proyecto.
  Criterio de aceptación: `src/index.ts` y los submódulos siguen una convención consistente y estable.

- [x] `design(api): define dev-overlay stability and public support level`
  Objetivo: decidir si el overlay es `experimental`, `stable` o estrictamente `dev-only`.
  Criterio de aceptación: la API pública del overlay queda definida y comunicada de forma explícita.

- [x] `ci: use frozen lockfile in GitHub Actions`
  Objetivo: hacer instalaciones reproducibles en CI.
  Criterio de aceptación: el workflow usa `pnpm install --frozen-lockfile`.

- [x] `ci(release): decide and document manual release behavior`
  Objetivo: dejar claro si `release` debe correr o no con `workflow_dispatch`.
  Criterio de aceptación: la política de release queda implementada y documentada.

- [x] `docs(dev-overlay): document setup, scope and limitations`
  Objetivo: documentar cómo se usa el overlay, en qué entornos aplica y qué límites tiene.
  Criterio de aceptación: `README.md` y `README.en.md` incluyen sección del overlay.

- [x] `docs(product): add overlay screenshot or gif`
  Objetivo: hacer visible la feature en docs y promoción.
  Criterio de aceptación: existe al menos una demo visual reutilizable.

- [x] `docs(api): clarify dev-overlay exports in public documentation`
  Objetivo: documentar `createDevOverlay`, `getDevOverlay`, `destroyDevOverlay` y `RequestTracker`.
  Criterio de aceptación: la documentación explica propósito, uso esperado y alcance de esos exports.

- [x] `docs(product): strengthen Nexa positioning around observability and DX`
  Objetivo: reforzar que Nexa no es solo un cliente HTTP, sino también una herramienta con observabilidad integrada.
  Criterio de aceptación: README, examples y material promocional reflejan esa diferenciación.

### P2

- [x] `feat(dev-overlay): persist panel state and preferences`
  Objetivo: recordar visibilidad, posición o preferencias básicas.
  Criterio de aceptación: el overlay conserva estado útil entre sesiones o recreaciones.

- [x] `feat(dev-overlay): add copy-as-fetch and export history actions`
  Objetivo: mejorar el valor del overlay como herramienta de debugging.
  Criterio de aceptación: se pueden reutilizar requests fuera del overlay.

- [x] `feat(dev-overlay): allow configurable branding or icon customization`
  Objetivo: evitar branding rígido y facilitar integración en distintos proyectos.
  Criterio de aceptación: el overlay permite configurar o sustituir su icono/identidad visual.

- [x] `feat(dev-overlay): improve filter model with status and time-based views`
  Objetivo: hacer el overlay más útil en flujos con mucho tráfico.
  Criterio de aceptación: se puede filtrar de forma más precisa por categorías relevantes.

- [x] `test(http2): expand error and abort coverage for node adapters`
  Objetivo: cubrir mejor cancelación, timeout y errores de stream en HTTP/2.
  Criterio de aceptación: existen pruebas específicas para esos escenarios.

- [x] `test(node-adapters): expand coverage for abort and timeout behavior in HTTP/1.1`
  Objetivo: asegurar consistencia entre adapters Node y HTTP/2.
  Criterio de aceptación: hay pruebas para cancelación, timeout y errores importantes en HTTP/1.1.

- [x] `chore(build): remove deprecated Vite inlineDynamicImports config`
  Objetivo: eliminar warning de build y limpiar configuración redundante.
  Criterio de aceptación: `pnpm build` no muestra ese warning.

- [x] `chore(examples): add focused dev-overlay examples or demo page`
  Objetivo: mostrar el overlay en un flujo fácil de probar y compartir.
  Criterio de aceptación: existe un ejemplo reproducible que demuestre el overlay.

## Recomendación de ejecución

1. Completar todos los P0.
2. Hacer `ci: use frozen lockfile in GitHub Actions`.
3. Documentar el overlay en ambos README.
4. Añadir demo visual del overlay.

## Quick Wins

- [x] `ci: use frozen lockfile in GitHub Actions`
- [x] `ci(release): decide and document manual release behavior`
- [x] `chore(build): remove deprecated Vite inlineDynamicImports config`
- [x] `docs(dev-overlay): document setup, scope and limitations`
- [x] `docs(api): clarify dev-overlay exports in public documentation`
- [x] `docs(product): add overlay screenshot or gif`
- [x] `docs(product): strengthen Nexa positioning around observability and DX`
- [x] `chore(examples): add focused dev-overlay examples or demo page`

## Cambios Estructurales

- [x] `fix(dev-overlay): remove global listeners on destroy`
- [x] `fix(dev-overlay): guard browser-only APIs for SSR and Node environments`
- [x] `fix(dev-overlay): replace hardcoded repo asset path with inline or configurable icon`
- [x] `test(dev-overlay): add tracker and lifecycle coverage`
- [x] `refactor(esm): normalize root exports to explicit ESM-compatible paths`
- [x] `design(api): define dev-overlay stability and public support level`
- [x] `feat(dev-overlay): persist panel state and preferences`
- [x] `feat(dev-overlay): add copy-as-fetch and export history actions`
- [x] `feat(dev-overlay): allow configurable branding or icon customization`
- [x] `feat(dev-overlay): improve filter model with status and time-based views`
- [x] `test(http2): expand error and abort coverage for node adapters`
- [x] `test(node-adapters): expand coverage for abort and timeout behavior in HTTP/1.1`

## Siguiente Release Recomendada

### v1.4.0

- [x] `fix(dev-overlay): remove global listeners on destroy`
- [x] `fix(dev-overlay): guard browser-only APIs for SSR and Node environments`
- [x] `fix(dev-overlay): replace hardcoded repo asset path with inline or configurable icon`
- [x] `test(dev-overlay): add tracker and lifecycle coverage`
- [x] `ci: use frozen lockfile in GitHub Actions`
- [x] `docs(dev-overlay): document setup, scope and limitations`
- [x] `docs(api): clarify dev-overlay exports in public documentation`
- [x] `chore(build): remove deprecated Vite inlineDynamicImports config`

### v1.4.1+

- [x] `refactor(esm): normalize root exports to explicit ESM-compatible paths`
- [x] `design(api): define dev-overlay stability and public support level`
- [x] `feat(dev-overlay): persist panel state and preferences`
- [x] `feat(dev-overlay): add copy-as-fetch and export history actions`
- [x] `feat(dev-overlay): allow configurable branding or icon customization`
- [x] `feat(dev-overlay): improve filter model with status and time-based views`
- [x] `test(http2): expand error and abort coverage for node adapters`
- [x] `test(node-adapters): expand coverage for abort and timeout behavior in HTTP/1.1`
