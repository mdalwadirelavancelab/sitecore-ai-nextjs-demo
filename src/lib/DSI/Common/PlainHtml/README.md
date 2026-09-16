# DSI Plain HTML

CMS template: **Dsi Plain HTML**, section **HTML**, field **HtmlCode**, type **Multi-Line Text**.

This component mounts trusted HTML after React hydration. It supports ordinary
HTML fragments, inline styles, stylesheet links, inline scripts and external
scripts. It leaves each script at its original position. The existing CMS sample
using `document.currentScript.previousElementSibling` does not need a rewrite.

## Media resolution

No Plain HTML media-host environment variable is required. Before rendering,
page.tsx calls getPlainHtmlMediaData with the current page, Sitecore client and
editing headers. It looks up local media references with GraphQL item.url.url.
Sitecore supplies the complete URL, including preview parameters when applicable.
The helper never generates, hardcodes or copies tokens from another field.

References can use an item ID or a media-library-relative path with a file
extension. The browser applies the results to src, href and poster attributes
starting with -/media/, /-/media/, ~/media/ or /~/media/. Authored query options
are retained without replacing Sitecore's authentication parameters. External
URLs and page links are unchanged. This does not rewrite strings inside scripts,
srcset, inline CSS or external CSS files.

Requests use the page language and site. Duplicate paths across instances are
looked up once per page. There is no separate persistent cache of resolved URLs.
If an item is unavailable, its original reference is retained and a server warning
identifies it. A GraphQL transport error fails the page fetch instead of silently
replacing all media URLs. Publication and media availability are managed by CMS.

## Script behavior

- Non-async external scripts finish loading before following scripts run.
- Explicit async scripts load independently. Inline and external modules are supported.
- JSON script blocks are retained without waiting for load events.
- A failed library load is reported in the console and stops dependent scripts.
- Content replacement/unmount removes owned HTML, styles and script elements and
  stops the pending execution sequence. Scripts execute again on a real remount.
- Removing a script element cannot undo global listeners, timers or third-party
  library state that the script created. External libraries execute per occurrence;
  this renderer does not assume that repeated script URLs are safe to skip.

The component accepts executable developer-authored content. CMS permissions
should reflect that capability. It does not sanitize or bypass browser CSP.
It is an HTML **fragment** renderer, not a separate document: scripts relying on
initial document parsing (`document.write`, an already-fired `DOMContentLoaded`)
need to account for mounting in an existing page.

Content is client-rendered, so it is absent from the initial server HTML.
An empty field shows an authoring hint in Page Builder. Edit the Multi-Line Text
field using the CMS editor rather than inline Rich Text editing.

## Verification

Run `node scripts/tests/plain-html-browser.cjs`, then open
`http://127.0.0.1:4319`. The checks use the actual TypeScript helper and a local
HTTP server to exercise script order, multiple instances, remounting, cancellation,
styles, SVG, JSON, modules, failed libraries and relative media. Stop with Ctrl+C.

Also verify the real CMS page in normal browsing and Page Builder. A passing
local fixture does not verify CMS media access or Page Builder integration.

Server data checks: `node --test scripts/tests/plain-html-media.test.cjs`.
