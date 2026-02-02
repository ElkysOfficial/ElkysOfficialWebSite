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
 * - Autoplay inteligente com pausa ao interagir
 * - Retomada automática após 2s de inatividade
 * - Largura de cards dinâmica baseada no viewport
 * - Setas de navegação (ocultas em mobile)
 * - Indicadores de posição (dots) para mobile
 * - Imagens otimizadas com srcset responsivo
 *
 * Controles:
 * - Setas: navegação manual (desktop) - pausa e retoma após 2s
 * - Swipe: deslize left/right (mobile) - pausa e retoma após 2s
 * - Dots: navegação direta por posição (mobile) - pausa e retoma após 2s
 * - Hover: pausa ao passar mouse, retoma após 2s ao sair
 * - Autoplay: avança automaticamente a cada 6s (lento e fluido)
 *
 * Performance:
 * - Largura responsiva: 280px (mobile), 300px (tablet), 320px (desktop)
 * - Loop infinito com duplicação de array para evitar gaps
 * - Imagens com lazy loading e múltiplos tamanhos (40w, 48w, 80w, 96w)
 */
const Testimonials = () => {
  /** Array de depoimentos - adicionar novos depoimentos aqui */
  const testimonialsData = [
    {
      name: "Guilherme Trindade Duarte",
      role: "CEO",
      company: "Aquele Bar",
      image: "/imgs/testimonials/guilhermeTrindade.png",
      rating: 5,
      quote:
        "Serviço de consultoria e extração de informações realizado com excelente profissionalismo. A entrega ocorreu antes do prazo e os dados vieram precisos, bem estruturados e fáceis de analisar.",
    },
    {
      name: "Lucas Alves",
      role: "Profissional Autônomo",
      company: "",
      image: "/imgs/testimonials/lucasAlves.png",
      rating: 5,
      quote:
        "Muito satisfeito com o serviço de consultoria e extração de dados. Todo o processo foi profissional, ágil e entregue antes do prazo, com resultados organizados que facilitaram minha análise.",
    },
    {
      name: "Ramiro Silva",
      role: "Fundador",
      company: "1UmPrintComunicação",
      image: "/imgs/testimonials/ramiroSilva.png",
      rating: 5,
      quote:
        "Desenvolvimento do site superou minhas expectativas. Layout moderno, funcional, responsivo e entregue em tempo recorde, com total entendimento da necessidade do cliente e experiência intuitiva.",
    },
    {
      name: "João Pedro Monteiro",
      role: "Profissional Autônomo",
      company: "",
      image: "/imgs/testimonials/joaoMonteiro.png",
      rating: 5,
      quote:
        "Empresa de primeira categoria em tecnologia. Acompanham desde a ideia até a entrega, com produtos fáceis de usar, alta qualidade, responsabilidade com prazos e foco total na experiência do cliente.",
    },
    {
      name: "Alexandre Silva",
      role: "Owner",
      company: "AK Produções",
      image: "/api/placeholder/64/64",
      rating: 5,
      quote:
        "A criação do site para nossa dubladora e gravadora ficou impecável. Design moderno, rápido e profissional, com ótima estrutura para apresentar nossos trabalhos e identidade artística. Excelente execução.",
    },
    {
      name: "Antonio Oliveira",
      role: "Advogado",
      company: "Escritório Antonio Oliveira",
      image: "/imgs/testimonials/antonioOliveira.webp",
      rating: 5,
      quote:
        "Site institucional moderno, claro e muito profissional. A entrega foi precisa, ágil e alinhada exatamente ao que eu precisava para meu escritório.",
    },
    {
      name: "Heliel Souza",
      role: "Owner",
      company: "PlansCoop",
      image: "/imgs/testimonials/helielSouza.png",
      rating: 5,
      quote:
        "O chat-bot de cotações ficou extremamente eficiente. Processo otimizado, respostas rápidas e uma solução clara e funcional que melhorou o atendimento e acelerou nossas cotações.",
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
  const resumeAutoplayTimeoutRef = useRef(null);
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
    setIsPaused(true);

    // Cancela qualquer autoplay agendado
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
    }
    if (resumeAutoplayTimeoutRef.current) {
      clearTimeout(resumeAutoplayTimeoutRef.current);
    }

    // Agenda retomada do autoplay após 2s
    resumeAutoplayTimeoutRef.current = setTimeout(() => setIsPaused(false), 2000);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTransitionEnabled(true);
    setCurrentIndex((prev) => prev - 1);
    setIsPaused(true);

    // Cancela qualquer autoplay agendado
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
    }
    if (resumeAutoplayTimeoutRef.current) {
      clearTimeout(resumeAutoplayTimeoutRef.current);
    }

    // Agenda retomada do autoplay após 2s
    resumeAutoplayTimeoutRef.current = setTimeout(() => setIsPaused(false), 2000);
  };

  const startAutoplay = React.useCallback(() => {
    autoplayTimeoutRef.current = setTimeout(() => {
      if (!isPaused && !isAnimating) {
        setIsAnimating(true);
        setTransitionEnabled(true);
        setCurrentIndex((prev) => prev + 1);
      }
    }, 6000); // Aumentado para 6s para transição mais lenta e fluida
  }, [isPaused, isAnimating]);

  const resetAutoplayTimer = React.useCallback(() => {
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
    }
    startAutoplay();
  }, [startAutoplay]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);

    // Cancela qualquer autoplay agendado
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
    }
    if (resumeAutoplayTimeoutRef.current) {
      clearTimeout(resumeAutoplayTimeoutRef.current);
    }
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

    // Limpa timeout anterior se existir
    if (resumeAutoplayTimeoutRef.current) {
      clearTimeout(resumeAutoplayTimeoutRef.current);
    }

    // Retoma autoplay após 2 segundos de inatividade
    resumeAutoplayTimeoutRef.current = setTimeout(() => setIsPaused(false), 2000);
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
      if (resumeAutoplayTimeoutRef.current) {
        clearTimeout(resumeAutoplayTimeoutRef.current);
      }
    };
  }, [startAutoplay]);

  useEffect(() => {
    if (!isAnimating && !isPaused) {
      startAutoplay();
    }
    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
      if (resumeAutoplayTimeoutRef.current) {
        clearTimeout(resumeAutoplayTimeoutRef.current);
      }
    };
  }, [isAnimating, isPaused, currentIndex, startAutoplay]);

  return (
    <section id="testimonials" className="py-16 md:py-20 lg:py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            O que nossos <span className="text-primary">clientes dizem</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A satisfação dos nossos clientes é nossa maior conquista. Veja alguns depoimentos de
            quem já transformou seu negócio conosco.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative flex gap-4 md:gap-6 justify-center items-center">
          <button
            onClick={handlePrev}
            disabled={isAnimating}
            className="hidden sm:flex rounded-full hover:bg-muted transition-all duration-150 p-2 z-10 min-h-[44px] min-w-[44px] items-center justify-center"
            aria-label="Anterior"
          >
            <img
              src={ArrowLeft}
              alt="Voltar"
              width={32}
              height={32}
              loading="lazy"
              className="w-8 h-8 md:w-10 md:h-10"
            />
          </button>

          <div
            ref={carouselRef}
            className="relative mb-8 md:mb-12 overflow-hidden w-full max-w-[280px] sm:max-w-[600px] md:max-w-[680px] lg:max-w-[800px]"
            onMouseEnter={() => {
              // Cancela qualquer autoplay agendado
              if (autoplayTimeoutRef.current) {
                clearTimeout(autoplayTimeoutRef.current);
              }
              if (resumeAutoplayTimeoutRef.current) {
                clearTimeout(resumeAutoplayTimeoutRef.current);
              }
              setIsPaused(true);
            }}
            onMouseLeave={() => {
              // Cancela qualquer timeout de retomada anterior
              if (resumeAutoplayTimeoutRef.current) {
                clearTimeout(resumeAutoplayTimeoutRef.current);
              }
              // Agenda retomada do autoplay após 2s
              resumeAutoplayTimeoutRef.current = setTimeout(() => setIsPaused(false), 2000);
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex gap-4 md:gap-6"
              style={{
                transform: `translateX(-${currentIndex * (itemWidth + (window.innerWidth < 640 ? 16 : window.innerWidth < 768 ? 16 : 24))}px)`,
                transition: transitionEnabled ? "transform 0.5s ease" : "none",
                willChange: "transform",
              }}
            >
              {extendedTestimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className="shadow-elegant hover:shadow-glow transition-all duration-300 group flex-shrink-0"
                  style={{ width: `${itemWidth}px` }}
                >
                  <CardContent className="p-5 md:p-6 space-y-4">
                    <div className="text-primary/50">
                      <Quote className="h-7 md:h-8 w-7 md:w-8" />
                    </div>

                    <div className="flex space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                      ))}
                    </div>

                    <p className="text-muted-foreground leading-relaxed text-sm min-h-[100px]">
                      "{testimonial.quote}"
                    </p>

                    <div className="flex items-center space-x-3 pt-4 border-t border-border">
                      {testimonial.image ? (
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          loading="lazy"
                          width={48}
                          height={48}
                          srcSet={`
                            ${testimonial.image}?w=40&h=40&q=80 40w,
                            ${testimonial.image}?w=48&h=48&q=80 48w,
                            ${testimonial.image}?w=80&h=80&q=80 80w,
                            ${testimonial.image}?w=96&h=96&q=80 96w
                          `}
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {testimonial.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground text-sm truncate">
                          {testimonial.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {testimonial.role}
                          {testimonial.company && ` • ${testimonial.company}`}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Mobile Navigation Indicators */}
            <div className="flex sm:hidden justify-center items-center gap-1.5 mt-4 px-4">
              {testimonialsData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAnimating(true);
                    setTransitionEnabled(true);
                    setCurrentIndex(index);
                    setIsPaused(true);

                    // Cancela qualquer autoplay agendado
                    if (autoplayTimeoutRef.current) {
                      clearTimeout(autoplayTimeoutRef.current);
                    }
                    if (resumeAutoplayTimeoutRef.current) {
                      clearTimeout(resumeAutoplayTimeoutRef.current);
                    }

                    // Agenda retomada do autoplay após 2s
                    resumeAutoplayTimeoutRef.current = setTimeout(() => setIsPaused(false), 2000);
                  }}
                  className="p-1.5 transition-all duration-300 ease-in-out"
                  aria-label={`Ir para depoimento ${index + 1}`}
                >
                  <span
                    className={`block rounded-full transition-all duration-300 ease-in-out ${
                      currentIndex % totalItems === index
                        ? "w-6 h-2 bg-primary scale-110"
                        : "w-2 h-2 bg-primary/30 hover:bg-primary/50 hover:scale-125"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={isAnimating}
            className="hidden sm:flex rounded-full hover:bg-muted transition-all duration-150 p-2 z-10 min-h-[44px] min-w-[44px] items-center justify-center"
            aria-label="Próximo"
          >
            <img
              src={ArrowRight}
              alt="Avançar"
              width={32}
              height={32}
              loading="lazy"
              className="w-8 h-8 md:w-10 md:h-10"
            />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
