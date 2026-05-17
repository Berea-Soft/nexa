# Contribuir a Nexa

**🇪🇸 Este documento está disponible en español.**  
**🇬🇧 This document is available in English. If you prefer English, please see [CONTRIBUTING.md](CONTRIBUTING.md).**

¡Gracias por tu interés en contribuir a Nexa! Este documento proporciona pautas e instrucciones para contribuir al proyecto.

## Código de Conducta

Por favor, lee y sigue nuestro [Código de Conducta](CODE_OF_CONDUCT.md) antes de participar.

## Empezando

### Prerrequisitos

- Node.js 20 o posterior
- npm 10 o posterior
- TypeScript 6.0 o posterior

### Configuración de desarrollo

1. **Haz un fork del repositorio** en GitHub
2. **Clona tu fork** localmente:
   ```bash
   git clone https://github.com/TU_USUARIO/nexa.git
   cd nexa
   ```
3. **Instala las dependencias**:
   ```bash
   npm install
   ```
4. **Crea una rama** para tu funcionalidad o corrección:
   ```bash
   git checkout -b feature/nombre-de-tu-funcionalidad
   ```

## Estructura del proyecto

```
src/
├── http-client/         # Implementación del cliente HTTP
│   ├── http-client.ts   # Clase principal del cliente HTTP
│   ├── node-http-adapter.ts # Adaptadores de transporte para Node.js
│   └── index.ts         # Exportaciones públicas
├── realtime/            # Comunicación en tiempo real (WebSocket/SSE)
│   ├── websocket-client.ts
│   ├── sse-client.ts
│   ├── plugin.ts
│   └── index.ts
├── types/               # Definiciones de tipos TypeScript
│   └── index.ts
├── utils/               # Utilidades, middleware, sistema de plugins
│   └── index.ts
├── testing/             # Utilidades de testing
│   └── mock-client.ts
└── index.ts             # Punto de entrada principal
```

## Flujo de trabajo de desarrollo

### Ejecutar tests

Usamos Vitest para testing. Ejecuta los tests con:

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con UI
npm run test:ui

# Ejecutar tests con cobertura
npm run test:coverage
```

### Verificación de tipos

```bash
npm run lint
```

### Construcción

```bash
npm run build
```

Esto generará los siguientes archivos en `dist/`:
- `nexa.es.js` (ESM)
- `nexa.cjs.js` (CommonJS)
- `nexa.umd.js` (UMD)
- `nexa.iife.js` (IIFE)
- `types/` (declaraciones TypeScript)

## Hacer cambios

### Pautas de estilo de código

1. **TypeScript**: Usa TypeScript estricto con tipos explícitos
2. **Imports**: Usa sintaxis de módulos ES (`import/export`)
3. **Nomenclatura**:
   - Interfaces: `IHttpClient`, `IRealtimeClient`
   - Clases: `HttpClient`, `WebSocketClient`
   - Funciones: `createHttpClient`, `isHttpError`
   - Variables: `camelCase`
   - Constantes: `UPPER_SNAKE_CASE`
4. **Manejo de errores**: Usa el patrón monádico `Result<T, E>` en lugar de excepciones
5. **Documentación**: Añade comentarios JSDoc para APIs públicas

### Añadir nuevas funcionalidades

1. **Verifica issues existentes** o crea uno nuevo para discutir la funcionalidad
2. **Escribe tests** para tu funcionalidad
3. **Implementa la funcionalidad** siguiendo la arquitectura existente
4. **Actualiza la documentación** (README.md, ejemplos, definiciones de tipos)
5. **Asegúrate de que todos los tests pasen** y el linting sea exitoso

### Corregir bugs

1. **Reproduce el bug** con un test que falle
2. **Corrige el bug** y asegúrate de que el test pase
3. **Añade tests adicionales** para casos extremos

### Añadir ejemplos

Los ejemplos van en el directorio `examples/`. Cada ejemplo debe:
- Demostrar una funcionalidad o caso de uso específico
- Ser autocontenido y ejecutable
- Incluir comentarios explicando el código

## Proceso de Pull Request

1. **Asegúrate de que tu código pase** todos los tests y linting
2. **Actualiza la documentación** según sea necesario
3. **Escribe una descripción clara del PR**:
   - Qué cambios se hicieron
   - Por qué se hicieron
   - Cualquier cambio rompedor
   - Issues relacionados
4. **Usa conventional commits** en tu PR (ver abajo)
5. **Solicita revisión** de los mantenedores

### Pautas para mensajes de commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[ámbito opcional]: <descripción>

[cuerpo opcional]

[pie(s) opcional(es)]
```

Tipos:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de estilo de código (formato, etc.)
- `refactor`: Refactorización de código
- `test`: Añadir o actualizar tests
- `chore`: Tareas de mantenimiento

Ejemplos:
```
feat(http): añadir cliente WebSocket con reconexión automática
fix(cache): manejar invalidación de caché en peticiones POST
docs: actualizar README con nuevas funcionalidades
```

## Desarrollo de plugins

Nexa tiene un sistema de plugins. Al crear plugins:

1. **Extiende la interfaz `Plugin`** desde `src/utils/index.ts`
2. **Registra middleware** a través del `PluginManager`
3. **Emite eventos** para comunicación entre plugins
4. **Añade tests** para tu plugin
5. **Documenta** opciones de configuración y uso

Ejemplo de estructura de plugin:
```typescript
export class MyPlugin implements Plugin {
  name = 'my-plugin';
  
  setup(manager: PluginManager): void {
    manager.addMiddleware(createMyMiddleware());
    manager.on('some-event', this.handleEvent.bind(this));
  }
}
```

## Funcionalidades en tiempo real

Al añadir funcionalidades en tiempo real (WebSocket/SSE):
- Sigue la interfaz existente `IRealtimeClient`
- Implementa reconexión automática
- Añade soporte de heartbeat
- Integra con el sistema de plugins
- Soporta múltiples entornos (Browser, Node.js, Deno, Bun, Cloudflare)

## Pautas de testing

- **Tests unitarios**: Prueba funciones y clases individuales
- **Tests de integración**: Prueba el cliente HTTP con servidor mock
- **Casos extremos**: Prueba condiciones de error y casos límite
- **Rendimiento**: Considera añadir benchmarks para rutas críticas

Usa el mock client existente para testing HTTP:
```typescript
import { createMockClient } from '@bereasoftware/nexa/testing';

const mockClient = createMockClient();
mockClient.mockResponse('/api/users', { users: [] });
```

## Documentación

- **README.md**: Documentación principal (español)
- **README.en.md**: Documentación en inglés
- **Comentarios JSDoc**: Todas las APIs públicas
- **Ejemplos**: Ejemplos de uso práctico
- **Definiciones de tipos**: Auto-documentación a través de TypeScript

## ¿Preguntas o necesitas ayuda?

- **Abre un issue** para bugs o solicitudes de funcionalidad
- **Inicia una discusión** para preguntas sobre implementación
- **Email**: johnandrade@bereasoft.com

¡Gracias por contribuir a Nexa! 🚀