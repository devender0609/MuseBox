import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const layout = fs.readFileSync('app/layout.tsx', 'utf8');
const checkout = fs.readFileSync('app/api/checkout/route.ts', 'utf8');
const success = fs.readFileSync('app/checkout-success/page.tsx', 'utf8');

test('Google Ads global tag is installed once in root layout', () => {
  assert.match(layout, /AW-18430730512/);
  assert.match(layout, /googletagmanager\.com\/gtag\/js/);
  assert.equal((layout.match(/id=AW-18430730512/g) || []).length, 1);
});

test('Stripe checkout uses dedicated Google Ads purchase destination', () => {
  assert.match(checkout, /success_url: `\$\{origin\}\/checkout-success`/);
});

test('checkout success page exists and returns users to Cantoa', () => {
  assert.match(success, /Your membership is ready/);
  assert.match(success, /\/\?checkout=success/);
  assert.match(success, /index: false/);
});
