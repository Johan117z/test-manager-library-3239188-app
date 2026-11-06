import { api } from './client.js';

// api-contract.md §3.3 and §3.4.
export async function listCategories() {
  const data = await api.get('/categories');
  return Array.isArray(data) ? data : data?.items || [];
}

export const searchBooks = ({ q, categoryId, page, size }) =>
  api.get('/books', { q, category_id: categoryId, page, size });

export const createBook = (book) => api.post('/books', book);

// PUT replaces title, author, category and total; the ISBN is not editable.
export const updateBook = (id, { title, author, category_id, total_copies }) =>
  api.put(`/books/${id}`, { title, author, category_id, total_copies });

export const deleteBook = (id) => api.del(`/books/${id}`);
