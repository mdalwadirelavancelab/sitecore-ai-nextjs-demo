import type { Field } from '@sitecore-content-sdk/nextjs';

export interface RouteFields {
  Title?: Field;
  MetaKeywords?: Field;
  MetaDescription?: Field;
  OpenGraphTitle?: Field;
  OpenGraphDescription?: Field;
}

export interface MetadataValues {
  metaKeywords: string;
  metaDescription: string;
  openGraphTitle: string;
  openGraphDescription: string;
  title: string;
}

/** Converts optional Sitecore route metadata fields into safe string values. */
export function getMetadata(fields: RouteFields | undefined): MetadataValues {
  const getValue = (field?: Field) =>
    field?.value !== undefined && field?.value !== null ? String(field.value) : '';

  return {
    metaKeywords: getValue(fields?.MetaKeywords),
    metaDescription: getValue(fields?.MetaDescription),
    openGraphTitle: getValue(fields?.OpenGraphTitle),
    openGraphDescription: getValue(fields?.OpenGraphDescription),
    title: getValue(fields?.Title),
  };
}
