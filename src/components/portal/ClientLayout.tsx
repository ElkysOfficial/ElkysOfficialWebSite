import { Suspense, useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import PortalErrorBoundary from "@/components/portal/PortalErrorBoundary";
import PortalLoading from "@/components/portal/PortalLoading";
import { useTheme } from "next-themes";

import { Button, HexAvatar, HexPattern, cn } from "@/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_PROFILE_AVATAR_TRANSFORM,
  PORTAL_PROFILE_UPDATED_EVENT,
  getProfileAvatarImageStyle,
  getProfileInitials,
  resolveProfileAvatarTransform,
  type PortalProfileUpdatedDetail,
} from "@/lib/profile";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarX,
  FileText,
  Home,
  Phone,
  X,
} from "@/assets/icons";
import NotificationBell from "@/components/portal/NotificationBell";

const SIDEBAR_STORAGE_KEY = "elkys-client-sidebar-collapsed";

const navItems = [
  { label: "Visão Geral", href: "/portal/cliente", icon: Home },
  { label: "Propostas", href: "/portal/cliente/propostas", icon: FileText },
  { label: "Contratos", href: "/portal/cliente/contratos", icon: FileText },
  { label: "Projetos", href: "/portal/cliente/projetos", icon: CalendarX },
  { label: "Financeiro", href: "/portal/cliente/financeiro", icon: Banknote },
  { label: "Suporte", href: "/portal/cliente/suporte", icon: Phone },
];

const clientPageMeta = [
  {
    match: (pathname: string) => pathname === "/portal/cliente",
    title: "Visão Geral",
    description:
      "Acompanhamento objetivo do projeto, da cobrança e dos próximos passos da sua conta.",
  },
  {
    match: (pathname: string) => pathname === "/portal/cliente/propostas",
    title: "Propostas",
    description: "Propostas comerciais enviadas pela Elkys para sua avaliacao e aprovacao.",
  },
  {
    match: (pathname: string) => pathname.startsWith("/portal/cliente/propostas/"),
    title: "Detalhe da Proposta",
    description: "Avalie os termos da proposta e responda diretamente pelo portal.",
  },
  {
    match: (pathname: string) => pathname === "/portal/cliente/contratos",
    title: "Contratos",
    description:
      "Contratos emitidos pela Elkys com escopo, valores e vigência. Revise e registre seu aceite formal.",
  },
  {
    match: (pathname: string) => pathname === "/portal/cliente/projetos",
    title: "Projetos",
    description:
      "Carteira completa dos seus projetos com status, etapa atual e proxima acao em cada frente.",
  },
  {
    match: (pathname: string) => pathname.startsWith("/portal/cliente/projetos/"),
    title: "Detalhe do projeto",
    description:
      "Visao clara do andamento, pagamentos, documentos e historico relevante do projeto.",
  },
  {
    match: (pathname: string) => pathname === "/portal/cliente/financeiro",
    title: "Financeiro",
    description:
      "Acompanhe apenas o que impacta sua relacao financeira com a Elkys: valores, vencimentos e situacao.",
  },
  {
    match: (pathname: string) => pathname === "/portal/cliente/suporte",
    title: "Suporte",
    description: "Canais diretos para tratar dúvidas, solicitações e acompanhamento operacional.",
  },
  {
    match: (pathname: string) => pathname === "/portal/cliente/perfil",
    title: "Perfil",
    description: "Dados pessoais, foto e leitura do seu acesso ao Portal Elkys.",
  },
];

function isItemActive(currentPath: string, href: string) {
  if (href === "/portal/cliente") return currentPath === href;
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function MenuGlyph({ className }: { className?: string }) {
  return (
    <span className={cn("flex h-4 w-4 flex-col items-center justify-center gap-1", className)}>
      <span className="block h-[1.5px] w-4 rounded-full bg-current" />
      <span className="block h-[1.5px] w-3 rounded-full bg-current" />
      <span className="block h-[1.5px] w-4 rounded-full bg-current" />
    </span>
  );
}

export default function ClientLayout() {
  const { user, signOut } = useAuth();
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profileName, setProfileName] = useState("Cliente");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [profileAvatarTransform, setProfileAvatarTransform] = useState(
    DEFAULT_PROFILE_AVATAR_TRANSFORM
  );
  const [clockTime, setClockTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClockTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      );
    };
    const id = window.setInterval(tick, 10_000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    setMounted(true);

    if (typeof window === "undefined") return;

    const storedValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (storedValue !== null) setSidebarCollapsed(storedValue === "true");
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
  }, [mounted, sidebarCollapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    let active = true;

    const fallbackName = () => {
      const metadataName = user?.user_metadata?.full_name;
      if (typeof metadataName === "string" && metadataName.trim().length > 0) {
        return metadataName.trim();
      }

      const emailPrefix = user?.email
        ?.split("@")[0]
        ?.replace(/[._-]+/g, " ")
        .trim();
      if (!emailPrefix) return "Cliente";

      return emailPrefix.replace(/\b\w/g, (letter) => letter.toUpperCase());
    };

    const formatName = (value: string) => {
      const parts = value.trim().split(/\s+/);
      if (parts.length <= 1) return value.trim();
      return `${parts[0]} ${parts[parts.length - 1]}`;
    };

    if (!user?.id) {
      setProfileName("Cliente");
      setProfileAvatarUrl(null);
      setProfileAvatarTransform(DEFAULT_PROFILE_AVATAR_TRANSFORM);
      return () => {
        active = false;
      };
    }

    const loadProfile = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

      if (!active) return;

      const resolvedAvatar =
        data?.avatar_url?.trim() ||
        (typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null);
      const resolvedAvatarTransform = resolveProfileAvatarTransform({
        zoom: data?.avatar_zoom ?? user.user_metadata?.avatar_zoom,
        positionX: data?.avatar_position_x ?? user.user_metadata?.avatar_position_x,
        positionY: data?.avatar_position_y ?? user.user_metadata?.avatar_position_y,
      });

      setProfileName(formatName(data?.full_name?.trim() || fallbackName()));
      setProfileAvatarUrl(resolvedAvatar);
      setProfileAvatarTransform(resolvedAvatarTransform);
    };

    void loadProfile();

    const handleProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<PortalProfileUpdatedDetail>).detail;
      if (!active || !detail) return;

      if (typeof detail.fullName === "string" && detail.fullName.trim().length > 0) {
        setProfileName(formatName(detail.fullName));
      }

      if ("avatarUrl" in detail) {
        setProfileAvatarUrl(detail.avatarUrl ?? null);
      }

      if (detail.avatarTransform) {
        setProfileAvatarTransform(resolveProfileAvatarTransform(detail.avatarTransform));
      }
    };

    window.addEventListener(PORTAL_PROFILE_UPDATED_EVENT, handleProfileUpdated as EventListener);

    return () => {
      active = false;
      window.removeEventListener(
        PORTAL_PROFILE_UPDATED_EVENT,
        handleProfileUpdated as EventListener
      );
    };
  }, [user?.email, user?.id, user?.user_metadata]);

  const isDarkTheme = mounted && resolvedTheme === "dark";
  const avatarInitial = getProfileInitials(profileName, "C");
  const avatarImageStyle = useMemo(
    () => getProfileAvatarImageStyle(profileAvatarTransform),
    [profileAvatarTransform]
  );
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mounted]
  );
  const currentPageMeta = useMemo(
    () =>
      clientPageMeta.find((item) => item.match(location.pathname)) ?? {
        title: "Portal do Cliente",
        description: "Ambiente dedicado ao acompanhamento da sua conta na Elkys.",
      },
    [location.pathname]
  );

  const closeMobileSidebar = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-secondary-dark/35 backdrop-blur-sm lg:hidden"
          onClick={closeMobileSidebar}
          aria-label="Fechar navegação"
        />
      ) : null}

      <div className="relative flex min-h-screen">
        <aside
          id="client-sidebar"
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex h-dvh flex-col border-r border-border/75 bg-card transition-all duration-300 ease-out lg:sticky lg:top-0 lg:h-screen",
            sidebarCollapsed ? "w-32" : "w-56",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="grid h-20 grid-cols-[1fr_40px] items-center gap-2 border-b border-border/75 px-3">
            <Link
              to="/portal/cliente"
              className="flex min-w-0 items-center justify-center pr-1"
              aria-label="Ir para visão geral do cliente"
            >
              <img
                src={
                  isDarkTheme
                    ? "/imgs/icons/lettering_elkys_login.webp"
                    : "/imgs/icons/lettering_elkys_purple_login.webp"
                }
                alt="Elkys"
                width={90}
                height={30}
                className={cn(
                  "block h-auto transition-all duration-300",
                  sidebarCollapsed ? "w-[64px]" : "w-[44px]"
                )}
              />
            </Link>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden justify-self-center text-muted-foreground hover:text-foreground lg:inline-flex"
              onClick={() => setSidebarCollapsed((current) => !current)}
              aria-expanded={!sidebarCollapsed}
              aria-label={sidebarCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
            >
              {sidebarCollapsed ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="justify-self-center text-muted-foreground hover:text-foreground lg:hidden"
              onClick={closeMobileSidebar}
              aria-label="Fechar sidebar"
            >
              <X size={18} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 sidebar-scroll">
            <nav className="space-y-2">
              {navItems.map(({ label, href, icon: Icon }) => {
                const active = isItemActive(location.pathname, href);

                return (
                  <Link
                    key={href}
                    to={href}
                    title={sidebarCollapsed ? label : undefined}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex min-h-[48px] items-center gap-3 overflow-hidden rounded-lg border px-3 py-2.5 transition-all duration-300 ease-out",
                      sidebarCollapsed ? "justify-center px-0" : "",
                      active
                        ? "border-border/80 bg-background text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-background/65 hover:text-foreground"
                    )}
                  >
                    {!sidebarCollapsed ? (
                      <HexPattern
                        variant="inline"
                        className={cn(
                          active
                            ? "-right-4 -bottom-4 h-16 w-16 opacity-[0.16] transition-all duration-300 dark:opacity-[0.22]"
                            : "-right-4 -bottom-4 h-16 w-16 opacity-[0.05] transition-all duration-300 group-hover:opacity-[0.09] dark:opacity-[0.08] dark:group-hover:opacity-[0.12]"
                        )}
                      />
                    ) : (
                      <HexPattern
                        variant="inline"
                        className={cn(
                          "left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2",
                          active
                            ? "opacity-[0.14] transition-all duration-300 dark:opacity-[0.2]"
                            : "opacity-[0.04] transition-all duration-300 group-hover:opacity-[0.08] dark:opacity-[0.07] dark:group-hover:opacity-[0.1]"
                        )}
                      />
                    )}

                    {!sidebarCollapsed && active ? (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                    ) : null}

                    <span
                      className={cn(
                        "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ease-out",
                        active
                          ? "bg-primary/12 text-primary dark:bg-primary/18"
                          : "bg-transparent text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <Icon size={17} />
                    </span>

                    {!sidebarCollapsed ? (
                      <span className="relative z-10 min-w-0 flex-1 truncate text-sm font-medium">
                        {label}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-border/75 p-3">
            <Link
              to="/portal/cliente/perfil"
              className={cn(
                "group mb-3 block rounded-lg border border-border/75 bg-background/60 p-3 transition-colors duration-200 hover:border-primary/20 hover:bg-background",
                sidebarCollapsed ? "px-2 py-3" : ""
              )}
              aria-label="Abrir perfil"
            >
              <div
                className={cn(
                  "flex items-center gap-3",
                  sidebarCollapsed ? "flex-col justify-center text-center" : ""
                )}
              >
                {profileAvatarUrl ? (
                  <HexAvatar
                    size={sidebarCollapsed ? "lg" : "md"}
                    src={profileAvatarUrl}
                    fallback={avatarInitial}
                    alt={profileName}
                    imageStyle={avatarImageStyle}
                    backgroundClassName={cn(sidebarCollapsed ? "scale-[1.12]" : "scale-[1.1]")}
                    contentInsetClassName={cn(sidebarCollapsed ? "inset-[5.75%]" : "inset-[6.25%]")}
                    className={sidebarCollapsed ? undefined : "h-12 w-12"}
                  />
                ) : (
                  <HexAvatar
                    size={sidebarCollapsed ? "lg" : "md"}
                    fallback={avatarInitial}
                    backgroundClassName={cn(sidebarCollapsed ? "scale-[1.12]" : "scale-[1.1]")}
                    contentInsetClassName={cn(sidebarCollapsed ? "inset-[5.75%]" : "inset-[6.25%]")}
                    className={sidebarCollapsed ? undefined : "h-12 w-12"}
                  />
                )}

                {!sidebarCollapsed ? (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight text-foreground">
                      {profileName}
                    </p>
                    <p className="text-xs font-medium leading-tight text-muted-foreground tabular-nums">
                      {clockTime}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <p className="break-words text-[11px] font-semibold leading-tight text-foreground">
                      {profileName}
                    </p>
                    <p className="break-words text-[10px] font-medium leading-tight text-muted-foreground tabular-nums">
                      {clockTime}
                    </p>
                  </div>
                )}
              </div>
            </Link>

            <Button
              type="button"
              variant="ghost"
              size={sidebarCollapsed ? "icon" : "default"}
              className={cn(
                "w-full text-destructive hover:bg-destructive/10 hover:text-destructive",
                sidebarCollapsed ? "px-0" : "justify-start"
              )}
              onClick={() => void signOut()}
              aria-label="Sair"
              title={sidebarCollapsed ? "Sair" : undefined}
            >
              <X size={18} />
              {!sidebarCollapsed ? <span>Sair</span> : null}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 h-20 border-b border-border/75 bg-background">
            <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6 xl:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="items-center justify-center text-muted-foreground hover:text-foreground lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-controls="client-sidebar"
                  aria-expanded={mobileOpen}
                  aria-label="Abrir navegação"
                >
                  <MenuGlyph />
                </Button>

                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-base font-semibold tracking-tight text-foreground md:text-lg">
                    {currentPageMeta.title}
                  </p>
                  <p className="hidden max-w-2xl truncate text-xs leading-relaxed text-muted-foreground md:block">
                    {currentPageMeta.description}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <NotificationBell />
                <p className="hidden text-right text-sm font-medium capitalize text-muted-foreground md:block">
                  {todayLabel}
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto px-4 py-5 md:px-6 md:py-6 xl:px-8 xl:py-8">
            <div className="mx-auto w-full max-w-[1400px]">
              <PortalErrorBoundary key={location.pathname}>
                <Suspense fallback={<PortalLoading />}>
                  <Outlet />
                </Suspense>
              </PortalErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
