import React from 'react';
import { useToasts } from '../hooks/useToast';

const ICON = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };

export default function ToastContainer() {
  const { toasts, remove } = useToasts();
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type || 'success'}`} onClick={() => remove(t.id)}>
          <i className={`bi ${ICON[t.type] || ICON.success}`} />
          {t.message}
        </div>
      ))}
    </div>
  );
}
