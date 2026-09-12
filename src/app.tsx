import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { clientOnly } from "@solidjs/start";
import { ErrorBoundary, Suspense } from "solid-js";

import Layout from "./components/layout/Layout.tsx";
import "./index.css";
import "./material.ts";

// Combine client-only providers into a single wrapper component to optimize bundle loading
const ClientProviders = clientOnly(async () => {
  const [
    { ThemeProvider },
    { AppProvider },
  ] = await Promise.all([
    import("./theme/themeContext"),
    import("./context/app/App.tsx"),
  ]);

  return {
    default: (props: { children: any }) => (
      <ThemeProvider>
        <AppProvider>
                {props.children}
        </AppProvider>
      </ThemeProvider>
    ),
  };
});

export default function App() {
  return (
    <Router
      root={(props) => (
        <ErrorBoundary
          fallback={(err, reset) => (
            <div class="p-4 m-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <h2 class="font-bold text-lg mb-1">An unexpected error occurred</h2>
              <p class="text-sm text-red-600 mb-3">{err?.message || String(err)}</p>
              <button
                onClick={reset}
                class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        >
          <ClientProviders>
            <Suspense fallback={<div class="p-4 text-center">Loading application...</div>}>
              <Layout {...props} />
            </Suspense>
          </ClientProviders>
        </ErrorBoundary>
      )}
    >
      <FileRoutes />
    </Router>
  );
}