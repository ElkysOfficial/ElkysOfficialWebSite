import { ArrowUp, Mail, Phone, Linkedin, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const quickLinks = [
    { label: 'Início', href: '#home' },
    { label: 'Sobre', href: '#about' },
    { label: 'Serviços', href: '#services' },
    { label: 'Depoimentos', href: '#testimonials' },
    { label: 'Contato', href: '#contact' }
  ];

  const services = [
    'Desenvolvimento Web',
    'Aplicações Mobile',
    'Automação RPA',
    'Integrações',
    'Consultoria'
  ];

  const legal = [
    'Política de Privacidade',
    'Termos de Uso',
    'Cookies',
    'LGPD'
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img
                src="/imgs/icons/lettering_elys.png"
                alt="Elys"
                width={80}
                height={40}
                loading="lazy"
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Construímos software que transforma a maneira que você faz negócio. 
              Especialistas em desenvolvimento sob demanda para PMEs.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://linkedin.com/company/elys"
                className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Visite nosso perfil no LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/elys"
                className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Visite nosso perfil no Github"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="font-semibold text-white mb-4">Links Rápidos</p>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-primary-light transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <p className="font-semibold text-white mb-4">Serviços</p>
            <ul className="space-y-2">
              {services.map((service, index) => (
                <li key={index}>
                  <span className="text-sm text-gray-300">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="font-semibold text-white mb-4">Contato</p>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary-light" />
                <span className="text-sm text-gray-300">+55 (31) 9 9973-8235</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary-light" />
                <span className="text-sm text-gray-300">contato@elys.com.br</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-gray-400 text-center md:text-left">
              © 2024 Elys. Todos os direitos reservados.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-4">
              {legal.map((item, index) => (
                <a
                  key={index}
                  href="#"
                  className="text-xs text-gray-400 hover:text-primary-light transition-colors"
                  aria-label={`Acessar página de ${item}`}
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Back to Top */}
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToTop}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
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