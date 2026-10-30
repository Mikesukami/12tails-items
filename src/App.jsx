import React, { useCallback, useEffect, useRef, useState } from 'react';
import { filterItems, formatPrice, formatDate } from './domain.js';
import { demoItems } from './demo.js';
import ItemArt from './ItemArt.jsx';
import Dialog from './Dialog.jsx';
import ItemEditor from './ItemEditor.jsx';
import Login from './Login.jsx';

function ItemImage({ url, name, art }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return <div className={`item-art art-${art || 'gem'}`}>
    {url && !failed ? <img src={url} alt={name} loading="lazy" onError={() => setFailed(true)} /> : <ItemArt kind={art} />}
    {!url && !art && <span className="no-image">ยังไม่มีรูป</span>}
  </div>;
}

export default function App({ client, repository, configurationError = '' }) {
  const demo = !client;
  const [items, setItems] = useState(demo ? demoItems : []);
  const [loading, setLoading] = useState(!demo); const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState(''); const [sort, setSort] = useState('updated');
  const [session, setSession] = useState(null); const [admin, setAdmin] = useState(false);
  const [login, setLogin] = useState(false); const [editor, setEditor] = useState(undefined);
  const [deleting, setDeleting] = useState(null); const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(''); const [notice, setNotice] = useState('');
  const requestId = useRef(0);
  const load = useCallback(async () => {
    if (!repository) return;
    const request = ++requestId.current;
    setLoading(true); setLoadError('');
    try { const data = await repository.list(); if (request === requestId.current) setItems(data); }
    catch (error) { if (request === requestId.current) setLoadError(`โหลดข้อมูลไม่สำเร็จ: ${error.message}`); }
    finally { if (request === requestId.current) setLoading(false); }
  }, [repository]);
  useEffect(() => { load(); return () => { requestId.current++; }; }, [load]);
  useEffect(() => {
    if (!client) return;
    let active = true; let authChanged = false;
    let userId = null;
    function acceptSession(next) {
      const nextId = next?.user?.id ?? null;
      if (userId !== nextId) {
        setAdmin(false); setEditor(undefined); setDeleting(null);
      }
      userId = nextId;
      setSession(next);
    }
    client.auth.getSession().then(({ data, error }) => {
      if (!active || authChanged) return;
      if (error) setNotice('ตรวจการเข้าสู่ระบบไม่สำเร็จ กรุณาลองเข้าสู่ระบบใหม่');
      acceptSession(data?.session ?? null);
    }).catch(() => { if (active) setNotice('ตรวจการเข้าสู่ระบบไม่สำเร็จ'); });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      // No async Supabase call inside this callback (Auth lock).
      authChanged = true;
      if (active) acceptSession(next);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [client]);
  useEffect(() => {
    let active = true;
    if (!session) setAdmin(false);
    if (session && repository) repository.isAdmin().then(value => { if (active) setAdmin(value); })
      .catch(() => { if (active) { setAdmin(false); setNotice('ตรวจสิทธิ์แก้ไขไม่สำเร็จ กรุณาออกแล้วเข้าสู่ระบบใหม่'); } });
    return () => { active = false; };
  }, [session, repository]);

  const visible = filterItems(items, query, sort);
  const latest = items.reduce((last, item) => item.updated_at > last ? item.updated_at : last, '');
  async function logout() {
    setBusy(true);
    try { const { error } = await client.auth.signOut(); if (error) throw error; setSession(null); setAdmin(false); }
    catch { setNotice('ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง'); }
    finally { setBusy(false); }
  }
  async function confirmDelete() {
    if (busy) return; setBusy(true); setDeleteError('');
    try {
      const { warning } = await repository.remove(deleting);
      setItems(current => current.filter(item => item.id !== deleting.id)); setDeleting(null);
      setNotice(warning || 'ลบไอเท็มแล้ว');
    } catch (error) { setDeleteError(`ลบไม่สำเร็จ: ${error.message}`); }
    finally { setBusy(false); }
  }
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="/" aria-label="12 Tails หน้าหลัก"><img src="/favicon.svg" alt="" /><span>12 TAILS<span className="brand-sub">ITEM NOTEBOOK</span></span></a>
      <div className="topbar-right"><span className="shared-label"><span className="status-dot" /> สมุดที่แชร์กัน</span>
        {client && (session ? <button className="button secondary small" disabled={busy} onClick={logout}>ออกจากระบบ</button>
          : <button className="button secondary small" onClick={() => setLogin(true)}>เข้าสู่ระบบเจ้าของ</button>)}</div>
    </header>
    <main>
      <section className="hero"><div className="hero-copy"><div className="eyebrow"><span /> YOUR LITTLE ITEM ARCHIVE</div>
        <h1>ไอเท็มที่เจอ<br />ราคาที่<span className="accent">จดไว้.</span></h1>
        <p>สมุดราคาไอเท็ม 12 หางของเรา<br className="mobile-break" /> เก็บไว้ที่เดียว เปิดดูกันได้ทุกเวลา</p>
        <div className="hero-tags"><span>✦ ราคา Gold</span><span>฿ ราคาเงินบาท</span><span>กรอกและอัปเดตเอง</span></div>
      </div><div className="hero-illustration" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><span className="spark spark-one">✧</span><span className="spark spark-two">+</span><div className="floating-item"><ItemArt kind="gem" /></div><span className="illustration-caption">GOOD FINDS, KEPT HERE.</span></div></section>

      {demo && <div className="banner demo-banner"><span className="banner-icon">◇</span><div><strong>โหมดตัวอย่าง · ยังไม่เชื่อมต่อฐานข้อมูล</strong><p>{configurationError || 'ข้อมูลและราคาด้านล่างเป็นตัวอย่าง เมื่อเชื่อมต่อ Supabase แล้วจะแสดงสมุดจริงของคุณ'}</p></div></div>}
      {session && !admin && <p className="banner">เข้าสู่ระบบแล้ว · บัญชีนี้กำลังดูข้อมูล หากเป็นเจ้าของให้ตรวจสิทธิ์ใน Supabase</p>}
      {notice && <div className="banner notice" role="status"><span>{notice}</span><button className="icon-button" aria-label="ปิดข้อความ" onClick={() => setNotice('')}>×</button></div>}

      <section className="collection" aria-labelledby="collection-title">
        <div className="section-heading"><div><div className="eyebrow">THE COLLECTION</div><h2 id="collection-title">สมุดไอเท็ม <span className="count">{items.length}</span></h2></div>
          <div className="heading-actions">{!demo && <button className="button secondary small" disabled={loading} onClick={load} aria-label="โหลดข้อมูลใหม่">↻ <span>รีเฟรช</span></button>}
            {admin && <button className="button primary" onClick={() => setEditor(null)}><span aria-hidden="true">＋</span> เพิ่มไอเท็ม</button>}</div></div>
        <div className="toolbar"><div className="search-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
          <input type="search" aria-label="ค้นหาชื่อไอเท็ม" placeholder="ค้นหาชื่อไอเท็มที่จดไว้…" value={query} onChange={e => setQuery(e.target.value)} />
          {query && <button className="icon-button clear-search" aria-label="ล้างคำค้น" onClick={() => setQuery('')}>×</button>}</div>
          <label className="sort-label">เรียงตาม<select aria-label="เรียงไอเท็ม" value={sort} onChange={e => setSort(e.target.value)}><option value="updated">อัปเดตล่าสุด</option><option value="name">ชื่อไอเท็ม</option><option value="gold">Gold น้อย → มาก</option><option value="baht">บาท น้อย → มาก</option></select></label></div>
        <div className="results-meta" aria-live="polite"><span>{query ? `พบ ${visible.length} จาก ${items.length} ไอเท็ม` : `${items.length} ไอเท็มในสมุด`}</span><span>{demo ? 'ราคาสมมติสำหรับแสดงตัวอย่าง' : 'ราคาที่บันทึกเอง · ต่อไอเท็ม'}</span></div>
        {loading ? <div className="empty-state" role="status"><span className="loader" /><h3>กำลังเปิดสมุด…</h3></div>
          : loadError ? <div className="empty-state error-state" role="alert"><h3>เปิดสมุดไม่สำเร็จ</h3><p>{loadError}</p><button className="button secondary" onClick={load}>ลองอีกครั้ง</button></div>
          : !visible.length ? <div className="empty-state"><span className="empty-icon">◇</span><h3>{query ? 'ไม่พบไอเท็มที่ค้นหา' : 'ยังไม่มีไอเท็มในสมุด'}</h3><p>{query ? 'ลองค้นหาด้วยชื่ออื่น หรือกดล้างคำค้น' : admin ? 'เริ่มเก็บของที่เจอ ด้วยปุ่มเพิ่มไอเท็มด้านบน' : 'เจ้าของสมุดยังไม่ได้เพิ่มไอเท็ม กลับมาเปิดดูได้อีกครั้ง'}</p>{query && <button className="button secondary" onClick={() => setQuery('')}>ล้างคำค้น</button>}</div>
          : <div className="item-grid">{visible.map(item => <article className="item-card" key={item.id}>
            <div className="card-top"><ItemImage url={repository?.imageUrl(item.image_path)} name={item.name} art={item.art} /><span className="item-label">12 TAILS ITEM</span></div>
            <h3>{item.name}</h3><p className="item-description">{item.description || 'ยังไม่มีรายละเอียดเพิ่มเติม'}</p>
            <div className="prices"><div><span className="price-label"><i className="gold-dot" /> GOLD</span><strong className="gold-price">{formatPrice(item.gold)} <small>G</small></strong></div><div><span className="price-label">THAI BAHT</span><strong>฿ {formatPrice(item.baht)}</strong></div></div>
            <div className="card-bottom"><time dateTime={item.updated_at}>อัปเดต {formatDate(item.updated_at)}</time>
              {admin && <div className="card-actions"><button aria-label={`แก้ไข ${item.name}`} onClick={() => setEditor(item)}>แก้ไข</button><button className="danger-text" aria-label={`ลบ ${item.name}`} onClick={() => { setDeleting(item); setDeleteError(''); }}>ลบ</button></div>}</div>
          </article>)}</div>}
      </section>
      <div className="notebook-note"><span>✧</span><p>ราคาดี ๆ เปลี่ยนได้เสมอ<br /><small>สมุดนี้เก็บราคาที่เราจดไว้ เพื่อช่วยเทียบก่อนซื้อหรือขาย</small></p></div>
    </main>
    <footer><span>12 TAILS <span className="footer-dot">/</span> OUR ITEM NOTEBOOK</span><span>{latest && !loadError && !loading ? `อัปเดตล่าสุด ${formatDate(latest)}` : 'เก็บไอเท็มไว้ในที่เดียวกัน'}</span></footer>
    {login && client && <Login client={client} onClose={() => setLogin(false)} />}
    {editor !== undefined && admin && <ItemEditor item={editor} repository={repository} onClose={() => setEditor(undefined)} onSaved={({ item, warning }) => {
      setItems(current => [item, ...current.filter(row => row.id !== item.id)]); setEditor(undefined); setNotice(warning || 'บันทึกไอเท็มแล้ว');
    }} />}
    {deleting && admin && <Dialog title="ลบไอเท็มนี้?" busy={busy} onClose={() => setDeleting(null)}>
      <p className="delete-copy">ต้องการลบ <strong>{deleting.name}</strong> ออกจากสมุดใช่ไหม? การลบนี้ย้อนกลับไม่ได้</p>
      {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
      <div className="modal-actions"><button className="button secondary" disabled={busy} onClick={() => setDeleting(null)}>ยกเลิก</button><button className="button danger" disabled={busy} onClick={confirmDelete}>{busy ? 'กำลังลบ…' : 'ยืนยันลบไอเท็ม'}</button></div>
    </Dialog>}
  </div>;
}
