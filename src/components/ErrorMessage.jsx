// Shows an ApiError: the API message (Spanish, as sent) plus any field details.
export default function ErrorMessage({ error }) {
  if (!error) return null;
  return (
    <div className="alert" role="alert">
      <strong>{error.message}</strong>
      {error.details?.length > 0 && (
        <ul>
          {error.details.map((detail, index) => (
            <li key={index}>
              {detail.field ? <code>{detail.field}</code> : null} {detail.issue}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
