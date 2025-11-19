import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import backgroundPattern from '../../public/imgs/icons/hexagonal.png';

interface CaseStudy {
  id: number;
  title: string;
  client: string;
  category: string;
  description: string;
  image: string;
  video?: string;
  results: {
    metric: string;
    value: string;
  }[];
  tags: string[];
  link?: string;
}

const caseStudies: CaseStudy[] = [
  {
    id: 1,
    title: "Transformação Digital Completa",
    client: "Hapvida",
    category: "Saúde",
    description: "Desenvolvemos uma plataforma integrada que revolucionou o atendimento ao paciente, reduzindo tempo de espera e aumentando satisfação.",
    image: "/imgs/cases/case-1.jpg",
    results: [
      { metric: "Redução no tempo de atendimento", value: "45%" },
      { metric: "Aumento na satisfação", value: "92%" },
      { metric: "Processos digitalizados", value: "100%" },
    ],
    tags: ["UX/UI Design", "Desenvolvimento Web", "Mobile"],
    link: "#",
  },
  {
    id: 2,
    title: "Identidade Visual Moderna",
    client: "God Of Barber",
    category: "Beleza & Estética",
    description: "Criamos uma identidade visual sofisticada e um sistema de agendamento online que elevou a marca a outro patamar.",
    image: "/imgs/cases/case-2.jpg",
    results: [
      { metric: "Aumento em agendamentos", value: "150%" },
      { metric: "Engajamento nas redes", value: "220%" },
      { metric: "Novos clientes", value: "+85%" },
    ],
    tags: ["Branding", "Design Gráfico", "Web Design"],
    link: "#",
  },
  {
    id: 3,
    title: "Como transformamos um site de advocacia em uma vitrine de autoridade",
    client: "Dr. Antônio",
    category: "Jurídico",
    description: "Redesenhamos do zero um site institucional com foco em clareza, design responsivo e estrutura que transmite autoridade e confiança.",
    image: "/imgs/cases/case-3.webp",
    video: "imgs/cases/videos/case-3-preview.mp4",
    results: [
      { metric: "Design", value: "100%" },
      { metric: "Responsivo", value: "Todos" },
      { metric: "Confiança", value: "Máxima" },
    ],
    tags: ["Web Design", "Site Institucional", "Branding"],
    link: "https://www.antonioadvogado.com.br/",
  },
  {
    id: 4,
    title: "De inexistente a digital: criamos o primeiro canal online da 1UmPrint",
    client: "1Um Print Comunicação",
    category: "Comunicação Visual",
    description: "Site moderno com navegação responsiva, formulário inteligente de orçamento e infraestrutura otimizada para SEO e performance.",
    image: "/imgs/cases/case-4.jpg",
    results: [
      { metric: "Presença Digital", value: "100%" },
      { metric: "Mobile First", value: "✓" },
      { metric: "Conversão", value: "Otimizada" },
    ],
    tags: ["Web Design", "SEO", "Formulário Inteligente"],
    link: "#",
  },
  {
    id: 5,
    title: "Portal Corporativo Integrado",
    client: "PlansCoop",
    category: "Cooperativismo",
    description: "Portal completo para gestão de cooperados, com área do associado e sistema de comunicação interna.",
    image: "/imgs/cases/case-5.jpg",
    results: [
      { metric: "Usuários ativos", value: "15k+" },
      { metric: "Satisfação do usuário", value: "94%" },
      { metric: "Redução em custos", value: "40%" },
    ],
    tags: ["Portal", "Sistema Web", "Integração"],
    link: "#",
  },
  {
    id: 6,
    title: "Campanha Digital Integrada",
    client: "AK Produções",
    category: "Entretenimento",
    description: "Estratégia completa de marketing digital com landing pages otimizadas e gestão de tráfego pago.",
    image: "/imgs/cases/case-6.jpg",
    results: [
      { metric: "ROI da campanha", value: "340%" },
      { metric: "Leads gerados", value: "2.8k" },
      { metric: "Custo por lead", value: "-65%" },
    ],
    tags: ["Marketing Digital", "Landing Page", "Tráfego Pago"],
    link: "#",
  },
];

const CaseCard = ({ caseStudy }: { caseStudy: CaseStudy }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  return (
    <article
      className="group relative overflow-hidden rounded-3xl bg-white shadow-lg shadow-purple-900/10 transition-all duration-700 hover:shadow-2xl hover:shadow-purple-900/20 hover:-translate-y-3"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Gradient Border Effect - Harmonic */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-400/25 via-purple-300/15 to-indigo-400/25 opacity-0 transition-opacity duration-700 group-hover:opacity-100 -z-10"></div>

      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
        {/* Video on Hover */}
        {caseStudy.video && isHovering && (
          <video
            src={caseStudy.video}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover z-10"
          />
        )}

        {!imageError ? (
          <img
            src={caseStudy.image}
            srcSet={caseStudy.image.endsWith('.webp') ? `${caseStudy.image.replace('.webp', '-640w.webp')} 640w, ${caseStudy.image.replace('.webp', '-1024w.webp')} 1024w, ${caseStudy.image.replace('.webp', '-1920w.webp')} 1920w` : undefined}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
            alt={caseStudy.title}
            width={1920}
            height={1200}
            loading="lazy"
            className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="text-center">
              <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
                <span className="text-4xl font-bold text-primary">
                  {caseStudy.client.charAt(0)}
                </span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Imagem em breve
              </p>
            </div>
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"></div>

        {/* Category Badge - Refined Colors */}
        <div className="absolute left-6 top-6 z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700 shadow-lg shadow-purple-900/10 backdrop-blur-md transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:via-violet-600 group-hover:to-purple-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-primary/30">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-violet-600 group-hover:from-white group-hover:to-white shadow-sm"></span>
            {caseStudy.category}
          </span>
        </div>

        {/* Hover Indicator - Harmonic */}
        {caseStudy.link && (
          <a
            href={caseStudy.link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-6 right-6 z-10 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 translate-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-white to-slate-50 shadow-2xl shadow-purple-900/20 ring-2 ring-white/50 hover:scale-110 transition-transform">
              <ArrowRight className="h-6 w-6 text-primary transition-transform group-hover:translate-x-1" />
            </div>
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-8 lg:p-10">
        {/* Client Name - Refined */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-primary via-violet-600 to-purple-600 shadow-sm"></div>
          <p className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
            {caseStudy.client}
          </p>
        </div>

        {/* Title - Harmonic Hover */}
        <h3 className="mb-5 text-2xl font-bold leading-tight text-slate-900 transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:via-violet-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent lg:text-3xl">
          {caseStudy.title}
        </h3>

        {/* Description */}
        <p className="mb-8 leading-relaxed text-slate-600">
          {caseStudy.description}
        </p>

        {/* Results Grid - Soft Colors */}
        <div className="mb-8 grid grid-cols-3 gap-6 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-purple-50/30 p-6 shadow-sm">
          {caseStudy.results.map((result, index) => (
            <div key={index} className="text-center group/stat">
              <p className="mb-2 text-2xl font-bold bg-gradient-to-br from-primary via-violet-600 to-purple-600 bg-clip-text text-transparent lg:text-3xl transition-transform group-hover/stat:scale-110 duration-300">
                {result.value}
              </p>
              <p className="text-xs leading-tight text-slate-500 font-medium">{result.metric}</p>
            </div>
          ))}
        </div>

        {/* Tags - Comfortable Colors */}
        <div className="mb-8 flex flex-wrap gap-2.5">
          {caseStudy.tags.map((tag, index) => (
            <span
              key={index}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 transition-all duration-500 hover:border-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-violet-500/10 hover:text-primary hover:shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA Link - Elegant */}
        {caseStudy.link && (
          <a
            href={caseStudy.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-flex items-center gap-3 font-bold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent transition-all hover:gap-5"
          >
            Ver case completo
            <ArrowRight className="h-5 w-5 text-primary transition-all group-hover/link:translate-x-2 group-hover/link:text-violet-600" />
          </a>
        )}
      </div>

      {/* Bottom Accent Line - Harmonic Gradient */}
      <div className="absolute bottom-0 left-0 h-1.5 w-0 bg-gradient-to-r from-primary via-violet-600 to-purple-600 transition-all duration-700 group-hover:w-full shadow-lg shadow-primary/30"></div>
    </article>
  );
};

export const CaseStudies = () => {
  const [filter, setFilter] = useState<string>("all");

  const categories = [
    "all",
    ...Array.from(new Set(caseStudies.map((c) => c.category))),
  ];

  const filteredCases =
    filter === "all"
      ? caseStudies
      : caseStudies.filter((c) => c.category === filter);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30">
      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-50/80 via-white to-purple-50/30 px-4 pb-24 pt-32 md:pt-40">
        {/* Background Pattern - Subtle & Harmonious */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-primary/60 to-purple-400/40 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-br from-violet-400/40 to-indigo-300/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-purple-300/30 to-primary/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        <img src={backgroundPattern} alt="Background" width={1000} height={1000} loading="lazy" className="absolute inset-0 object-cover opacity-[0.08] top-[500px] left-[100px] w-[1000px] animate-diamond-rotate" />

        <div className="container relative z-10 mx-auto">
          {/* Breadcrumb - Refined */}
          <div className="mb-12 animate-fade-in">
            <Link
              to="/"
              className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-primary"
            >
              <span className="transition-transform group-hover:-translate-x-1">Home</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              <span className="text-foreground font-semibold">Cases de Sucesso</span>
            </Link>
          </div>

          {/* Title - Enhanced Typography */}
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-4 inline-block animate-fade-in">
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/8 to-violet-500/8 px-5 py-2.5 text-sm font-semibold text-primary shadow-sm border border-primary/10">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-violet-500 animate-pulse shadow-lg shadow-primary/50"></span>
                Portfólio
              </span>
            </div>
            <h1 className="mb-8 text-5xl font-bold tracking-tight text-slate-900 md:text-6xl lg:text-7xl xl:text-8xl animate-fade-in leading-[1.1]" style={{ animationDelay: '0.1s' }}>
              Nossos Cases de{' '}
              <span className="bg-gradient-to-r from-primary via-violet-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                Sucesso
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl lg:text-2xl animate-slide-up font-light" style={{ animationDelay: '0.2s' }}>
              Descubra como transformamos desafios em resultados excepcionais para nossos clientes
            </p>

            {/* Stats Mini - Harmonic Colors */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 md:gap-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="group text-center transition-transform hover:scale-105 duration-300">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary via-violet-600 to-purple-600 bg-clip-text text-transparent">50+</div>
                <div className="mt-2 text-sm text-slate-500 font-medium group-hover:text-primary transition-colors">Projetos</div>
              </div>
              <div className="group text-center transition-transform hover:scale-105 duration-300">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary via-violet-600 to-purple-600 bg-clip-text text-transparent">98%</div>
                <div className="mt-2 text-sm text-slate-500 font-medium group-hover:text-primary transition-colors">Satisfação</div>
              </div>
              <div className="group text-center transition-transform hover:scale-105 duration-300">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary via-violet-600 to-purple-600 bg-clip-text text-transparent">6+</div>
                <div className="mt-2 text-sm text-slate-500 font-medium group-hover:text-primary transition-colors">Setores</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Filter Section - Natural and Seamless */}
      <section className="relative bg-white px-4 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-7">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Filtrar por setor</p>
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category, index) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`group relative rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                    filter === category
                      ? "bg-gradient-to-r from-primary via-violet-600 to-purple-600 text-white shadow-md shadow-primary/20"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-primary"
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {category === "all" ? "Todos os Cases" : category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cases Grid - Clean White Background */}
      <section className="relative overflow-hidden bg-white px-4 py-32">
        {/* Subtle Background Elements */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
          <div className="absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/20 to-violet-200/20 blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-200/20 to-indigo-200/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container relative z-10 mx-auto">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <div className="mb-4 inline-block">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-bold text-slate-700 shadow-md">
                <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-primary to-violet-600 animate-pulse shadow-sm"></span>
                {filteredCases.length} {filteredCases.length === 1 ? 'Projeto' : 'Projetos'}
              </span>
            </div>
          </div>

          {/* Grid */}
          <div className="grid gap-10 md:grid-cols-2 lg:gap-14">
            {filteredCases.map((caseStudy, index) => (
              <div
                key={caseStudy.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CaseCard caseStudy={caseStudy} />
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredCases.length === 0 && (
            <div className="py-32 text-center">
              <div className="mx-auto mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-slate-900 mb-2">
                Nenhum case encontrado
              </p>
              <p className="text-slate-600">
                Tente selecionar outro setor
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Minimal */}
      <section className="relative overflow-hidden bg-white px-4 py-24">
        <div className="container relative mx-auto">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold text-slate-900 md:text-4xl">
              Vamos transformar sua ideia em realidade?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-slate-600">
              Converse com nossa equipe e descubra como podemos ajudar seu negócio
            </p>
            <Link
              to="/#contact"
              className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary via-violet-600 to-purple-600 px-8 py-4 font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
            >
              Falar com especialista
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
