import { createHttpClient } from '@bereasoftware/nexa';

const api = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  defaultHeaders: { 'X-API-Key': import.meta.env.VITE_API_KEY || '' },
});

export async function getPosts() {
  const result = await api.get<Post[]>('/posts');
  return result.ok ? result.value.data : [];
}

export async function getPost(id: number) {
  const result = await api.get<Post>(`/posts/${id}`);
  return result.ok ? result.value.data : null;
}

export interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}
