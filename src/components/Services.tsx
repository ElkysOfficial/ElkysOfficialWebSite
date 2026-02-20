import { ArrowRight, Hexagon } from "@/assets/icons";
import { Card, CardContent, CardHeader, CardTitle, Button, HexPattern } from "@/design-system";
import { Link } from "react-router-dom";
import { services } from "@/data/services";

/**
 * Componente Services - Seção de serviços oferecidos
 *
 * Layout:
 * - Grid responsivo: 1 col mobile, 2 cols desktop
 * - Cards com altura uniforme usando flex-grow
 * - Cada card contém ícone, título, descrição e lista de features
 *
 * Features:
 * - 4 serviços principais com gradientes personalizados
 * - Animação de hover nos cards e ícones
 * - Botão "Saiba mais" com mínimo 44px (acessibilidade)
 */
const Services = () => {
  return (
    <section id="services" className="py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Cabeçalho da seção */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Nossos <span className="text-primary">Serviços</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Do diagnóstico à entrega em produção, cobrimos todo o ciclo de desenvolvimento com
            engenharia rigorosa, gestão transparente e compromisso com resultados mensuráveis.
          </p>
        </div>

        {/* Grid de serviços: 1 col mobile, 2 cols desktop */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
          {services.map((service, index) => (
            <Card key={index} className="relative overflow-hidden group flex flex-col h-full">
              <CardHeader className="pb-4 md:pb-6">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${service.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
                  >
                    <service.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg md:text-xl text-foreground group-hover:text-primary transition-colors duration-150">
                    {service.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex flex-col flex-grow pt-0">
                <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                <ul className="space-y-2 flex-grow">
                  {service.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center space-x-2 text-sm text-muted-foreground"
                    >
                      <Hexagon className="h-2 w-2 text-primary fill-primary/20 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={`/servicos/${service.slug}`}
                  className="relative mt-auto min-h-[44px] flex items-center justify-between px-4 rounded-md overflow-hidden bg-muted text-muted-foreground group-hover:bg-gradient-primary group-hover:text-white transition-all duration-300"
                  aria-label={`Saiba mais sobre ${service.title}`}
                >
                  <HexPattern variant="inline" />
                  <span className="relative z-10 text-sm font-medium">Saiba mais</span>
                  <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-8 md:mt-12">
          <div className="bg-gradient-primary rounded-xl md:rounded-2xl p-6 md:p-10 hex-card-container">
            <HexPattern variant="banner" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="text-center md:text-left text-white max-w-xl">
                <p className="text-xl md:text-2xl font-semibold">
                  Seu próximo projeto merece engenharia de verdade
                </p>
                <p className="text-sm md:text-base mt-2 opacity-90">
                  Da arquitetura à entrega em produção, com processo, transparência e compromisso
                  técnico.
                </p>
              </div>
              <Button
                size="lg"
                variant="accent"
                className="btn-primary-animate w-full md:w-auto min-h-[44px] shrink-0"
                onClick={() => {
                  const contactForm = document.getElementById("contact-form");
                  contactForm?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                aria-label="Agendar diagnóstico técnico - ir para formulário de contato"
              >
                Agendar diagnóstico técnico
                <ArrowRight className="ml-2 h-5 w-5 btn-arrow-animate" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
