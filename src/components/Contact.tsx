import { Phone, Mail, Linkedin, Github, Clock, Instagram } from "@/assets/icons";
import { Card, CardContent, Button, HexPattern } from "@/design-system";

const Contact = () => {
  const contactInfo = [
    {
      icon: Phone,
      title: "Telefone",
      value: "+55 (31) 9 9973-8235",
      subtitle: "Seg-Sex: 8h-18h | Sáb: 8h-12h",
    },
    {
      icon: Mail,
      title: "E-mail",
      value: "contato@elkys.com.br",
      subtitle: "Resposta: até 2h úteis",
    },
  ];

  const socialLinks = [
    {
      icon: Linkedin,
      name: "LinkedIn",
      url: "https://linkedin.com/company/elkys",
      color: "hover:text-blue-600 dark:hover:text-blue-400",
    },
    {
      icon: Github,
      name: "GitHub",
      url: "https://github.com/elkys",
      color: "hover:text-foreground dark:hover:text-primary",
    },
    {
      icon: Instagram,
      name: "Instagram",
      url: "https://instagram.com/elkys_.oficial",
      color: "hover:text-red-600 dark:hover:text-red-400",
    },
  ];

  return (
    <section id="contact" className="py-16 md:py-20 lg:py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Canais de <span className="text-primary">Atendimento</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Fale diretamente com nossa equipe técnica. Sem intermediários, sem filas, atendimento
            direto com quem entende do seu projeto.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
          <div className="space-y-8">
            <div className="space-y-6">
              {contactInfo.map((info) => (
                <Card
                  key={info.title}
                  className="shadow-elegant hover:shadow-glow transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-accent to-accent-light rounded-lg flex items-center justify-center flex-shrink-0">
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

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Acompanhe a Elkys</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-12 h-12 min-h-[44px] min-w-[44px] bg-card border border-border rounded-lg flex items-center justify-center transition-all duration-150 hover:shadow-md ${social.color}`}
                    aria-label={`Visite nosso perfil no ${social.name}`}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-accent to-accent-light rounded-lg flex items-center justify-center flex-shrink-0">
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
            <Card className="shadow-elegant bg-gradient-primary text-white hex-card-container">
              <HexPattern variant="card" />
              <CardContent className="p-6 text-center space-y-4 relative z-10">
                <p className="text-lg md:text-xl font-bold">Suporte Prioritário</p>
                <p className="opacity-90">
                  Para clientes com projetos em produção, canal de suporte técnico com atendimento
                  estendido.
                </p>
                <div className="pt-2">
                  <Button
                    variant="accent"
                    size="default"
                    className="min-h-[44px]"
                    onClick={() => (window.location.href = "tel:+5531999738235")}
                    aria-label="Falar com suporte técnico prioritário"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Falar com Suporte
                  </Button>
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
