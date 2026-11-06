import { useCallback, useEffect, useState } from 'react';
import { createBook, deleteBook, listCategories, searchBooks, updateBook } from '../../api/books.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Pagination from '../../components/Pagination.jsx';
import BookForm from './BookForm.jsx';

const PAGE_SIZE = 20;

// HU-03 (admin manages books) and HU-04 (search books).
export default function BooksPage() {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [draft, setDraft] = useState({ q: '', categoryId: '' });
  const [filters, setFilters] = useState({ q: '', categoryId: '', page: 1 });
  const [result, setResult] = useState({ items: [], page: 1, size: PAGE_SIZE, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  // null = no form, 'new' = create form, otherwise the book being edited.
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    listCategories().then(setCategories).catch(setError);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchBooks({ ...filters, size: PAGE_SIZE });
      setResult(data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(event) {
    event.preventDefault();
    setFilters({ q: draft.q.trim(), categoryId: draft.categoryId, page: 1 });
  }

  async function handleSave(values) {
    if (editing === 'new') {
      const book = await createBook(values);
      setNotice(`Book "${book.title}" created.`);
    } else {
      const book = await updateBook(editing.id, values);
      setNotice(`Book "${book.title}" updated.`);
    }
    setEditing(null);
    await load();
  }

  async function handleDelete(book) {
    if (!window.confirm(`Delete "${book.title}"? It will leave the catalog but stay in past loans.`)) return;
    setNotice('');
    try {
      await deleteBook(book.id);
      setNotice(`Book "${book.title}" deleted.`);
      setError(null);
      // Step back a page if the last row of this page was removed.
      if (result.items.length === 1 && filters.page > 1) setFilters((f) => ({ ...f, page: f.page - 1 }));
      else await load();
    } catch (err) {
      setError(err);
    }
  }

  function openForm(target) {
    setNotice('');
    setEditing(target);
  }

  return (
    <>
      <div className="page-header">
        <h1>Books</h1>
        {isAdmin && editing === null && <button onClick={() => openForm('new')}>New book</button>}
      </div>

      {editing !== null && (
        <BookForm
          key={editing === 'new' ? 'new' : editing.id}
          book={editing === 'new' ? null : editing}
          categories={categories}
          onSubmit={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="card">
        <form className="toolbar" onSubmit={handleSearch}>
          <label>
            Title or author
            <input
              type="search"
              value={draft.q}
              onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
              placeholder="Search..."
            />
          </label>
          <label>
            Category
            <select value={draft.categoryId} onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Search</button>
        </form>

        {notice && <div className="notice">{notice}</div>}
        <ErrorMessage error={error} />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>ISBN</th>
                <th>Category</th>
                <th>Available</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {result.items.map((book) => (
                <tr key={book.id}>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.isbn}</td>
                  <td>{book.category?.name}</td>
                  <td>
                    {book.available_copies} / {book.total_copies}
                  </td>
                  {isAdmin && (
                    <td className="actions">
                      <button type="button" className="secondary small" onClick={() => openForm(book)}>
                        Edit
                      </button>
                      <button type="button" className="danger small" onClick={() => handleDelete(book)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <p className="empty">Loading...</p>}
        {!loading && result.items.length === 0 && !error && <p className="empty">No books match the search.</p>}

        <Pagination
          page={result.page || filters.page}
          size={result.size || PAGE_SIZE}
          total={result.total || 0}
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
        />
      </div>
    </>
  );
}
