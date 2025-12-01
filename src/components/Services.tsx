import { Code, Cog, Network, Wrench, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Services = () => {
  const services = [
    {
      icon: Code,
      title: 'Desenvolvimento Sob Demanda',
      description: 'Criamos software personalizado que atende exatamente às necessidades do seu negócio.',
      features: [
        'Aplicações web e mobile',
        'Sistemas de gestão empresarial',
        'E-commerce e marketplaces',
        'Dashboards e relatórios'
      ],
      gradient: 'from-primary to-primary-light'
    },
    {
      icon: Cog,
      title: 'Automação e RPA',
      description: 'Automatizamos processos repetitivos para aumentar eficiência e reduzir custos operacionais.',
      features: [
        'Automação de processos',
        'Integração de sistemas',
        'Fluxos de trabalho digitais',
        'Bots e assistentes virtuais'
      ],
      gradient: 'from-accent to-orange-400'
    },
    {
      icon: Network,
      title: 'Integrações de Sistemas',
      description: 'Conectamos seus sistemas existentes para uma operação mais fluida e integrada.',
      features: [
        'APIs e microserviços',
        'Integração com ERPs',
        'Sincronização de dados',
        'Middlewares personalizados'
      ],
      gradient: 'from-primary-dark to-primary'
    },
    {
      icon: Wrench,
      title: 'Consultoria e CI/CD',
      description: 'Oferecemos consultoria especializada em arquitetura de software e DevOps.',
      features: [
        'Arquitetura de software',
        'Code review e auditoria',
        'Implementação de CI/CD',
        'Otimização de performance'
      ],
      gradient: 'from-purple-600 to-primary-light'
    }
  ];

  return (
    <section id="services" className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 md:mb-4">
            Nossos <span className="text-primary">Serviços</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
            Oferecemos soluções completas em tecnologia, desde o desenvolvimento até a consultoria especializada, sempre focados no crescimento do seu negócio.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-12">
          {services.map((service, index) => (
            <Card key={index} className="relative overflow-hidden shadow-elegant hover:shadow-glow transition-all group flex flex-col h-full">
              <CardHeader className="pb-3 sm:pb-4 md:pb-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r ${service.gradient} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <service.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl text-foreground group-hover:text-primary transition-colors">
                    {service.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 flex flex-col flex-grow pt-0">
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  {service.description}
                </p>
                <ul className="space-y-1.5 sm:space-y-2 flex-grow">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="ghost"
                  className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-all mt-auto text-xs sm:text-sm min-h-[44px]"
                  aria-label={`Saiba mais sobre ${service.title}`}
                >
                  Saiba mais
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-primary rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white">
            <p className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">
              Pronto para transformar seu negócio?
            </p>
            <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 opacity-90 max-w-2xl mx-auto">
              Entre em contato conosco e descubra como podemos ajudar sua empresa a crescer com tecnologia.
            </p>
            <Button
              size="lg"
              variant="accent"
              className="btn-primary-animate btn-breathe w-full sm:w-auto text-sm sm:text-base min-h-[44px]"
              onClick={() => {
                const contactForm = document.getElementById('contact-form');
                contactForm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              aria-label="Solicitar orçamento - ir para formulário de contato"
            >
              Solicitar Orçamento
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 btn-arrow-animate" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;