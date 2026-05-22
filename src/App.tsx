import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import RootErrorBoundary from "@/components/RootErrorBoundary";

// Index e SYNC (nao lazy): combina com o LCP instant shim injetado no
// index.html. Se Index fosse lazy, a primeira commit do React renderiza
// null (Suspense fallback) enquanto o chunk de Index baixa, deixando a
// tela em branco atras do shim — removeLcpShim() em main.tsx removeria
// o shim e o usuario veria flash branco ate o Hero montar. Com Index
// sync, o Hero existe no DOM logo apos createRoot.render, e o shim pode
// sair em 2 rAFs sem flash. Outras rotas continuam lazy.
import Index from "./pages/Index";

// CookieConsent so aparece apos 1500ms e somente pra quem nao deu consent.
// Carregar lazy tira icones Cookie/X + Button + Link do bundle inicial.
const CookieConsent = lazy(() => import("@/components/CookieConsent"));

// Toaster (sonner) removido do root. Na landing, ContactForm.tsx monta o
// seu proprio Toaster (lazy, so carrega quando o usuario rola ate o form).
// No portal, PortalShell.tsx monta. Tira ~10KB gzip do entry na landing
// pra visitantes que nao chegam em form/portal.

// React Query (QueryClientProvider) removido do root. Nenhuma pagina
// publica (Index, Cases, ServiceDetail, ContactForm...) consome React
// Query — so o portal usa (AuthContext + hooks useAdmin*/useClient*).
// O provider agora vive em PortalShell.tsx, que ja e lazy. Visitantes
// que nao entram no portal nao baixam o chunk query-vendor (~9KB gzip)
// nem pagam o modulepreload hint dele competindo com fonts/CSS no boot.

// Public pages (exceto Index, ver acima)
const Cases = lazy(() => import("./pages/Cases"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const ComoTrabalhamos = lazy(() => import("./pages/ComoTrabalhamos"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Portal shell (AuthProvider + QueryClientProvider loaded only when a
// portal/auth route matches)
const PortalShell = lazy(() => import("./pages/PortalShell"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PortalRoutes = lazy(() => import("./pages/PortalRoutes"));

const App = () => (
  // HelmetProvider removido: o componente SEO agora e imperativo (useEffect
  // + document.querySelector), sem dependencia de react-helmet-async. Tira
  // o virtual DOM paralelo de <head> do bundle inicial (~15 KB gzip).
  <RootErrorBoundary>
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
           * Renders AuthProvider (+ Supabase) and QueryClientProvider only
           * when a child route matches. Login and ForgotPassword are direct
           * children so they are NOT wrapped in a path-consuming <Route>,
           * avoiding the React Router descendant-Routes path-stripping bug.
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
      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>
    </BrowserRouter>
  </RootErrorBoundary>
);

export default App;
