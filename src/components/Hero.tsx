import { ArrowRight, Code2, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import backgroundPattern from "../../public/imgs/icons/hexagonal.webp";

/**
 * Componente Hero - Seção principal da homepage
 *
 * Features:
 * - Headline com proposta de valor
 * - CTAs para WhatsApp e página de cases
 * - Estatísticas de destaque (projetos, satisfação, experiência)
 * - Cards de features (visível apenas em desktop)
 * - Background animado com esferas e padrão hexagonal
 *
 * Performance:
 * - Imagem de fundo com loading="eager" e fetchPriority="high" (acima da dobra)
 * - will-change-transform para otimização de GPU
 * - Animações desabilitadas em mobile (<768px) via CSS
 */
const Hero = () => {
  return (
    <section
      id="hero"
      className="min-h-screen flex items-center bg-gradient-hero dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden"
    >
      {/* Esferas decorativas de fundo com animação float */}
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

      {/* Padrão hexagonal rotacionando - carregamento prioritário */}
      {/* Wrapper controla posição e escala, img controla animação */}
      <div className="absolute -bottom-[400px] xs:-bottom-[500px] sm:bottom-auto sm:top-[600px] md:top-[950px] lg:top-[900px] xl:top-[700px] 2xl:top-[700px] left-[30px] xs:left-[50px] sm:left-[80px] md:left-[100px] lg:left-[150px] xl:left-[200px] 2xl:left-[200px] scale-[1.75] xs:scale-[1.6] sm:scale-[1.25] md:scale-[1.6] lg:scale-200 xl:scale-100 2xl:scale-90 origin-bottom-left sm:origin-top-left">
        <img
          src={backgroundPattern}
          alt="Background"
          width={1200}
          height={1200}
          loading="eager"
          fetchPriority="high"
          className="h-auto opacity-30 sm:opacity-50 dark:opacity-[0.15] dark:sm:opacity-[0.25] w-[1600px] animate-diamond-rotate dark:brightness-150 dark:saturate-150 dark:hue-rotate-15 will-change-transform"
          style={{ filter: "drop-shadow(0 0 40px rgba(168, 85, 247, 0.3))" }}
        />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24 relative z-10">
        {/* Grid: 1 col mobile, 2 cols desktop (>1024px) */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Coluna esquerda: Conteúdo principal */}
          <div className="text-white space-y-6 md:space-y-8">
            {/* Headline e subtítulo */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight animate-fade-in">
                Construímos software que <span className="text-accent">transforma</span> a maneira
                que você faz negócio
              </h1>
              <p className="text-base md:text-lg text-gray-200 leading-relaxed animate-slide-up">
                Desenvolvemos soluções sob demanda para PMEs, com entregas ágeis, código limpo e
                arquitetura escalável que cresce com seu negócio.
              </p>
            </div>

            {/* Botões CTA: coluna em mobile, linha em desktop */}
            <div
              className="flex flex-col sm:flex-row gap-4 animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Button
                size="lg"
                variant="accent"
                className="btn-primary-animate w-full sm:w-auto min-h-[44px]"
                onClick={() => window.open("https://wa.me/553197382935", "_blank")}
                aria-label="Fale com um especialista no WhatsApp"
              >
                Fale com um especialista
                <ArrowRight className="ml-2 h-5 w-5 btn-arrow-animate" />
              </Button>
              <Link to="/cases" className="w-full sm:w-auto">
                <Button size="lg" variant="hero_outline" className="btn-secondary-animate w-full">
                  Ver nossos cases
                </Button>
              </Link>
            </div>

            {/* Estatísticas: grid 2 colunas mobile, flex horizontal desktop */}
            <div
              className="grid grid-cols-2 sm:flex sm:flex-wrap gap-6 md:gap-8 pt-6 md:pt-8 animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-accent">20+</div>
                <div className="text-xs md:text-sm text-gray-300/80 mt-1">Projetos entregues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-accent">98%</div>
                <div className="text-xs md:text-sm text-gray-300/80 mt-1">
                  Satisfação do cliente
                </div>
              </div>
              <div className="text-center col-span-2 sm:col-span-1">
                <div className="text-2xl md:text-3xl font-bold text-accent">2+</div>
                <div className="text-xs md:text-sm text-gray-300/80 mt-1">Anos de experiência</div>
              </div>
            </div>
          </div>

          {/* Coluna direita: Feature cards - oculto em mobile e tablet */}
          <div
            className="relative animate-fade-in hidden lg:block"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="space-y-6">
                {/* Feature 1: Clean Code */}
                <div className="flex items-center space-x-4 p-4 rounded-lg border border-transparent animate-card-pulse">
                  <Code2 className="h-8 w-8 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Clean Code</p>
                    <p className="text-gray-300 text-sm">Código limpo e documentado</p>
                  </div>
                </div>
                {/* Feature 2: Entregas Ágeis */}
                <div
                  className="flex items-center space-x-4 p-4 rounded-lg border border-transparent animate-card-pulse"
                  style={{ animationDelay: "1s" }}
                >
                  <Zap className="h-8 w-8 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Entregas Ágeis</p>
                    <p className="text-gray-300 text-sm">Metodologia ágil e entregas rápidas</p>
                  </div>
                </div>
                {/* Feature 3: Suporte Contínuo */}
                <div
                  className="flex items-center space-x-4 p-4 rounded-lg border border-transparent animate-card-pulse"
                  style={{ animationDelay: "2s" }}
                >
                  <Shield className="h-8 w-8 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Suporte Contínuo</p>
                    <p className="text-gray-300 text-sm">Acompanhamento pós-entrega</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
