import { useEffect } from "react";
import { ChevronRight, Home } from "@/assets/icons";
import { Link, useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href: string;
}

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const isHome = location.pathname === "/";

  // Map paths to readable names
  const pathMap: Record<string, string> = {
    "terms-of-service": "Termos de Uso",
    "privacy-policy": "Política de Privacidade",
    "cookie-policy": "Política de Cookies",
  };

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [{ label: "Início", href: "/" }];

  let currentPath = "";
  pathnames.forEach((path) => {
    currentPath += `/${path}`;
    breadcrumbItems.push({
      label: pathMap[path] || path,
      href: currentPath,
    });
  });

  // Injeta o JSON-LD BreadcrumbList diretamente no <head> (era feito via
  // <Helmet> — substituido por DOM direto pra eliminar react-helmet-async
  // do bundle inicial). Marca com data-breadcrumbs="true" pra remover
  // entre navegacoes sem afetar o @graph estatico do index.html.
  useEffect(() => {
    document.head.querySelectorAll('script[data-breadcrumbs="true"]').forEach((s) => s.remove());

    if (isHome) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: `https://elkys.com.br${item.href}`,
      })),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.breadcrumbs = "true";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.head.querySelectorAll('script[data-breadcrumbs="true"]').forEach((s) => s.remove());
    };
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Don't show breadcrumbs on homepage
  if (isHome) return null;

  return (
    <>
      <nav aria-label="Breadcrumb" className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;
              const isFirst = index === 0;

              return (
                <li key={item.href} className="flex items-center">
                  {index > 0 && <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />}
                  {isLast ? (
                    <span className="text-foreground font-medium" aria-current="page">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      to={item.href}
                      className="text-muted-foreground hover:text-primary transition-colors flex items-center"
                    >
                      {isFirst && <Home className="h-4 w-4 mr-1" />}
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
};

export default Breadcrumbs;
