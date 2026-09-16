import type { Page } from '@sitecore-content-sdk/nextjs';
import type { SitecoreClient } from '@sitecore-content-sdk/nextjs/client';

type RecordValue = Record<string, unknown>;
// Layout data contains arrays, fields and renderings. Check the shape before
// reading properties so empty placeholders and missing fields are safe to visit.
const isRecord = (value: unknown): value is RecordValue =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Multi-Line Text keeps raw media references. Ask Sitecore for each media item's
 * URL so preview tokens and delivery hosts come from the same API as the page.
 * Never copy tokens from another field or build them in the browser.
 */
export async function getPlainHtmlMediaData(
  page: Page,
  client: Pick<SitecoreClient, 'getData'>,
  headers: Record<string, string> = {}
): Promise<Page> {
  // Add application data to a copy. Do not change the original SDK page object.
  const result = structuredClone(page);
  // Remember which media paths belong to each Plain HTML component.
  const targets: { fields: RecordValue; paths: Set<string> }[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) { value.forEach(visit); return; }
    if (!isRecord(value)) return;
    if (value.componentName === 'DsiPlainHTMLComponent' && isRecord(value.fields)) {
      const field = value.fields.HtmlCode;
      if (isRecord(field) && typeof field.value === 'string') {
        const paths = new Set<string>();
        // Find local references such as -/media/ITEM-ID.ashx in the HTML.
        // Leave off query strings and fragments: they are not part of the item ID.
        // Full URLs on other hosts are not looked up through Sitecore.
        for (const match of field.value.matchAll(/(?:^|[\s"'(=,])((?:\/?[-~]\/media\/)[^\s"'<>`)?,#]+)/gi)) {
          paths.add(match[1]);
        }
        if (paths.size) targets.push({ fields: value.fields, paths });
      }
    }
    // Continue into nested placeholders, including wrappers and partial designs.
    Object.values(value).forEach(visit);
  };
  visit(result.layout.sitecore.route?.placeholders);
  const paths = [...new Set(targets.flatMap(({ paths }) => [...paths]))];
  const resolved: Record<string, string> = {};
  // GraphQL accepts either an item ID or an item path in the media library.
  // Remove URL-only parts such as /-/media/ and the file extension first.
  const itemPath = (path: string) => {
    const mediaPath = decodeURIComponent(path.replace(/^\/?[-~]\/media\//i, ''));
    const id = mediaPath.replace(/\.[^.\/]+$/, '').replace(/[{}-]/g, '');
    return /^[a-f0-9]{32}$/i.test(id)
      ? id
      : `/sitecore/media library/${mediaPath.replace(/\.[^.\/]+$/, '')}`;
  };

  // Look up repeated paths once per page. Use small batches of three items so
  // a large HTML block does not produce one oversized GraphQL request.
  for (let offset = 0; offset < paths.length; offset += 3) {
    const batch = paths.slice(offset, offset + 3);
    const declarations = batch.map((_, i) => `$id${i}: String!`).join(', ');
    // m0, m1 and m2 let us match each response to its requested media path.
    // url.url is Sitecore's complete URL; url.path alone omits preview parameters.
    const selections = batch.map((_, i) => `m${i}: item(path: $id${i}, language: $language) { path url { url } }`).join('\n');
    const data = await client.getData<Record<string, { path: string; url: { url: string } } | null>>(
      `query DsiPlainHtmlMedia($language: String!, ${declarations}) { ${selections} }`,
      { language: page.locale, ...Object.fromEntries(batch.map((path, i) => [`id${i}`, itemPath(path)])) },
      {
        headers: { ...(page.siteName ? { sc_site: page.siteName } : {}), ...headers },
        // Reuse the page's site and editing headers. Disable Next.js fetch caching
        // for this lookup; do not keep a separate cache of generated preview URLs.
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      }
    );
    batch.forEach((path, i) => {
      const item = data[`m${i}`];
      if (item?.path.toLowerCase().startsWith('/sitecore/media library/') && item.url.url) {
        resolved[path] = item.url.url;
      } else {
        // A missing/unpublished item must not remove the rest of the author's HTML.
        // Keep its original reference and report which item could not be resolved.
        console.warn(`[DSI Plain HTML] Media item could not be resolved: ${path}`);
      }
    });
  }
  for (const { fields, paths } of targets) {
    // This extra property exists only in application page data, not in the CMS.
    // Send each component its own mapping while leaving HtmlCode unchanged.
    fields.mediaUrls = Object.fromEntries([...paths].filter(path => resolved[path]).map(path => [path, resolved[path]]));
  }
  return result;
}
