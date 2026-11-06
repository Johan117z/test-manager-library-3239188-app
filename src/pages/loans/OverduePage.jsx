import { useCallback, useEffect, useState } from 'react';
import { listOverdue, returnItem } from '../../api/loans.js';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Pagination from '../../components/Pagination.jsx';
import { formatDateTime } from '../../format.js';

const PAGE_SIZE = 20;

// HU-09: unreturned lines past due, most days late first (order comes from the API).
export default function OverduePage() {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [busyItem, setBusyItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listOverdue({ page, size: PAGE_SIZE });
      // Accept a paginated body or a bare list.
      setRows(Array.isArray(data) ? data : data.items || []);
      setMeta(Array.isArray(data) || data.total === undefined ? null : data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReturn(row) {
    setBusyItem(row.item_id);
    setNotice('');
    setError(null);
    try {
      await returnItem(row.loan_id, row.item_id);
      setNotice(`"${row.book_title}" returned.`);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyItem(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Overdue books</h1>
      </div>
      <div className="card">
        {notice && <div className="notice">{notice}</div>}
        <ErrorMessage error={error} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>Member</th>
                <th>Due</th>
                <th>Days late</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.item_id}>
                  <td>{row.book_title}</td>
                  <td>{row.member_name}</td>
                  <td>{formatDateTime(row.due_at)}</td>
                  <td>
                    <span className="badge status-overdue">{row.days_late}</span>
                  </td>
                  <td>
                    <button type="button" className="small" disabled={busyItem !== null} onClick={() => handleReturn(row)}>
                      {busyItem === row.item_id ? 'Returning...' : 'Return'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <p className="empty">Loading...</p>}
        {!loading && rows.length === 0 && !error && <p className="empty">No overdue books.</p>}
        {meta && <Pagination page={meta.page || page} size={meta.size || PAGE_SIZE} total={meta.total} onPageChange={setPage} />}
      </div>
    </>
  );
}
