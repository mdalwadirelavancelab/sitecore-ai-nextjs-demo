import { headers } from "next/headers";
import { parseRewriteHeader } from "@sitecore-content-sdk/nextjs/utils";
import Link from "next/link";
import { ErrorPage } from "@sitecore-content-sdk/nextjs";
import client from "lib/sitecore-client";
import scConfig from "sitecore.config";
import Layout from "src/Layout";
import Providers from "src/Providers";
import { NextIntlClientProvider } from "next-intl";

//#region New code for 404 page, if you want to use Sitecore-managed 404 page, uncomment the code below and comment out the code above
export default async function NotFound() {
  const headersList = await headers();
  const { site, locale } = parseRewriteHeader(headersList);
  let page;

  // Fetch custom 404 page from Sitecore, falling back if the request fails.
  try {
    page = await client.getErrorPage(ErrorPage.NotFound, {
      site: site || scConfig.defaultSite,
      locale: locale || scConfig.defaultLanguage,
    });
  } catch (error) {
    console.error("Error fetching 404 page:", error);
  }

  if (page) {
    // Render Sitecore-managed 404 page
    return (
      <NextIntlClientProvider>
        <Providers page={page}>
          <Layout page={page} />
        </Providers>
      </NextIntlClientProvider>
    );
  }
  // Fallback if no custom 404 is available or the fetch failed.
  return (
    <div>
      <h1>Page not found</h1>
      <Link href="/">Go to the Home page</Link>
    </div>
  );
}
//#endregion

//#region Default code for 404 page, if you want to use Sitecore-managed 404 page, uncomment the code below and comment out the code above
// export default async function NotFound() {
//   const { site, locale } = getCachedPageParams();

//   let page;

//   try {
//     page = await client.getErrorPage(ErrorPage.NotFound, {
//       site: site || scConfig.defaultSite,
//       locale: locale || scConfig.defaultLanguage,
//     });
//   } catch (error) {
//     console.error("Error fetching 404 page:", error);
//   }

//   if (page) {
//     return (
//       <NextIntlClientProvider>
//         <Providers page={page}>
//           <Layout page={page} />
//         </Providers>
//       </NextIntlClientProvider>
//     );
//   }

//   return (
//     <div style={{ padding: 10 }}>
//       <h1>Page not found</h1>
//       <p>This page does not exist.</p>
//       <Link href="/">Go to the Home page</Link>
//     </div>
//   );
// }
//#endregion
