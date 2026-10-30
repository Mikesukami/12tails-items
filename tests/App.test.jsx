import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import App from '../src/App.jsx';

const items = [
  { id: '1', name: 'ดาบแมว', description: 'อาวุธ', gold: 1500, baht: 20, updated_at: '2026-10-30T00:00:00Z' },
  { id: '2', name: 'Rabbit staff', description: '', gold: 200, baht: 3, updated_at: '2026-10-29T00:00:00Z' }
];
function fixture({ admin = false, error = null } = {}) {
  const repository = {
    list: vi.fn(async () => { if (error) throw error; return items; }),
    isAdmin: vi.fn(async () => admin), imageUrl: () => null,
    save: vi.fn(async values => ({ item: { ...values, id: '3', updated_at: new Date().toISOString() }, warning: '' })),
    remove: vi.fn(async () => ({ warning: '' }))
  };
  const client = { auth: {
    getSession: async () => ({ data: { session: admin ? { user: { id: 'owner', email: 'owner@example.com' } } : null } }),
    onAuthStateChange: callback => { client.emitAuth = callback; return { data: { subscription: { unsubscribe() {} } } }; },
    signOut: async () => ({ error: null })
  } };
  return { repository, client };
}
describe('shared board', () => {
  test('visitor can search Thai names but has no editing controls', async () => {
    const user = userEvent.setup();
    render(<App {...fixture()} />);
    await screen.findByRole('heading', { name: 'ดาบแมว' });
    expect(screen.queryByRole('button', { name: 'เพิ่มไอเท็ม' })).not.toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'แมว');
    expect(screen.queryByRole('heading', { name: 'Rabbit staff' })).not.toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'notfound');
    expect(screen.getByText('ไม่พบไอเท็มที่ค้นหา')).toBeInTheDocument();
  });
  test('owner adds item and sees it on the board', async () => {
    const user = userEvent.setup(); const deps = fixture({ admin: true });
    render(<App {...deps} />);
    await user.click(await screen.findByRole('button', { name: 'เพิ่มไอเท็ม' }));
    await user.type(screen.getByLabelText('ชื่อไอเท็ม'), 'โล่ใหม่');
    await user.type(screen.getByLabelText('ราคา Gold'), '120');
    await user.type(screen.getByLabelText('ราคาเงินบาท'), '5');
    await user.click(screen.getByRole('button', { name: 'บันทึกไอเท็ม' }));
    await screen.findByRole('heading', { name: 'โล่ใหม่' });
    expect(deps.repository.save).toHaveBeenCalledOnce();
  });
  test('failed save retains typed values and shows error', async () => {
    const user = userEvent.setup(); const deps = fixture({ admin: true });
    deps.repository.save.mockRejectedValue(new Error('network failed'));
    render(<App {...deps} />);
    await user.click(await screen.findByRole('button', { name: 'เพิ่มไอเท็ม' }));
    await user.type(screen.getByLabelText('ชื่อไอเท็ม'), 'โล่เดิม');
    await user.type(screen.getByLabelText('ราคา Gold'), '1');
    await user.type(screen.getByLabelText('ราคาเงินบาท'), '2');
    await user.click(screen.getByRole('button', { name: 'บันทึกไอเท็ม' }));
    await screen.findByText(/network failed/);
    expect(screen.getByLabelText('ชื่อไอเท็ม')).toHaveValue('โล่เดิม');
  });
  test('load failure offers retry instead of an empty board', async () => {
    render(<App {...fixture({ error: new Error('offline') })} />);
    await screen.findByText(/offline/);
    expect(screen.getByRole('button', { name: 'ลองอีกครั้ง' })).toBeInTheDocument();
    expect(screen.queryByText('ยังไม่มีไอเท็มในสมุด')).not.toBeInTheDocument();
  });
  test('missing config is explicitly read-only demo', async () => {
    render(<App client={null} repository={null} />);
    await waitFor(() => expect(screen.getByText(/โหมดตัวอย่าง/)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'เพิ่มไอเท็ม' })).not.toBeInTheDocument();
  });
  test('same-owner auth refresh preserves unsaved editor values', async () => {
    const user = userEvent.setup(); const deps = fixture({ admin: true });
    render(<App {...deps} />);
    await user.click(await screen.findByRole('button', { name: 'เพิ่มไอเท็ม' }));
    await user.type(screen.getByLabelText('ชื่อไอเท็ม'), 'ยังไม่ได้บันทึก');
    await act(async () => deps.client.emitAuth('TOKEN_REFRESHED', { user: { id: 'owner', email: 'owner@example.com' } }));
    expect(screen.getByLabelText('ชื่อไอเท็ม')).toHaveValue('ยังไม่ได้บันทึก');
  });
});
