import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, ChevronRight, Clock } from "@/assets/icons";
import { Button, Card, CardContent, HexPattern } from "@/design-system";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { processSteps6, processInfoCards } from "@/data/process";

// Import via src/assets pra Vite aplicar fingerprint hash (cache-bust automatico).
import backgroundPattern from "@/assets/icons/hexagonal.webp";

const hexMask: CSSProperties = {
  WebkitMaskImage: `url(${backgroundPattern})`,
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskImage: `url(${backgroundPattern})`,
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
};

/** Flat-top hexagon: 6 vertices at 60° intervals, clockwise from top-right */
const HEX_ANGLES_DEG = [270, 330, 30, 90, 150, 210];
const MODAL_ID = "hds-phase-detail";

const ComoTrabalhamos = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const activeData = activeStep !== null ? processSteps6[activeStep] : null;
  const ActiveIcon = activeData?.icon ?? null;
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const closeModal = useCallback(() => setActiveStep(null), []);

  // ESC to close + focus management
  useEffect(() => {
    if (activeStep !== null) {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeModal();
      };
      document.addEventListener("keydown", onKey);
      modalRef.current?.focus();
      return () => document.removeEventListener("keydown", onKey);
    }
    triggerRef.current?.focus();
    triggerRef.current = null;
  }, [activeStep, closeModal]);

  const openStep = (index: number, button: HTMLButtonElement) => {
    if (activeStep === index) {
      setActiveStep(null);
    } else {
      triggerRef.current = button;
      setActiveStep(index);
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://elkys.com.br/como-trabalhamos#webpage",
    url: "https://elkys.com.br/como-trabalhamos",
    name: "Hexa Design System (HDS) | Elkys",
    description:
      "O HDS é o framework de entrega da Elkys: 6 etapas, escopo fechado, validação a cada ciclo e rastreabilidade de ponta a ponta.",
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
        title="Hexa Design System (HDS) | Elkys"
        description="O HDS é o framework de entrega da Elkys: 6 etapas, escopo fechado, validação a cada ciclo e rastreabilidade de ponta a ponta."
        canonical="https://elkys.com.br/como-trabalhamos"
        jsonLd={jsonLd}
      />
      <div className="min-h-screen">
        <Navigation />
        <main id="main-content">
          {/* Hero Section */}
          <section className="min-h-[50vh] flex items-center bg-gradient-hero dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
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
                style={{ filter: "drop-shadow(0 0 40px hsl(var(--primary) / 0.3))" }}
              />
            </div>

            <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24 relative z-10">
              <div className="max-w-3xl">
                <nav aria-label="Breadcrumb" className="mb-6 animate-fade-in">
                  <ol className="flex items-center gap-2 text-sm text-white/60">
                    <li>
                      <Link to="/" className="hover:text-white transition-colors">
                        Início
                      </Link>
                    </li>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <li className="text-white font-medium">Hexa Design System</li>
                  </ol>
                </nav>

                <div className="text-white space-y-6 md:space-y-8">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight animate-fade-in">
                    Hexa Design <span className="text-accent">System</span>
                  </h1>
                  <p className="text-base md:text-lg text-white/80 leading-relaxed animate-slide-up max-w-2xl">
                    Escopo definido antes do código. Validação a cada ciclo. Rastreabilidade de
                    ponta a ponta. É assim que reduzimos risco em projetos de software sob demanda.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Process - Interactive Hexagonal Wheel */}
          <section className="py-10 md:py-14 lg:py-16 bg-gradient-subtle">
            <div className="container mx-auto px-4">
              {/* Desktop: Hexagonal Wheel + Info (lg+) */}
              <div className="hidden lg:grid lg:grid-cols-2 gap-8 xl:gap-12 items-center">
                <div className="flex justify-center">
                  <div className="relative" style={{ width: 520, height: 520 }}>
                    {/* Hexagonal background watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <img
                        src={backgroundPattern}
                        alt=""
                        aria-hidden="true"
                        className="w-[460px] h-auto opacity-[0.12] dark:opacity-[0.30]"
                      />
                    </div>

                    {/* Spokes - 6 hexagonal directions */}
                    {HEX_ANGLES_DEG.map((angleDeg, i) => (
                      <div
                        key={`spoke-${i}`}
                        className="absolute bg-primary/10 dark:bg-primary/15"
                        style={{
                          top: "50%",
                          left: "50%",
                          width: "46%",
                          height: "1px",
                          transformOrigin: "0 50%",
                          transform: `rotate(${angleDeg}deg)`,
                        }}
                      />
                    ))}

                    {/* Central hub */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div
                        className="w-[100px] h-[100px] bg-gradient-primary flex items-center justify-center"
                        style={hexMask}
                      >
                        <span className="text-white text-base font-bold leading-tight text-center px-4">
                          HDS
                        </span>
                      </div>
                    </div>

                    {/* 6 step nodes - positioned at hexagon vertices
                       Ajuste manual: mude left/top (%) de cada fase individualmente.
                       50/50 = centro. Menor top = mais pra cima, maior left = mais pra direita. */}
                    {processSteps6.map((step, i) => {
                      /* R = 45%  |  sin60 ≈ 0.866 → dx = 39  |  cos60 = 0.5 → dy = 23 */
                      const positions = [
                        { left: 50, top: 10 }, // 1ª Etapa - topo           (d = 38)
                        { left: 89, top: 27 }, // 2ª Etapa - superior dir   (d ≈ 45.3)
                        { left: 89, top: 73 }, // 3ª Etapa - inferior dir   (d ≈ 45.3)
                        { left: 50, top: 90 }, // 4ª Etapa - base           (d = 38)
                        { left: 11, top: 73 }, // 5ª Etapa - inferior esq   (d ≈ 45.3)
                        { left: 11, top: 27 }, // 6ª Etapa - superior esq   (d ≈ 45.3)
                      ];
                      const x = positions[i].left;
                      const y = positions[i].top;
                      const StepIcon = step.icon;
                      const isActive = activeStep === i;

                      return (
                        <button
                          key={step.number}
                          type="button"
                          className={`absolute -translate-x-1/2 -translate-y-8 flex flex-col items-center text-center cursor-pointer transition-transform duration-200 will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm ${isActive ? "scale-110" : "hover:scale-105"}`}
                          style={{ left: `${x}%`, top: `${y}%`, width: 120 }}
                          onClick={(e) => openStep(i, e.currentTarget)}
                          aria-pressed={isActive}
                          aria-controls={MODAL_ID}
                          aria-label={`${step.number}ª Etapa: ${step.title}`}
                        >
                          <div className="relative w-16 h-16 flex items-center justify-center mb-1.5">
                            <div
                              className={`absolute inset-0 transition-colors duration-200 ${isActive ? "bg-primary/30 dark:bg-primary/40" : "bg-primary/15 dark:bg-primary/25"}`}
                              style={hexMask}
                            />
                            <div
                              className="w-12 h-12 bg-gradient-primary flex items-center justify-center"
                              style={hexMask}
                            >
                              <StepIcon className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <span className="text-xs font-bold text-primary">
                            {step.number}ª Etapa
                          </span>
                          <span className="text-xs font-semibold text-foreground leading-tight max-w-[110px]">
                            {step.title}
                          </span>
                          {step.duration && (
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {step.duration}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Info copy */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <h3 className="text-lg xl:text-xl font-semibold text-foreground">
                      O que você ganha com o HDS
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Previsibilidade de prazo, controle total do escopo e visibilidade do progresso
                      em tempo real. Clique em uma etapa para ver os detalhes.
                    </p>
                  </div>

                  {processInfoCards.map((card, index) => {
                    const InfoIcon = card.icon;
                    return (
                      <Card key={index}>
                        <CardContent className="p-3 xl:p-4 space-y-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 bg-gradient-primary flex items-center justify-center flex-shrink-0"
                              style={hexMask}
                            >
                              <InfoIcon className="h-4 w-4 text-white" />
                            </div>
                            <h4 className="text-sm font-semibold text-foreground">{card.title}</h4>
                          </div>
                          <ul className="space-y-1 pl-[42px]">
                            {card.items.map((item, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-1.5 text-xs text-muted-foreground"
                              >
                                <CheckCircle className="h-3 w-3 text-accent flex-shrink-0 mt-0.5" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    );
                  })}

                  <Link
                    to="/cases"
                    className="group relative inline-flex items-center justify-between gap-2 min-h-[44px] px-6 rounded-md overflow-hidden bg-muted text-muted-foreground hover:bg-gradient-primary hover:text-white transition-all duration-300"
                  >
                    <HexPattern variant="inline" />
                    <span className="relative z-10 text-sm font-medium">
                      Ver resultados do HDS em produção
                    </span>
                    <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>

                {/* Accessible modal overlay */}
                {activeData && ActiveIcon && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
                    onClick={closeModal}
                  >
                    <div
                      ref={modalRef}
                      id={MODAL_ID}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="hds-modal-title"
                      tabIndex={-1}
                      className="max-w-2xl w-full relative outline-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Card className="shadow-xl">
                        <button
                          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-lg"
                          onClick={closeModal}
                          aria-label="Fechar"
                        >
                          ×
                        </button>
                        <CardContent className="p-6 md:p-8">
                          <div className="flex gap-5">
                            <div className="flex-shrink-0">
                              <div
                                className="w-14 h-14 bg-gradient-primary flex items-center justify-center"
                                style={hexMask}
                              >
                                <ActiveIcon className="h-7 w-7 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                                  {activeData.number}ª Etapa
                                </span>
                                {activeData.duration && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {activeData.duration}
                                  </span>
                                )}
                                {activeData.clientParticipation && (
                                  <span className="text-xs font-medium text-accent flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Cliente participa
                                  </span>
                                )}
                              </div>
                              <h3
                                id="hds-modal-title"
                                className="text-xl font-semibold text-foreground mb-3"
                              >
                                {activeData.title}
                              </h3>
                              {activeData.details.map((paragraph, j) => (
                                <p
                                  key={j}
                                  className="text-muted-foreground leading-relaxed mb-2 last:mb-0"
                                >
                                  {paragraph}
                                </p>
                              ))}
                              <div className="mt-4 pt-4 border-t border-border">
                                <p className="text-sm font-semibold text-foreground mb-2">
                                  Entregáveis:
                                </p>
                                <ul className="grid grid-cols-2 gap-2">
                                  {activeData.deliverables.map((d, j) => (
                                    <li
                                      key={j}
                                      className="flex items-start gap-2 text-sm text-muted-foreground"
                                    >
                                      <CheckCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                                      {d}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile/Tablet: Vertical Timeline (< lg) */}
              <div className="lg:hidden">
                <div className="relative max-w-xl mx-auto">
                  <div className="space-y-0">
                    {processSteps6.map((step, index) => {
                      const StepIcon = step.icon;
                      const isLast = index === processSteps6.length - 1;
                      return (
                        <div key={step.number} className="relative flex gap-4">
                          <div className="flex flex-col items-center flex-shrink-0 z-10">
                            <div
                              className="w-11 h-11 bg-gradient-primary flex items-center justify-center flex-shrink-0"
                              style={hexMask}
                            >
                              <StepIcon className="h-5 w-5 text-white" />
                            </div>
                            {!isLast && <div className="w-px flex-1 bg-border" />}
                          </div>
                          <div className={`flex-1 ${isLast ? "pb-0" : "pb-8"}`}>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {step.number}ª Etapa
                              </span>
                              {step.duration && (
                                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                  <Clock className="h-3 w-3" />
                                  {step.duration}
                                </span>
                              )}
                              {step.clientParticipation && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                                  <CheckCircle className="h-3 w-3" />
                                  Cliente participa
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-semibold text-foreground mb-2">
                              {step.title}
                            </h3>
                            {step.details.map((paragraph, j) => (
                              <p
                                key={j}
                                className="text-sm text-muted-foreground leading-relaxed mb-2 last:mb-0"
                              >
                                {paragraph}
                              </p>
                            ))}
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs font-semibold text-foreground mb-1.5">
                                Entregáveis:
                              </p>
                              <ul className="space-y-1">
                                {step.deliverables.map((d, j) => (
                                  <li
                                    key={j}
                                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                                  >
                                    <CheckCircle className="h-3 w-3 text-accent flex-shrink-0 mt-0.5" />
                                    {d}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Info Cards - mobile/tablet only */}
          <section className="py-16 md:py-20 bg-background lg:hidden">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                {processInfoCards.map((card, index) => {
                  const CardIcon = card.icon;
                  return (
                    <Card key={index} className="h-full">
                      <CardContent className="p-5 md:p-6 space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                          <CardIcon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {card.description}
                        </p>
                        <ul className="space-y-2 pt-2">
                          {card.items.map((item, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <CheckCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 md:py-20 lg:py-24">
            <div className="container mx-auto px-4">
              <div className="bg-gradient-primary rounded-xl md:rounded-2xl p-6 md:p-10 hex-card-container">
                <HexPattern variant="banner" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="text-center md:text-left text-white max-w-xl">
                    <p className="text-xl md:text-2xl font-semibold">
                      Quer entender como o HDS se aplica ao seu projeto?
                    </p>
                    <p className="text-sm md:text-base mt-2 opacity-90">
                      Agende um diagnóstico técnico gratuito. Em 30 minutos mapeamos escopo, riscos
                      e viabilidade, sem compromisso.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    variant="accent"
                    className="btn-primary-animate w-full md:w-auto min-h-[44px] shrink-0"
                    onClick={() => {
                      window.location.href = "/#contact-form";
                    }}
                    aria-label="Agendar diagnóstico técnico"
                  >
                    Agendar diagnóstico técnico
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

export default ComoTrabalhamos;
