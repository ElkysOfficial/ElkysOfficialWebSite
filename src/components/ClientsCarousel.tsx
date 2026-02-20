import { useState, useEffect } from "react";

const ClientsCarousel = () => {
  const [logos, setLogos] = useState<string[]>([]);

  useEffect(() => {
    fetch("/imgs/logo/logos.json")
      .then((res) => res.json())
      .then((data) => {
        const logoPaths = data.logos.map((filename: string) => `/imgs/logo/${filename}`);
        setLogos(logoPaths);
      })
      .catch((error) => {
        console.error("Error loading logos:", error);
        setLogos([
          "/imgs/logo/1UmPrintComunicação.svg",
          "/imgs/logo/AKProducoes.svg",
          "/imgs/logo/Antônio Oliveira Advogados.webp",
          "/imgs/logo/Dps Celulares.webp",
          "/imgs/logo/God of Baber.webp",
          "/imgs/logo/Hapvida.webp",
          "/imgs/logo/Logo Inline White.webp",
          "/imgs/logo/plansCoop.webp",
        ]);
      });
  }, []);

  const duplicatedLogos = [...logos, ...logos, ...logos];

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-background border-y border-border overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
            Empresas que confiam na <span className="text-primary">Elkys</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Confiança construída com entregas consistentes
          </p>
        </div>

        {/* Carrossel */}
        <div className="relative w-full overflow-hidden">
          <div className="animate-clients-scroll clients-carousel-track flex items-center gap-8 md:gap-12">
            {duplicatedLogos.map((logo, index) => (
              <div
                key={index}
                className="clients-logo-wrapper flex-shrink-0 transition-all duration-300"
              >
                <img
                  src={logo}
                  alt={`Logo do cliente parceiro da Elkys`}
                  width={120}
                  height={60}
                  loading="lazy"
                  className="clients-logo-grayscale"
                  style={{
                    width: "auto",
                    height: "clamp(50px, 10vw, 80px)",
                    maxWidth: "clamp(100px, 20vw, 160px)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientsCarousel;
