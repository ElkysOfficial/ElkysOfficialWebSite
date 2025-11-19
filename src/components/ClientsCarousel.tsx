import { useState, useEffect } from 'react';

const ClientsCarousel = () => {
  const [logos, setLogos] = useState<string[]>([]);

  useEffect(() => {
    fetch('/imgs/logo/logos.json')
      .then(res => res.json())
      .then(data => {
        const logoPaths = data.logos.map((filename: string) => `/imgs/logo/${filename}`);
        setLogos(logoPaths);
      })
      .catch(error => {
        console.error('Error loading logos:', error);
        setLogos([
          '/imgs/logo/1UmPrintComunicação.svg',
          '/imgs/logo/AKProducoes.svg',
          '/imgs/logo/Antônio Oliveira Advogados.png',
          '/imgs/logo/Developers Logo.png',
          '/imgs/logo/hapvida.png',
          '/imgs/logo/Logo Inline White.png',
          '/imgs/logo/PlansCoop.png',
          '/imgs/logo/Dps Celulares.png'
        ]);
      });
  }, []);

  const duplicatedLogos = [...logos, ...logos, ...logos];

  return (
    <section className="py-16 bg-background border-y border-border overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Empresas que confiam na <span className="text-primary">Elys</span>
          </h3>
          <p className="text-muted-foreground">
            Parceiros de sucesso em diversos segmentos
          </p>
        </div>

        {/* Carrossel */}
        <div className="relative w-full overflow-hidden">
          <div className="clients-carousel-track flex items-center gap-12">
            {duplicatedLogos.map((logo, index) => (
              <div
                key={index}
                className="clients-logo-wrapper flex-shrink-0 transition-all duration-300"
              >
                <img
                  src={logo.replace(/\.(png|jpg|jpeg)$/i, '.webp')}
                  alt={`Client logo ${index + 1}`}
                  width={200}
                  height={100}
                  loading="lazy"
                  className="clients-logo-grayscale"
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
