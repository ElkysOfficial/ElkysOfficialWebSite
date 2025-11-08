import React, { useState, useEffect, useRef } from "react";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ArrowLeft from "../../public/imgs/images/chevron-compact-left.svg";
import ArrowRight from "../../public/imgs/images/chevron-compact-right.svg";

const Testimonials = () => {
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

  const itemWidth = 320;
  const totalItems = testimonialsData.length;
  const extendedTestimonials = [...testimonialsData, ...testimonialsData];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const animationTimeoutRef = useRef(null);
  const autoplayTimeoutRef = useRef(null);

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
    <section id="testimonials" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            O que nossos <span className="text-primary">clientes dizem</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A satisfação dos nossos clientes é nossa maior conquista. Veja alguns depoimentos de quem já transformou seu negócio conosco.
          </p>
        </div>

        {/* Carousel */}
        <div className="flex gap-6 justify-center items-center">
          <button
            onClick={handlePrev}
            disabled={isAnimating}
            className="rounded-full hover:bg-[#0000002f] transition-all p-2"
            aria-label="Anterior"
          >
            <img src={ArrowLeft} alt="Voltar" className="w-10 h-10" />
          </button>

          <div
            className="relative mb-12 overflow-hidden"
            style={{ width: `${itemWidth * 2.5}px` }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className="flex space-x-8"
              style={{
                transform: `translateX(-${currentIndex * itemWidth}px)`,
                transition: transitionEnabled ? "transform 0.5s ease" : "none",
                willChange: "transform",
              }}
            >
              {extendedTestimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className="shadow-elegant hover:shadow-glow transition-all group flex-shrink-0"
                  style={{ width: "300px" }}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="text-primary opacity-50">
                      <Quote className="h-8 w-8" />
                    </div>

                    <div className="flex space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                      ))}
                    </div>

                    <p className="text-muted-foreground leading-relaxed text-sm">
                      "{testimonial.quote}"
                    </p>

                    <div className="flex items-center space-x-3 pt-4 border-t border-border">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {testimonial.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {testimonial.role} • {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={isAnimating}
            className="rounded-full hover:bg-[#0000002f] transition-all p-2"
            aria-label="Próximo"
          >
            <img src={ArrowRight} alt="Avançar" className="w-10 h-10" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mt-16">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">98%</div>
            <div className="text-sm text-muted-foreground">Taxa de Satisfação</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">50+</div>
            <div className="text-sm text-muted-foreground">Projetos Entregues</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">25+</div>
            <div className="text-sm text-muted-foreground">Clientes Ativos</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">5+</div>
            <div className="text-sm text-muted-foreground">Anos de Experiência</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
