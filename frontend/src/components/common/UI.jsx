export function Loader() {
  return <div className="loader" aria-label="Loading" />;
}
export function Empty({ title, text }) {
  return (
    <div className="empty">
      <span>◎</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function ErrorMessage({ message }) {
  return message ? <p className="error">{message}</p> : null;
}
export function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type}`} role="status">
      <span>{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Close notification">
        ×
      </button>
    </div>
  );
}
