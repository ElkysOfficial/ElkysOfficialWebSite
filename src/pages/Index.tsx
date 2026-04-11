import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import ClientsCarousel from "@/components/ClientsCarousel";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const ContactForm = lazy(() => import("@/components/ContactForm"));

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
      <div className="min-h-screen">
        <Navigation />
        <main id="main-content">
          <Hero />
          <About />
          <Services />
          <ClientsCarousel />
          <Testimonials />
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
