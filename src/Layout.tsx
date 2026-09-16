import React, { JSX } from "react";
import { Field, ImageField, Page, DesignLibraryApp } from "@sitecore-content-sdk/nextjs";
import Scripts from "src/Scripts";
import SitecoreStyles from "components/content-sdk/SitecoreStyles";
import { AppPlaceholder } from "@sitecore-content-sdk/nextjs";
import componentMap from ".sitecore/component-map";
// #region DSI page body attributes
import BodyAttributes from "lib/DSI/Common/BodyAttributes";
// #endregion DSI page body attributes

interface LayoutProps {
  page: Page;
}

export interface RouteFields {
  [key: string]: unknown;
  Title?: Field;
  // #region DSI page body attributes
  // These names match the existing CMS fields and the JSS application's fields.
  BodyId?: Field<string>;
  BodyCssClass?: Field<string>;
  // #endregion DSI page body attributes
  metadataTitle?: Field;
  metadataKeywords?: Field;
  pageTitle?: Field;
  metadataDescription?: Field;
  pageSummary?: Field;
  ogTitle?: Field;
  ogDescription?: Field;
  ogImage?: ImageField;
  thumbnailImage?: ImageField;

  tweetTitle?: Field<string>;
  tweetDescription?: Field<string>;
  tweetSite?: Field<string>;
  tweetImage?: ImageField;
  tweetCardType?: Field<string>;
}

const Layout = ({ page }: LayoutProps): JSX.Element => {
  const { layout, mode } = page;
  const { route } = layout.sitecore;
  const mainClassPageEditing = mode.isEditing ? "editing-mode" : "prod-mode";
  // #region DSI page body attributes
  // Page data is already available here. Pass only the field values to the client
  // helper; no extra CMS query or page.tsx change is needed for body attributes.
  const fields = route?.fields as RouteFields | undefined;
  const bodyId = fields?.BodyId?.value?.toString() ?? '';
  const bodyClass = fields?.BodyCssClass?.value?.toString() ?? '';
  // #endregion DSI page body attributes

  return (
    <>
      {/* Update the real document body, not the wrapper div below. */}
      <BodyAttributes bodyId={bodyId} bodyClass={bodyClass} isEditing={mode.isEditing} />
      <Scripts />
      <SitecoreStyles layoutData={layout} />
      {/* root placeholder for the app, which we add components to using route data */}
      <div className={mainClassPageEditing}>
        {mode.isDesignLibrary ? (
          route && (
            <DesignLibraryApp
              page={page}
              rendering={route}
              componentMap={componentMap}
              loadServerImportMap={() => import(".sitecore/import-map.server")}
            />
          )
        ) : (
          <>
            <header>
              <div id="header">
                {route && (
                  <AppPlaceholder
                    page={page}
                    componentMap={componentMap}
                    name="headless-header"
                    rendering={route}
                  />
                )}
              </div>
            </header>
            <main>
              <div id="content">
                {route && (
                  <AppPlaceholder
                    page={page}
                    componentMap={componentMap}
                    name="headless-main"
                    rendering={route}
                  />
                )}
              </div>
            </main>
            <footer>
              <div id="footer">
                {route && (
                  <AppPlaceholder
                    page={page}
                    componentMap={componentMap}
                    name="headless-footer"
                    rendering={route}
                  />
                )}
              </div>
            </footer>
          </>
        )}
      </div>
    </>
  );
};

export default Layout;
