import type { Field, ImageField, LinkField, Page, TextField } from '@sitecore-content-sdk/nextjs';
import type { SitecoreClient } from '@sitecore-content-sdk/nextjs/client';
import type { MegaBlock, MegaItem, MegaLink } from './types';

type RecordValue = Record<string, unknown>;

// These types describe the GraphQL response, before we prepare it for React.
type CmsItem = {
  id: string;
  name: string;
  url?: { url: string };
  updated?: { value: string } | null;
  template: { name: string };
  fields: { name: string; jsonValue: unknown }[];
};

type Connection = {
  results: CmsItem[];
  pageInfo: { hasNext: boolean; endCursor: string };
};

const isRecord = (value: unknown): value is RecordValue =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

// This is the list of details we ask Sitecore for each item.
// fields contains values such as Title and Image; url is the page address.
// __Updated tells us when the page was last changed, so we can put the newest pages first.
// Future date field: replace field(name: "__Updated") below with field(name: "Item Published date").
// Use the exact CMS field name and create it as a Date or Datetime field on the listed pages.
// Keep the alias updated: unchanged. It is the response property used by updatedTime below.
const itemFields = 'id name url { url } updated: field(name: "__Updated") { value } template { name } fields { name jsonValue }';
const field = <T,>(item: CmsItem, name: string) => item.fields.find((value) => value.name === name)?.jsonValue as T | undefined;
const textValue = (item: CmsItem, name: string) => String(field<Field<unknown>>(item, name)?.value ?? '');

// Sitecore stores raw dates as yyyyMMddTHHmmssZ. Missing dates go last.
// If the query switches to a custom Date/Datetime field, this function can still read it
// through the same updated property. Only change the parser if the date format changes.
// A missing custom date will go last; it will not automatically fall back to __Updated.
function updatedTime(item: CmsItem): number {
  const raw = item.updated?.value || '';
  const normalized = raw.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/, '$1-$2-$3T$4:$5:$6Z');
  const time = Date.parse(normalized);

  return Number.isFinite(time) ? time : -Infinity;
}

function toLink(item: CmsItem): MegaLink {
  // Keep the complete SDK fields, including any editing information from Sitecore.
  return {
    id: item.id,
    title: field<TextField>(item, 'Title'),
    link: field<LinkField>(item, 'Link'),
    image: field<ImageField>(item, 'Image'),
    description: field<TextField>(item, 'Description'),
    badgeText: field<TextField>(item, 'BadgeText'),
  };
}

/** Read menu children on the server using the same language and editing context as the page. */
export async function getMegaNavigationData(
  page: Page,
  client: Pick<SitecoreClient, 'getData'>,
  headers: Record<string, string> = {}
): Promise<Page> {
  // Add menu data to a copy so other code can still use the original page.
  const result = structuredClone(page);
  const renderings: RecordValue[] = [];

  // Menus may be inside wrappers or partial designs, so check nested placeholders too.
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      // Check each entry in this list. For example, a placeholder may contain a wrapper and a menu.
      // visit checks inside each entry too, so a menu inside the wrapper is also found.
      value.forEach(visit); return;
    }

    if (!isRecord(value)) {
      return;
    }

    if (value.componentName === 'DsiMegaNavigationComponent') {
      renderings.push(value);
    }
    // Check each property for more nested items. For example, a wrapper's placeholders may hold a menu.
    // This only checks data already in memory; there is no CMS request to wait for here.
    Object.values(value).forEach(visit);
  };

  visit(result.layout.sitecore.route?.placeholders);

  if (!renderings.length) {
    return page;
  }

  // Reuse child data within this page request when the same menu is used twice.
  const childrenCache = new Map<string, Promise<CmsItem[]>>();
  const readChildren = (id: string): Promise<CmsItem[]> => {

    if (childrenCache.has(id)) {
      return childrenCache.get(id)!;
    }

    const pending = (async () => {
      const items: CmsItem[] = [];
      let after = '';
      // Make the first CMS request, then keep requesting batches while more children are available.
      // Example: 45 children need three requests: 20 items, another 20, then the last 5.
      // await waits for each response. Its endCursor tells the next request where to start.
      // When hasNext is false, break stops this loop, even though the bottom says while (true).
      do {
        // Get the items directly below the item identified by id.
        // Example: for the main menu, get News and About Us; for a column, get its links.
        // The same query also gets pages below SourceItem for an Automatic listing.
        // We ask for 20 items at a time. If there are more, after tells Sitecore where to continue.
        const response = await client.getData<{ item: { children: Connection } | null }>
          (`query MegaNavigationChildren($id: String!, $language: String!, $after: String!) {
            item(path: $id, language: $language) {
              children(first: 20, after: $after) {
                results { ${itemFields} }
                pageInfo { hasNext endCursor }
              }
            }
          }`,
            { id, language: page.locale, after },

            {
              // Use the page's preview context and request fresh data for this lookup.
              headers: { ...(page.siteName ? { sc_site: page.siteName } : {}), ...headers },
              fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
            }
          );

        if (!response.item) {
          throw new Error(`Mega Navigation datasource item could not be read: ${id}`);
        }

        const connection = response.item.children;
        items.push(...connection.results);

        if (!connection.pageInfo.hasNext) {
          break;
        }

        if (!connection.pageInfo.endCursor || connection.pageInfo.endCursor === after) {
          throw new Error('Mega Navigation returned an invalid pagination cursor.');
        }

        after = connection.pageInfo.endCursor;
      } while (true);

      return items;
    })();

    childrenCache.set(id, pending);

    return pending;
  };

  // #region Listing - selected pages or children of a source item
  const listingCache = new Map<string, Promise<MegaLink[]>>();
  const readListing = (block: CmsItem): Promise<MegaLink[]> => {
    if (listingCache.has(block.id))
      return listingCache.get(block.id)!;

    const pending = (async () => {
      const options = {
        headers: { ...(page.siteName ? { sc_site: page.siteName } : {}), ...headers },
        fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: 'no-store' }),
      };

      // Find out where this listing should get its pages from.
      // Manual: SelectedItems gives us the IDs of the pages chosen by the author, in order.
      // Automatic: SourceItem gives us the ID of the parent whose child pages we should show.
      // This query gets those IDs only. It does not load the page titles or images yet.
      const response = await client.getData<{
        item: {
          selected: { value: string } | null;
          source: { value: string } | null;
        } | null
      }>
        (`query MegaNavigationListing($id: String!, $language: String!) {
          item(path: $id, language: $language) {
            selected: field(name: "SelectedItems") { value }
            source: field(name: "SourceItem") { value }
          }
        }`, { id: block.id, language: page.locale }, options);

      const count = Number(textValue(block, 'ItemCount'));
      const limit = Number.isInteger(count) && count > 0 ? count : 5;
      const mode = textValue(block, 'SelectionMode').trim().toLowerCase();
      const pages: CmsItem[] = [];

      if (mode === 'manual') {
        // Clean each selected ID and remove empty entries, then remove duplicates without changing order.
        // Example: " A | B | A | " becomes ["A", "B"].
        const ids = [...new Set((response.item?.selected?.value || '').split('|').map((id) => id.trim()).filter(Boolean))];

        // Load one selected page at a time and wait for its CMS response before loading the next.
        // Example: with A, B, C selected and ItemCount = 2, stop after two usable pages are found.
        // If B is missing or has no URL, try C instead. Keep the author's selection order.
        // for...of supports await and break; forEach would not wait for these requests to finish.
        for (const id of ids) {
          if (pages.length >= limit)
            break;

          // We now have a selected page ID, but we still need the details to display it.
          // Get that page's Title, Description/Content, Image and URL in the current language.
          // Repeat for each selected page. Keep the author's order and skip missing pages.
          const selected = await client.getData<{ item: CmsItem | null }>
            (`query MegaNavigationPage($id: String!, $language: String!) {
              item(path: $id, language: $language) { ${itemFields} }
            }`, { id, language: page.locale }, options);
          if (selected.item?.url?.url) pages.push(selected.item);
        }
      } else if (mode === 'automatic' && response.item?.source?.value) {
        // Sort all batches before applying ItemCount so a later batch can supply the newest page.
        // Equal or missing dates keep their original CMS order. Manual selection is not sorted.
        // Example: ItemCount = 3 shows only the first 3 pages after sorting newest first.
        // For a future custom date, change the field in itemFields above; keep this order:
        // read all children, sort by date descending, then take ItemCount. Update the tests too.
        pages.push(...(await readChildren(response.item.source.value))
          .filter((item) => item.url?.url)
          .sort((a, b) => updatedTime(b) - updatedTime(a) || 0).slice(0, limit));
      }

      // Turn each loaded CMS page into the fields the menu displays. No more requests are made here.
      // Example: a News page becomes one listing entry with its title, image, text and page link.
      return pages.map((item) => {
        const title = field<TextField>(item, 'Title');
        const description = field<TextField>(item, 'Description');

        return {
          id: item.id,
          title: String(title?.value || '').trim() ? title : { value: item.name?.trim() || 'Link' },
          link: { value: { href: item.url!.url, text: String(title?.value || '').trim() || item.name?.trim() || 'Link' } },
          image: field<ImageField>(item, 'Image'),
          description: description?.value ? description : undefined,
          content: description?.value ? undefined : field<Field<string>>(item, 'Content'),
        };
      });
    })();

    listingCache.set(block.id, pending);
    return pending;
  };
  // #endregion Listing

  // Prepare each Mega Navigation component found on this page, one at a time.
  // Example: a header menu and a footer menu each need data from their own datasource.
  // Wait for all the child requests inside this loop before returning the completed page.
  for (const rendering of renderings) {
    const fields = isRecord(rendering.fields) ? rendering.fields : {};
    const data = isRecord(fields.data) ? fields.data : {};
    const datasource = isRecord(data.datasource) ? data.datasource : {};

    // The small rendering query resolves local:/Data references in partial designs.
    // Never try to resolve them relative to the current page in Next.js.
    if (typeof datasource.id !== 'string') {
      rendering.fields = {
        ...fields, megaNavigation: {
          items: [], message: 'Assign a datasource and add the Mega Navigation query to the rendering.',
        }
      };
      continue;
    }

    const items: MegaItem[] = [];

    // Read the top-level menu items in CMS order. Example: About Us, News, then Careers.
    // For each item, wait for its panel content to load before moving to the next item.
    // Skip other templates. If EnablePanel is unchecked, keep the item as a direct link.
    for (const menu of await readChildren(datasource.id)) {

      if (menu.template.name !== 'Dsi Mega Navigation Item') {
        continue;
      }

      const blocks: MegaBlock[] = [];
      const enablePanel = field<Field<boolean | string>>(menu, 'EnablePanel');

      if (['true', '1'].includes(String(enablePanel?.value).toLowerCase())) {
        // Build each block inside this menu panel, keeping its CMS order.
        // Example: News can contain a column of links followed by a Latest News listing.
        // A column loads its child links; a listing loads its selected or automatic pages.
        // Wait for that block's data before adding the next block.
        for (const block of await readChildren(menu.id)) {
          if (block.template.name === 'Dsi Mega Navigation Column') {
            blocks.push({
              ...toLink(block),
              // A column can show content and a button even when it has no child links.
              content: field<Field<string>>(block, 'Content'),
              buttonLink: field<LinkField>(block, 'ButtonLink'),
              // Keep only link items, then turn each into menu fields. Example: ignore a folder,
              // but include its sibling Contact link. These array steps make no CMS requests.
              kind: 'column', links: (await readChildren(block.id))
                .filter((link) => link.template.name === 'Dsi Mega Navigation Link').map(toLink)
            });
          } else if (block.template.name === 'Dsi Mega Navigation Listing') {
            blocks.push({
              ...toLink(block), kind: 'listing', links: await readListing(block),
              viewAllLink: field<LinkField>(block, 'ViewAllLink'),
            });
          }
        }
      }

      items.push({
        ...toLink(menu),
        panelTitle: field<TextField>(menu, 'PanelTitle'),
        enablePanel,
        blocks,
      });
    }

    // megaNavigation is prepared application data, not a field authors create in CMS.
    rendering.fields = { ...fields, megaNavigation: { items } };
  }
  return result;
}
