// Illustrative prices only. Never inserted into the real database.
export const demoItems = [
  { id: 'demo-1', name: 'ดาบแห่งนักเดินทาง', description: 'อาวุธคู่ใจสำหรับการผจญภัยครั้งใหม่', gold: 125000, baht: 250, art: 'sword' },
  { id: 'demo-2', name: 'คริสตัลแสงจันทร์', description: 'วัตถุดิบหายาก · จดราคาไว้ก่อนซื้อ', gold: 48000, baht: 96, art: 'gem' },
  { id: 'demo-3', name: 'โล่ผู้พิทักษ์', description: 'เช็กราคาล่าสุดก่อนแลกเปลี่ยน', gold: 87500, baht: 175, art: 'shield' },
  { id: 'demo-4', name: 'น้ำยาแห่งชีวิต', description: 'ของใช้สิ้นเปลือง · ราคาต่อชิ้น', gold: 2500, baht: 5, art: 'potion' }
].map(item => ({ ...item, image_path: null, updated_at: '2026-10-30T03:00:00Z' }));
