import React from 'react'
import type { ReactNode } from 'react'

interface Props {
  visible: boolean
  title: string
  onClose: () => void
  onConfirm?: () => void
  children: ReactNode
  width?: number
  confirmText?: string
  cancelText?: string
}

const Modal: React.FC<Props> = ({
  visible,
  title,
  onClose,
  onConfirm,
  children,
  width = 600,
  confirmText = '确定',
  cancelText = '取消',
}) => {
  if (!visible) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            {cancelText}
          </button>
          {onConfirm && (
            <button className="btn btn-primary" onClick={onConfirm}>
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Modal
