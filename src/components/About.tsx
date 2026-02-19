import { Target, Eye, Heart, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/design-system";

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

        {/* Mission, Vision, Values */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {values.map((value, index) => (
            <Card key={index} className="text-center p-6 md:p-8 group">
              <CardContent className="p-0 space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <p className="text-lg md:text-xl font-semibold text-foreground">{value.title}</p>
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
