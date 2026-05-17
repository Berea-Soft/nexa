import { createHttpClient } from '../dist/nexa.es.js';

let axios;
try {
  axios = (await import('axios')).default;
} catch {
  console.log('⚠️  axios not installed. Skipping.\n');
}

const concurrency = 10;
const rounds = 10;
const baseUrl = 'https://jsonplaceholder.typicode.com';
const url = `${baseUrl}/posts/1`;

const client = createHttpClient({
  baseURL: baseUrl,
  defaultTimeout: 30000,
});

async function benchmark(name, fn) {
  const allStart = performance.now();
  for (let r = 0; r < rounds; r++) {
    const batch = Array.from({ length: concurrency }, () => fn());
    await Promise.all(batch);
  }
  const total = performance.now() - allStart;
  const perRequest = total / (rounds * concurrency);
  console.log(`${name}: ${total.toFixed(2)}ms total (${perRequest.toFixed(2)}ms per request)`);
  return { total, perRequest };
}

async function run() {
  const totalReqs = rounds * concurrency;
  console.log(`Running benchmark: ${concurrency} concurrent × ${rounds} rounds = ${totalReqs} requests\n`);

  const nexaResult = await benchmark('Nexa', async () => {
    await client.get('/posts/1');
  });

  const fetchResult = await benchmark('Native fetch', async () => {
    const response = await fetch(url);
    await response.json();
  });

  let axiosResult;
  if (axios) {
    axiosResult = await benchmark('Axios', async () => {
      await axios.get(url);
    });
  }

  console.log('\nResults:');
  console.log(`  Nexa:  ${nexaResult.perRequest.toFixed(2)}ms`);
  console.log(`  fetch: ${fetchResult.perRequest.toFixed(2)}ms`);
  if (axiosResult) {
    console.log(`  axios: ${axiosResult.perRequest.toFixed(2)}ms`);
  }

  console.log('\nOverhead vs fetch:');
  console.log(`  Nexa:  +${((nexaResult.perRequest / fetchResult.perRequest - 1) * 100).toFixed(1)}%`);
  if (axiosResult) {
    console.log(`  axios: +${((axiosResult.perRequest / fetchResult.perRequest - 1) * 100).toFixed(1)}%`);
  }
}

run().catch(console.error);
