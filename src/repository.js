import { parseItem, validateImage } from './domain.js';

export function createRepository(client) {
  const bucket = client.storage.from('item-images');
  async function isAdmin() {
    const { data, error } = await client.rpc('is_admin');
    if (error) throw error;
    return data === true;
  }
  async function requireAdmin() {
    if (!await isAdmin()) throw new Error('บัญชีนี้ไม่มีสิทธิ์แก้ไขข้อมูล');
  }
  async function clean(path) {
    if (!path) return '';
    try {
      const { error } = await bucket.remove([path]);
      if (error) throw error;
      return '';
    } catch {
      return 'บันทึกข้อมูลแล้ว แต่ลบรูปเก่าไม่สำเร็จ สามารถลบไฟล์ที่ไม่ได้ใช้ใน Supabase Storage ภายหลังได้';
    }
  }
  return {
    isAdmin,
    imageUrl(path) { return path ? bucket.getPublicUrl(path).data.publicUrl : null; },
    async list() {
      // Page through PostgREST's default 1,000-row limit rather than silently dropping items.
      const rows = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await client.from('items').select('*').order('id').range(offset, offset + 499);
        if (error) throw error;
        rows.push(...data);
        if (data.length < 500) return rows;
      }
    },
    async save(values, file, previous = null, removeImage = false) {
      const item = parseItem(values);
      const extension = file ? validateImage(file) : null;
      await requireAdmin();
      let newPath;
      if (file) {
        newPath = `${crypto.randomUUID()}.${extension}`;
        const { error } = await bucket.upload(newPath, file, { contentType: file.type, upsert: false, cacheControl: '31536000' });
        if (error) throw error;
      }
      const image_path = newPath ?? (removeImage ? null : previous?.image_path ?? null);
      let data;
      try {
        const query = previous
          ? client.from('items').update({ ...item, image_path }).eq('id', previous.id)
          : client.from('items').insert({ ...item, image_path, id: crypto.randomUUID() });
        const result = await query.select().single();
        if (result.error) throw result.error;
        data = result.data;
      } catch (error) {
        const cleanupWarning = newPath ? await clean(newPath) : '';
        if (cleanupWarning) throw new Error(`${error.message} (มีรูปอัปโหลดค้างใน Storage กรุณาตรวจสอบไฟล์ที่ไม่ได้ใช้)`);
        throw error;
      }
      const warning = previous?.image_path && previous.image_path !== image_path ? await clean(previous.image_path) : '';
      return { item: data, warning };
    },
    async remove(item) {
      await requireAdmin();
      const { data, error } = await client.from('items').delete().eq('id', item.id).select();
      if (error) throw error;
      if (!data?.length) throw new Error('ไม่พบไอเท็มหรือไม่มีสิทธิ์ลบ กรุณาโหลดข้อมูลใหม่');
      return { warning: await clean(item.image_path) };
    }
  };
}
