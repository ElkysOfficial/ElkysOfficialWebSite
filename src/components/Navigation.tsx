import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import letteringPurple from "../../public/imgs/icons/lettering_elkys_purple.webp";
import letteringWhite from "../../public/imgs/icons/lettering_elkys.webp";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();

  const isHomePage = location.pathname === "/";
  const hasHeroSection = isHomePage || location.pathname === "/cases";
  const isDarkTheme = mounted && resolvedTheme === "dark";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    { label: "Serviços", href: isHomePage ? "#services" : "/#services", isRoute: false },
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

          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navItems.map((item) =>
              item.isRoute ? (
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

        {isMenuOpen && (
          <div
            className={`md:hidden py-4 border-t transition-colors duration-150 max-h-[calc(100vh-4rem)] overflow-y-auto ${isDarkTheme ? "border-slate-800 bg-slate-900/95" : "border-border bg-white/95"}`}
          >
            <div className="flex flex-col space-y-2">
              {navItems.map((item) =>
                item.isRoute ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`${isDarkTheme ? "text-slate-200 hover:text-primary" : "text-foreground hover:text-primary"} transition-colors duration-150 font-medium px-4 py-3 rounded-lg hover:bg-muted min-h-[44px] flex items-center`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={item.label === "Início" ? handleHomeClick : () => setIsMenuOpen(false)}
                    className={`${isDarkTheme ? "text-slate-200 hover:text-primary" : "text-foreground hover:text-primary"} transition-colors duration-150 font-medium px-4 py-3 rounded-lg hover:bg-muted min-h-[44px] flex items-center`}
                  >
                    {item.label}
                  </a>
                )
              )}
              <Button
                variant="gradient"
                className="mt-4 w-full"
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
        )}
      </div>
    </nav>
  );
};

export default Navigation;
