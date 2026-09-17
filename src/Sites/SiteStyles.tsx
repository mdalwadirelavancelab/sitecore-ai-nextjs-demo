import type { SiteTheme } from './siteThemes';

interface SiteStylesProps {
  theme?: SiteTheme;
}

export default function SiteStyles({ theme }: SiteStylesProps) {
  if (!theme) return null;

  // React puts this stylesheet in the document head. Load only the theme chosen
  // for the current page, instead of importing every site's CSS into the app.
  // React can retain stylesheets after navigation, so site rules must also use
  // their data-site-theme wrapper. The separate file alone does not isolate CSS.
  return <link rel="stylesheet" href={theme.stylesheet} precedence="site-theme" />;
}
