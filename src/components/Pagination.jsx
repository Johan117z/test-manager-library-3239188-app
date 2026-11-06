// Pager for the contract's paginated responses: { items, page, size, total }.
export default function Pagination({ page, size, total, onPageChange }) {
  const pages = Math.max(1, Math.ceil(total / size));
  const first = total === 0 ? 0 : (page - 1) * size + 1;
  const last = Math.min(page * size, total);

  return (
    <div className="pagination">
      <span className="muted">
        {total === 0 ? 'No results' : `Showing ${first}-${last} of ${total}`}
      </span>
      <div className="buttons">
        <button type="button" className="secondary small" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <span className="muted">
          Page {page} of {pages}
        </span>
        <button type="button" className="secondary small" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
