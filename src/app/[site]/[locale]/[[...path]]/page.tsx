import { isDesignLibraryPreviewData } from "@sitecore-content-sdk/nextjs/editing";
import { notFound } from "next/navigation";
import { draftMode, headers as nextHeaders } from "next/headers";
import { SiteInfo } from "@sitecore-content-sdk/nextjs";
import sites from ".sitecore/sites.json";
import { routing } from "src/i18n/routing";
import scConfig from "sitecore.config";
import client from "src/lib/sitecore-client";
import Layout, { RouteFields } from "src/Layout";
import components from ".sitecore/component-map";
import Providers from "src/Providers";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getBaseUrl } from "lib/utils";
// #region DSI navigation - custom data helper
import { getDsiNavigationData } from "lib/DSI/Common/getDsiNavigationData";
// #endregion DSI navigation - custom data helper

type PageProps = {
  params: Promise<{
    site: string;
    locale: string;
    path?: string[];
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { site, locale, path } = await params;
  const draft = await draftMode();

  // Set site and locale to be available in src/i18n/request.ts for fetching the dictionary
  setRequestLocale(`${site}_${locale}`);

  // Fetch the page data from Sitecore
  let page;
  // #region DSI navigation - request headers
  // Custom DSI navigation makes an extra GraphQL request for link fields.
  // Normal pages need no editing headers. Page Builder supplies them below.
  let navigationHeaders: Record<string, string> = {};
  // #endregion DSI navigation - request headers
  if (draft.isEnabled) {
    const headers = await nextHeaders();
    const previewData = client.getPreviewData(headers);

    // #region DSI navigation - Page Builder context
    // Pass the page's editing/preview context to the extra navigation request.
    // This lets the request use the same site and mode when reading saved changes.
    // Design Library uses different preview data, so it does not enter this block.
    if (previewData && typeof previewData === 'object' && 'mode' in previewData &&
      'site' in previewData && !isDesignLibraryPreviewData(previewData)) {
      const editing = previewData as { mode: string; site: string; variantId?: string; layoutKind?: string; previewTime?: string };
      navigationHeaders = {
        sc_editMode: String(editing.mode === 'edit'),
        sc_previewMode: String(editing.mode === 'preview'),
        sc_site: editing.site,
        sc_variant: editing.variantId || 'default',
        sc_layoutKind: editing.layoutKind || 'final',
        ...(editing.previewTime ? { sc_previewTime: editing.previewTime } : {}),
      };
    }
    // #endregion DSI navigation - Page Builder context

    if (isDesignLibraryPreviewData(previewData)) {
      page = await client.getDesignLibraryData(previewData);
    } else {
      page = await client.getPreview(previewData);
    }
  } else {
    page = await client.getPage(path ?? [], { site, locale });
  }

  // If the page is not found, return a 404
  if (!page) {
    notFound();
  }

  // #region DSI navigation - add custom fields to page data
  // Custom DSI step: the standard Navigation resolver does not include our link,
  // rich text, or image fields. Add these fields before passing the page to Layout.
  // Keep the resolver's existing parent/child tree, order, and navigation filtering.
  page = await getDsiNavigationData(page, client, navigationHeaders);
  // #endregion DSI navigation - add custom fields to page data

  // Fetch the component data from Sitecore (Likely will be deprecated)
  const componentProps = await client.getComponentData(
    page.layout,
    {},
    components,
  );

  return (
    <NextIntlClientProvider>
      <Providers page={page} componentProps={componentProps}>
        <Layout page={page} />
      </Providers>
    </NextIntlClientProvider>
  );
}

// This function gets called at build and export time to determine
// pages for SSG ("paths", as tokenized array).
export const generateStaticParams = async () => {
  if (process.env.NODE_ENV !== "development" && scConfig.generateStaticPaths) {
    // Filter sites to only include the sites this starter is designed to serve.
    // This prevents cross-site build errors when multiple starters share the same XM Cloud instance.
    const defaultSite = scConfig.defaultSite;
    const allowedSites = defaultSite
      ? sites
        .filter((site: SiteInfo) => site.name === defaultSite)
        .map((site: SiteInfo) => site.name)
      : sites.map((site: SiteInfo) => site.name);
    return await client.getAppRouterStaticParams(
      allowedSites,
      routing.locales.slice(),
    );
  }
  return [];
};

// Metadata fields for the page.
export const generateMetadata = async ({ params }: PageProps) => {
  const baseUrl = getBaseUrl();

  const { path, site, locale } = await params;

  // Canonical URL: base URL + content path only (no site/locale segments)
  const pathSegment = path?.length ? `/${path.join("/")}` : "";
  const canonicalUrl = baseUrl ? `${baseUrl}${pathSegment}` : undefined;

  // The same call as for rendering the page. Should be cached by default react behavior
  const page = await client.getPage(path ?? [], { site, locale });
  const fields = page?.layout.sitecore.route?.fields as RouteFields;

  // Parse keywords from comma-separated string to array
  const keywordsString = fields?.metadataKeywords?.value?.toString() || "";
  const keywords = keywordsString ? keywordsString.split(",").map((k: string) => k.trim()) : [];

  return {
    title: fields?.Title?.value?.toString() || "",
    description: fields?.metadataDescription?.value?.toString() || "",
    keywords,
    ...(canonicalUrl && {
      alternates: {
        canonical: canonicalUrl,
      },
    }),
    openGraph: {
      title: fields?.ogTitle?.value?.toString() || "",
      description: fields?.ogDescription?.value?.toString() || "",
      url: canonicalUrl,
      images: fields?.ogImage?.value?.src || fields?.thumbnailImage?.value?.src,
    },
    twitter: {
      card: fields?.tweetCardType?.value === "summary" ? "summary" : "summary_large_image",
      title: fields?.tweetTitle?.value || "",
      description: fields?.tweetDescription?.value || "",
      site: fields?.tweetSite?.value || "",
      images: fields?.tweetImage?.value?.src || "",
    },
  };
};
