export default function LoadingSpinner({ text = 'Ładowanie...' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      {text && <p className="spinner-text">{text}</p>}
    </div>
  )
}
