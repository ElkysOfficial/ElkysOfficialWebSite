import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Testimonials from "@/components/Testimonials";
import ClientsCarousel from "@/components/ClientsCarousel";
import ContactForm from "@/components/ContactForm";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const Index = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://elkys.com.br/#webpage",
    url: "https://elkys.com.br/",
    name: "Elkys - Software Sob Medida para Empresas em Crescimento",
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
        title="ELKYS | Software Sob Medida para Empresas em Crescimento"
        description="Engenharia de software sob demanda para empresas em crescimento. Arquitetura escalável, código limpo e gestão transparente do projeto."
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
          <ContactForm />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
