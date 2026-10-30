import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseItem, validateImage, filterItems } from '../src/domain.js';

test('trims Thai names and preserves zero and independent prices', () => {
  assert.deepEqual(parseItem({ name: '  ดาบแมว  ', description: ' test ', gold: '0', baht: '12.50' }),
    { name: 'ดาบแมว', description: 'test', gold: 0, baht: 12.5 });
});
test('rejects missing, negative, nonfinite, excess precision and overflow prices', () => {
  for (const gold of ['', ' ', '-1', 'Infinity', 'NaN', '1.001', '1000000000000', '1e3']) {
    assert.throws(() => parseItem({ name: 'x', gold, baht: '1' }));
  }
  assert.throws(() => parseItem({ name: ' ', gold: '1', baht: '1' }));
  assert.throws(() => parseItem({ name: 'a'.repeat(121), gold: '1', baht: '1' }));
  assert.throws(() => parseItem({ name: 'a', description: 'a'.repeat(2001), gold: '1', baht: '1' }));
});
test('accepts raster images only up to 2 MiB', () => {
  assert.equal(validateImage({ type: 'image/png', size: 2097152 }), 'png');
  assert.equal(validateImage({ type: 'image/jpeg', size: 32 }), 'jpg');
  assert.throws(() => validateImage({ type: 'image/svg+xml', size: 10 }));
  assert.throws(() => validateImage({ type: 'image/webp', size: 2097153 }));
  assert.throws(() => validateImage({ type: 'image/png', size: 0 }));
});
test('searches names literally without interpreting symbols and sorts without mutating', () => {
  const items = [{ name: 'Cat [Rare]', gold: 12 }, { name: 'ดาบแมว', gold: 2 }];
  assert.equal(filterItems(items, ' cat [ ', 'name')[0].name, 'Cat [Rare]');
  assert.equal(filterItems(items, 'แมว', 'name')[0].name, 'ดาบแมว');
  assert.deepEqual(filterItems(items, '', 'gold').map(i => i.gold), [2, 12]);
  assert.equal(items[0].gold, 12);
});
