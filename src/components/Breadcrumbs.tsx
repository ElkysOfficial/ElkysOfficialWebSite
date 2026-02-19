import { ChevronRight, Home } from "@/assets/icons";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

interface BreadcrumbItem {
  label: string;
  href: string;
}

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Don't show breadcrumbs on homepage
  if (location.pathname === "/") return null;

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

  // Generate Schema.org BreadcrumbList
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `https://elkys.com.br${item.href}`,
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

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
