import Modal from './Modal'

export default function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <p className="text-text-secondary text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="btn-ghost">Cancel</button>
        <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>Confirm</button>
      </div>
    </Modal>
  )
}
