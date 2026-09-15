// #region DSI navigation - custom server-side data
import type { ImageField, LinkField, Page, TextField } from '@sitecore-content-sdk/nextjs';
import type { SitecoreClient } from '@sitecore-content-sdk/nextjs/client';

type CustomFields = {
  // A null field means the item does not have that field.
  // A field with an empty value still exists and must follow the empty-link rule.
  link: { jsonValue: LinkField } | null;
  content: { jsonValue: TextField } | null;
  image: { jsonValue: ImageField } | null;
};
type RecordValue = Record<string, unknown>;
const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
// Layout data and GraphQL can format the same ID differently. Use one format to match them.
const normalizeId = (id: string) => id.replace(/[{}-]/g, '').toLowerCase();

/**
 * Server-side replacement for the custom-field part of the JSS C# resolver.
 * The standard resolver still builds the navigation tree. This helper reads each
 * item's custom fields and adds them to that tree without changing its structure.
 * It also includes NavigationContent and NavigationImage for future rendering use.
 */
export async function getDsiNavigationData(
  page: Page,
  client: Pick<SitecoreClient, 'getData'>,
  headers: Record<string, string> = {}
): Promise<Page> {
  // Work on a copy so other code using the original page data is not affected.
  const result = structuredClone(page);
  const items: RecordValue[] = [];
  // Collect parents and their children, including items with no custom link field.
  const collectItems = (fields: unknown) => {
    if (!fields || typeof fields !== 'object') return;
    for (const item of Object.values(fields)) {
      if (!isRecord(item) || typeof item.Id !== 'string') continue;
      items.push(item);
      collectItems(item.Children);
    }
  };
  // Navigation can sit inside other components' placeholders. Search those too,
  // but add custom data only to renderings named DsiNavigationComponent.
  const visit = (value: unknown) => {
    if (Array.isArray(value)) { value.forEach(visit); return; }
    if (!isRecord(value)) return;
    if (value.componentName === 'DsiNavigationComponent') collectItems(value.fields);
    Object.values(value).forEach(visit);
  };
  visit(result.layout.sitecore.route?.placeholders);
  // The same page item can appear in several menus. Read it once and reuse its data.
  const ids = [...new Set(items.map((item) => normalizeId(item.Id as string)))];
  const dataById = new Map<string, CustomFields>();

  // A larger query hit the endpoint's query limit during testing; use three items per request.
  // Variables carry all item IDs; the same item is fetched only once per page.
  for (let offset = 0; offset < ids.length; offset += 3) {
    const batch = ids.slice(offset, offset + 3);
    const declarations = batch.map((_, i) => `$id${i}: String!`).join(', ');
    // n0, n1, etc. label each result so we can match it to the requested item ID.
    // jsonValue keeps the SDK field shape, including General Link settings such as target.
    const selections = batch.map((_, i) => `n${i}: item(path: $id${i}, language: $language) {
      link: field(name: "NavigationLink") { jsonValue }
      content: field(name: "NavigationContent") { jsonValue }
      image: field(name: "NavigationImage") { jsonValue }
    }`).join('\n');
    const data = await client.getData<Record<string, CustomFields | null>>(
      `query DsiNavigation($language: String!, ${declarations}) { ${selections} }`,
      { language: page.locale, ...Object.fromEntries(batch.map((id, i) => [`id${i}`, id])) },
      { headers: { ...(page.siteName ? { sc_site: page.siteName } : {}), ...headers },
        // Do not reuse Next.js's cached fetch response for these custom fields.
        // This does not publish content or clear caches managed by Sitecore itself.
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) }
    );
    batch.forEach((id, i) => {
      const item = data[`n${i}`];
      // Fail clearly if an item cannot be read. Treating it as an empty field would
      // silently create the wrong link. This error will stop the page render.
      if (!item) throw new Error(`DSI navigation item ${id} could not be read.`);
      dataById.set(id, item);
    });
  }

  for (const item of items) {
    const data = dataById.get(normalizeId(item.Id as string))!;
    if (data.link) {
      const field = data.link.jsonValue;
      // Match JSS: an existing but empty NavigationLink field becomes #.
      const rawHref = field.value?.href?.trim() || '#';
      // Sitecore returned ## for our placeholder anchor. Treat hash-only values as #.
      // Real section anchors, such as #contact, stay unchanged.
      const href = /^#+$/.test(rawHref) ? '#' : rawHref;
      item.NavigationLink = href;
      // Keep the full link field as well as the URL, so target and other settings survive.
      item.NavigationLinkField = { ...field, value: { ...field.value, href } };
    } else {
      // Match JSS: no NavigationLink field means the component uses the normal Href.
      item.NavigationLink = '';
    }
    if (data.content) item.NavigationContent = data.content.jsonValue;
    if (data.image) item.NavigationImage = data.image.jsonValue;
  }
  return result;
}
// #endregion DSI navigation - custom server-side data
