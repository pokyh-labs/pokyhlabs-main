import { useState, useCallback } from 'react';

let _setToasts = null;

export function registerToastSetter(fn) { _setToasts = fn; }

export function toast(message, type = 'success') {
  if (!_setToasts) return;
  const id = Date.now() + Math.random();
  _setToasts(prev => [...prev, { id, message, type }]);
  setTimeout(() => {
    _setToasts(prev => prev.filter(t => t.id !== id));
  }, 3500);
}

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  registerToastSetter(setToasts);
  const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, remove };
}
