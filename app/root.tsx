import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";

import { DashboardLayout } from "@/components/layouts/dashboard";

import globalStylesHref from "./globals.css?url";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href={globalStylesHref} />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <Meta />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return (
    <div className="px-4 py-12 mx-auto prose">
      <h1 className="text-4xl font-semibold">An error occurred</h1>
      <p className="text-lg text-muted-foreground">
        A few things you could try:
      </p>
      <ul className="text-lg text-muted-foreground w-full">
        <li>Make sure ollama is running</li>
        <li>Refresh the page</li>
      </ul>
    </div>
  );
}
