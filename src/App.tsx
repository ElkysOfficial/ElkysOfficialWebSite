import { lazy, Suspense } from "react";
import { Toaster } from "@/design-system";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/portal/ProtectedRoute";
import MustChangePasswordGuard from "@/components/portal/MustChangePasswordGuard";
import MustChangePasswordGuardAdmin from "@/components/portal/MustChangePasswordGuardAdmin";
import PortalRoleGuard from "@/components/portal/PortalRoleGuard";

// Public pages
const Index = lazy(() => import("./pages/Index"));
const Cases = lazy(() => import("./pages/Cases"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const ComoTrabalhamos = lazy(() => import("./pages/ComoTrabalhamos"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));

// Portal pages
const Login = lazy(() => import("./pages/Login"));
const AdminLayout = lazy(() => import("./components/portal/AdminLayout"));
const AdminPortalHome = lazy(() => import("./components/portal/AdminPortalHome"));
const AdminMarketingCalendar = lazy(() => import("./pages/portal/admin/MarketingCalendar"));
const AdminClients = lazy(() => import("./pages/portal/admin/Clients"));
const AdminClientCreate = lazy(() => import("./pages/portal/admin/ClientCreate"));
const AdminClientDetail = lazy(() => import("./pages/portal/admin/ClientDetail"));
const AdminProjects = lazy(() => import("./pages/portal/admin/Projects"));
const AdminProjectCreate = lazy(() => import("./pages/portal/admin/ProjectCreate"));
const AdminProjectDetail = lazy(() => import("./pages/portal/admin/ProjectDetail"));
const AdminInternalDocuments = lazy(() => import("./pages/portal/admin/InternalDocuments"));
const AdminFinance = lazy(() => import("./pages/portal/admin/Finance"));
const AdminExpenseCreate = lazy(() => import("./pages/portal/admin/ExpenseCreate"));
const AdminTeam = lazy(() => import("./pages/portal/admin/Team"));
const AdminTeamCreate = lazy(() => import("./pages/portal/admin/TeamCreate"));
const AdminSupport = lazy(() => import("./pages/portal/admin/Support"));
const AdminProfile = lazy(() => import("./pages/portal/admin/Profile"));
const ClientLayout = lazy(() => import("./components/portal/ClientLayout"));
const ClientOverview = lazy(() => import("./pages/portal/client/Overview"));
const ClientProjects = lazy(() => import("./pages/portal/client/Projects"));
const ClientProjectDetail = lazy(() => import("./pages/portal/client/ProjectDetail"));
const ClientFinance = lazy(() => import("./pages/portal/client/Finance"));
const ClientSupport = lazy(() => import("./pages/portal/client/Support"));
const ClientProfile = lazy(() => import("./pages/portal/client/Profile"));
const ChangePassword = lazy(() => import("./pages/portal/client/ChangePassword"));
const AdminChangePassword = lazy(() => import("./pages/portal/admin/ChangePassword"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="space-y-4 text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-muted-foreground text-sm">Carregando...</p>
    </div>
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ScrollToTop />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/servicos/:slug" element={<ServiceDetail />} />
              <Route path="/como-trabalhamos" element={<ComoTrabalhamos />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* First-access password change (client only, before portal) */}
              <Route
                path="/portal/cliente/alterar-senha"
                element={
                  <ProtectedRoute requiredRole="cliente">
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />

              {/* First-access password change (team members, before admin portal) */}
              <Route
                path="/portal/admin/alterar-senha"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminChangePassword />
                  </ProtectedRoute>
                }
              />

              {/* Admin / Team Portal */}
              <Route
                path="/portal/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <MustChangePasswordGuardAdmin>
                      <AdminLayout />
                    </MustChangePasswordGuardAdmin>
                  </ProtectedRoute>
                }
              >
                <Route
                  index
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin"]}>
                      <AdminPortalHome />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="calendario"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin", "marketing"]}>
                      <AdminMarketingCalendar />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="documentos/marketing-design"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin", "marketing"]}>
                      <AdminInternalDocuments audience="marketing_design" />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="documentos/desenvolvedor"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin", "developer"]}>
                      <AdminInternalDocuments audience="developer" />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="clientes"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin"]}>
                      <AdminClients />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="clientes/novo"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin"]}>
                      <AdminClientCreate />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="clientes/:id"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin"]}>
                      <AdminClientDetail />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="projetos"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin"]}>
                      <AdminProjects />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="projetos/novo"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin"]}>
                      <AdminProjectCreate />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="projetos/:id"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin"]}>
                      <AdminProjectDetail />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="financeiro"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin"]}>
                      <AdminFinance />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="financeiro/nova-despesa"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin"]}>
                      <AdminExpenseCreate />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="despesas"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin"]}>
                      <Navigate
                        to="/portal/admin/financeiro"
                        replace
                        state={{ financeTab: "despesas" }}
                      />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="despesas/nova"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin"]}>
                      <Navigate
                        to="/portal/admin/financeiro/nova-despesa"
                        replace
                        state={{ financeTab: "despesas" }}
                      />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="equipe"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin"]}>
                      <AdminTeam />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="equipe/novo"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin"]}>
                      <AdminTeamCreate />
                    </PortalRoleGuard>
                  }
                />
                <Route
                  path="suporte"
                  element={
                    <PortalRoleGuard allowedRoles={["admin_super", "admin", "support"]}>
                      <AdminSupport />
                    </PortalRoleGuard>
                  }
                />
                <Route path="perfil" element={<AdminProfile />} />
              </Route>

              {/* Client Portal */}
              <Route
                path="/portal/cliente"
                element={
                  <ProtectedRoute requiredRole="cliente">
                    <MustChangePasswordGuard>
                      <ClientLayout />
                    </MustChangePasswordGuard>
                  </ProtectedRoute>
                }
              >
                <Route index element={<ClientOverview />} />
                <Route path="projetos" element={<ClientProjects />} />
                <Route path="projetos/:id" element={<ClientProjectDetail />} />
                <Route path="financeiro" element={<ClientFinance />} />
                <Route
                  path="documentos"
                  element={<Navigate to="/portal/cliente/projetos" replace />}
                />
                <Route path="suporte" element={<ClientSupport />} />
                <Route path="perfil" element={<ClientProfile />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <CookieConsent />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
