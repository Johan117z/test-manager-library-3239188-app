import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createMember, searchMembers } from '../../api/members.js';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Pagination from '../../components/Pagination.jsx';

const PAGE_SIZE = 20;

function MemberForm({ onCreated, onCancel }) {
  const [fullName, setFullName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const member = await createMember({ full_name: fullName.trim(), document_number: documentNumber.trim() });
      onCreated(member);
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>New member</h2>
      <ErrorMessage error={error} />
      <div className="form-grid">
        <label>
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus />
        </label>
        <label>
          Document number
          <input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} required />
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {busy ? 'Saving...' : 'Create member'}
        </button>
        <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// HU-05: list, search by name or document, create.
export default function MembersPage() {
  const [draft, setDraft] = useState('');
  const [filters, setFilters] = useState({ q: '', page: 1 });
  const [result, setResult] = useState({ items: [], page: 1, size: PAGE_SIZE, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await searchMembers({ ...filters, size: PAGE_SIZE }));
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

  function handleCreated(member) {
    setShowForm(false);
    setNotice(`Member "${member.full_name}" created.`);
    load();
  }

  return (
    <>
      <div className="page-header">
        <h1>Members</h1>
        {!showForm && (
          <button
            onClick={() => {
              setNotice('');
              setShowForm(true);
            }}
          >
            New member
          </button>
        )}
      </div>

      {showForm && <MemberForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />}

      <div className="card">
        <form
          className="toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            setFilters({ q: draft.trim(), page: 1 });
          }}
        >
          <label>
            Name or document
            <input type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search..." />
          </label>
          <button type="submit">Search</button>
        </form>

        {notice && <div className="notice">{notice}</div>}
        <ErrorMessage error={error} />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Full name</th>
                <th>Document</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((member) => (
                <tr key={member.id}>
                  <td>{member.full_name}</td>
                  <td>{member.document_number}</td>
                  <td className="actions">
                    <Link to={`/loans/new?member_id=${member.id}`}>New loan</Link>
                    <Link to={`/loans?member_id=${member.id}`}>Loans</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <p className="empty">Loading...</p>}
        {!loading && result.items.length === 0 && !error && <p className="empty">No members match the search.</p>}

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
