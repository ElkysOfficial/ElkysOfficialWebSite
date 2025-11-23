import Navigation from '@/components/Navigation';
import { CaseStudies } from '@/components/CaseStudies';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const Cases = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://elys.com.br/cases#webpage",
    "url": "https://elys.com.br/cases",
    "name": "Cases de Sucesso - Elys",
    "isPartOf": {
      "@id": "https://elys.com.br/#website"
    },
    "about": {
      "@id": "https://elys.com.br/#organization"
    },
    "description": "Descubra como transformamos desafios em resultados excepcionais para nossos clientes. Projetos de desenvolvimento de software, design e automação.",
    "inLanguage": "pt-BR",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://elys.com.br/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Cases de Sucesso",
          "item": "https://elys.com.br/cases"
        }
      ]
    }
  };

  return (
    <>
      <SEO
        title="Cases de Sucesso - Elys | Projetos que Transformaram Negócios"
        description="Descubra como transformamos desafios em resultados excepcionais para nossos clientes. Projetos de desenvolvimento de software, design e automação."
        canonical="https://elys.com.br/cases"
        jsonLd={jsonLd}
      />
      <div className="min-h-screen">
        <Navigation />
        <main id="main-content">
          <CaseStudies />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Cases;
