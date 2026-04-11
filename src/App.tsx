import { lazy, Suspense } from "react";
import { Toaster } from "@/design-system";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";

// Public pages
const Index = lazy(() => import("./pages/Index"));
const Cases = lazy(() => import("./pages/Cases"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const ComoTrabalhamos = lazy(() => import("./pages/ComoTrabalhamos"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Portal shell (AuthProvider + Supabase loaded only when needed)
const PortalRoutes = lazy(() => import("./pages/PortalRoutes"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 2 minutes — no refetch during this window
      staleTime: 2 * 60 * 1000,
      // Keep inactive data in memory for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Background refetch when user returns to tab (only if stale)
      refetchOnWindowFocus: "always",
      // Don't refetch on mount if data is still fresh
      refetchOnMount: true,
      // Single retry on failure
      retry: 1,
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Routes>
          {/* Public — sem loading, navegação instantânea */}
          <Route path="/" element={<Index />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/servicos/:slug" element={<ServiceDetail />} />
          <Route path="/como-trabalhamos" element={<ComoTrabalhamos />} />

          {/* Portal + Login — Supabase carregado sob demanda */}
          <Route
            path="/login"
            element={
              <Suspense fallback={null}>
                <PortalRoutes />
              </Suspense>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <Suspense fallback={null}>
                <PortalRoutes />
              </Suspense>
            }
          />
          <Route
            path="/portal/*"
            element={
              <Suspense fallback={null}>
                <PortalRoutes />
              </Suspense>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieConsent />
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
