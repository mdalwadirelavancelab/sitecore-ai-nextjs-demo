# sitecore-ai-nextjs-demo

## Overview

This application uses Sitecore Content SDK with Next.js App Router. It was copied from examples/basic-nextjs in Sitecore's xmcloud-starter-js repository.

## How to Run This Application Locally

Copy `.env.remote.example` to `.env.local` in this folder and populate it with your Sitecore environment settings before running the application.

Optional: for stable absolute URLs in server-rendered code when the request has no `Host` header, set `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_BASE_URL` (see [`.env.remote.example`](.env.remote.example)).

From PowerShell:

```powershell
cd D:\Learning\SitecoreAI\sitecore-ai-nextjs-demo
npm install
npm run dev
```

Open **http://localhost:3000**.

## Documentation

- [Site styles and package.json commands](src/Sites/README.md) — How shared theme loading works and where site designs belong.

- [Skills: application capability map](Skills.md) — High-level capability groupings for this application.
- [Sitecore Content SDK for XM Cloud](https://doc.sitecore.com/xmc/en/developers/content-sdk/sitecore-content-sdk-for-xm-cloud.html)
