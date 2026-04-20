export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <p className="dialog-msg">{message}</p>
        <div className="dialog-actions">
          <button className="btn-ghost" onClick={onCancel}>Anuluj</button>
          <button className="btn-danger" onClick={onConfirm}>Usuń</button>
        </div>
      </div>
    </div>
  )
}
