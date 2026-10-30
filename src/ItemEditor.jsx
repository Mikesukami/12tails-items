import React, { useEffect, useState } from 'react';
import Dialog from './Dialog.jsx';
import { validateImage } from './domain.js';

export default function ItemEditor({ item, repository, onClose, onSaved }) {
  const [values, setValues] = useState({ name: item?.name ?? '', description: item?.description ?? '', gold: item?.gold ?? '', baht: item?.baht ?? '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const image = preview || (!removeImage && repository.imageUrl(item?.image_path));
  function change(event) { setValues(current => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try { onSaved(await repository.save(values, file, item, removeImage)); }
    catch (err) { setError(`บันทึกไม่สำเร็จ: ${err.message}`); }
    finally { setBusy(false); }
  }
  return <Dialog title={item ? 'แก้ไขไอเท็ม' : 'เพิ่มไอเท็มใหม่'} onClose={onClose} busy={busy} wide>
    <p className="muted modal-intro">จดรายละเอียดและราคาที่คุณต้องการเก็บไว้</p>
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <div className="upload-row"><div className="image-preview">{image ? <img src={image} alt="ตัวอย่างรูปไอเท็ม" /> : <span aria-hidden="true">◇</span>}</div>
          <div><label className="file-label" htmlFor="item-image">เลือกรูปไอเท็ม</label>
            <input id="item-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
              const next = event.target.files?.[0]; if (!next) return;
              try { validateImage(next); setFile(next); setRemoveImage(false); setError(''); }
              catch (err) { setError(err.message); event.target.value = ''; }
            }} />
            <small>JPG, PNG หรือ WebP · ไม่เกิน 2 MB · ไม่ใส่รูปก็ได้</small>
            {image && <button type="button" className="text-button" onClick={() => { setFile(null); setRemoveImage(true); }}>นำรูปออก</button>}
          </div>
        </div>
        <label htmlFor="item-name">ชื่อไอเท็ม</label>
        <input autoFocus id="item-name" name="name" value={values.name} onChange={change} required maxLength={120} placeholder="เช่น ดาบแห่งนักเดินทาง" />
        <div className="price-fields"><div><label htmlFor="item-gold">ราคา Gold</label>
          <input id="item-gold" name="gold" type="number" inputMode="decimal" min="0" max="999999999999.99" step="0.01" required value={values.gold} onChange={change} placeholder="0" /></div>
          <div><label htmlFor="item-baht">ราคาเงินบาท</label>
            <input id="item-baht" name="baht" type="number" inputMode="decimal" min="0" max="999999999999.99" step="0.01" required value={values.baht} onChange={change} placeholder="0.00" /></div></div>
        <p className="field-hint">กรอกแต่ละราคาเองได้เลย ไม่จำเป็นต้องอิงอัตราแลกเปลี่ยนเดียวกัน</p>
        <label htmlFor="item-description">รายละเอียดเพิ่มเติม</label>
        <textarea id="item-description" name="description" rows={3} maxLength={2000} value={values.description} onChange={change} placeholder="เช่น ออปชันของไอเท็ม ร้านที่พบ หรือราคาต่อชิ้น" />
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions"><button type="button" className="button secondary" disabled={busy} onClick={onClose}>ยกเลิก</button>
        <button className="button primary" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึกไอเท็ม'}</button></div>
    </form>
  </Dialog>;
}
