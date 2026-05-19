# Nexa Backlog

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
