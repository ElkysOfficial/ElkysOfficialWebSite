import { ArrowRight, Code2, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import backgroundPattern from "../../public/imgs/icons/hexagonal.webp";

const Hero = () => {
  return (
    <section
      id="hero"
      className="min-h-screen flex items-center bg-gradient-hero dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden"
    >
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

      <img
        src={backgroundPattern}
        alt="Background"
        width={1000}
        height={1000}
        loading="eager"
        fetchPriority="high"
        className="absolute inset-0 object-cover opacity-30 sm:opacity-50 dark:opacity-[0.15] dark:sm:opacity-[0.25] top-[500px] sm:top-[700px] left-[50px] sm:left-[100px] w-[600px] sm:w-[1000px] animate-diamond-rotate dark:brightness-150 dark:saturate-150 dark:hue-rotate-15 will-change-transform"
        style={{ filter: "drop-shadow(0 0 40px rgba(168, 85, 247, 0.3))" }}
      />

      <div className="container mx-auto px-4 py-16 sm:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
          <div className="text-white space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight animate-fade-in">
                Construímos software que <span className="text-accent">transforma</span> a maneira que você
                faz negócio
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 leading-relaxed animate-slide-up">
                Desenvolvemos soluções sob demanda para PMEs, com entregas ágeis, código limpo e arquitetura
                escalável que cresce com seu negócio.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button
                size="lg"
                variant="accent"
                className="btn-primary-animate btn-breathe border-white text-white hover:text-white w-full sm:w-auto text-sm sm:text-base"
                onClick={() => window.open("https://wa.me/5531997382935", "_blank")}
                aria-label="Fale com um especialista no WhatsApp"
              >
                Fale com um especialista
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 btn-arrow-animate" />
              </Button>
              <Link to="/cases" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="btn-secondary-animate bg-white border-white text-primary hover:text-primary hover:bg-white/90 w-full text-sm sm:text-base"
                >
                  Ver nossos cases
                </Button>
              </Link>
            </div>

            <div
              className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6 md:gap-8 pt-4 sm:pt-6 md:pt-8 animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="text-center p-2 sm:p-0">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-accent">20+</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-gray-300 mt-1">Projetos entregues</div>
              </div>
              <div className="text-center p-2 sm:p-0">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-accent">98%</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-gray-300 mt-1">Satisfação do cliente</div>
              </div>
              <div className="text-center p-2 sm:p-0 col-span-2 sm:col-span-1">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-accent">2+</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-gray-300 mt-1">Anos de experiência</div>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in hidden lg:block" style={{ animationDelay: "0.6s" }}>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg border border-transparent hover-lift animate-card-pulse">
                  <Code2 className="h-6 w-6 sm:h-8 sm:w-8 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm sm:text-base">Clean Code</p>
                    <p className="text-gray-300 text-xs sm:text-sm">Código limpo e documentado</p>
                  </div>
                </div>
                <div
                  className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg border border-transparent hover-lift animate-card-pulse"
                  style={{ animationDelay: "1s" }}
                >
                  <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm sm:text-base">Entregas Ágeis</p>
                    <p className="text-gray-300 text-xs sm:text-sm">Metodologia ágil e entregas rápidas</p>
                  </div>
                </div>
                <div
                  className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg border border-transparent hover-lift animate-card-pulse"
                  style={{ animationDelay: "2s" }}
                >
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm sm:text-base">Suporte Contínuo</p>
                    <p className="text-gray-300 text-xs sm:text-sm">Acompanhamento pós-entrega</p>
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
