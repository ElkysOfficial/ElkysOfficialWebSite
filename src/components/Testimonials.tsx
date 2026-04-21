import React, { useState, useEffect, useRef, memo } from "react";
import { Star, Quote } from "@/assets/icons";
import { Card, CardContent } from "@/design-system";
import ArrowLeft from "../../public/imgs/images/chevron-compact-left.svg";
import ArrowRight from "../../public/imgs/images/chevron-compact-right.svg";

/**
 * Carrossel de depoimentos.
 *
 * Performance (mobile):
 * - Largura dos cards e step do translateX vivem em CSS var --tw, trocada
 *   por media query (sem listener de resize, sem layout thrashing).
 * - Autoplay pausa via IntersectionObserver enquanto a secao esta fora do
 *   viewport (mobile fica muito tempo no Hero antes de scrollar ate aqui).
 * - TestimonialCard memoizado: o tick do autoplay so re-renderiza o wrapper
 *   que move o transform, nao os 14 cards.
 * - willChange: transform aplicado so durante a transicao (evita layer GPU
 *   permanente).
 */

type Testimonial = {
  name: string;
  role: string;
  company: string;
  image: string;
  rating: number;
  quote: string;
};

const testimonialsData: Testimonial[] = [
  {
    name: "Guilherme Trindade Duarte",
    role: "CEO",
    company: "Aquele Bar",
    image: "/imgs/testimonials/guilhermeTrindade.webp",
    rating: 5,
    quote:
      "Serviço de consultoria e extração de informações realizado com excelente profissionalismo. A entrega ocorreu antes do prazo e os dados vieram precisos, bem estruturados e fáceis de analisar.",
  },
  {
    name: "Lucas Alves",
    role: "Profissional Autônomo",
    company: "",
    image: "/imgs/testimonials/lucasAlves.webp",
    rating: 5,
    quote:
      "Muito satisfeito com o serviço de consultoria e extração de dados. Todo o processo foi profissional, ágil e entregue antes do prazo, com resultados organizados que facilitaram minha análise.",
  },
  {
    name: "Ramiro Silva",
    role: "Fundador",
    company: "1UmPrintComunicação",
    image: "/imgs/testimonials/ramiroSilva.webp",
    rating: 5,
    quote:
      "Desenvolvimento do site superou minhas expectativas. Layout moderno, funcional, responsivo e entregue em tempo recorde, com total entendimento da necessidade do cliente e experiência intuitiva.",
  },
  {
    name: "João Pedro Monteiro",
    role: "Profissional Autônomo",
    company: "",
    image: "/imgs/testimonials/joaoMonteiro.webp",
    rating: 5,
    quote:
      "Empresa de primeira categoria em tecnologia. Acompanham desde a ideia até a entrega, com produtos fáceis de usar, alta qualidade, responsabilidade com prazos e foco total na experiência do cliente.",
  },
  {
    name: "Alexandre Silva",
    role: "Proprietário",
    company: "AK Produções",
    image: "",
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
    role: "Proprietário",
    company: "PlansCoop",
    image: "/imgs/testimonials/helielSouza.webp",
    rating: 5,
    quote:
      "O chat-bot de cotações ficou extremamente eficiente. Processo otimizado, respostas rápidas e uma solução clara e funcional que melhorou o atendimento e acelerou nossas cotações.",
  },
];

const TestimonialCard = memo(({ testimonial }: { testimonial: Testimonial }) => (
  // Largura via CSS var --tw, trocada por media query no wrapper. Sem style
  // inline = props estaveis, memo evita re-render no tick do autoplay.
  // transition-shadow (nao transition-all): unico delta visual no hover.
  <Card className="shadow-elegant hover:shadow-glow transition-shadow duration-300 group flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px]">
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
            decoding="async"
            width={48}
            height={48}
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
          <div className="font-semibold text-foreground text-sm truncate">{testimonial.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {testimonial.role}
            {testimonial.company && ` • ${testimonial.company}`}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
));
TestimonialCard.displayName = "TestimonialCard";

const Testimonials = () => {
  const totalItems = testimonialsData.length;
  const extendedTestimonials = [...testimonialsData, ...testimonialsData];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  // Autoplay so dispara enquanto a secao esta visivel. Em mobile o usuario
  // costuma ficar varios segundos no Hero antes de scrollar; sem isto o
  // autoplay rodava 5+ vezes durante esse periodo, cada tick custando
  // re-render do carrossel.
  const [isVisible, setIsVisible] = useState(false);

  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeAutoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = sectionRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTransitionEnabled(true);
    setCurrentIndex((prev) => prev + 1);
    setIsPaused(true);

    if (autoplayTimeoutRef.current) clearTimeout(autoplayTimeoutRef.current);
    if (resumeAutoplayTimeoutRef.current) clearTimeout(resumeAutoplayTimeoutRef.current);

    resumeAutoplayTimeoutRef.current = setTimeout(() => setIsPaused(false), 2000);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTransitionEnabled(true);
    setCurrentIndex((prev) => prev - 1);
    setIsPaused(true);

    if (autoplayTimeoutRef.current) clearTimeout(autoplayTimeoutRef.current);
    if (resumeAutoplayTimeoutRef.current) clearTimeout(resumeAutoplayTimeoutRef.current);

    resumeAutoplayTimeoutRef.current = setTimeout(() => setIsPaused(false), 2000);
  };

  const startAutoplay = React.useCallback(() => {
    autoplayTimeoutRef.current = setTimeout(() => {
      if (!isPaused && !isAnimating && isVisible) {
        setIsAnimating(true);
        setTransitionEnabled(true);
        setCurrentIndex((prev) => prev + 1);
      }
    }, 6000);
  }, [isPaused, isAnimating, isVisible]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);

    if (autoplayTimeoutRef.current) clearTimeout(autoplayTimeoutRef.current);
    if (resumeAutoplayTimeoutRef.current) clearTimeout(resumeAutoplayTimeoutRef.current);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();

    setTouchStart(0);
    setTouchEnd(0);

    if (resumeAutoplayTimeoutRef.current) clearTimeout(resumeAutoplayTimeoutRef.current);
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

    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, [currentIndex, isAnimating, totalItems]);

  useEffect(() => {
    if (!transitionEnabled) {
      const timer = setTimeout(() => setTransitionEnabled(true), 20);
      return () => clearTimeout(timer);
    }
  }, [transitionEnabled]);

  useEffect(() => {
    if (!isAnimating && !isPaused && isVisible) {
      startAutoplay();
    }
    return () => {
      if (autoplayTimeoutRef.current) clearTimeout(autoplayTimeoutRef.current);
      if (resumeAutoplayTimeoutRef.current) clearTimeout(resumeAutoplayTimeoutRef.current);
    };
  }, [isAnimating, isPaused, isVisible, currentIndex, startAutoplay]);

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="py-16 md:py-20 lg:py-24 bg-gradient-subtle"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Resultados que nossos <span className="text-primary">clientes confirmam</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Cada projeto entregue reforça nossa reputação. Veja o que dizem os profissionais e
            empresas que confiaram na Elkys para suas demandas técnicas.
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

          {/* --tw = card width + gap por breakpoint. Mobile: 280+16=296,
              sm: 300+16=316, md: 320+24=344. Substitui o resize listener
              por CSS puro (zero forced reflow). */}
          <div
            ref={carouselRef}
            className="relative mb-8 md:mb-12 overflow-hidden w-full max-w-[280px] sm:max-w-[600px] md:max-w-[680px] lg:max-w-[800px] py-2 [--tw:296px] sm:[--tw:316px] md:[--tw:344px]"
            onMouseEnter={() => {
              if (autoplayTimeoutRef.current) clearTimeout(autoplayTimeoutRef.current);
              if (resumeAutoplayTimeoutRef.current) clearTimeout(resumeAutoplayTimeoutRef.current);
              setIsPaused(true);
            }}
            onMouseLeave={() => {
              if (resumeAutoplayTimeoutRef.current) clearTimeout(resumeAutoplayTimeoutRef.current);
              resumeAutoplayTimeoutRef.current = setTimeout(() => setIsPaused(false), 2000);
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex gap-4 md:gap-6"
              style={{
                transform: `translateX(calc(var(--tw) * -${currentIndex}))`,
                transition: transitionEnabled ? "transform 0.5s ease" : "none",
                willChange: isAnimating ? "transform" : "auto",
              }}
            >
              {extendedTestimonials.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} />
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

                    if (autoplayTimeoutRef.current) clearTimeout(autoplayTimeoutRef.current);
                    if (resumeAutoplayTimeoutRef.current)
                      clearTimeout(resumeAutoplayTimeoutRef.current);

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
