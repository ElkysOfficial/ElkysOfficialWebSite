import { Target, Eye, Heart, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Missão",
      description:
        "Transformar ideias em soluções tecnológicas que impulsionam o crescimento dos nossos clientes.",
    },
    {
      icon: Eye,
      title: "Visão",
      description: "Ser reconhecida como a principal parceira tecnológica para PMEs no Brasil.",
    },
    {
      icon: Heart,
      title: "Valores",
      description:
        "Transparência, qualidade, inovação e comprometimento com resultados excepcionais.",
    },
  ];

  const stats = [
    { number: "20+", label: "Projetos Entregues" },
    { number: "20+", label: "Clientes Ativos" },
    { number: "98%", label: "Taxa de Satisfação" },
    { number: "2+", label: "Anos de Mercado" },
  ];

  return (
    <section id="about" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Sobre a <span className="text-primary">Elys</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Somos especialistas em desenvolvimento de software sob demanda, com foco em pequenas e
            médias empresas que buscam crescer através da tecnologia.
          </p>
        </div>

        {/* Company Story */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-foreground">Nossa História</h3>
            <p className="text-muted-foreground leading-relaxed">
              Fundada com a missão de democratizar o acesso à tecnologia de qualidade, a Elys nasceu
              da percepção de que muitas PMEs enfrentam desafios para encontrar soluções
              tecnológicas que realmente atendam às suas necessidades específicas. Ao longo dos
              anos, evoluímos para entregar sistemas robustos, seguros e alinhados aos objetivos de
              cada cliente.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Desenvolvemos uma metodologia própria que une eficiência, qualidade técnica e
              proximidade no processo, tornando cada entrega uma extensão direta das operações dos
              nossos parceiros e acelerando seus resultados.
            </p>
            <div className="flex items-center space-x-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">Crescimento sustentável através da tecnologia.</span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end w-full">
            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:gap-6 w-full max-w-sm sm:max-w-md lg:max-w-xl">
              {stats.map((stat, index) => (
                <Card
                  key={index}
                  className="text-center p-4 sm:p-5 md:p-6 shadow-elegant hover:shadow-glow transition-all border-border bg-card"
                >
                  <CardContent className="p-0 flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px]">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-1 sm:mb-2">
                      {stat.number}
                    </div>
                    <div className="text-xs sm:text-sm md:text-base text-muted-foreground leading-tight px-2">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Mission, Vision, Values */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {values.map((value, index) => (
            <Card
              key={index}
              className="text-center p-8 shadow-elegant hover:shadow-glow transition-all group"
            >
              <CardContent className="p-0 space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <p className="text-xl font-bold text-foreground">{value.title}</p>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
