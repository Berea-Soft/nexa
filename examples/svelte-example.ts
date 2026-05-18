import { createHttpClient } from '@bereasoftware/nexa';

const client = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
});

export async function fetchTodos() {
  const result = await client.get<Todo[]>('/todos');
  return result.ok ? result.value.data : [];
}

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}
