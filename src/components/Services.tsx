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
    <section id="services" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nossos <span className="text-primary">Serviços</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Oferecemos soluções completas em tecnologia, desde o desenvolvimento até a consultoria especializada, sempre focados no crescimento do seu negócio.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {services.map((service, index) => (
            <Card key={index} className="relative overflow-hidden shadow-elegant hover:shadow-glow transition-all group">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${service.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <service.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">
                    {service.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  Saiba mais
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-primary rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Pronto para transformar seu negócio?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Entre em contato conosco e descubra como podemos ajudar sua empresa a crescer com tecnologia.
            </p>
            <Button size="lg" variant="accent">
              Solicitar Orçamento
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;