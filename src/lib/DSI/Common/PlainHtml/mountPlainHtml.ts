/**
 * Put the author's HTML inside this component and run its scripts.
 * React owns the outer container; this helper owns everything inside it.
 * Returns a cleanup function for content changes and page navigation.
 */
export function mountPlainHtml(container: HTMLElement, html: string, mediaUrls: Record<string, string> = {}): () => void {
  const doc = container.ownerDocument;
  // Parse HTML off the page first. Scripts in a template do not execute here.
  // This gives us time to replace media URLs and record each script's position.
  const template = doc.createElement('template');
  template.innerHTML = html;

  // Use complete URLs returned by Sitecore. Adding only a CMS hostname loses
  // preview tokens and redirects anonymous image requests to the login page.
  const mediaUrl = (value: string): string => {
    const path = value.trim();
    if (!/^\/?[-~]\/media\//i.test(path)) return value;
    const basePath = path.split(/[?#]/, 1)[0];
    const resolved = mediaUrls[basePath];
    // The server already reports unresolved media. Keep the author's value.
    if (!resolved) return value;
    const url = new URL(resolved);
    // This dummy base only lets URL parse a relative path. No request is sent to it.
    const original = new URL(path.replace(/^\//, ''), 'https://plain-html.invalid/');
    // Preserve authored options, but Sitecore owns authentication parameters.
    original.searchParams.forEach((value, key) => {
      if (!url.searchParams.has(key) && !['tt', 'ttc', 'hash'].includes(key.toLowerCase())) url.searchParams.set(key, value);
    });
    url.hash = original.hash;
    return url.href;
  };
  for (const element of template.content.querySelectorAll('[src], [href], [poster]')) {
    // Covers images/scripts, media links and video poster images. Ordinary page
    // links and external URLs pass through mediaUrl without being changed.
    for (const attribute of ['src', 'href', 'poster']) {
      const value = element.getAttribute(attribute);
      if (value !== null) element.setAttribute(attribute, mediaUrl(value));
    }
  }
  // Mark each script's original position. This preserves document.currentScript
  // and previousElementSibling for both nested and top-level inline scripts.
  const scripts = Array.from(template.content.querySelectorAll('script'), (source) => {
    const marker = doc.createComment('DSI script');
    source.replaceWith(marker);
    return { source, marker };
  });
  container.replaceChildren(template.content);
  // A page change may happen while an external script is still loading.
  // These values let cleanup stop the remaining sequence and release listeners.
  let disposed = false;
  const pending = new Set<() => void>();

  const execute = (source: HTMLScriptElement, marker: Comment): Promise<void> => {
    // A newly created script element can execute when inserted. Copy the author's
    // attributes, including type, src, integrity, crossorigin and CSP nonce.
    const script = doc.createElement('script');
    for (const attribute of Array.from(source.attributes)) script.setAttribute(attribute.name, attribute.value);
    if (source.nonce) script.nonce = source.nonce;
    script.textContent = source.textContent;
    const type = (source.getAttribute('type') || '').trim().toLowerCase();
    const executable = !type || type === 'module' || /^(text|application)\/(java|ecma)script$/.test(type);
    const hasSource = source.hasAttribute('src');
    if (hasSource && !source.hasAttribute('async')) script.async = false;
    // JSON data blocks and skipped nomodule scripts do not emit load events.
    if (!executable || (script.noModule && type !== 'module') || (!hasSource && type !== 'module')) {
      marker.replaceWith(script);
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      // Finish waiting on success, failure or cleanup. Remove our load handlers
      // in all three cases so they do not keep running after this instance leaves.
      const finish = (failed = false) => {
        script.removeEventListener('load', loaded);
        script.removeEventListener('error', failedLoad);
        pending.delete(cancel);
        if (failed) reject(new Error('A Plain HTML script could not load. Check the browser Network panel.'));
        else resolve();
      };
      const loaded = () => finish();
      const failedLoad = () => finish(true);
      const cancel = () => { script.remove(); finish(); };
      pending.add(cancel);
      script.addEventListener('load', loaded);
      script.addEventListener('error', failedLoad);
      marker.replaceWith(script);
    });
  };
  const report = (error: unknown) => {
    if (!disposed) console.error('[DSI Plain HTML]', error);
  };
  void (async () => {
    for (const { source, marker } of scripts) {
      if (disposed) break;
      // Earlier author scripts may remove later HTML. Do not resurrect a script
      // whose original position no longer exists inside this component.
      if (!container.contains(marker)) continue;
      const execution = execute(source, marker);
      // Wait for libraries before running the following inline code. Explicit
      // async scripts retain their independent loading behavior.
      if (source.hasAttribute('async')) void execution.catch(report);
      else await execution;
    }
  })().catch(report);

  return () => {
    disposed = true;
    for (const cancel of Array.from(pending)) cancel();
    container.replaceChildren();
    // Removing DOM does not undo arbitrary scripts' global listeners or timers.
  };
}
