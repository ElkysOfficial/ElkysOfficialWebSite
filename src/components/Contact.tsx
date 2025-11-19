import { Phone, Mail, Linkedin, Github, Clock, Instagram } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Contact = () => {
  const contactInfo = [
    {
      icon: Phone,
      title: 'Telefone',
      value: '+55 (31) 9 9973-8235',
      subtitle: 'Seg - Sex: 8h às 18h'
    },
    {
      icon: Mail,
      title: 'E-mail',
      value: 'contato@elys.com.br',
      subtitle: 'Resposta em até 1h'
    }
  ];

  const socialLinks = [
    {
      icon: Linkedin,
      name: 'LinkedIn',
      url: 'https://linkedin.com/company/elys',
      color: 'hover:text-blue-600'
    },
    {
      icon: Github,
      name: 'GitHub',
      url: 'https://github.com/elys',
      color: 'hover:text-gray-800'
    },
    {
      icon: Instagram,
      name: 'Instagram',
      url: 'https://instagram.com/elys_.oficial',
      color: 'hover:text-red-600'
    },


  ];

  return (
    <section id="contact" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Entre em <span className="text-primary">contato</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Estamos prontos para ajudar sua empresa a crescer. Entre em contato e vamos conversar sobre seu próximo projeto.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <Card key={index} className="shadow-elegant hover:shadow-glow transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <info.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">{info.title}</p>
                        <p className="text-primary font-medium">{info.value}</p>
                        <p className="text-sm text-muted-foreground mt-1">{info.subtitle}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Siga-nos nas redes sociais
              </h3>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-12 h-12 bg-white border border-border rounded-lg flex items-center justify-center transition-all hover:shadow-md ${social.color}`}
                    aria-label={`Visite nosso perfil no ${social.name}`}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Business Hours */}
            
          </div>

          {/* Map Placeholder */}
          <div className="space-y-6">
            {/* Quick Contact Card */}
            <Card className="shadow-elegant">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-2">Horário de Atendimento</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Segunda a Sexta: 8h às 18h</div>
                      <div>Sábado: 8h às 12h</div>
                      <div>Domingo: Fechado</div>
                    </div>
                    <p className="text-xs text-primary mt-2 font-medium">
                      Atendimento de emergência disponível 24/7
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-elegant bg-gradient-primary text-white">
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-xl font-bold">Precisa de ajuda urgente?</p>
                <p className="opacity-90">
                  Nossa equipe está disponível para atendimento de emergência 24 horas por dia, 7 dias por semana.
                </p>
                <div className="pt-2">
                  <a
                    href="tel:+5531999738235"
                    className="inline-flex items-center space-x-2 bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    aria-label="Ligar agora para atendimento de emergência"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Ligar Agora</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;