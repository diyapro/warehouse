export default function Modal({ title, children, close }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{title}</h3>
        {children}
        <button onClick={close}>Close</button>
      </div>
    </div>
  );
}
