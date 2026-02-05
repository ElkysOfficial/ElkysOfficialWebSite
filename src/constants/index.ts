/**
 * @fileoverview Constantes globais da aplicação ELKYS
 * @description Centraliza todas as constantes, configurações e dados estáticos
 * utilizados em toda a aplicação para facilitar manutenção e consistência.
 */

/* ============================================================================
   INFORMAÇÕES DA EMPRESA
   ============================================================================ */

/**
 * Dados da empresa ELKYS
 * @description Informações de contato e identificação da marca
 */
export const COMPANY = {
  /** Nome oficial da empresa */
  name: "ELKYS",
  /** Nome completo/legal */
  legalName: "ELKYS Software",
  /** Slogan principal */
  slogan: "Construímos software que transforma a maneira que você faz negócio",
  /** Ano de fundação */
  foundedYear: 2022,
  /** Localização */
  location: {
    city: "Belo Horizonte",
    state: "MG",
    country: "Brasil",
  },
} as const;

/**
 * Informações de contato
 */
export const CONTACT = {
  /** Telefone para WhatsApp */
  phone: "+55 (31) 9 9738-2935",
  /** Telefone formatado para links */
  phoneLink: "553197382935",
  /** E-mail principal */
  email: "contato@elkys.com.br",
  /** Link do WhatsApp */
  whatsappUrl: "https://wa.me/553197382935",
} as const;

/**
 * Redes sociais
 */
export const SOCIAL_LINKS = {
  linkedin: "https://linkedin.com/company/elkys",
  github: "https://github.com/elkys",
  instagram: "https://instagram.com/elkys_.oficial",
} as const;

/**
 * Horário de funcionamento
 */
export const BUSINESS_HOURS = {
  weekdays: "8h às 18h",
  saturday: "8h às 12h",
  sunday: "Fechado",
  emergencySupport: "24/7",
} as const;

/* ============================================================================
   SEO E META TAGS
   ============================================================================ */

/**
 * Configurações de SEO
 * @description Constantes para otimização de mecanismos de busca
 */
export const SEO = {
  /** URL base do site */
  baseUrl: "https://elkys.com.br",
  /** Título padrão para SEO */
  defaultTitle: "ELKYS | Desenvolvimento de Software Sob Demanda para PMEs",
  /** Descrição padrão */
  defaultDescription:
    "ELKYS - Especialistas em desenvolvimento de software sob demanda. Criamos aplicações web, mobile, automação RPA e integrações para PMEs.",
  /** Imagem Open Graph */
  ogImage: "https://elkys.com.br/og-image.jpg",
  /** Imagem Twitter Card */
  twitterImage: "https://elkys.com.br/twitter-card.jpg",
  /** Locale */
  locale: "pt_BR",
  /** Palavras-chave */
  keywords: [
    "ELKYS",
    "desenvolvimento de software",
    "software sob demanda",
    "PME",
    "aplicações web",
    "mobile",
    "RPA",
    "automação",
    "Belo Horizonte",
    "Brasil",
  ],
} as const;

/* ============================================================================
   MÉTRICAS E ESTATÍSTICAS
   ============================================================================ */

/**
 * Estatísticas da empresa
 * @description Números para exibição no site (atualizar conforme crescimento)
 */
export const STATS = {
  /** Projetos entregues */
  projectsDelivered: "20+",
  /** Taxa de satisfação */
  satisfactionRate: "98%",
  /** Anos de experiência */
  yearsExperience: "2+",
  /** Clientes ativos */
  activeClients: "20+",
} as const;

/* ============================================================================
   NAVEGAÇÃO
   ============================================================================ */

/**
 * Links do menu de navegação principal
 */
export const NAV_LINKS = [
  { label: "Início", href: "#hero" },
  { label: "Sobre", href: "#about" },
  { label: "Serviços", href: "#services" },
  { label: "Contato", href: "#contact" },
] as const;

/**
 * Links rápidos do footer
 */
export const QUICK_LINKS = [
  { label: "Início", href: "#hero" },
  { label: "Sobre", href: "#about" },
  { label: "Serviços", href: "#services" },
  { label: "Depoimentos", href: "#testimonials" },
  { label: "Contato", href: "#contact" },
] as const;

/**
 * Links legais
 */
export const LEGAL_LINKS = [
  { label: "Política de Privacidade", href: "/privacy-policy" },
  { label: "Termos de Uso", href: "/terms-of-service" },
  { label: "Cookies", href: "/cookie-policy" },
] as const;

/* ============================================================================
   SERVIÇOS
   ============================================================================ */

/**
 * Lista de serviços oferecidos
 */
export const SERVICES = [
  "Desenvolvimento Web",
  "Aplicações Mobile",
  "Automação RPA",
  "Integrações",
  "Consultoria",
] as const;

/* ============================================================================
   ANIMAÇÕES E UI
   ============================================================================ */

/**
 * Durações de animação (em ms)
 * @description Valores padronizados para transições consistentes
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800,
} as const;

/**
 * Breakpoints responsivos (em px)
 * @description Alinhados com Tailwind CSS
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1400,
} as const;
