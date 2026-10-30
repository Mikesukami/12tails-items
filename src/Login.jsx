import React, { useState } from 'react';
import Dialog from './Dialog.jsx';

export default function Login({ client, onClose }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      const { error: authError } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) throw authError;
      onClose();
    } catch { setError('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจอีเมล รหัสผ่าน และการเชื่อมต่อ'); }
    finally { setBusy(false); }
  }
  return <Dialog title="เข้าสู่ระบบเจ้าของสมุด" onClose={onClose} busy={busy}>
    <p className="muted modal-intro">สำหรับเพิ่มไอเท็มและอัปเดตราคา ส่วนการดูข้อมูลไม่ต้องเข้าสู่ระบบ</p>
    <form onSubmit={submit}>
      <fieldset disabled={busy}><label htmlFor="login-email">อีเมล</label>
        <input autoFocus id="login-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
        <label htmlFor="login-password">รหัสผ่าน</label>
        <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <p className="field-hint">ลืมรหัสผ่าน? เจ้าของโปรเจกต์ตั้งรหัสใหม่ได้ใน Supabase → Authentication → Users</p>
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={busy}>ยกเลิก</button>
        <button className="button primary" disabled={busy}>{busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</button></div>
    </form>
  </Dialog>;
}
