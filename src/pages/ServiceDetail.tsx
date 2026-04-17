import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowRight, CheckCircle, ChevronRight } from "@/assets/icons";
import { Button, Card, CardContent, HexPattern } from "@/design-system";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import ServiceProcess from "@/components/ServiceProcess";
import { getServiceBySlug } from "@/data/services";

// Asset servido direto de public/ — evita duplicacao no bundle.
const backgroundPattern = "/imgs/icons/hexagonal.webp";

const ServiceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const service = slug ? getServiceBySlug(slug) : undefined;

  if (!service) {
    return <Navigate to="/404" replace />;
  }

  const Icon = service.icon;
  const { detail } = service;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `https://elkys.com.br/servicos/${service.slug}#service`,
    name: service.title,
    description: service.description,
    provider: {
      "@id": "https://elkys.com.br/#organization",
    },
    areaServed: {
      "@type": "Country",
      name: "BR",
    },
    url: `https://elkys.com.br/servicos/${service.slug}`,
  };

  return (
    <>
      <SEO
        title={`${service.title} | Elkys`}
        description={service.description}
        canonical={`https://elkys.com.br/servicos/${service.slug}`}
        jsonLd={jsonLd}
      />
      <div className="min-h-screen">
        <Navigation />
        <main id="main-content">
          {/* Hero Section */}
          <section className="min-h-[60svh] flex items-center bg-gradient-hero dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
            {/* Decorative background spheres */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-20 left-10 w-24 h-24 sm:w-32 sm:h-32 bg-primary rounded-full blur-3xl animate-float" />
              <div
                className="absolute top-40 right-20 w-20 h-20 sm:w-24 sm:h-24 bg-accent rounded-full blur-2xl animate-float"
                style={{ animationDelay: "1s" }}
              />
              <div
                className="absolute bottom-20 left-1/3 w-32 h-32 sm:w-40 sm:h-40 bg-primary-light rounded-full blur-3xl animate-float"
                style={{ animationDelay: "2s" }}
              />
            </div>

            {/* Hexagonal pattern — fundo decorativo, nao e LCP */}
            <div className="absolute -bottom-[400px] xs:-bottom-[500px] sm:bottom-auto sm:top-[600px] md:top-[950px] lg:top-[900px] xl:top-[700px] 2xl:top-[600px] left-[30px] xs:left-[50px] sm:left-[80px] md:left-[100px] lg:left-[150px] xl:left-[200px] 2xl:left-[190px] scale-[1.75] xs:scale-[1.6] sm:scale-[1.25] md:scale-[1.6] lg:scale-[2] xl:scale-[0.8] 2xl:scale-[0.8] origin-bottom-left sm:origin-top-left">
              <img
                src={backgroundPattern}
                alt=""
                aria-hidden="true"
                width={1200}
                height={1200}
                loading="eager"
                className="h-auto opacity-30 sm:opacity-50 dark:opacity-[0.15] dark:sm:opacity-[0.25] w-[1600px] animate-diamond-rotate dark:brightness-150 dark:saturate-150 dark:hue-rotate-15"
                style={{ filter: "drop-shadow(0 0 40px hsl(var(--primary) / 0.3))" }}
              />
            </div>

            <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24 relative z-10">
              <div className="max-w-3xl">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="mb-6 animate-fade-in">
                  <ol className="flex items-center gap-2 text-sm text-white/60">
                    <li>
                      <Link to="/" className="hover:text-white transition-colors">
                        Início
                      </Link>
                    </li>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <li>
                      <Link to="/#services" className="hover:text-white transition-colors">
                        Serviços
                      </Link>
                    </li>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <li className="text-white font-medium">{service.title}</li>
                  </ol>
                </nav>

                <div className="text-white space-y-6 md:space-y-8">
                  <div className="space-y-4">
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-r ${service.gradient} flex items-center justify-center animate-fade-in`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight animate-fade-in">
                      {service.title}
                    </h1>
                    <p className="text-base md:text-lg text-white/80 leading-relaxed animate-slide-up">
                      {service.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Overview Section */}
          <section className="py-16 md:py-20 lg:py-24 bg-background">
            <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
                {/* Description */}
                <div className="space-y-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    Como <span className="text-primary">funciona</span>
                  </h2>
                  {detail.longDescription.map((paragraph, index) => (
                    <p key={index} className="text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Features */}
                <div className="space-y-6">
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                    O que entregamos
                  </h3>
                  <ul className="space-y-4">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-16 md:py-20 lg:py-24 bg-gradient-subtle">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Por que escolher a <span className="text-primary">Elkys</span>
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
                {detail.benefits.map((benefit, index) => (
                  <Card key={index} className="h-full hex-card-container">
                    <HexPattern variant="subtle" />
                    <CardContent className="p-6 space-y-3 relative z-10">
                      <h3 className="text-lg font-semibold text-foreground">{benefit.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Service Process Section */}
          <ServiceProcess serviceSlug={service.slug} />

          {/* Technologies Section */}
          <section className="py-16 md:py-20 lg:py-24 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Tecnologias e <span className="text-primary">ferramentas</span>
                </h2>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {detail.technologies.map((tech, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium border border-border"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Use Cases Section */}
          <section className="py-16 md:py-20 lg:py-24 bg-gradient-subtle">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Casos de <span className="text-primary">aplicação</span>
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {detail.useCases.map((useCase, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{useCase}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 md:py-20 lg:py-24">
            <div className="container mx-auto px-4">
              <div className="bg-gradient-primary rounded-xl md:rounded-2xl p-6 md:p-10 hex-card-container">
                <HexPattern variant="banner" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="text-center md:text-left text-white max-w-xl">
                    <p className="text-xl md:text-2xl font-semibold">
                      Pronto para transformar sua operação?
                    </p>
                    <p className="text-sm md:text-base mt-2 opacity-90">
                      Converse com nossa equipe técnica sobre como podemos ajudar com{" "}
                      {service.title.toLowerCase()}.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    variant="accent"
                    className="btn-primary-animate w-full md:w-auto min-h-[44px] shrink-0"
                    onClick={() => {
                      const contactForm = document.getElementById("contact-form");
                      if (contactForm) {
                        contactForm.scrollIntoView({ behavior: "smooth", block: "start" });
                      } else {
                        window.location.href = "/#contact-form";
                      }
                    }}
                    aria-label="Agendar diagnóstico técnico"
                  >
                    Agendar diagnóstico técnico
                    <ArrowRight className="ml-2 h-5 w-5 btn-arrow-animate" />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ServiceDetail;
