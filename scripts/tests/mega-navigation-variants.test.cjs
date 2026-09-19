const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');

// Test labels and event decisions without connecting to CMS. Browser layout is tested separately.
function setup(variant, items, open = null) {
  const changes = [];
  let stateIndex = 0;
  const react = { ...React,
    useId: () => 'test-menu', useRef: (value) => ({ current: value }), useEffect: () => {},
    useState: (value) => {
      const index = stateIndex++;
      return [index === 0 ? open : value, (next) => changes.push([index, next])];
    },
  };
  const sdk = {
    useSitecore: () => ({ page: { mode: { isEditing: false } } }),
    Text: ({ tag = 'span', field, ...props }) => React.createElement(tag, props, field?.value),
    Link: ({ field, children, ...props }) => React.createElement('a', { ...props, href: field?.value?.href }, children),
    RichText: () => null, Image: () => null,
  };
  const source = fs.readFileSync(path.join(__dirname, '../../src/components/DSI/CoreUI/DsiMegaNavigationComponent.tsx'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true,
  } }).outputText;
  const exports = {};
  new Function('require', 'exports', code)((name) => {
    if (name === 'react') return react;
    if (name === '@sitecore-content-sdk/nextjs') return sdk;
    if (name.endsWith('getComponentStyles')) return { getComponentStyles: () => ({ styles: '' }) };
    throw new Error(`Unexpected import: ${name}`);
  }, exports);
  const nodes = [];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (typeof node.type === 'function') return walk(node.type(node.props));
    nodes.push(node);
    walk(node.props?.children);
  }
  walk(exports[variant]({ fields: { megaNavigation: { items } } }));
  return { changes, nodes, find: (className) => nodes.filter((node) => node.props?.className?.split(' ').includes(className)) };
}
const field = (value) => ({ value });
const menu = (values = {}) => ({ id: 'about', title: field('About'), enablePanel: field(true), blocks: [], ...values });
const text = (node) => Array.isArray(node) ? node.map(text).join('') :
  node && typeof node === 'object' ? text(typeof node.type === 'function' ? node.type(node.props) : node.props?.children) :
    typeof node === 'boolean' ? '' : (node ?? '').toString();

test('AnchorHover keeps real links navigable and opens on focus; touch has an inner parent link', () => {
  const view = setup('AnchorHover', [menu({ link: field({ href: '/about' }) })]);
  const desktop = view.find('mega-desktop-trigger')[0];
  assert.equal(desktop.type, 'a');
  assert.equal(desktop.props.href, '/about');
  desktop.props.onClick({ preventDefault: () => assert.fail('Real URL must navigate') });
  desktop.props.onFocus();
  assert.deepEqual(view.changes.pop(), [0, 'about']);
  assert.equal(view.find('mega-touch-trigger')[0].type, 'button');
  assert.equal(view.find('mega-parent-link')[0].props.href, '/about');
  view.find('mega-touch-trigger')[0].props.onClick();
  assert.deepEqual(view.changes.pop(), [0, 'about']);
  const expanded = setup('AnchorHover', [menu()], 'about');
  expanded.find('mega-touch-trigger')[0].props.onClick();
  assert.deepEqual(expanded.changes.pop(), [0, null]);
});

test('Empty and hash URLs never jump and never create an inner parent link', () => {
  for (const href of ['', ' ', '#']) {
    const view = setup('AnchorHover', [menu({ link: field({ href }) })]);
    let prevented = false;
    const anchor = view.find('mega-desktop-trigger')[0];
    assert.equal(anchor.props.href, '#');
    anchor.props.onClick({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(view.find('mega-parent-link').length, 0);
  }
});

test('Both variants use distinct label and heading priorities, including whitespace and Link fallback', () => {
  const cases = [
    ['News', 'Newsroom', 'Go', 'News', 'Newsroom'],
    [' ', 'Newsroom', 'Go', 'Newsroom', 'Newsroom'],
    ['', '', 'Go', 'Go', 'Go'],
    [' ', ' ', ' ', 'Link', 'Link'],
  ];
  for (const variant of ['Default', 'AnchorHover']) {
    for (const [title, panel, linkText, label, heading] of cases) {
      const view = setup(variant, [menu({ title: field(title), panelTitle: field(panel), link: field({ text: linkText }) })]);
      assert.equal(text(view.find('mega-trigger')[0]), label);
      assert.equal(text(view.nodes.find((node) => node.type === 'h2')), heading);
    }
  }
});

test('Content-only columns have no heading; buttons, child links and ViewAllLink get labels', () => {
  const view = setup('Default', [menu({ blocks: [{
    id: 'column', kind: 'column', title: field(' '), links: [{ id: 'child' }],
    buttonLink: field({ href: '/button', text: ' ' }), viewAllLink: field({ href: '/all' }),
  }] })]);
  assert.equal(view.nodes.filter((node) => node.type === 'h3').length, 0);
  assert.equal(text(view.find('mega-column-button')[0]), 'Link');
  assert.equal(text(view.find('mega-view-all')[0]), 'Link');
  assert.equal(text(view.find('mega-link-title')[0]), 'Link');
});
