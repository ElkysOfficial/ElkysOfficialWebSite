import { ArrowUp, Mail, Phone, Linkedin, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const quickLinks = [
    { label: "Início", href: "#hero" },
    { label: "Sobre", href: "#about" },
    { label: "Serviços", href: "#services" },
    { label: "Depoimentos", href: "#testimonials" },
    { label: "Contato", href: "#contact" },
  ];

  const services = [
    "Desenvolvimento Web",
    "Aplicações Mobile",
    "Automação RPA",
    "Integrações",
    "Consultoria",
  ];

  const legal = [
    { label: "Política de Privacidade", href: "/privacy-policy" },
    { label: "Termos de Uso", href: "/terms-of-service" },
    { label: "Cookies", href: "/cookie-policy" },
  ];

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-card text-card-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-12">
          <div className="space-y-4">
            <div className="flex items-center">
              <img
                src="/imgs/icons/lettering_elys.webp"
                alt="elys"
                width={80}
                height={40}
                loading="lazy"
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm opacity-80 leading-relaxed">
              Construímos software que transforma a maneira que você faz negócio. Especialistas em
              desenvolvimento sob demanda para PMEs.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://linkedin.com/company/elys"
                className="w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Visite nosso perfil no LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/elys"
                className="w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Visite nosso perfil no Github"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="font-semibold mb-4">Links Rápidos</p>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    className="text-sm opacity-80 hover:text-primary hover:opacity-100 transition-all"
                    href={link.href}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-4">Serviços</p>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service}>
                  <span className="text-sm opacity-80">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-4">Contato</p>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm opacity-80">+55 (31) 9 9973-8235</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm opacity-80">contato@elystech.com.br</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm opacity-70 text-center md:text-left">
              © 2024 elys. Todos os direitos reservados.
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {legal.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-xs opacity-70 hover:text-primary hover:opacity-100 transition-all"
                  aria-label={`Acessar página de ${item.label}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToTop}
              className="opacity-70 hover:opacity-100 hover:bg-muted"
              aria-label="Voltar ao topo da página"
            >
              <ArrowUp className="h-4 w-4 mr-1" />
              Topo
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
