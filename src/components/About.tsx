import { Target, Eye, Heart, TrendingUp, ArrowRight } from "@/assets/icons";
import { workPhilosophy } from "@/data/process";
import { Link } from "react-router-dom";
import { Card, CardContent, HexPattern } from "@/design-system";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Excelência Técnica",
      description:
        "Cada entrega segue padrões rigorosos de engenharia: código versionado, testado e documentado, pronto para escalar.",
    },
    {
      icon: Eye,
      title: "Compromisso com Entregas",
      description:
        "Cumprimos prazos e escopo com gestão transparente, entregas semanais e visibilidade total do progresso.",
    },
    {
      icon: Heart,
      title: "Transparência Total",
      description:
        "Acesso a repositórios, relatórios de progresso e comunicação direta com a equipe técnica responsável.",
    },
  ];

  const stats = [
    { number: "20+", label: "Projetos em Produção" },
    { number: "20+", label: "Clientes em Operação" },
    { number: "98%", label: "Retenção de Clientes" },
    { number: "2+", label: "Anos de Operação" },
  ];

  return (
    <section id="about" className="py-16 md:py-20 lg:py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Quem é a <span className="text-primary">Elkys</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Engenharia de software sob demanda com processo, previsibilidade e compromisso técnico.
            Parceiro direto para empresas que exigem confiabilidade em cada entrega.
          </p>
        </div>

        {/* Company Story */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center mb-16 md:mb-20">
          <div className="space-y-6">
            <h3 className="text-xl md:text-2xl font-semibold text-foreground">
              Engenharia aplicada a resultados
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              A Elkys foi fundada para resolver um problema recorrente no mercado: empresas que
              precisam de software sob medida, mas não encontram parceiros técnicos com processo,
              previsibilidade e comprometimento com a qualidade da entrega. Construímos uma operação
              especializada onde cada projeto recebe atenção direta da equipe de engenharia, sem
              intermediários, sem ruído.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Nossa metodologia combina práticas consolidadas de engenharia de software,
              versionamento, revisão de código, testes automatizados e documentação técnica, com
              gestão de projeto transparente. O resultado: entregas dentro do prazo, sistemas
              estáveis em produção e clientes que renovam contrato.
            </p>
            <div className="flex items-center space-x-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">
                Processo, qualidade e previsibilidade em cada entrega.
              </span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end w-full">
            <div className="grid grid-cols-2 gap-6 w-full max-w-md lg:max-w-xl">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center p-6">
                  <CardContent className="p-0 flex flex-col items-center justify-center min-h-[100px]">
                    <div className="text-3xl md:text-4xl font-bold text-accent mb-2">
                      {stat.number}
                    </div>
                    <div className="text-sm text-muted-foreground leading-tight">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Values - horizontal compact */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-16 md:mb-20">
          {values.map((value, index) => (
            <Card key={index} className="p-4 md:p-5">
              <CardContent className="p-0 flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <value.icon className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm md:text-base font-semibold text-foreground">
                    {value.title}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How We Work - grid 2 cols, icons left / text right */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
          <div className="space-y-4">
            {workPhilosophy.highlights.map((h, i) => {
              const HighlightIcon = h.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border"
                >
                  <HighlightIcon className="h-5 w-5 text-accent flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{h.label}</span>
                </div>
              );
            })}
            <Link
              to="/como-trabalhamos"
              className="group relative inline-flex items-center justify-between gap-2 min-h-[44px] px-6 rounded-md overflow-hidden bg-muted text-muted-foreground hover:bg-gradient-primary hover:text-white transition-all duration-300"
            >
              <HexPattern variant="inline" />
              <span className="relative z-10 text-sm font-medium">Ver processo completo</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl md:text-2xl font-semibold text-foreground">
              {workPhilosophy.heading}
            </h3>
            <p className="text-muted-foreground leading-relaxed">{workPhilosophy.paragraphs[0]}</p>
            <div className="flex items-center space-x-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">
                Entendemos antes de propor. Entregamos antes de prometer.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
