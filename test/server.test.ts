import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { verify, checksum, complete } from '../src/server.js';

test('verify known valid number (Visa test card)', () => {
  assert.equal(verify('4532015112830366'), true);
});

test('verify known valid number with spaces', () => {
  assert.equal(verify('4532 0151 1283 0366'), true);
});

test('verify rejects invalid', () => {
  assert.equal(verify('4532015112830367'), false);
});

test('checksum computes the missing digit', () => {
  // Known: appending check digit to "7992739871" gives 79927398713
  assert.equal(checksum('7992739871'), 3);
});

test('complete appends check digit', () => {
  assert.equal(complete('7992739871'), '79927398713');
  assert.equal(verify(complete('7992739871')), true);
});

test('rejects non-numeric input', () => {
  assert.throws(() => verify('123 abc'));
});

test('verifies an IMEI', () => {
  // Sample valid IMEI (test value).
  assert.equal(verify('490154203237518'), true);
});

test('verify accepts dashes as separators', () => {
  assert.equal(verify('4532-0151-1283-0366'), true);
});

test('verify rejects inputs shorter than two digits', () => {
  assert.equal(verify('0'), false);
  assert.equal(verify('7'), false);
});

test('checksum ignores spaces and dashes', () => {
  assert.equal(checksum('7992 7398 71'), checksum('7992739871'));
  assert.equal(checksum('799-273-9871'), 3);
});

test('complete strips separators and yields a Luhn-valid number', () => {
  assert.equal(complete('7992 7398 71'), '79927398713');
  assert.equal(verify(complete('4532 0151 1283 036')), true);
});

test('checksum produces a digit that makes the input verify-valid', () => {
  for (const base of ['12345', '8', '49015420323751', '0']) {
    const full = base + String(checksum(base));
    assert.equal(verify(full), true, `expected ${full} to be Luhn-valid`);
  }
});

test('checksum and complete reject non-numeric input', () => {
  assert.throws(() => checksum('12 ab'));
  assert.throws(() => complete('12 ab'));
});
