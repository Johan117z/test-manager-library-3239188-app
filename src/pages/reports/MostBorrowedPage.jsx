import { useState } from 'react';
import { mostBorrowed } from '../../api/loans.js';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { isoDay } from '../../format.js';

// HU-10 (admin only): one row per frozen book title and category name, most borrowed first.
// No member or librarian data is shown (CA-10.3). Date validation (INVALID_DATE_RANGE) is left to the API.
export default function MostBorrowedPage() {
  const [from, setFrom] = useState(isoDay(30));
  const [to, setTo] = useState(isoDay(0));
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setReport(await mostBorrowed({ from, to }));
    } catch (err) {
      setError(err);
      setReport(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Most borrowed books</h1>
      </div>
      <div className="card">
        <form className="toolbar" onSubmit={handleSubmit}>
          <label>
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
          </label>
          <label>
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} required />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? 'Loading...' : 'Run report'}
          </button>
        </form>
        <ErrorMessage error={error} />

        {report && (
          <>
            <p className="muted">
              From {report.from} to {report.to} (both inclusive).
            </p>
            {report.rows.length === 0 ? (
              <p className="empty">No loans in this range.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Book</th>
                      <th>Category</th>
                      <th>Times borrowed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row, index) => (
                      <tr key={`${row.book_id}-${row.book_title}-${row.category_name}`}>
                        <td>{index + 1}</td>
                        <td>{row.book_title}</td>
                        <td>{row.category_name}</td>
                        <td>{row.times_borrowed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
