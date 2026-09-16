import './globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/DSI/CoreUI/index.scss';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://edge-platform.sitecorecloud.io" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      {/* Common classes are present in the initial HTML on every route.
          BodyAttributes adds the current CMS page's ID and classes after hydration. */}
      <body className="default-device bodyclass">{children}</body>
    </html>
  );
}
