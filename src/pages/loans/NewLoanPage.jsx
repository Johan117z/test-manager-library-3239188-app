import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchBooks } from '../../api/books.js';
import { createLoan, MAX_ITEMS_PER_LOAN } from '../../api/loans.js';
import { getMember, searchMembers } from '../../api/members.js';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { formatDateTime } from '../../format.js';

const RESULTS = 8;

// Search box plus a short result list; `renderRow` draws each result with its action button.
function Finder({ label, placeholder, search, renderRow }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  async function run(event) {
    event.preventDefault();
    try {
      const data = await search(q.trim());
      setItems(data.items || []);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div>
      <form className="toolbar" onSubmit={run}>
        <label>
          {label}
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
        </label>
        <button type="submit" className="secondary">
          Search
        </button>
      </form>
      <ErrorMessage error={error} />
      {items && items.length === 0 && <p className="empty">No results.</p>}
      {items && items.length > 0 && (
        <ul className="pick-list">
          {items.map((item) => (
            <li key={item.id}>{renderRow(item)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// HU-06: one member, 1 to 3 different books. Business rules are enforced by the API; its errors are shown as sent.
export default function NewLoanPage() {
  const [params] = useSearchParams();
  const [member, setMember] = useState(null);
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loan, setLoan] = useState(null);

  // Preselect the member when coming from the members page.
  const preselectedId = params.get('member_id');
  useEffect(() => {
    if (preselectedId) getMember(preselectedId).then(setMember).catch(setError);
  }, [preselectedId]);

  async function selectMember(candidate) {
    setMember(candidate);
    setError(null);
    try {
      setMember(await getMember(candidate.id)); // detail adds active_loans
    } catch {
      // Keep the list data if the detail call fails.
    }
  }

  function addBook(book) {
    setError(null);
    setBooks((current) =>
      current.length >= MAX_ITEMS_PER_LOAN || current.some((b) => b.id === book.id) ? current : [...current, book],
    );
  }

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      setLoan(await createLoan(member.id, books.map((b) => b.id)));
    } catch (err) {
      // Point "items[N].book_id" details at the chosen book so the user knows which one failed.
      err.details = err.details.map((detail) => {
        const match = /^items\[(\d+)\]/.exec(detail.field || '');
        const book = match ? books[Number(match[1])] : null;
        return book ? { ...detail, field: book.title } : detail;
      });
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setLoan(null);
    setMember(null);
    setBooks([]);
    setError(null);
  }

  if (loan) {
    return (
      <div className="card">
        <h1>Loan registered</h1>
        <div className="notice">
          Loan for {member.full_name} on {formatDateTime(loan.loaned_at)}.
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>ISBN</th>
                <th>Category</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {loan.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.book_title}</td>
                  <td>{item.isbn}</td>
                  <td>{item.category_name}</td>
                  <td>{formatDateTime(item.due_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="form-actions">
          <button onClick={reset}>New loan</button>
          <Link to="/loans">Go to loans</Link>
        </div>
      </div>
    );
  }

  const full = books.length >= MAX_ITEMS_PER_LOAN;

  return (
    <>
      <div className="page-header">
        <h1>New loan</h1>
      </div>

      <div className="card">
        <h2>1. Member</h2>
        {member ? (
          <div className="selected">
            <span>
              <strong>{member.full_name}</strong> <span className="muted">({member.document_number})</span>
              {member.active_loans !== undefined && (
                <span className="muted"> · {member.active_loans} book(s) not returned</span>
              )}
            </span>
            <button type="button" className="secondary small" onClick={() => setMember(null)}>
              Change
            </button>
          </div>
        ) : (
          <Finder
            label="Name or document"
            placeholder="Search members..."
            search={(q) => searchMembers({ q, page: 1, size: RESULTS })}
            renderRow={(m) => (
              <>
                <span>
                  {m.full_name} <span className="muted">({m.document_number})</span>
                </span>
                <button type="button" className="small" onClick={() => selectMember(m)}>
                  Select
                </button>
              </>
            )}
          />
        )}
      </div>

      <div className="card">
        <h2>
          2. Books ({books.length} of {MAX_ITEMS_PER_LOAN})
        </h2>
        {books.length > 0 && (
          <ul className="pick-list">
            {books.map((book) => (
              <li key={book.id}>
                <span>
                  <strong>{book.title}</strong> <span className="muted">· {book.author}</span>
                </span>
                <button
                  type="button"
                  className="secondary small"
                  onClick={() => setBooks((current) => current.filter((b) => b.id !== book.id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {!full && (
          <Finder
            label="Title or author"
            placeholder="Search books..."
            search={(q) => searchBooks({ q, page: 1, size: RESULTS })}
            renderRow={(book) => {
              const chosen = books.some((b) => b.id === book.id);
              return (
                <>
                  <span>
                    {book.title} <span className="muted">· {book.author} · {book.available_copies} available</span>
                  </span>
                  <button type="button" className="small" disabled={chosen} onClick={() => addBook(book)}>
                    {chosen ? 'Added' : 'Add'}
                  </button>
                </>
              );
            }}
          />
        )}
        {full && <p className="muted">A loan can have at most {MAX_ITEMS_PER_LOAN} books.</p>}
      </div>

      <div className="card">
        <ErrorMessage error={error} />
        <button type="button" onClick={handleSubmit} disabled={busy || !member || books.length === 0}>
          {busy ? 'Registering...' : 'Register loan'}
        </button>
        <p className="muted">Due date is 14 days after the loan is registered.</p>
      </div>
    </>
  );
}
