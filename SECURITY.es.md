# Política de Seguridad

**🇪🇸 Este documento está disponible en español.**  
**🇬🇧 This document is available in English. If you prefer English, please see [SECURITY.md](SECURITY.md).**

## Reportar una Vulnerabilidad

Tomamos la seguridad de Nexa seriamente. Si crees que has encontrado una vulnerabilidad de seguridad, por favor repórtala siguiendo las pautas a continuación.

### **No reportes vulnerabilidades de seguridad a través de issues públicos de GitHub.**

En su lugar, por favor repórtalas vía email a **johnandrade@bereasoft.com**.

### Qué incluir en tu reporte

Para ayudarnos a entender y resolver el problema rápidamente, por favor incluye:

1. **Tipo de vulnerabilidad** (ej., XSS, CSRF, SSRF, bypass de autenticación, etc.)
2. **Versiones afectadas** de Nexa
3. **Pasos para reproducir** la vulnerabilidad
4. **Impacto potencial** de la vulnerabilidad
5. **Solución sugerida** (si tienes una)
6. **Prueba de concepto** o código de exploit (si aplica)

### Línea de tiempo de respuesta

- **Respuesta inicial**: Dentro de 48 horas
- **Evaluación**: Dentro de 7 días
- **Desarrollo de solución**: Depende de la complejidad
- **Divulgación pública**: Después de que se libere una solución y los usuarios hayan tenido tiempo de actualizar

## Consideraciones de seguridad para Nexa

Nexa es una librería cliente HTTP que maneja comunicación de red. Áreas clave de seguridad incluyen:

### 1. **Seguridad de transporte**
   - Siempre usa HTTPS en producción
   - Valida certificados SSL (comportamiento por defecto)
   - Considera implementar certificate pinning para aplicaciones críticas

### 2. **Autenticación y credenciales**
   - Almacena API keys y tokens de forma segura (no en código del lado del cliente)
   - Usa variables de entorno o gestión segura de secretos
   - Implementa flujos de autenticación apropiados (OAuth2, JWT, etc.)

### 3. **Validación de entrada**
   - Valida todas las entradas antes de enviar peticiones
   - Sanea URLs y parámetros para prevenir ataques de inyección
   - Usa tipos TypeScript para validación en tiempo de compilación

### 4. **Manejo de errores**
   - Evita exponer información sensible en mensajes de error
   - Registra errores apropiadamente sin filtrar credenciales
   - Implementa circuit breakers para prevenir fallos en cascada

### 5. **Limitación de tasa**
   - Usa el middleware de limitación de tasa incorporado para protección de API
   - Implementa colas de peticiones para aplicaciones de alto volumen
   - Monitorea patrones anormales de peticiones

### 6. **Comunicación en tiempo real**
   - Valida conexiones WebSocket/Secure WebSocket (WSS)
   - Implementa validación de mensajes para datos en tiempo real
   - Usa canales seguros para comunicación en tiempo real sensible

## Características de seguridad en Nexa

### Protecciones incorporadas
- **Validación de peticiones**: Interfaces TypeScript para todos los tipos de petición/respuesta
- **Contención de errores**: Monad `Result<T, E>` previene fugas de excepciones
- **Protección de timeout**: Timeouts de conexión y respuesta
- **Circuit breaker**: Previene fallos en cascada
- **Limitación de tasa**: Middleware incorporado para throttling de peticiones

### Seguridad de plugins
- **Plugins sandboxed**: Los plugins se ejecutan en entorno controlado
- **Pipeline de middleware**: Transformación segura de petición/respuesta
- **Sistema de eventos**: Emisión controlada de eventos entre plugins

### Seguridad en tiempo real
- **Soporte Secure WebSocket**: Soporte de protocolo WSS
- **Validación de mensajes**: Manejo de mensajes type-safe
- **Gestión de conexiones**: Lógica de reconexión segura

### Acceso a red y seguridad de la cadena de suministro
- **Módulos incorporados solamente**: Nexa usa importaciones dinámicas solo para módulos incorporados de Node.js (`http`, `https`, `http2`, `fs`)
- **Dependencias opcionales**: El soporte WebSocket requiere el paquete opcional `ws`, que debe ser instalado explícitamente por el usuario
- **Sin descargas automáticas**: Nexa no descarga ni ejecuta código de fuentes externas en tiempo de ejecución
- **Acceso a red transparente**: Como librería cliente HTTP, Nexa realiza peticiones de red según las instrucciones del código del usuario

## Mejores prácticas para usuarios

### Configuración
```typescript
import { createHttpClient } from '@bereasoftware/nexa';

const client = createHttpClient({
  // Siempre usa HTTPS en producción
  baseURL: 'https://api.example.com',
  
  // Establece timeouts razonables
  defaultTimeout: 30000,
});
```

### Autenticación
```typescript
// Almacena tokens de forma segura (no en código fuente)
const token = process.env.API_TOKEN;

const authenticatedClient = client.extend({
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### Manejo de errores
```typescript
const result = await client.get('/api/data');

if (!result.ok) {
  // Registra error sin exponer datos sensibles
  console.error('Petición fallida:', result.error.message);
  // Maneja el error apropiadamente
}
```

## Actualizaciones de seguridad

### Versionado
Seguimos [Versionado Semántico](https://semver.org/):
- **Versiones mayores**: Pueden contener cambios rompedores, actualizaciones de seguridad
- **Versiones menores**: Nuevas funcionalidades, compatibles con versiones anteriores
- **Versiones de parche**: Correcciones de bugs, parches de seguridad

### Estrategia de actualización
- **Correcciones de seguridad críticas**: Liberadas como versiones de parche
- **Mejoras de seguridad**: Liberadas en versiones menores
- **Cambios de seguridad rompedores**: Liberados en versiones mayores con guías de migración

## Proceso de divulgación de vulnerabilidades

1. **Reporte privado**: Vulnerabilidad reportada vía email
2. **Reconocimiento**: Confirmamos recepción dentro de 48 horas
3. **Investigación**: Investigamos y confirmamos la vulnerabilidad
4. **Desarrollo de solución**: Desarrollamos y probamos una solución
5. **Liberación**: Liberamos una versión parcheada
6. **Divulgación**: Divulgamos públicamente la vulnerabilidad después de que los usuarios hayan actualizado
7. **Crédito**: Acreditamos al reportero (si lo desea)

## Versiones soportadas

| Versión | Soporte              | Actualizaciones de seguridad hasta |
|---------|----------------------|-----------------------------------|
| 1.x.x   | ✅ Sí                | Por determinar                    |
| < 1.0   | ❌ No                | N/A                               |

## Dependencias de terceros

Nexa tiene **cero dependencias de tiempo de ejecución** para el cliente HTTP central. Sin embargo, usamos dependencias de desarrollo:

- **TypeScript**: Verificación de tipos en tiempo de compilación
- **Vitest**: Framework de testing
- **Vite**: Herramienta de construcción
- **vite-plugin-dts**: Generación de tipos

Todas las dependencias son auditadas y actualizadas regularmente.

### Nota sobre vulnerabilidades del CLI de npm

Al ejecutar `npm audit` en Nexa, puedes ver vulnerabilidades reportadas en `node_modules/npm/node_modules/`. Estas son vulnerabilidades en la herramienta CLI de npm misma, no en las dependencias de Nexa. Nexa tiene cero dependencias de producción, por lo que estas vulnerabilidades no afectan a las aplicaciones que usan Nexa.

Para abordar vulnerabilidades del CLI de npm:
1. Actualiza Node.js a la última versión LTS
2. Actualiza npm globalmente: `npm install -g npm@latest`
3. El pipeline de CI para Nexa usa `--audit-level=critical` para ignorar vulnerabilidades no críticas en herramientas de desarrollo

## Contacto

- **Email de seguridad**: johnandrade@bereasoft.com
- **GitHub Issues**: Para problemas no relacionados con seguridad
- **Documentación**: [README.md](README.md)

## Agradecimientos

Agradecemos a los investigadores de seguridad y miembros de la comunidad que ayudan a mantener seguro a Nexa.

---

*Esta política de seguridad está adaptada de las mejores prácticas en gestión de seguridad de código abierto.*
