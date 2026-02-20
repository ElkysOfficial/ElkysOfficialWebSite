import { ArrowUp, Mail, Phone, Linkedin, Github } from "@/assets/icons";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/design-system";
import { services as serviceData } from "@/data/services";

const Footer = () => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const isDarkTheme = mounted && resolvedTheme === "dark";

  const quickLinks = [
    { label: "Início", href: "#hero" },
    { label: "Sobre", href: "#about" },
    { label: "Serviços", href: "#services" },
    { label: "Depoimentos", href: "#testimonials" },
    { label: "Contato", href: "#contact" },
  ];

  const footerServices = [
    ...serviceData.map((s) => ({ label: s.title, href: `/servicos/${s.slug}` })),
    { label: "Suporte Técnico", href: null },
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 md:mb-12">
          <div className="space-y-4">
            <div className="flex items-center">
              <img
                src={
                  isDarkTheme
                    ? "/imgs/icons/lettering_elkys.webp"
                    : "/imgs/icons/lettering_elkys_purple.webp"
                }
                alt="elkys"
                width={80}
                height={40}
                loading="lazy"
                className="h-10 w-auto transition-all duration-300"
              />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Engenharia de software sob demanda com processo, qualidade e previsibilidade. Parceiro
              técnico para empresas que exigem confiabilidade.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://linkedin.com/company/elkys"
                className="w-10 h-10 bg-muted rounded-full flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
                aria-label="Visite nosso perfil no LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/elkys"
                className="w-10 h-10 bg-muted rounded-full flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
                aria-label="Visite nosso perfil no Github"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <p className="font-semibold mb-4">Links Rápidos</p>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
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
              {footerServices.map((service) => (
                <li key={service.label}>
                  {service.href ? (
                    <Link
                      to={service.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
                    >
                      {service.label}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">{service.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-4">Contato</p>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted-foreground">+55 (31) 9 9973-8235</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted-foreground">contato@elkys.com.br</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground text-center md:text-left">
              © 2025 elkys. Todos os direitos reservados.
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {legal.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors duration-150"
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
              className="text-muted-foreground hover:text-foreground hover:bg-muted min-h-[44px]"
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
