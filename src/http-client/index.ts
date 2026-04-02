/**
 * HTTP Client Plugin - Main Exports
 */

export { createHttpClient, HttpClient, HttpError, isHttpError } from './http-client.js';
export type {
  IHttpClient,
  HttpRequest,
  HttpRequestConfig,
  HttpResponse,
  HttpErrorDetails,
  RequestInterceptor,
  ResponseInterceptor,
  RetryStrategy,
  CacheStrategy,
  Validator,
  Transformer,
  HttpClientConfig,
  ResponseType,
  RequestHooks,
  ProgressEvent,
  PaginateOptions,
  PollOptions,
  Disposer,
  Result,
} from '../types/index.js';

export { Ok, Err } from '../types/index.js';

export {
  // Timeout utilities
  withTimeout,
  retry,
  // Validators
  createSchemaValidator,
  createRequiredFieldsValidator,
  validatorIsArray,
  validatorIsObject,
  // Transformers
  transformSnakeToCamel,
  transformCamelToSnake,
  transformFlatten,
  createProjectionTransformer,
  createWrapperTransformer,
  // Retry Strategies
  AggressiveRetry,
  ConservativeRetry,
  CircuitBreakerRetry,
  // Advanced: Cache
  CacheStore,
  createCacheMiddleware,
  cacheMiddleware,
  // Advanced: Request Deduplication
  RequestDeduplicator,
  createDedupeMiddleware,
  dedupeMiddleware,
  // Advanced: Middleware Pipeline
  MiddlewarePipeline,
  createPipeline,
  type Middleware,
  type HttpContext,
  // Advanced: Typed Generics & Observable
  createTypedResponse,
  createTypedRequest,
  createTypedApiClient,
  createTypeGuard,
  createUrl,
  createApiUrl,
  TypedObservable,
  Defer,
  type TypedResponse,
  type ApiEndpoint,
  type ApiSchema,
  type Url,
  type ApiUrl,
  type FileUrl,
  type UnionToIntersection,
  type ResultOf,
  // Advanced: Streaming
  handleStream,
  streamToFile,
  createStreamingMiddleware,
  streamingMiddleware,
  type StreamOptions,
  // Advanced: Plugins
  PluginManager,
  LoggerPlugin,
  MetricsPlugin,
  CachePlugin,
  DedupePlugin,
  type Plugin,
} from '../utils';
