import React, { useState, useEffect, useRef } from "react";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ArrowLeft from "../../public/imgs/images/chevron-compact-left.svg";
import ArrowRight from "../../public/imgs/images/chevron-compact-right.svg";

/**
 * Componente Testimonials - Carrossel de depoimentos de clientes
 *
 * Features:
 * - Carrossel infinito com loop seamless
 * - Suporte a touch/swipe em dispositivos móveis
 * - Autoplay com pausa ao interagir
 * - Largura de cards dinâmica baseada no viewport
 * - Setas de navegação (ocultas em mobile)
 * - Indicadores de posição (dots) para mobile
 *
 * Controles:
 * - Setas: navegação manual (desktop)
 * - Swipe: deslize left/right (mobile)
 * - Dots: navegação direta por posição (mobile)
 * - Autoplay: avança automaticamente a cada 5s
 *
 * Performance:
 * - Largura responsiva: 280px (mobile), 300px (tablet), 320px (desktop)
 * - Loop infinito com duplicação de array para evitar gaps
 */
const Testimonials = () => {
  /** Array de depoimentos - adicionar novos depoimentos aqui */
  const testimonialsData = [
    {
      name: "Carlos Silva",
      role: "CEO",
      company: "TechFlow Solutions",
      image: "/api/placeholder/64/64",
      rating: 5,
      quote:
        "A Elys transformou nossa operação completamente. O sistema que desenvolveram automatizou 80% dos nossos processos manuais, resultando em uma economia de 40% no tempo de operação.",
    },
    {
      name: "Ana Costa",
      role: "Diretora de TI",
      company: "InnovaCorp",
      image: "/api/placeholder/64/64",
      rating: 5,
      quote:
        "Profissionalismo excepcional e entrega no prazo. A equipe da Elys entendeu perfeitamente nossas necessidades e entregou uma solução que superou nossas expectativas.",
    },
    {
      name: "Roberto Oliveira",
      role: "Fundador",
      company: "StartupXYZ",
      image: "/api/placeholder/64/64",
      rating: 5,
      quote:
        "Como startup, precisávamos de um parceiro que entendesse nossas limitações orçamentárias sem comprometer a qualidade. A Elys foi exatamente isso - qualidade premium com custo justo.",
    },
    {
      name: "Marina Santos",
      role: "Gerente de Operações",
      company: "LogisticaPro",
      image: "/api/placeholder/64/64",
      rating: 5,
      quote:
        "O suporte pós-entrega é impressionante. Qualquer dúvida ou ajuste necessário é resolvido rapidamente. É como ter uma equipe de TI interna dedicada.",
    },
    {
      name: "Felipe Rocha",
      role: "CTO",
      company: "FinanceFlow",
      image: "/api/placeholder/64/64",
      rating: 5,
      quote:
        "A arquitetura do sistema é sólida e escalável. Conseguimos crescer 300% no último ano sem problemas de performance. Código limpo e bem documentado.",
    },
  ];

  // Estados do carrossel
  const [itemWidth, setItemWidth] = useState(320); // Largura dinâmica dos cards
  const totalItems = testimonialsData.length;
  const extendedTestimonials = [...testimonialsData, ...testimonialsData]; // Array duplicado para loop infinito

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false); // Pausa do autoplay

  // Estados para controle de touch/swipe
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Refs para controle de timeouts e referência do DOM
  const animationTimeoutRef = useRef(null);
  const autoplayTimeoutRef = useRef(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Atualiza largura dos cards baseado no viewport
  useEffect(() => {
    const updateItemWidth = () => {
      if (window.innerWidth < 640) {
        setItemWidth(280); // Mobile
      } else if (window.innerWidth < 768) {
        setItemWidth(300); // Tablet
      } else {
        setItemWidth(320); // Desktop
      }
    };

    updateItemWidth();
    window.addEventListener("resize", updateItemWidth);
    return () => window.removeEventListener("resize", updateItemWidth);
  }, []);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTransitionEnabled(true);
    setCurrentIndex((prev) => prev + 1);
    resetAutoplayTimer();
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTransitionEnabled(true);
    setCurrentIndex((prev) => prev - 1);
    resetAutoplayTimer();
  };

  const resetAutoplayTimer = () => {
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
    }
    if (!isPaused) {
      startAutoplay();
    }
  };

  const startAutoplay = () => {
    autoplayTimeoutRef.current = setTimeout(() => {
      if (!isPaused && !isAnimating) {
        setIsAnimating(true);
        setTransitionEnabled(true);
        setCurrentIndex((prev) => prev + 1);
      }
    }, 4000);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }

    setTouchStart(0);
    setTouchEnd(0);
    setIsPaused(false);
  };

  useEffect(() => {
    if (!isAnimating) return;

    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);

      if (currentIndex >= totalItems) {
        setTransitionEnabled(false);
        setCurrentIndex(0);
      } else if (currentIndex < 0) {
        setTransitionEnabled(false);
        setCurrentIndex(totalItems - 1);
      }
    }, 500);

    return () => clearTimeout(animationTimeoutRef.current);
  }, [currentIndex, isAnimating, totalItems]);

  useEffect(() => {
    if (!transitionEnabled) {
      const timer = setTimeout(() => setTransitionEnabled(true), 20);
      return () => clearTimeout(timer);
    }
  }, [transitionEnabled]);

  useEffect(() => {
    startAutoplay();
    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAnimating && !isPaused) {
      startAutoplay();
    }
    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
    };
  }, [isAnimating, isPaused, currentIndex]);

  return (
    <section id="testimonials" className="py-12 sm:py-16 md:py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-14 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            O que nossos <span className="text-primary">clientes dizem</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
            A satisfação dos nossos clientes é nossa maior conquista. Veja alguns depoimentos de
            quem já transformou seu negócio conosco.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative flex gap-2 sm:gap-4 md:gap-6 justify-center items-center">
          <button
            onClick={handlePrev}
            disabled={isAnimating}
            className="hidden sm:flex rounded-full hover:bg-[#0000002f] transition-all p-1.5 sm:p-2 z-10"
            aria-label="Anterior"
          >
            <img
              src={ArrowLeft}
              alt="Voltar"
              width={32}
              height={32}
              loading="lazy"
              className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
            />
          </button>

          <div
            ref={carouselRef}
            className="relative mb-8 sm:mb-10 md:mb-12 overflow-hidden w-full max-w-[280px] sm:max-w-[600px] md:max-w-[680px] lg:max-w-[800px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex gap-3 sm:gap-4 md:gap-6 lg:gap-8"
              style={{
                transform: `translateX(-${currentIndex * (itemWidth + (window.innerWidth < 640 ? 12 : window.innerWidth < 768 ? 16 : 32))}px)`,
                transition: transitionEnabled ? "transform 0.5s ease" : "none",
                willChange: "transform",
              }}
            >
              {extendedTestimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className="shadow-elegant hover:shadow-glow transition-all group flex-shrink-0"
                  style={{ width: `${itemWidth}px` }}
                >
                  <CardContent className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                    <div className="text-primary opacity-50">
                      <Quote className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                    </div>

                    <div className="flex space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-accent text-accent"
                        />
                      ))}
                    </div>

                    <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm min-h-[80px] sm:min-h-[100px]">
                      "{testimonial.quote}"
                    </p>

                    <div className="flex items-center space-x-2 sm:space-x-3 pt-3 sm:pt-4 border-t border-border">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-xs sm:text-sm">
                          {testimonial.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground text-xs sm:text-sm truncate">
                          {testimonial.name}
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {testimonial.role} • {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Mobile Navigation Indicators */}
            <div className="flex sm:hidden justify-center gap-2 mt-6">
              {testimonialsData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAnimating(true);
                    setTransitionEnabled(true);
                    setCurrentIndex(index);
                    resetAutoplayTimer();
                  }}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2"
                  aria-label={`Ir para depoimento ${index + 1}`}
                >
                  <span
                    className={`h-2 rounded-full transition-all ${
                      currentIndex % totalItems === index ? "w-8 bg-primary" : "w-2 bg-primary/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={isAnimating}
            className="hidden sm:flex rounded-full hover:bg-[#0000002f] transition-all p-1.5 sm:p-2 z-10"
            aria-label="Próximo"
          >
            <img
              src={ArrowRight}
              alt="Avançar"
              width={32}
              height={32}
              loading="lazy"
              className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
            />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center mt-12 md:mt-16">
          <div className="p-4">
            <div className="text-2xl sm:text-3xl md:text-3xl font-bold text-primary mb-1 sm:mb-2">
              98%
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Taxa de Satisfação</div>
          </div>
          <div className="p-4">
            <div className="text-2xl sm:text-3xl md:text-3xl font-bold text-primary mb-1 sm:mb-2">
              20+
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Projetos Entregues</div>
          </div>
          <div className="p-4">
            <div className="text-2xl sm:text-3xl md:text-3xl font-bold text-primary mb-1 sm:mb-2">
              20+
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Clientes Ativos</div>
          </div>
          <div className="p-4">
            <div className="text-2xl sm:text-3xl md:text-3xl font-bold text-primary mb-1 sm:mb-2">
              2+
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Anos de Experiência</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
