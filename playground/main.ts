import { createHttpClient, createDevOverlay } from '../src';

const { tracker, ui } = createDevOverlay({
  position: 'bottom-right',
  theme: 'dark',
  maxHistory: 200,
});

const client = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  devTracker: tracker,
});

const statusEl = document.getElementById('status')!;

function setStatus(msg: string, type: 'ok' | 'err' | 'info' = 'info'): void {
  statusEl.innerHTML = `<span class="${type}">${msg}</span>`;
}

function trackResult(result: { ok: boolean; error?: { message: string; code?: string }; value?: { status: number; duration: number } }, label: string): void {
  if (result.ok) {
    setStatus(`${label} → ${result.value!.status} (${result.value!.duration.toFixed(0)}ms)`, 'ok');
  } else {
    setStatus(`${label} → ${result.error!.code || 'ERROR'}: ${result.error!.message}`, 'err');
  }
}

document.getElementById('btn-get')!.addEventListener('click', async () => {
  setStatus('GET /users...', 'info');
  const result = await client.get('/users');
  trackResult(result, 'GET /users');
});

document.getElementById('btn-post')!.addEventListener('click', async () => {
  setStatus('POST /posts...', 'info');
  const result = await client.post('/posts', { title: 'Nexa Test', body: 'Testing dev overlay', userId: 1 });
  trackResult(result, 'POST /posts');
});

document.getElementById('btn-put')!.addEventListener('click', async () => {
  setStatus('PUT /posts/1...', 'info');
  const result = await client.put('/posts/1', { id: 1, title: 'Updated', body: 'Updated body', userId: 1 });
  trackResult(result, 'PUT /posts/1');
});

document.getElementById('btn-patch')!.addEventListener('click', async () => {
  setStatus('PATCH /posts/1...', 'info');
  const result = await client.patch('/posts/1', { title: 'Patched' });
  trackResult(result, 'PATCH /posts/1');
});

document.getElementById('btn-delete')!.addEventListener('click', async () => {
  setStatus('DELETE /posts/1...', 'info');
  const result = await client.delete('/posts/1');
  trackResult(result, 'DELETE /posts/1');
});

document.getElementById('btn-404')!.addEventListener('click', async () => {
  setStatus('GET /nonexistent...', 'info');
  const result = await client.get('/nonexistent-endpoint-xyz');
  trackResult(result, '404');
});

document.getElementById('btn-500')!.addEventListener('click', async () => {
  setStatus('GET /status/500...', 'info');
  const result = await client.get('https://httpbin.org/status/500');
  trackResult(result, '500');
});

document.getElementById('btn-timeout')!.addEventListener('click', async () => {
  setStatus('GET (timeout 1ms)...', 'info');
  const result = await client.get('/users', { timeout: 1 });
  trackResult(result, 'Timeout');
});

document.getElementById('btn-network')!.addEventListener('click', async () => {
  setStatus('GET (network error)...', 'info');
  const result = await client.get('https://this-domain-does-not-exist-xyz123.com/api');
  trackResult(result, 'Network Error');
});

document.getElementById('btn-cache')!.addEventListener('click', async () => {
  setStatus('GET /users/1 (cached)...', 'info');
  const result = await client.get('/users/1', { cache: { enabled: true, ttlMs: 30000 } });
  trackResult(result, 'Cache');
});

document.getElementById('btn-retry')!.addEventListener('click', async () => {
  setStatus('GET (retry 3x)...', 'info');
  const result = await client.get('https://httpbin.org/status/500', { retry: { maxAttempts: 3, backoffMs: 100 } });
  trackResult(result, 'Retry');
});

document.getElementById('btn-parallel')!.addEventListener('click', async () => {
  setStatus('5 parallel requests...', 'info');
  const ids = [1, 2, 3, 4, 5];
  const results = await Promise.all(ids.map((id) => client.get(`/users/${id}`)));
  const ok = results.filter((r) => r.ok).length;
  setStatus(`Parallel: ${ok}/${ids.length} succeeded`, ok === ids.length ? 'ok' : 'err');
});

document.getElementById('btn-concurrent')!.addEventListener('click', async () => {
  setStatus('10 requests, max 3 concurrent...', 'info');
  const limitedClient = createHttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com',
    maxConcurrent: 3,
    devTracker: tracker,
  });
  const ids = Array.from({ length: 10 }, (_, i) => i + 1);
  const results = await Promise.all(ids.map((id) => limitedClient.get(`/users/${id}`)));
  const ok = results.filter((r) => r.ok).length;
  setStatus(`Concurrent: ${ok}/${ids.length} succeeded`, ok === ids.length ? 'ok' : 'err');
});

document.getElementById('btn-show')!.addEventListener('click', () => ui.show());
document.getElementById('btn-hide')!.addEventListener('click', () => ui.hide());
document.getElementById('btn-clear')!.addEventListener('click', () => {
  tracker.clear();
  setStatus('History cleared', 'info');
});
