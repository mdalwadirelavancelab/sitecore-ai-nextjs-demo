const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const filename = require('node:path').resolve('src/lib/DSI/Common/PlainHtml/getPlainHtmlMediaData.ts');
const m = new Module(filename, module);
m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);
const { getPlainHtmlMediaData } = m.exports;
const rendering = html => ({componentName:'DsiPlainHTMLComponent',fields:{HtmlCode:{value:html}}});
const page = renderings => ({siteName:'test-site',locale:'en',layout:{sitecore:{route:{placeholders:{main:renderings}}}}});

test('resolves media IDs, preserves tokens, deduplicates and forwards preview context', async()=>{
 const html='<img src="-/media/14577B9343904BB1B33DA749284016D9.ashx?w=124"><img src="https://other.example/-/media/external.png">';
 const input=page([rendering(html),{placeholders:{nested:[rendering(html)]}}]);let calls=0;
 const output=await getPlainHtmlMediaData(input,{getData:async(query,variables,options)=>{
  calls++;assert.equal(variables.id0,'14577B9343904BB1B33DA749284016D9');assert.equal(variables.language,'en');
  assert.equal(options.headers.sc_site,'test-site');assert.equal(options.headers.sc_editMode,'true');
  return {m0:{path:'/sitecore/media library/Common/Merck',url:{url:'https://media.example/Merck.png?tt=from-cms&ttc=123'}}};
 }},{sc_editMode:'true'});
 assert.equal(calls,1);assert.equal(input.layout.sitecore.route.placeholders.main[0].fields.mediaUrls,undefined);
 assert.equal(output.layout.sitecore.route.placeholders.main[0].fields.HtmlCode.value,html);
 assert.equal(output.layout.sitecore.route.placeholders.main[0].fields.mediaUrls['-/media/14577B9343904BB1B33DA749284016D9.ashx'],'https://media.example/Merck.png?tt=from-cms&ttc=123');
});

test('skips pages without local Plain HTML media',async()=>{
 await getPlainHtmlMediaData(page([rendering('<p>Text</p>'),{componentName:'Other',fields:{HtmlCode:{value:'<img src="-/media/not-ours.png">'}}}]),{getData:async()=>assert.fail('Unexpected request')});
});

test('batches named paths and uses current language',async()=>{
 const input=page([rendering([1,2,3,4].map(i=>'<img src="/-/media/Project/Logo'+i+'.png">').join(''))]);input.locale='fr';let calls=0;
 await getPlainHtmlMediaData(input,{getData:async(q,v)=>{
  calls++;assert.equal(v.language,'fr');const result={};
  for(const [key,path] of Object.entries(v)){if(!key.startsWith('id'))continue;assert.match(path,/^\/sitecore\/media library\/Project\/Logo[1-4]$/);result['m'+key.slice(2)]={path,url:{url:'https://media.example/logo.png'}};}
  return result;
 }});assert.equal(calls,2);
});

test('missing media keeps HTML and reports the unresolved reference',async()=>{
 const old=console.warn;let warning='';console.warn=s=>warning=s;
 try{const output=await getPlainHtmlMediaData(page([rendering('<img src="-/media/missing.png">')]),{getData:async()=>({m0:null})});
 assert.deepEqual(output.layout.sitecore.route.placeholders.main[0].fields.mediaUrls,{});assert.match(warning,/missing.png/);
 }finally{console.warn=old;}
});
