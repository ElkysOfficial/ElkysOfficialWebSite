const ClientsCarousel = () => {
  // Mock client logos - in a real project, these would be actual client logos
  const clients = [
    { logo: '💡' },
    { logo: '⭐' },
    { logo: '📦' }
  ];

  return (
    <section className="py-16 bg-background border-y border-border">
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
        {/* Carousel */}
        <div className="relative overflow-hidden">
          <div className="flex flex-col items-center space-x-8 md:space-x-16 min-w-max  bg-red-100">
            {clients.map((client, index) => (
              <div
                key={index}
                className="flex-shrink-0 flex items-center justify-center space-x-3 opacity-60 hover:opacity-100 group w-60 bg-slate-600 ml-0" 
              >
                <div className="text-4xl group-hover:scale-110 transition-transform">
                  {client.logo}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientsCarousel;