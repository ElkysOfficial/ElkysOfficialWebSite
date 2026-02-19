import { useState, useRef, useCallback } from "react";
import { ArrowRight, ExternalLink, Play, Globe, Cog, FileText, Building2 } from "lucide-react";
import { Button, Card, CardContent } from "@/design-system";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import backgroundPattern from "../../public/imgs/icons/hexagonal.webp";

/**
 * Cases Page - Portfolio de Projetos ELKYS
 *
 * Features:
 * - Hero section matching homepage style
 * - Project cards with lazy-loaded video previews
 * - Real projects with outcome-focused descriptions
 * - Mobile-friendly: tap to toggle video preview
 */

type ProjectType = "SaaS" | "Landing Page" | "Site Institucional" | "Automação";

interface Project {
  id: string;
  name: string;
  type: ProjectType;
  description: string;
  url?: string;
  posterImage: string;
  previewVideo?: string;
  client?: string;
  featured?: boolean;
}

// Real ELKYS projects
const projects: Project[] = [
  {
    id: "sonnar",
    name: "Sonnar",
    type: "SaaS",
    description:
      "Produto SaaS próprio de busca inteligente de vagas. Monitora oportunidades 24/7, otimiza currículos para ATS, analisa compatibilidade com vagas e recomenda capacitações para evolução profissional.",
    url: "https://sonnarjobs.com.br",
    posterImage: "/imgs/cases/sonnar-poster.webp",
    previewVideo: "/videos/cases/sonnar-preview.mp4",
    featured: true,
  },
  {
    id: "elkut",
    name: "Elkut",
    type: "SaaS",
    description:
      "Produto SaaS próprio para otimização de corte industrial. Algoritmos proprietários que maximizam o aproveitamento de chapas e reduzem desperdícios em até 30%, impactando diretamente o custo operacional.",
    url: "https://elkut.com.br",
    posterImage: "/imgs/cases/elkut-poster.webp",
    previewVideo: "/videos/cases/elkut-preview.mp4",
    featured: true,
  },
  {
    id: "1um-print",
    name: "1Um Print Comunicação",
    type: "Landing Page",
    description:
      "Landing page para empresa de personalizados com foco em conversão. Estrutura estratégica que destaca o portfólio, facilita o contato comercial e gera demanda qualificada.",
    url: "https://1umprintcomunicacao.com.br",
    posterImage: "/imgs/cases/1umprint-poster.webp",
    previewVideo: "/videos/cases/1umprint-preview.mp4",
    client: "Ramiro Silva",
  },
  {
    id: "ak-producoes",
    name: "AK Produções",
    type: "Site Institucional",
    description:
      "Site institucional para gravadora, dubladora e produtora audiovisual. Estrutura que comunica profissionalismo, apresenta o portfólio de trabalhos e facilita a captação de novos projetos.",
    url: "https://akproducoes.com.br",
    posterImage: "/imgs/cases/akproducoes-poster.webp",
    previewVideo: "/videos/cases/akproducoes-preview.mp4",
    client: "Alexandre Silva",
  },
  {
    id: "jose-pedro-adv",
    name: "José Pedro Advogados",
    type: "Site Institucional",
    description:
      "Site institucional para escritório de advocacia. Estrutura clara e profissional que reforça credibilidade, apresenta áreas de atuação e facilita o primeiro contato com potenciais clientes.",
    url: "https://josepedroadv.com.br",
    posterImage: "/imgs/cases/josepedroadv-poster.webp",
    previewVideo: "/videos/cases/josepedroadv-preview.mp4",
    client: "José Pedro",
  },
  {
    id: "cartorios-brasil",
    name: "Mapeamento Nacional de Cartórios",
    type: "Automação",
    description:
      "Automação de extração e organização de dados de todos os cartórios do Brasil. Processo que levaria meses foi concluído em horas, com precisão total e dados estruturados para análise.",
    posterImage: "/imgs/cases/cartorios-poster.webp",
    client: "Lucas Alves",
  },
];

// Type badge configuration
const typeConfig: Record<ProjectType, { icon: React.ElementType; color: string }> = {
  SaaS: { icon: Globe, color: "bg-accent-soft text-accent dark:bg-accent/20" },
  "Landing Page": { icon: FileText, color: "bg-primary-soft text-primary dark:bg-primary/20" },
  "Site Institucional": {
    icon: Building2,
    color: "bg-secondary/10 text-secondary dark:bg-secondary/20",
  },
  Automação: { icon: Cog, color: "bg-accent-soft text-accent dark:bg-accent/20" },
};

/**
 * ProjectCard Component
 *
 * Displays project with lazy-loaded video preview on interaction.
 * - Desktop: hover to play video
 * - Mobile: tap to toggle video, second tap for external link
 */
interface ProjectCardProps {
  project: Project;
  featured?: boolean;
}

const ProjectCard = ({ project, featured = false }: ProjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isMobileTapped, setIsMobileTapped] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const TypeIcon = typeConfig[project.type].icon;

  // Handle mouse enter - desktop only
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  // Handle mouse leave - desktop only
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  // Handle touch for mobile devices
  const handleTouch = useCallback(
    (e: React.TouchEvent) => {
      if (!project.previewVideo) return;

      if (!isMobileTapped) {
        e.preventDefault();
        setIsMobileTapped(true);
        setIsHovered(true);
      }
      // Second tap will naturally follow the link
    },
    [isMobileTapped, project.previewVideo]
  );

  // Reset mobile tap state when clicking outside
  const handleClickOutside = useCallback(() => {
    if (isMobileTapped) {
      setIsMobileTapped(false);
      setIsHovered(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isMobileTapped]);

  // Play video when loaded and hovered
  const handleVideoLoaded = useCallback(() => {
    setVideoLoaded(true);
    if (isHovered && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked, ignore error
      });
    }
  }, [isHovered]);

  // Start playing when hover state changes
  const shouldPlayVideo = isHovered && project.previewVideo;

  return (
    <Card
      ref={cardRef}
      className={`group overflow-hidden flex flex-col h-full ${featured ? "lg:col-span-1" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouch}
      onBlur={handleClickOutside}
    >
      {/* Media Container */}
      <div className="relative aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {/* Poster Image - always rendered */}
        <img
          src={project.posterImage}
          alt={`${project.name} - ${project.type}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            shouldPlayVideo && videoLoaded ? "opacity-0" : "opacity-100"
          }`}
          loading="lazy"
        />

        {/* Lazy-loaded Video - only rendered when hovered */}
        {shouldPlayVideo && project.previewVideo && (
          <video
            ref={videoRef}
            src={project.previewVideo}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              videoLoaded ? "opacity-100" : "opacity-0"
            }`}
            muted
            loop
            playsInline
            onLoadedData={handleVideoLoaded}
            autoPlay
          />
        )}

        {/* Play indicator for videos - ciano */}
        {project.previewVideo && !isHovered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 dark:bg-slate-900/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <Play className="w-5 h-5 text-accent ml-0.5" />
            </div>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${typeConfig[project.type].color}`}
          >
            <TypeIcon className="w-3.5 h-3.5" />
            {project.type}
          </span>
        </div>

        {/* External link overlay on hover */}
        {project.url && isHovered && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 p-2 rounded-lg bg-white/90 dark:bg-slate-900/90 shadow-md hover:bg-white dark:hover:bg-slate-800 transition-colors duration-150"
            aria-label={`Visitar ${project.name}`}
          >
            <ExternalLink className="w-4 h-4 text-foreground" />
          </a>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-5 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-150">
            {project.name}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mt-3 flex-grow">
          {project.description}
        </p>

        {/* Client attribution */}
        {project.client && (
          <p className="text-xs text-muted-foreground mt-3">
            Cliente: <span className="font-medium">{project.client}</span>
          </p>
        )}

        {/* CTA Link - always at bottom */}
        {project.url ? (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors duration-150 mt-4"
          >
            Visitar projeto
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <div className="mt-4 h-5" /> /* Spacer for cards without URL */
        )}
      </CardContent>
    </Card>
  );
};

const Cases = () => {
  const featuredProjects = projects.filter((p) => p.featured);
  const otherProjects = projects.filter((p) => !p.featured);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://elkys.com.br/cases#webpage",
    url: "https://elkys.com.br/cases",
    name: "Cases de Sucesso - ELKYS",
    description:
      "Conheça os projetos desenvolvidos pela ELKYS: produtos SaaS próprios, sites institucionais, landing pages e automações em produção.",
    isPartOf: {
      "@id": "https://elkys.com.br/#website",
    },
    about: {
      "@id": "https://elkys.com.br/#organization",
    },
    inLanguage: "pt-BR",
  };

  return (
    <>
      <SEO
        title="Portfólio - ELKYS | Projetos e Produtos em Produção"
        description="Conheça os projetos e produtos desenvolvidos pela ELKYS: sistemas SaaS próprios, sites institucionais, landing pages e automações. Entregas reais em operação."
        canonical="https://elkys.com.br/cases"
        jsonLd={jsonLd}
      />
      <div className="min-h-screen">
        <Navigation />
        <main id="main-content">
          {/* Hero Section - Matching Homepage Style */}
          <section
            id="cases-hero"
            className="min-h-[70vh] flex items-center bg-gradient-hero dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden"
          >
            {/* Decorative background spheres */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-20 left-10 w-24 h-24 sm:w-32 sm:h-32 bg-primary rounded-full blur-3xl animate-float will-change-transform" />
              <div
                className="absolute top-40 right-20 w-20 h-20 sm:w-24 sm:h-24 bg-accent rounded-full blur-2xl animate-float will-change-transform"
                style={{ animationDelay: "1s" }}
              />
              <div
                className="absolute bottom-20 left-1/3 w-32 h-32 sm:w-40 sm:h-40 bg-primary-light rounded-full blur-3xl animate-float will-change-transform"
                style={{ animationDelay: "2s" }}
              />
            </div>

            {/* Hexagonal pattern - same as homepage */}
            <div className="absolute -bottom-[400px] xs:-bottom-[500px] sm:bottom-auto sm:top-[600px] md:top-[950px] lg:top-[900px] xl:top-[700px] 2xl:top-[600px] left-[30px] xs:left-[50px] sm:left-[80px] md:left-[100px] lg:left-[150px] xl:left-[200px] 2xl:left-[190px] scale-[1.75] xs:scale-[1.6] sm:scale-[1.25] md:scale-[1.6] lg:scale-[2] xl:scale-[0.8] 2xl:scale-[0.8] origin-bottom-left sm:origin-top-left">
              <img
                src={backgroundPattern}
                alt=""
                aria-hidden="true"
                width={1200}
                height={1200}
                loading="eager"
                {...{ fetchpriority: "high" }}
                className="h-auto opacity-30 sm:opacity-50 dark:opacity-[0.15] dark:sm:opacity-[0.25] w-[1600px] animate-diamond-rotate dark:brightness-150 dark:saturate-150 dark:hue-rotate-15 will-change-transform"
                style={{ filter: "drop-shadow(0 0 40px rgba(168, 85, 247, 0.3))" }}
              />
            </div>

            <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24 relative z-10">
              <div className="max-w-3xl">
                <div className="text-white space-y-6 md:space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight animate-fade-in">
                      Projetos e Soluções que{" "}
                      <span className="text-accent">Impulsionam Negócios</span>
                    </h1>
                    <p className="text-base md:text-lg text-gray-200 leading-relaxed animate-slide-up">
                      Soluções digitais personalizadas para empresas que já superaram ferramentas
                      genéricas e precisam de tecnologia alinhada à sua realidade operacional.
                    </p>
                  </div>

                  {/* Stats row */}
                  <div
                    className="flex flex-wrap gap-6 md:gap-8 pt-4 animate-fade-in"
                    style={{ animationDelay: "0.4s" }}
                  >
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-accent">20+</div>
                      <div className="text-xs md:text-sm text-gray-300/80 mt-1">
                        Projetos em produção
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-accent">4</div>
                      <div className="text-xs md:text-sm text-gray-300/80 mt-1">
                        Tipos de solução
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-accent">98%</div>
                      <div className="text-xs md:text-sm text-gray-300/80 mt-1">
                        Retenção de clientes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Projects */}
          <section className="py-16 md:py-20 lg:py-24 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  Projetos em <span className="text-primary">Destaque</span>
                </h2>
                <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Nossa atuação vai do entendimento do problema à evolução contínua da solução,
                  garantindo que a tecnologia acompanhe o crescimento do negócio.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-16">
                {featuredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} featured />
                ))}
              </div>

              {/* Other Projects */}
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-6 md:mb-8">
                Outros Projetos
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {otherProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-12 md:py-16">
            <div className="container mx-auto px-4">
              <div className="bg-gradient-primary rounded-xl md:rounded-2xl p-6 md:p-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left text-white max-w-xl">
                    <p className="text-xl md:text-2xl font-semibold">
                      Seu projeto pode ser o próximo
                    </p>
                    <p className="text-sm md:text-base mt-2 opacity-90">
                      Converse com nossa equipe técnica sobre os desafios do seu negócio.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    variant="accent"
                    className="btn-primary-animate w-full md:w-auto min-h-[44px] shrink-0"
                    onClick={() => window.open("https://wa.me/553197382935", "_blank")}
                    aria-label="Iniciar conversa no WhatsApp"
                  >
                    Iniciar conversa
                    <ArrowRight className="ml-2 h-5 w-5 btn-arrow-animate" />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Cases;
