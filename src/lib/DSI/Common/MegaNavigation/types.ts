import type { Field, ImageField, LinkField, TextField } from '@sitecore-content-sdk/nextjs';

// Keep Sitecore's field objects so links, images and text remain editable.
export interface MegaLink {
  id: string;
  title?: TextField;
  link?: LinkField;
  image?: ImageField;
  description?: TextField;
  // Page Content can contain HTML, so render it separately from the page link.
  content?: Field<string>;
  badgeText?: TextField;
}

// A panel contains columns of links or a listing of selected content.
export interface MegaBlock extends MegaLink {
  kind: 'column' | 'listing';
  links: MegaLink[];
  viewAllLink?: LinkField;
  // A column button can go to a different page from its heading link.
  buttonLink?: LinkField;
  message?: string;
}

// Each top-level item is either a direct link or a button that opens its blocks.
export interface MegaItem extends MegaLink {
  // Optional heading inside the open panel, for example Newsroom under News.
  panelTitle?: TextField;
  enablePanel?: Field<boolean | string>;
  blocks: MegaBlock[];
}

// The server adds this object to the rendering for the React component to read.
export interface MegaNavigationData {
  items: MegaItem[];
  message?: string;
}
