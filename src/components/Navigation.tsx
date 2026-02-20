import { useEffect, useState, useRef, useCallback } from "react";
import { Menu, X, Hexagon } from "@/assets/icons";
import { useTheme } from "next-themes";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/design-system";
import { services } from "@/data/services";
import letteringPurple from "../../public/imgs/icons/lettering_elkys_purple.webp";
import letteringWhite from "../../public/imgs/icons/lettering_elkys.webp";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const isHomePage = location.pathname === "/";
  const hasHeroSection =
    isHomePage || location.pathname === "/cases" || location.pathname.startsWith("/servicos/");
  const isDarkTheme = mounted && resolvedTheme === "dark";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsServicesOpen(false);
    setIsMobileServicesOpen(false);
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

  useEffect(() => {
    return () => clearTimeout(dropdownTimeoutRef.current);
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

  const navItems = [
    { label: "Início", href: isHomePage ? "#hero" : "/#hero", isRoute: false },
    { label: "Sobre", href: isHomePage ? "#about" : "/#about", isRoute: false },
    {
      label: "Serviços",
      href: isHomePage ? "#services" : "/#services",
      isRoute: false,
      hasDropdown: true,
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
      : isDarkTheme
        ? "text-slate-200 hover:text-primary"
        : "text-foreground hover:text-primary";

  const navBg = hasScrolled
    ? isDarkTheme
      ? "bg-slate-900/95 shadow-md border-b border-slate-800"
      : "bg-white/95 shadow-md border-b border-slate-100"
    : useTransparent
      ? "bg-transparent"
      : "bg-white/95 shadow-md border-b border-slate-100";

  const dropdownBg = isDarkTheme ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200";

  const dropdownItemClass = isDarkTheme
    ? "text-slate-300 hover:text-white hover:bg-slate-800"
    : "text-slate-600 hover:text-primary hover:bg-slate-50";

  if (!mounted) {
    return <nav className="fixed top-0 left-0 right-0 z-50 h-16" />;
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-all duration-500 ${navBg}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" onClick={handleLogoClick} className="flex items-center space-x-2">
            <img
              src={useWhiteLogo ? letteringWhite : letteringPurple}
              alt="elkys"
              width={64}
              height={32}
              className="w-16 transition-all duration-500"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navItems.map((item) =>
              item.hasDropdown ? (
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

                  {/* Dropdown panel */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 transition-all duration-200 ${
                      isServicesOpen
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div
                      className={`${dropdownBg} border rounded-xl shadow-xl min-w-[280px] overflow-hidden`}
                    >
                      {/* "Ver todos os serviços" link */}
                      <a
                        href={item.href}
                        className={`block px-4 py-3 text-sm font-semibold border-b ${
                          isDarkTheme
                            ? "text-white border-slate-700 hover:bg-slate-800"
                            : "text-foreground border-slate-100 hover:bg-slate-50"
                        } transition-colors duration-150`}
                        onClick={() => setIsServicesOpen(false)}
                      >
                        Todos os serviços
                      </a>

                      {/* Service items */}
                      <div className="py-1">
                        {services.map((service) => {
                          const Icon = service.icon;
                          return (
                            <Link
                              key={service.slug}
                              to={`/servicos/${service.slug}`}
                              className={`flex items-center gap-3 px-4 py-3 ${dropdownItemClass} transition-colors duration-150`}
                              onClick={() => setIsServicesOpen(false)}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg bg-gradient-to-r ${service.gradient} flex items-center justify-center flex-shrink-0`}
                              >
                                <Icon className="h-4 w-4 text-white" />
                              </div>
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
            <Button
              variant="gradient"
              onClick={() => window.open("https://wa.me/553197382935", "_blank")}
              aria-label="Fale conosco pelo WhatsApp"
            >
              Fale Conosco
            </Button>
          </div>

          <button
            className={`md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors duration-150 ${useTransparent && !hasScrolled ? "text-white" : isDarkTheme ? "text-slate-200" : "text-foreground"}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation — Full overlay */}
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
            } ${isDarkTheme ? "bg-slate-950/60" : "bg-black/20"}`}
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <div
            className={`relative mx-3 mt-2 rounded-2xl shadow-xl border overflow-hidden ${
              isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="max-h-[calc(100vh-6rem)] overflow-y-auto p-4">
              {/* Nav links */}
              <nav className="space-y-1">
                {navItems.map((item) =>
                  item.hasDropdown ? (
                    <div key={item.label}>
                      <button
                        onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold text-base min-h-[48px] transition-colors duration-150 ${
                          isDarkTheme
                            ? "text-white hover:bg-slate-800"
                            : "text-foreground hover:bg-slate-50"
                        }`}
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
                        <div
                          className={`ml-2 mr-2 mb-2 mt-1 rounded-xl border ${
                            isDarkTheme
                              ? "border-slate-800 bg-slate-800/50"
                              : "border-slate-100 bg-slate-50/50"
                          }`}
                        >
                          <a
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`block px-4 py-3 text-sm font-semibold border-b ${
                              isDarkTheme
                                ? "text-slate-300 border-slate-700 hover:text-white"
                                : "text-slate-500 border-slate-100 hover:text-primary"
                            } transition-colors duration-150`}
                          >
                            Todos os serviços
                          </a>
                          <div className="p-1.5 space-y-0.5">
                            {services.map((service) => {
                              const Icon = service.icon;
                              return (
                                <Link
                                  key={service.slug}
                                  to={`/servicos/${service.slug}`}
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[44px] transition-colors duration-150 ${
                                    isDarkTheme
                                      ? "text-slate-300 hover:text-white hover:bg-slate-700/50"
                                      : "text-slate-600 hover:text-primary hover:bg-white"
                                  }`}
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  <div
                                    className={`w-8 h-8 rounded-lg bg-gradient-to-r ${service.gradient} flex items-center justify-center flex-shrink-0`}
                                  >
                                    <Icon className="h-4 w-4 text-white" />
                                  </div>
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
                      className={`block px-4 py-3.5 rounded-xl font-semibold text-base min-h-[48px] flex items-center transition-colors duration-150 ${
                        isDarkTheme
                          ? "text-white hover:bg-slate-800"
                          : "text-foreground hover:bg-slate-50"
                      }`}
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
                      className={`block px-4 py-3.5 rounded-xl font-semibold text-base min-h-[48px] flex items-center transition-colors duration-150 ${
                        isDarkTheme
                          ? "text-white hover:bg-slate-800"
                          : "text-foreground hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </a>
                  )
                )}
              </nav>

              {/* Divider */}
              <div className={`my-4 mx-4 h-px ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`} />

              {/* CTA Button */}
              <Button
                variant="gradient"
                className="w-full min-h-[48px] text-base"
                onClick={() => {
                  window.open("https://wa.me/553197382935", "_blank");
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
