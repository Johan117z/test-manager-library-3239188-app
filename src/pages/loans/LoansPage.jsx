import { Fragment, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getLoan, listLoans, returnItem } from '../../api/loans.js';
import { getMember } from '../../api/members.js';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Pagination from '../../components/Pagination.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDateTime } from '../../format.js';

const PAGE_SIZE = 20;

// Lines of one loan, each returnable on its own (HU-07).
function LoanDetail({ loanId, onChanged }) {
  const [loan, setLoan] = useState(null);
  const [error, setError] = useState(null);
  const [busyItem, setBusyItem] = useState(null);

  const load = useCallback(() => getLoan(loanId).then(setLoan).catch(setError), [loanId]);
  useEffect(() => {
    load();
  }, [load]);

  async function handleReturn(item) {
    setBusyItem(item.id);
    setError(null);
    try {
      await returnItem(loanId, item.id);
      await load();
      onChanged();
    } catch (err) {
      setError(err);
    } finally {
      setBusyItem(null);
    }
  }

  if (!loan) return error ? <ErrorMessage error={error} /> : <p className="muted">Loading...</p>;
  return (
    <div className="detail">
      <ErrorMessage error={error} />
      <table>
        <thead>
          <tr>
            <th>Book</th>
            <th>ISBN</th>
            <th>Category</th>
            <th>Due</th>
            <th>Returned</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {loan.items.map((item) => (
            <tr key={item.id}>
              <td>{item.book_title}</td>
              <td>{item.isbn}</td>
              <td>{item.category_name}</td>
              <td>{formatDateTime(item.due_at)}</td>
              <td>{item.returned_at ? formatDateTime(item.returned_at) : '-'}</td>
              <td>
                {!item.returned_at && (
                  <button type="button" className="small" disabled={busyItem !== null} onClick={() => handleReturn(item)}>
                    {busyItem === item.id ? 'Returning...' : 'Return'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// HU-08: list loans by date range, status and member, newest first.
export default function LoansPage() {
  const [params, setParams] = useSearchParams();
  const memberId = params.get('member_id') || '';
  const [draft, setDraft] = useState({ from: '', to: '', status: '' });
  const [filters, setFilters] = useState({ from: '', to: '', status: '', page: 1 });
  const [result, setResult] = useState({ items: [], page: 1, size: PAGE_SIZE, total: 0 });
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await listLoans({ ...filters, memberId, size: PAGE_SIZE }));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters, memberId]);

  useEffect(() => {
    load();
  }, [load]);

  // The loan list only carries member_id; fetch names once per member.
  useEffect(() => {
    const ids = [...new Set(result.items.map((loan) => loan.member_id))].filter((id) => !(id in members));
    if (memberId && !(memberId in members)) ids.push(memberId);
    ids.forEach((id) => {
      setMembers((m) => ({ ...m, [id]: null }));
      getMember(id)
        .then((member) => setMembers((m) => ({ ...m, [id]: member.full_name })))
        .catch(() => {});
    });
  }, [result.items, memberId, members]);

  return (
    <>
      <div className="page-header">
        <h1>Loans</h1>
      </div>
      <div className="card">
        <form
          className="toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            setOpenId(null);
            setFilters({ ...draft, page: 1 });
          }}
        >
          <label>
            From
            <input type="date" value={draft.from} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} />
          </label>
          <label>
            To
            <input type="date" value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} />
          </label>
          <label>
            Status
            <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>
              <option value="">Any</option>
              <option value="open">Open</option>
              <option value="overdue">Overdue</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <button type="submit">Filter</button>
        </form>
        {memberId && (
          <p>
            Member: <strong>{members[memberId] || memberId}</strong>{' '}
            <button type="button" className="secondary small" onClick={() => setParams({})}>
              Show all members
            </button>
          </p>
        )}

        <ErrorMessage error={error} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loaned</th>
                <th>Member</th>
                <th>Books</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {result.items.map((loan) => (
                <Fragment key={loan.id}>
                  <tr>
                    <td>{formatDateTime(loan.loaned_at)}</td>
                    <td>{loan.member_name || members[loan.member_id] || '...'}</td>
                    <td>
                      {loan.items
                        ? `${loan.items.filter((i) => !i.returned_at).length} of ${loan.items.length} not returned`
                        : ''}
                    </td>
                    <td>
                      <StatusBadge status={loan.status} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="secondary small"
                        onClick={() => setOpenId(openId === loan.id ? null : loan.id)}
                      >
                        {openId === loan.id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {openId === loan.id && (
                    <tr>
                      <td colSpan={5}>
                        <LoanDetail loanId={loan.id} onChanged={load} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <p className="empty">Loading...</p>}
        {!loading && result.items.length === 0 && !error && <p className="empty">No loans match the filters.</p>}
        <Pagination
          page={result.page || filters.page}
          size={result.size || PAGE_SIZE}
          total={result.total || 0}
          onPageChange={(page) => {
            setOpenId(null);
            setFilters((f) => ({ ...f, page }));
          }}
        />
      </div>
    </>
  );
}
