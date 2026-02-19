import { Code, Cog, Network, Wrench, ArrowRight } from "@/assets/icons";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/design-system";
import hexagonalBg from "../../public/imgs/icons/hexagonal.webp";

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
  /**
   * Array de serviços
   * Cada serviço deve ter: icon, title, description, features (array), gradient
   */
  const services = [
    {
      icon: Code,
      title: "Desenvolvimento Sob Demanda",
      description:
        "Projetamos e desenvolvemos aplicações sob medida, com arquitetura definida para performance, segurança e manutenibilidade a longo prazo.",
      features: [
        "Aplicações web e mobile com arquitetura escalável",
        "Sistemas de gestão e operações empresariais",
        "Plataformas de e-commerce e marketplaces",
        "Dashboards analíticos e relatórios executivos",
      ],
      gradient: "from-accent to-accent-light",
    },
    {
      icon: Cog,
      title: "Automação e RPA",
      description:
        "Eliminamos gargalos operacionais com automações que reduzem custo, erro humano e tempo de execução em processos críticos.",
      features: [
        "Automação de processos de negócio (BPA)",
        "Integração entre sistemas legados e modernos",
        "Fluxos de trabalho automatizados com monitoramento",
        "Bots e assistentes para atendimento e operações",
      ],
      gradient: "from-accent to-accent-light",
    },
    {
      icon: Network,
      title: "Integrações de Sistemas",
      description:
        "Conectamos sistemas, APIs e plataformas para criar um ecossistema operacional unificado e confiável.",
      features: [
        "APIs RESTful e microserviços",
        "Integração com ERPs, CRMs e plataformas fiscais",
        "Sincronização de dados em tempo real",
        "Middlewares customizados com alta disponibilidade",
      ],
      gradient: "from-accent to-accent-light",
    },
    {
      icon: Wrench,
      title: "Consultoria Técnica e DevOps",
      description:
        "Avaliamos sua infraestrutura e processos de desenvolvimento para identificar riscos, gargalos e oportunidades de melhoria técnica.",
      features: [
        "Auditoria de arquitetura e código-fonte",
        "Implementação de pipelines CI/CD",
        "Code review e práticas de qualidade",
        "Otimização de performance e custos de infraestrutura",
      ],
      gradient: "from-accent to-accent-light",
    },
  ];

  return (
    <section id="services" className="py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Cabeçalho da seção */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Capacidades <span className="text-primary">Técnicas</span>
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
                      <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="ghost"
                  className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-150 mt-auto min-h-[44px]"
                  aria-label={`Saiba mais sobre ${service.title}`}
                >
                  Saiba mais
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-8 md:mt-12">
          <div className="bg-gradient-primary rounded-xl md:rounded-2xl p-6 md:p-10 hex-card-container">
            <img
              src={hexagonalBg}
              alt=""
              aria-hidden="true"
              className="hex-card-bg -right-10 -bottom-10 w-40 h-40 md:w-48 md:h-48 opacity-[0.08] animate-hex-spin will-change-transform"
            />
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
