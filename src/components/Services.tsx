import { Code, Cog, Network, Wrench, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        "Criamos software personalizado que atende exatamente às necessidades do seu negócio.",
      features: [
        "Aplicações web e mobile",
        "Sistemas de gestão empresarial",
        "E-commerce e marketplaces",
        "Dashboards e relatórios",
      ],
      gradient: "from-primary to-primary-light",
    },
    {
      icon: Cog,
      title: "Automação e RPA",
      description:
        "Automatizamos processos repetitivos para aumentar eficiência e reduzir custos operacionais.",
      features: [
        "Automação de processos",
        "Integração de sistemas",
        "Fluxos de trabalho digitais",
        "Bots e assistentes virtuais",
      ],
      gradient: "from-accent to-accent-light",
    },
    {
      icon: Network,
      title: "Integrações de Sistemas",
      description: "Conectamos seus sistemas existentes para uma operação mais fluida e integrada.",
      features: [
        "APIs e microserviços",
        "Integração com ERPs",
        "Sincronização de dados",
        "Middlewares personalizados",
      ],
      gradient: "from-primary-dark to-primary",
    },
    {
      icon: Wrench,
      title: "Consultoria e CI/CD",
      description: "Oferecemos consultoria especializada em arquitetura de software e DevOps.",
      features: [
        "Arquitetura de software",
        "Code review e auditoria",
        "Implementação de CI/CD",
        "Otimização de performance",
      ],
      gradient: "from-purple-600 to-primary-light",
    },
  ];

  return (
    <section id="services" className="py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Cabeçalho da seção */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Nossos <span className="text-primary">Serviços</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Oferecemos soluções completas em tecnologia, desde o desenvolvimento até a consultoria
            especializada, sempre focados no crescimento do seu negócio.
          </p>
        </div>

        {/* Grid de serviços: 1 col mobile, 2 cols desktop */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
          {services.map((service, index) => (
            <Card
              key={index}
              className="relative overflow-hidden group flex flex-col h-full"
            >
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
          <div className="bg-gradient-primary rounded-xl md:rounded-2xl p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left text-white max-w-xl">
                <p className="text-xl md:text-2xl font-semibold">
                  Tecnologia que trabalha pelo seu negócio
                </p>
                <p className="text-sm md:text-base mt-2 opacity-90">
                  Simplificamos o dia a dia da sua empresa com soluções práticas e fáceis de usar.
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
                aria-label="Solicitar orçamento - ir para formulário de contato"
              >
                Solicitar orçamento
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
