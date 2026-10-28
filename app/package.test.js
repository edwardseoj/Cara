const test = require('node:test');
const assert = require('node:assert');
const pkg = require('./package.json');

const cssTools = ['tailwindcss', '@tailwindcss/cli', 'basecoat-css'];

test('Dev UI CSS tooling is dev-only, never a runtime dependency', () => {
  for (const name of cssTools) {
    assert.ok(pkg.devDependencies[name], `${name} missing from devDependencies`);
    assert.ok(!(pkg.dependencies ?? {})[name], `${name} must not be a runtime dependency`);
  }
});

test('package build excludes the Dev UI page and its folder', () => {
  assert.ok(pkg.build.files.includes('!dev.html'));
  assert.ok(pkg.build.files.includes('!dev/**'));
});
