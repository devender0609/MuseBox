import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const sql = await readFile(new URL('../supabase-setup.sql', import.meta.url), 'utf8');

test('Explore copy states two free music creations and included sharing', () => {
  assert.match(page, /2 free music creations/);
  assert.match(page, /Any 2 Moments · up to 2 minutes each/i);
  assert.match(page, /downloads, gift pages and re-exports/i);
  assert.doesNotMatch(page, /Two-minute welcome allowance/);
});

test('migration does not infer a used free song from old minute balance', () => {
  assert.doesNotMatch(sql, /free_song_claimed=true\s*\nwhere plan='Explore'[^;]*minutes_remaining < 2/);
  assert.match(sql, /v17\.5_repair_explore_welcome_entitlement/);
  assert.match(sql, /exists \(\s*select 1 from public\.songs s where s\.user_id=m\.user_id/);
});

test('welcome entitlement repair is one-time and rerunnable', () => {
  assert.match(sql, /create table if not exists public\.cantoa_schema_migrations/);
  assert.match(sql, /if not exists \([\s\S]*migration_key='v17\.5_repair_explore_welcome_entitlement'/);
  assert.match(sql, /insert into public\.cantoa_schema_migrations\(migration_key\)/);
});

test('new accounts start with exactly two two-minute welcome creations', () => {
  assert.match(sql, /values\(new\.id,new\.email,'Explore','active',2,false/);
  assert.match(sql, /if coalesce\(free_remaining,0\) <= 0 then raise exception 'FREE_SONGS_USED'/);
  assert.match(sql, /if p_minutes>2 then raise exception 'FREE_SONG_TOO_LONG'/);
});
