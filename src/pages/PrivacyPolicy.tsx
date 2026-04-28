import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEO from "@/components/SEO";
import PrivacyBody from "@/components/legal/PrivacyBody";

const PrivacyPolicy = () => {
  return (
    <>
      <SEO
        title="Política de Privacidade | Elkys - Proteção de Dados LGPD"
        description="Política de Privacidade da Elkys em conformidade com a LGPD. Saiba como coletamos, usamos e protegemos seus dados pessoais."
        canonical="https://elkys.com.br/privacy-policy"
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
              Politica de Privacidade
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
              <span>Em conformidade com a LGPD (Lei n. 13.709/2018)</span>
            </div>
          </header>

          <article className="max-w-none">
            <PrivacyBody />

            <div className="border-t border-border pt-8 mt-12">
              <p className="text-sm text-muted-foreground text-center">
                Ao utilizar este website ou os portais autenticados, o usuario declara estar ciente
                das praticas de tratamento de dados descritas nesta Politica de Privacidade.
              </p>
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PrivacyPolicy;
