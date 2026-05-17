import { createHttpClient } from '@bereasoftware/nexa';

const client = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
});

export async function getUsers() {
  const result = await client.get<User[]>('/users');
  if (result.ok) return result.value.data;
  throw new Error(result.error.message);
}

export async function getUser(id: number) {
  const result = await client.get<User>(`/users/${id}`);
  if (result.ok) return result.value.data;
  throw new Error(result.error.message);
}

export async function createUser(data: { name: string; email: string }) {
  const result = await client.post<User>('/users', data);
  if (result.ok) return result.value.data;
  throw new Error(result.error.message);
}

export interface User {
  id: number;
  name: string;
  email: string;
}
