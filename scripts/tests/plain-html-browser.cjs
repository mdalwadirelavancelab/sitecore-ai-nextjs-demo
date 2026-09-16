/* Browser regression checks for the actual Plain HTML helper. No CMS is modified.
 * Run: node scripts/tests/plain-html-browser.cjs
 * Open the printed URL. Stop with Ctrl+C after testing.
 */
const http = require('node:http');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/lib/DSI/Common/PlainHtml/mountPlainHtml.ts', 'utf8');
const helper = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
const tests = `
import { mountPlainHtml } from '/helper.js';
const results = document.querySelector('#results');
let failures = 0;
const check = (name, condition) => {
  const li = document.createElement('li'); li.textContent = (condition ? 'PASS: ' : 'FAIL: ') + name;
  results.append(li); if (!condition) failures++;
};
const wait = ms => new Promise(r => setTimeout(r, ms));
const end = '<' + '/script>';
const block = '<section><button>Test</button><output></output></section>';
const action = '<script>(()=>{const c=document.currentScript.previousElementSibling;c.querySelector("button").onclick=()=>{const o=c.querySelector("output");o.textContent=String(Number(o.textContent)+1)}})();' + end;
const a=document.querySelector('#a'), b=document.querySelector('#b');
const cleanupA=mountPlainHtml(a, block+action);
const cleanupB=mountPlainHtml(b, block+action);
await wait(0);
a.querySelector('button').click();
check('original script position and isolated instances', a.querySelector('output').textContent==='1' && b.querySelector('output').textContent==='');
const old=a.querySelector('button');cleanupA();
check('cleanup removes old DOM', !old.isConnected && a.childNodes.length===0);
let clean=mountPlainHtml(a, block+action);await wait(0);a.querySelector('button').click();
check('remount binds the replacement once',a.querySelector('output').textContent==='1');clean();cleanupB();
clean=mountPlainHtml(a,'<script src="/library.js">'+end+'<output id="sequence"></output><script>document.querySelector("#sequence").textContent=String(window.plainLibraryReady);'+end);
await wait(250);
check('external library loads before following inline code',a.querySelector('output').textContent==='true');clean();
clean=mountPlainHtml(a,'<script src="/slow.js">'+end+'<script>document.body.dataset.cancelFailed="yes";'+end);
clean();await wait(250);
check('unmount stops the pending script sequence',!document.body.dataset.cancelFailed);
clean=mountPlainHtml(a,'<style>#a output{padding:13px}</style><output>styled</output><svg viewBox="0 0 1 1"><path d="M0 0L1 1"/></svg><script type="application/ld+json">{"name":"sample"}'+end+'<script>document.querySelector("#a output").dataset.ran="yes";'+end);
await wait(0);
check('styles, SVG and JSON data blocks survive',getComputedStyle(a.querySelector('output')).padding==='13px' && !!a.querySelector('svg path') && a.querySelector('output').dataset.ran==='yes');clean();
`;
// Continue with missing media and resolved Sitecore URL cases.
const suite = tests + `
clean=mountPlainHtml(a,'<img src="-/media/missing.svg"><p>Remaining HTML</p>');check('missing media does not hide other content',a.querySelector('p').textContent==='Remaining HTML');clean();
clean=mountPlainHtml(a,'<img src="-/media/test.svg"><a href="https://example.com/path">external</a>',{'-/media/test.svg':location.origin+'/-/media/test.svg?tt=sitecore-token&ttc=123'});
await wait(100);
check('relative CMS media loads on the configured host',a.querySelector('img').naturalWidth===1);
check('external URLs remain unchanged',a.querySelector('a').getAttribute('href')==='https://example.com/path');clean();
clean=mountPlainHtml(a,'<script type="module">document.querySelector("#a").dataset.module="yes";'+end+'<output>module</output>');
await wait(100);check('module scripts execute',a.dataset.module==='yes');clean();
const originalError=console.error;let reported=false;console.error=()=>{reported=true};
clean=mountPlainHtml(a,'<script src="/missing.js">'+end+'<script>document.body.dataset.afterFailure="yes";'+end);
await wait(150);console.error=originalError;
check('failed library is reported and stops dependent scripts',reported && !document.body.dataset.afterFailure);clean();
document.querySelector('h1').textContent=failures ? failures+' failed' : 'All Plain HTML checks passed';
`;
http.createServer((req,res)=>{
 if(req.url==='/helper.js'){res.setHeader('content-type','text/javascript');return res.end(helper)}
 if(req.url==='/tests.js'){res.setHeader('content-type','text/javascript');return res.end(suite)}
 if(req.url==='/library.js'||req.url==='/slow.js'){res.setHeader('content-type','text/javascript');return setTimeout(()=>res.end('window.plainLibraryReady=true;'),100)}
 if(req.url.startsWith('/-/media/test.svg')){res.setHeader('content-type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')}
 if(req.url==='/missing.js'){res.writeHead(404);return res.end()}
 if(req.url!=='/'){res.writeHead(404);return res.end()}
 res.setHeader('content-type','text/html');res.end('<!doctype html><title>Plain HTML regression checks</title><h1>Running checks</h1><ul id="results"></ul><div id="a"></div><div id="b"></div><script type="module" src="/tests.js"></script>');
}).listen(4319,'127.0.0.1',()=>console.log('Open http://127.0.0.1:4319'));
