import { lazy, Suspense } from "react";
import { Toaster } from "@/design-system";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";
import RootErrorBoundary from "@/components/RootErrorBoundary";

// Public pages
const Index = lazy(() => import("./pages/Index"));
const Cases = lazy(() => import("./pages/Cases"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const ComoTrabalhamos = lazy(() => import("./pages/ComoTrabalhamos"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Portal shell (AuthProvider loaded only when a portal/auth route matches)
const PortalShell = lazy(() => import("./pages/PortalShell"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PortalRoutes = lazy(() => import("./pages/PortalRoutes"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 2 minutes — no refetch during this window
      staleTime: 2 * 60 * 1000,
      // Keep inactive data in memory for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Background refetch when user returns to tab — apenas se stale
      // (coerente com staleTime; antes estava "always", que forcava refetch
      // mesmo dentro da janela fresca, contradizendo a intencao do staleTime).
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is still fresh
      refetchOnMount: true,
      // Single retry on failure
      retry: 1,
    },
  },
});

const App = () => (
  <RootErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Suspense fallback={null}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/servicos/:slug" element={<ServiceDetail />} />
              <Route path="/como-trabalhamos" element={<ComoTrabalhamos />} />

              {/*
               * Portal shell — pathless layout route.
               * Renders AuthProvider (+ Supabase) only when a child route matches.
               * Login and ForgotPassword are direct children so they are NOT
               * wrapped in a path-consuming <Route>, avoiding the React Router
               * descendant-Routes path-stripping bug.
               */}
              <Route
                element={
                  <Suspense fallback={null}>
                    <PortalShell />
                  </Suspense>
                }
              >
                <Route
                  path="/login"
                  element={
                    <Suspense fallback={null}>
                      <Login />
                    </Suspense>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <Suspense fallback={null}>
                      <ForgotPassword />
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
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <CookieConsent />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </RootErrorBoundary>
);

export default App;
