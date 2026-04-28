import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEO from "@/components/SEO";
import TermsBody from "@/components/legal/TermsBody";

const TermsOfService = () => {
  return (
    <>
      <SEO
        title="Termos de Uso | Elkys - Condições de Serviço"
        description="Termos de Uso do website e dos portais Elkys. Conheça as condições de uso, direitos, obrigações e políticas aplicáveis aos nossos serviços de desenvolvimento de software."
        canonical="https://elkys.com.br/terms-of-service"
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
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">Termos de Uso</h1>
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
            <TermsBody />

            <div className="border-t border-border pt-8 mt-12">
              <p className="text-sm text-muted-foreground text-center">
                Ao utilizar este website ou os portais, o usuario declara estar ciente e de acordo
                com os presentes Termos de Uso.
              </p>
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default TermsOfService;
