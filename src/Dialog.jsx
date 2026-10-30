import React, { useEffect, useRef } from 'react';

export default function Dialog({ title, onClose, busy = false, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className={wide ? 'modal wide' : 'modal'} aria-labelledby="dialog-title"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="modal-heading"><h2 id="dialog-title">{title}</h2>
      <button type="button" className="icon-button" aria-label="ปิดหน้าต่าง" disabled={busy} onClick={onClose}>×</button></div>
    {children}
  </dialog>;
}
