import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRepository } from '../src/repository.js';

// Controlled Supabase boundary: tests verify resulting records/files, not query strings.
function fixture({ admin = true, failSave = false, failDelete = false } = {}) {
  const files = new Set(['old.png']);
  const rows = new Map([['existing', { id: 'existing', image_path: 'old.png' }]]);
  const client = {
    rpc: async () => ({ data: admin, error: null }),
    storage: { from: () => ({
      upload: async path => { files.add(path); return { error: null }; },
      remove: async paths => { paths.forEach(p => files.delete(p)); return { error: null }; },
      getPublicUrl: path => ({ data: { publicUrl: `https://example.test/${path}` } })
    }) },
    from: () => ({
      insert: value => ({ select: () => ({ single: async () => {
        if (failSave) return { error: new Error('save failed') };
        rows.set(value.id, value); return { data: value, error: null };
      } }) }),
      update: value => ({ eq: (_, id) => ({ select: () => ({ single: async () => {
        if (failSave) return { error: new Error('save failed') };
        const row = { ...rows.get(id), ...value, id }; rows.set(id, row);
        return { data: row, error: null };
      } }) }) }),
      delete: () => ({ eq: (_, id) => ({ select: async () => {
        if (failDelete) return { error: new Error('delete failed') };
        const row = rows.get(id); rows.delete(id); return { data: row ? [row] : [], error: null };
      } }) })
    })
  };
  return { repo: createRepository(client), files, rows };
}
const values = { name: 'ดาบ', description: '', gold: '10', baht: '2' };
const file = { type: 'image/png', size: 30 };
test('denies authenticated non-admin before uploading or writing', async () => {
  const { repo, files, rows } = fixture({ admin: false });
  await assert.rejects(repo.save(values, file), /สิทธิ์/);
  await assert.rejects(repo.remove({ id: 'existing', image_path: 'old.png' }), /สิทธิ์/);
  assert.equal(files.size, 1); assert.equal(rows.size, 1);
});
test('failed database save cleans new upload while retaining old image and record', async () => {
  const { repo, files, rows } = fixture({ failSave: true });
  await assert.rejects(repo.save(values, file, { id: 'existing', image_path: 'old.png' }), /save failed/);
  assert.deepEqual([...files], ['old.png']); assert.equal(rows.get('existing').image_path, 'old.png');
});
test('replacement persists new image then removes previous image', async () => {
  const { repo, files, rows } = fixture();
  const { item } = await repo.save(values, file, { id: 'existing', image_path: 'old.png' });
  assert.ok(files.has(item.image_path)); assert.equal(files.has('old.png'), false);
  assert.equal(rows.get('existing').gold, 10);
});
test('failed deletion keeps old image; successful deletion cleans image', async () => {
  const failed = fixture({ failDelete: true });
  await assert.rejects(failed.repo.remove({ id: 'existing', image_path: 'old.png' }));
  assert.ok(failed.files.has('old.png'));
  const ok = fixture();
  await ok.repo.remove({ id: 'existing', image_path: 'old.png' });
  assert.equal(ok.rows.size, 0); assert.equal(ok.files.size, 0);
});
