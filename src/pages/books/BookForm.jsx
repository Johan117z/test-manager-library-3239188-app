import { useState } from 'react';
import ErrorMessage from '../../components/ErrorMessage.jsx';

const EMPTY = { title: '', author: '', isbn: '', category_id: '', total_copies: 1 };

// Create or edit a book (HU-03). On edit the ISBN is shown but not sent (PUT does not replace it).
export default function BookForm({ book, categories, onSubmit, onCancel }) {
  const isEdit = Boolean(book);
  const [values, setValues] = useState(() =>
    isEdit
      ? {
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          category_id: book.category?.id || '',
          total_copies: book.total_copies,
        }
      : EMPTY,
  );
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        title: values.title.trim(),
        author: values.author.trim(),
        isbn: values.isbn.trim(),
        category_id: values.category_id,
        total_copies: Number(values.total_copies),
      });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>{isEdit ? `Edit "${book.title}"` : 'New book'}</h2>
      <ErrorMessage error={error} />
      <div className="form-grid">
        <label>
          Title
          <input value={values.title} onChange={set('title')} required />
        </label>
        <label>
          Author
          <input value={values.author} onChange={set('author')} required />
        </label>
        <label>
          ISBN (13 digits)
          <input
            value={values.isbn}
            onChange={set('isbn')}
            inputMode="numeric"
            pattern="\d{13}"
            title="13 digits"
            required={!isEdit}
            disabled={isEdit}
          />
        </label>
        <label>
          Category
          <select value={values.category_id} onChange={set('category_id')} required>
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Total copies
          <input type="number" min="1" step="1" value={values.total_copies} onChange={set('total_copies')} required />
        </label>
      </div>
      {isEdit && (
        <p className="muted">
          Available copies change by the same difference as the total ({book.available_copies} of {book.total_copies} available now).
        </p>
      )}
      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {busy ? 'Saving...' : isEdit ? 'Save changes' : 'Create book'}
        </button>
        <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
