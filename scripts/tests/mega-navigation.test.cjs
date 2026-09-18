const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');

// Run the server helper with a fake CMS response; no credentials or live content are needed.
const source = fs.readFileSync(path.join(__dirname, '../../src/lib/DSI/Common/MegaNavigation/getMegaNavigationData.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const moduleExports = {};
new Function('exports', compiled)(moduleExports);
const { getMegaNavigationData } = moduleExports;
const item = (id, template, values = {}) => ({ id, name: id, template: { name: template },
  url: { url: `/${id}` }, fields: Object.entries(values).map(([name, value]) => ({ name, jsonValue: { value } })) });

for (const mode of ['Manual', 'Automatic']) {
  test(`${mode} listing keeps order, count, fields and preview context`, async () => {
    const listing = item('listing', 'Dsi Mega Navigation Listing', { SelectionMode: mode, ItemCount: 2 });
    const first = item('first', 'Page', { Title: 'First', Description: 'Summary', Content: '<p>Unused</p>' });
    const second = item('second', 'Page', { Content: '<p>Body</p>', Image: { src: '/image.png' } });
    first.updated = { value: '20260919T120000Z' };
    second.updated = { value: '20260918T120000Z' };
    const tree = {
      root: [item('menu', 'Dsi Mega Navigation Item', { EnablePanel: true })],
      menu: [listing], source: [second, first, item('third', 'Page')],
    };
    const page = { locale: 'fr-CA', siteName: 'test', layout: { sitecore: { route: { placeholders: {
      header: [{ componentName: 'DsiMegaNavigationComponent', fields: { data: { datasource: { id: 'root' } } } }],
    } } } } };
    const client = { async getData(query, vars, options) {
      assert.equal(vars.language, 'fr-CA');
      assert.equal(options.headers.sc_editMode, 'true');
      if (query.includes('query MegaNavigationListing')) return { item: { selected: { value: 'missing|second|first|third' }, source: { value: 'source' } } };
      if (query.includes('query MegaNavigationPage')) return { item: { first, second }[vars.id] || null };
      // Split source children into batches to verify pagination before ItemCount is applied.
      const results = vars.id === 'source' ? (vars.after ? tree.source.slice(1) : tree.source.slice(0, 1)) : tree[vars.id];
      return { item: { children: { results, pageInfo: { hasNext: vars.id === 'source' && !vars.after, endCursor: 'next' } } } };
    } };
    const result = await getMegaNavigationData(page, client, { sc_editMode: 'true' });
    const links = result.layout.sitecore.route.placeholders.header[0].fields.megaNavigation.items[0].blocks[0].links;
    assert.deepEqual(links.map((link) => link.id), mode === 'Manual' ? ['second', 'first'] : ['first', 'second']);
    const secondLink = links.find((link) => link.id === 'second');
    const firstLink = links.find((link) => link.id === 'first');
    assert.equal(secondLink.title.value, 'second');
    assert.equal(secondLink.content.value, '<p>Body</p>');
    assert.equal(secondLink.link.value.href, '/second');
    assert.equal(secondLink.image.value.src, '/image.png');
    assert.equal(firstLink.description.value, 'Summary');
    assert.equal(firstLink.content, undefined);
    assert.equal(page.layout.sitecore.route.placeholders.header[0].fields.megaNavigation, undefined);
  });
}
