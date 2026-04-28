import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEO from "@/components/SEO";
import CookieBody from "@/components/legal/CookieBody";

const CookiePolicy = () => {
  return (
    <>
      <SEO
        title="Política de Cookies | Elkys"
        description="Política de Cookies da Elkys. Saiba quais cookies utilizamos, suas finalidades e como gerenciá-los em seu navegador."
        canonical="https://elkys.com.br/cookie-policy"
      />
      <div className="min-h-screen bg-background">
        <Navigation />
        <Breadcrumbs />

        <main
          id="main-content"
          className="container mx-auto px-4 py-16 md:py-20 lg:py-24 max-w-4xl"
        >
          <header className="mb-12 border-b border-border pb-8">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              Documento Legal
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              Politica de Cookies
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
              <span>
                Vigencia:{" "}
                {new Date().toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="hidden sm:inline">|</span>
              <span>Versao 2.0</span>
            </div>
          </header>

          <article className="max-w-none">
            <CookieBody />

            <div className="border-t border-border pt-8 mt-12">
              <p className="text-sm text-muted-foreground text-center">
                Ao continuar navegando neste website, o usuario declara estar ciente e de acordo com
                a utilizacao de cookies conforme descrito nesta Politica.
              </p>
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CookiePolicy;
