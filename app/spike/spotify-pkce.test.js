const test = require('node:test');
const assert = require('node:assert');
const { challengeOf } = require('./spotify-pkce');

// RFC 7636 appendix B vector
test('S256 challenge matches RFC 7636', () => {
  assert.strictEqual(
    challengeOf('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),
    'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
  );
});
