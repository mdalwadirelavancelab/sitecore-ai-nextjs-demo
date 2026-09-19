# Mega Navigation setup

Add `DsiMegaNavigationComponent` to a page or partial design. Set its datasource
template to `/sitecore/templates/Feature/DSI/Core UI/Dsi Mega Navigation`.
Copy `rendering.graphql` into the rendering's Component GraphQL Query field.
This query resolves the datasource ID, including local datasources in partial designs.

Create menu items below the datasource. Each menu item has `Title` (Single-Line
Text), `Link` (General Link), and `EnablePanel` (Checkbox).
An unchecked item is a direct link. A checked item opens a panel; its top-level
control is a button. Put a destination link inside the panel if needed.
Optional PanelTitle (Single-Line Text) sets the heading inside the panel.
When it is empty, the panel uses Title, so existing items continue to work.

Create Column items below a panel item. A column uses `Title` and optional `Link`.
Create Link items below each column. Links use `Title`, `Link`, `Image` (Image),
`Description` (Multi-Line Text), and `BadgeText` (Single-Line Text).
Move items up or down in Sitecore to set their display order.
Columns also support optional Content (Rich Text), Image (Image), and ButtonLink
(General Link). ButtonLink is separate from the heading Link. Columns can contain
these fields without any child links. Empty fields and empty link lists are not rendered.
Basic image sizing and button styling are included; each site can style the layout.

`getMegaNavigationData.ts` reads these children on the server. It keeps the page's
language and editing headers, reads additional pages of children when needed,
and reuses requests when a datasource appears more than once on the page.
`page.tsx` calls this helper before passing the page to the components.

Desktop panels open on hover or click. Keyboard users can use Enter or Space
to open a panel and Tab to move through its controls. Arrow Down opens the panel
and focuses its first control. Escape or the close button returns focus to the
trigger. On mobile, the Menu button shows the navigation and taps open panels.
Page Builder users can click a panel to inspect its content. Edit the menu tree
in Content Editor; these panels do not contain component placeholders.

Styles are in `src/assets/DSI/CoreUI/component-meganavigation.scss` and are scoped
to this component. The existing Core UI stylesheet imports them.

## Listing setup

Set SelectionMode to Manual or Automatic. Manual reads SelectedItems in the
selected order. Automatic reads direct children of SourceItem and sorts by the
standard `__Updated` field, newest first, before applying ItemCount. Equal dates
keep CMS order; missing or invalid dates go last.
SourceItem should contain the pages you want to display, not content folders.
ItemCount limits both modes; an empty or invalid count defaults to 5.
Missing selected pages are skipped. Manual selections are never date-sorted.

### Changing the Automatic listing date later

Today, ItemCount = 3 means the three most recently updated child pages are shown.
If a custom Date/Datetime field such as `Item Published date` is introduced later:

1. Add and fill the field on the page templates used by the listing.
2. In `getMegaNavigationData.ts`, change `field(name: "__Updated")` inside
   `itemFields` to the exact custom field name. Keep the `updated:` alias.
3. `updatedTime` can keep reading that alias. Change its parser only if the new
   date format differs. Empty or invalid dates go last, with no fallback to __Updated.
4. Keep sorting before ItemCount is applied. Manual selection needs no change.
5. Update the sample dates in `scripts/tests/mega-navigation.test.cjs` and verify
   ordering in Page Builder and on the published site after publishing the new field and values.

The rendering query, React component and CSS need no change for this date switch.
This is a shared rule for Automatic listings; changing it here affects all sites
using this helper. Different date fields per site would need a separate configuration.

Pages use Title (with the item name as fallback), Image, and the URL returned by
Sitecore. Description is shown when filled; otherwise Content is rendered as
rich text outside the page link, so its own links do not create nested anchors.
ViewAllLink remains the listing's separate navigation link.

Validate the rendering query against your CMS, then check published and editing
pages, including mouse, keyboard and mobile interactions, before release.
