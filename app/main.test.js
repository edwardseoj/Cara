const test = require('node:test');
const assert = require('node:assert');

test('placeholder', () => assert.strictEqual(1 + 1, 2));

require("node:test")("ruleset red check", () => { throw new Error("intentional"); });
