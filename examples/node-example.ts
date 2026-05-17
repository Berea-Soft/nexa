import { createHttpClient, ConservativeRetry } from '@bereasoftware/nexa';

const api = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  defaultTimeout: 10000,
  maxConcurrent: 5,
});

api.addRequestInterceptor({
  onRequest(request) {
    const token = process.env.API_TOKEN;
    return {
      ...request,
      headers: { ...request.headers, Authorization: `Bearer ${token}` },
    };
  },
});

api.addResponseInterceptor({
  onError(error) {
    if (error.status === 401) {
      console.error('Unauthorized - check API token');
    }
    return error;
  },
});

export async function getData() {
  const result = await api.get('/data', {
    retry: new ConservativeRetry(3),
    cache: { enabled: true, ttlMs: 60000 },
  });

  if (result.ok) {
    return result.value.data;
  }

  console.error(`Error ${result.error.code}: ${result.error.message}`);
  return null;
}
