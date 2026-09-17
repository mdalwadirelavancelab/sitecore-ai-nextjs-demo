import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { compile } from 'sass';
import { createSite } from './create-site.mjs';

async function fixture(t) {
  const parent = path.resolve(os.tmpdir());
  const root = await mkdtemp(path.join(parent, 'dsi-site-create-test-'));
  t.after(async () => {
    // Delete only the temporary fixture created by this test.
    if (path.dirname(root) !== parent || !path.basename(root).startsWith('dsi-site-create-test-')) {
      throw new Error('Unexpected test cleanup path.');
    }
    await rm(root, { recursive: true, force: true });
  });
  await mkdir(path.join(root, 'src/Sites'), { recursive: true });
  await writeFile(path.join(root, 'src/Sites/siteThemes.json'), '{}\n');
  return root;
}

test('creates sites without demo-site and preserves registrations and developer edits', async t => {
  const rootDir = await fixture(t);
  const messages = [];
  const options = { rootDir, log: value => messages.push(value) };
  assert.equal(await createSite('xyz-demo', options), 'created');
  const entry = path.join(rootDir, 'src/Sites/xyz-demo/styles/main.scss');
  assert.equal(compile(entry, { style: 'compressed' }).css,
    await readFile(path.join(rootDir, 'public/Sites/xyz-demo/styles/main.css'), 'utf8'));
  await access(path.join(rootDir, 'src/components/Sites/xyz-demo/.gitkeep'));
  await access(path.join(rootDir, 'public/Sites/xyz-demo/images/.gitkeep'));
  await access(path.join(rootDir, 'public/Sites/xyz-demo/fonts/.gitkeep'));
  await writeFile(entry, '/* developer work */');
  assert.equal(await createSite('xyz-demo', options), 'exists');
  assert.equal(await readFile(entry, 'utf8'), '/* developer work */');
  assert.ok(messages.includes('Site "xyz-demo" already exists. No files were changed.'));
  await createSite('second-site', options);
  const themes = JSON.parse(await readFile(path.join(rootDir, 'src/Sites/siteThemes.json'), 'utf8'));
  assert.deepEqual(Object.keys(themes), ['xyz-demo', 'second-site']);
  assert.equal(themes['xyz-demo'].stylesheet, '/Sites/xyz-demo/styles/main.css');
});

test('rejects invalid names before writing', async t => {
  const rootDir = await fixture(t);
  for (const name of ['', '../escape', 'XYZ Demo', 'a/b', 'a--b', '-a', 'a-', 'con', 'lpt1', 'x'.repeat(64)]) {
    await assert.rejects(createSite(name, { rootDir }), /Invalid site name/);
  }
  assert.equal(await readFile(path.join(rootDir, 'src/Sites/siteThemes.json'), 'utf8'), '{}\n');
});

test('protects incomplete sites and releases the lock', async t => {
  const rootDir = await fixture(t);
  const folder = path.join(rootDir, 'src/components/Sites/partial-site');
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, 'keep.txt'), 'keep');
  await assert.rejects(createSite('partial-site', { rootDir }), /incomplete setup/);
  assert.equal(await readFile(path.join(folder, 'keep.txt'), 'utf8'), 'keep');
  await assert.rejects(access(path.join(rootDir, 'src/Sites/.site-create.lock')));
});

test('invalid registry and concurrent execution fail without creating a site', async t => {
  const rootDir = await fixture(t);
  const registry = path.join(rootDir, 'src/Sites/siteThemes.json');
  await writeFile(registry, '[]');
  await assert.rejects(createSite('new-site', { rootDir }), /Invalid siteThemes.json/);
  await assert.rejects(access(path.join(rootDir, 'src/Sites/new-site')));
  await writeFile(path.join(rootDir, 'src/Sites/.site-create.lock'), '');
  await assert.rejects(createSite('new-site', { rootDir }), /Another site creation/);
});
