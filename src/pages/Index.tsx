import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import SEO from "@/components/SEO";

// Tudo abaixo da dobra e lazy. Hero ocupa 100svh, entao About em diante
// nao esta visivel na primeira renderizacao. Placeholders com altura minima
// reservada evitam CLS quando o componente carrega (o conteudo acima da
// dobra nao se move, so o espaco abaixo se expande para o tamanho real).
const About = lazy(() => import("@/components/About"));
const Services = lazy(() => import("@/components/Services"));
const ClientsCarousel = lazy(() => import("@/components/ClientsCarousel"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const ContactForm = lazy(() => import("@/components/ContactForm"));
const Contact = lazy(() => import("@/components/Contact"));
const Footer = lazy(() => import("@/components/Footer"));

/** Placeholder com altura reservada conservadora (menor que o real) para
 * evitar empurrar conteudo acima ao hidratar a secao. */
const SectionSkeleton = ({ minH }: { minH: string }) => (
  <div aria-hidden="true" style={{ minHeight: minH }} />
);

const Index = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://elkys.com.br/#webpage",
    url: "https://elkys.com.br/",
    name: "Elkys",
    isPartOf: {
      "@id": "https://elkys.com.br/#website",
    },
    about: {
      "@id": "https://elkys.com.br/#organization",
    },
    description:
      "Engenharia de software sob demanda para empresas em crescimento. Arquitetura escalável, código limpo e gestão transparente do projeto.",
    inLanguage: "pt-BR",
  };

  return (
    <>
      <SEO
        title="Elkys | Soluções Inteligentes em Software & Automação B2B"
        description="Especialistas em desenvolvimento de software sob demanda. Engenharia de dados e automação B2B de alta performance. Aplicações web, mobile, RPA e integrações empresariais em Belo Horizonte."
        canonical="https://elkys.com.br/"
        jsonLd={jsonLd}
      />
      <div className="min-h-[100svh]">
        <Navigation />
        <main id="main-content">
          <Hero />
          <Suspense fallback={<SectionSkeleton minH="400px" />}>
            <About />
          </Suspense>
          <Suspense fallback={<SectionSkeleton minH="600px" />}>
            <Services />
          </Suspense>
          <Suspense fallback={<SectionSkeleton minH="200px" />}>
            <ClientsCarousel />
          </Suspense>
          <Suspense fallback={<SectionSkeleton minH="500px" />}>
            <Testimonials />
          </Suspense>
          <Suspense fallback={<SectionSkeleton minH="400px" />}>
            <ContactForm />
          </Suspense>
          <Suspense fallback={<SectionSkeleton minH="300px" />}>
            <Contact />
          </Suspense>
        </main>
        <Suspense fallback={<SectionSkeleton minH="200px" />}>
          <Footer />
        </Suspense>
      </div>
    </>
  );
};

export default Index;
