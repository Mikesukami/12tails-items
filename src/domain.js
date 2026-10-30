export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const imageTypes = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function validateImage(file) {
  if (!imageTypes[file.type]) throw new Error('รองรับรูป JPG, PNG และ WebP เท่านั้น');
  if (!file.size || file.size > MAX_IMAGE_SIZE) throw new Error('รูปภาพต้องมีขนาดไม่เกิน 2 MB และไม่เป็นไฟล์ว่าง');
  return imageTypes[file.type];
}

function price(value, label) {
  const text = String(value ?? '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text) || !Number.isFinite(Number(text)) || Number(text) > 999999999999.99) {
    throw new Error(`${label}: กรอกตัวเลขตั้งแต่ 0 ถึง 999,999,999,999.99 ทศนิยมไม่เกิน 2 ตำแหน่ง`);
  }
  return Number(text);
}

export function parseItem(values) {
  const name = String(values.name ?? '').trim();
  const description = String(values.description ?? '').trim();
  if (!name || name.length > 120) throw new Error('ชื่อไอเท็มต้องมี 1–120 ตัวอักษร');
  if (description.length > 2000) throw new Error('รายละเอียดต้องไม่เกิน 2,000 ตัวอักษร');
  return { name, description, gold: price(values.gold, 'ราคา Gold'), baht: price(values.baht, 'ราคาเงินบาท') };
}

export function filterItems(items, query, sort = 'updated') {
  const needle = query.trim().toLocaleLowerCase('th');
  return items.filter(item => item.name.toLocaleLowerCase('th').includes(needle)).sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'th');
    if (sort === 'gold' || sort === 'baht') return Number(a[sort]) - Number(b[sort]) || a.name.localeCompare(b.name, 'th');
    return new Date(b.updated_at) - new Date(a.updated_at);
  });
}

export const formatPrice = value => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value);
export const formatDate = value => new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
