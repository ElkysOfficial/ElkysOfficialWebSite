import { useEffect, useState, useRef, useCallback } from "react";
import { Menu, X, Hexagon, Building2, Target } from "@/assets/icons";
import { useTheme } from "next-themes";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, cn } from "@/design-system";
import { services } from "@/data/services";
// Assets servidos direto de public/ — evita duplicacao no bundle.
const letteringPurple = "/imgs/icons/lettering_elkys_purple.webp";
const letteringWhite = "/imgs/icons/lettering_elkys.webp";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMobileAboutOpen, setIsMobileAboutOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const aboutDropdownRef = useRef<HTMLDivElement>(null);
  const aboutTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const isHomePage = location.pathname === "/";
  const hasHeroSection =
    isHomePage ||
    location.pathname === "/cases" ||
    location.pathname.startsWith("/servicos/") ||
    location.pathname === "/como-trabalhamos";
  const isDarkTheme = mounted && resolvedTheme === "dark";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setIsServicesOpen(false);
    setIsMobileServicesOpen(false);
    setIsAboutOpen(false);
    setIsMobileAboutOpen(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleDropdownEnter = useCallback(() => {
    clearTimeout(dropdownTimeoutRef.current);
    setIsServicesOpen(true);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => setIsServicesOpen(false), 150);
  }, []);

  const handleAboutEnter = useCallback(() => {
    clearTimeout(aboutTimeoutRef.current);
    setIsAboutOpen(true);
  }, []);

  const handleAboutLeave = useCallback(() => {
    aboutTimeoutRef.current = setTimeout(() => setIsAboutOpen(false), 150);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(dropdownTimeoutRef.current);
      clearTimeout(aboutTimeoutRef.current);
    };
  }, []);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isHomePage) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isHomePage) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      e.preventDefault();
      navigate("/");
    }
    setIsMenuOpen(false);
  };

  const aboutSubItems = [
    {
      label: "Quem somos",
      href: isHomePage ? "#about" : "/#about",
      icon: Building2,
      isRoute: false,
    },
    {
      label: "Como trabalhamos",
      href: "/como-trabalhamos",
      icon: Target,
      isRoute: true,
    },
  ];

  const navItems: Array<{
    label: string;
    href: string;
    isRoute: boolean;
    dropdownType?: "about" | "services";
  }> = [
    { label: "Início", href: isHomePage ? "#hero" : "/#hero", isRoute: false },
    {
      label: "Sobre",
      href: isHomePage ? "#about" : "/#about",
      isRoute: false,
      dropdownType: "about",
    },
    {
      label: "Serviços",
      href: isHomePage ? "#services" : "/#services",
      isRoute: false,
      dropdownType: "services",
    },
    { label: "Cases", href: "/cases", isRoute: true },
    { label: "Contato", href: isHomePage ? "#contact" : "/#contact", isRoute: false },
  ];

  const isHeroVisible = hasHeroSection && scrollY <= 900;
  const useTransparent = isHeroVisible || isDarkTheme;
  const hasScrolled = scrollY > 0;

  /**
   * Lógica da logo:
   * - Logo branca: quando o fundo é escuro (hero visível OU tema escuro)
   * - Logo roxa: quando o fundo é claro (tema claro + após scroll OU páginas secundárias)
   */
  const useWhiteLogo = isDarkTheme || (hasHeroSection && !hasScrolled && isHeroVisible);

  const linkClass =
    useTransparent && !hasScrolled
      ? "text-white hover:text-accent"
      : "text-foreground hover:text-primary";

  const navBg = hasScrolled
    ? "bg-background/95 shadow-md border-b border-border"
    : useTransparent
      ? "bg-transparent"
      : "bg-background/95 shadow-md border-b border-border";
  const isOverlayHeader = useTransparent && !hasScrolled;

  const dropdownBg = "bg-popover border-border";

  const dropdownItemClass = "text-muted-foreground hover:text-primary hover:bg-muted";
  const portalLinkClass = cn(
    "inline-flex min-h-[44px] items-center justify-center rounded-md border px-4 text-sm font-semibold tracking-wide transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2",
    isOverlayHeader
      ? "border-white/16 bg-white/10 text-white shadow-sm backdrop-blur-md hover:border-white/26 hover:bg-white/14 focus-visible:ring-white/35 focus-visible:ring-offset-0"
      : "border-border/70 bg-background/85 text-foreground shadow-sm backdrop-blur-md hover:border-primary/20 hover:bg-primary-soft hover:text-primary focus-visible:ring-ring focus-visible:ring-offset-2"
  );

  const renderPortalLink = (compact = false) => (
    <Link
      to="/login"
      className={cn(portalLinkClass, compact ? "px-3.5" : "px-4")}
      aria-label="Acessar o portal"
    >
      Portal
    </Link>
  );

  if (!mounted) {
    return <nav className="fixed top-0 left-0 right-0 z-50 h-16" />;
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-all duration-300 ${navBg}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" onClick={handleLogoClick} className="flex items-center space-x-2">
            <img
              src={useWhiteLogo ? letteringWhite : letteringPurple}
              alt="Elkys"
              width={64}
              height={32}
              className="w-16 transition-all duration-500"
            />
            <span className="sr-only">Elkys</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <div className="flex items-center space-x-6 lg:space-x-8">
              {navItems.map((item) =>
                item.dropdownType === "about" ? (
                  /* About dropdown */
                  <div
                    key={item.label}
                    ref={aboutDropdownRef}
                    className="relative"
                    onMouseEnter={handleAboutEnter}
                    onMouseLeave={handleAboutLeave}
                  >
                    <a
                      href={item.href}
                      className={`${linkClass} transition-colors duration-150 font-medium inline-flex items-center gap-1`}
                    >
                      {item.label}
                      <Hexagon
                        className={`h-3 w-3 transition-all duration-300 ${isAboutOpen ? "rotate-90 scale-110 fill-current" : "fill-transparent"}`}
                      />
                    </a>

                    <div
                      className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 transition-all duration-200 ${
                        isAboutOpen
                          ? "opacity-100 translate-y-0 pointer-events-auto"
                          : "opacity-0 -translate-y-2 pointer-events-none"
                      }`}
                    >
                      <div
                        className={`${dropdownBg} border rounded-xl shadow-xl min-w-[220px] overflow-hidden py-1`}
                      >
                        {aboutSubItems.map((sub) => {
                          const SubIcon = sub.icon;
                          return sub.isRoute ? (
                            <Link
                              key={sub.label}
                              to={sub.href}
                              className={`flex items-center gap-3 px-4 py-3 ${dropdownItemClass} transition-colors duration-150`}
                              onClick={() => setIsAboutOpen(false)}
                            >
                              <SubIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm font-medium">{sub.label}</span>
                            </Link>
                          ) : (
                            <a
                              key={sub.label}
                              href={sub.href}
                              className={`flex items-center gap-3 px-4 py-3 ${dropdownItemClass} transition-colors duration-150`}
                              onClick={() => setIsAboutOpen(false)}
                            >
                              <SubIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm font-medium">{sub.label}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : item.dropdownType === "services" ? (
                  /* Services dropdown */
                  <div
                    key={item.label}
                    ref={dropdownRef}
                    className="relative"
                    onMouseEnter={handleDropdownEnter}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <a
                      href={item.href}
                      className={`${linkClass} transition-colors duration-150 font-medium inline-flex items-center gap-1`}
                    >
                      {item.label}
                      <Hexagon
                        className={`h-3 w-3 transition-all duration-300 ${isServicesOpen ? "rotate-90 scale-110 fill-current" : "fill-transparent"}`}
                      />
                    </a>

                    <div
                      className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 transition-all duration-200 ${
                        isServicesOpen
                          ? "opacity-100 translate-y-0 pointer-events-auto"
                          : "opacity-0 -translate-y-2 pointer-events-none"
                      }`}
                    >
                      <div
                        className={`${dropdownBg} border rounded-xl shadow-xl min-w-[220px] overflow-hidden py-1`}
                      >
                        {services.map((service) => {
                          const Icon = service.icon;
                          return (
                            <Link
                              key={service.slug}
                              to={`/servicos/${service.slug}`}
                              className={`flex items-center gap-3 px-4 py-3 ${dropdownItemClass} transition-colors duration-150`}
                              onClick={() => setIsServicesOpen(false)}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm font-medium">{service.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : item.isRoute ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`${linkClass} transition-colors duration-150 font-medium`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={item.label === "Início" ? handleHomeClick : undefined}
                    className={`${linkClass} transition-colors duration-150 font-medium`}
                  >
                    {item.label}
                  </a>
                )
              )}
            </div>

            <div className="flex items-center gap-3">
              {renderPortalLink()}
              <Button
                variant="gradient"
                onClick={() => window.open("https://wa.me/553199738235", "_blank")}
                aria-label="Fale conosco pelo WhatsApp"
              >
                Fale Conosco
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {renderPortalLink(true)}
            <button
              className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors duration-150 ${useTransparent && !hasScrolled ? "text-white" : "text-foreground"}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Full overlay */}
        <div
          className={`md:hidden fixed inset-x-0 top-16 bottom-0 z-40 transition-all duration-300 ease-out ${
            isMenuOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              isMenuOpen ? "opacity-100" : "opacity-0"
            } bg-foreground/20`}
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <div className="relative mx-3 mt-2 rounded-2xl shadow-xl border border-border overflow-hidden bg-popover">
            <div className="max-h-[calc(100vh-6rem)] overflow-y-auto p-4">
              {/* Nav links */}
              <nav className="space-y-1">
                {navItems.map((item) =>
                  item.dropdownType === "about" ? (
                    <div key={item.label}>
                      <button
                        onClick={() => setIsMobileAboutOpen(!isMobileAboutOpen)}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold text-base min-h-[48px] transition-colors duration-150 text-foreground hover:bg-muted"
                      >
                        {item.label}
                        <Hexagon
                          className={`h-3.5 w-3.5 transition-all duration-300 ${
                            isMobileAboutOpen
                              ? "rotate-90 scale-110 fill-current text-primary"
                              : "fill-transparent"
                          }`}
                        />
                      </button>

                      {/* About sub-menu */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-out ${
                          isMobileAboutOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="ml-2 mr-2 mb-2 mt-1 rounded-xl border border-border bg-muted/50">
                          <div className="p-1.5 space-y-0.5">
                            {aboutSubItems.map((sub) => {
                              const SubIcon = sub.icon;
                              return sub.isRoute ? (
                                <Link
                                  key={sub.label}
                                  to={sub.href}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[44px] transition-colors duration-150 text-muted-foreground hover:text-primary hover:bg-background"
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  <SubIcon className="h-4 w-4 flex-shrink-0" />
                                  <span className="text-sm font-medium">{sub.label}</span>
                                </Link>
                              ) : (
                                <a
                                  key={sub.label}
                                  href={sub.href}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[44px] transition-colors duration-150 text-muted-foreground hover:text-primary hover:bg-background"
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  <SubIcon className="h-4 w-4 flex-shrink-0" />
                                  <span className="text-sm font-medium">{sub.label}</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : item.dropdownType === "services" ? (
                    <div key={item.label}>
                      <button
                        onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold text-base min-h-[48px] transition-colors duration-150 text-foreground hover:bg-muted"
                      >
                        {item.label}
                        <Hexagon
                          className={`h-3.5 w-3.5 transition-all duration-300 ${
                            isMobileServicesOpen
                              ? "rotate-90 scale-110 fill-current text-primary"
                              : "fill-transparent"
                          }`}
                        />
                      </button>

                      {/* Services sub-menu */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-out ${
                          isMobileServicesOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="ml-2 mr-2 mb-2 mt-1 rounded-xl border border-border bg-muted/50">
                          <div className="p-1.5 space-y-0.5">
                            {services.map((service) => {
                              const Icon = service.icon;
                              return (
                                <Link
                                  key={service.slug}
                                  to={`/servicos/${service.slug}`}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[44px] transition-colors duration-150 text-muted-foreground hover:text-primary hover:bg-background"
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  <Icon className="h-4 w-4 flex-shrink-0" />
                                  <span className="text-sm font-medium">{service.title}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : item.isRoute ? (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="flex px-4 py-3.5 rounded-xl font-semibold text-base min-h-[48px] items-center transition-colors duration-150 text-foreground hover:bg-muted"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={
                        item.label === "Início" ? handleHomeClick : () => setIsMenuOpen(false)
                      }
                      className="flex px-4 py-3.5 rounded-xl font-semibold text-base min-h-[48px] items-center transition-colors duration-150 text-foreground hover:bg-muted"
                    >
                      {item.label}
                    </a>
                  )
                )}
              </nav>

              {/* Divider */}
              <div className="my-4 mx-4 h-px bg-border" />

              {/* CTA Button */}
              <Button
                variant="gradient"
                className="w-full min-h-[48px] text-base"
                onClick={() => {
                  window.open("https://wa.me/553199738235", "_blank");
                  setIsMenuOpen(false);
                }}
                aria-label="Fale conosco pelo WhatsApp"
              >
                Fale Conosco
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
