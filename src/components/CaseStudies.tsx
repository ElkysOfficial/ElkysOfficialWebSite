import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import backgroundPattern from "../../public/imgs/icons/hexagonal.webp";
import { ResponsiveImage } from "@/components/ui/responsive-image";

/**
 * Interface que define a estrutura de um case de sucesso
 * @property {number} id - Identificador único do case
 * @property {string} title - Título do case (máx 3 linhas com line-clamp)
 * @property {string} client - Nome do cliente
 * @property {string} category - Categoria do case (usado no filtro)
 * @property {string} description - Descrição detalhada (máx 4 linhas com line-clamp)
 * @property {string} image - Caminho da imagem principal
 * @property {string} video - Caminho do vídeo de preview (opcional, exibido no hover)
 * @property {Array} results - Array com 3 métricas de resultado (grid fixo 3 colunas)
 * @property {Array<string>} tags - Tags do projeto
 * @property {string} link - URL externa do case completo (opcional)
 */
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

/**
 * Array com todos os cases de sucesso
 * NOTA: Sempre manter 3 resultados por case para grid uniforme
 * NOTA: Cases comentados podem ser descomentados quando necessário
 */
const caseStudies: CaseStudy[] = [
  {
    id: 3,
    title: "Como transformamos um site de advocacia em uma vitrine de autoridade",
    client: "Dr. Antônio",
    category: "Jurídico",
    description:
      "Redesenhamos do zero um site institucional com foco em clareza, design responsivo e estrutura que transmite autoridade e confiança.",
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
    id: 1,
    title: "Chatbot de Cotação de Planos",
    client: "Planscoop",
    category: "Saúde",
    description:
      "Desenvolvemos um chatbot automatizado para cotação de planos de saúde, capaz de coletar dados, consultar tabelas, gerar valores e encaminhar o cliente diretamente para atendimento no WhatsApp. O sistema recebeu melhorias adicionais, incluindo módulos de tabelas, suporte, treinamento, cadastro e consulta de premiação.",
    image: "/imgs/cases/case-1.jpg",
    results: [
      { metric: "Tempo de resposta mais rápido", value: "Processo 100% automatizado" },
      { metric: "Redução de operações manuais", value: "Eliminação de cálculos manuais" },
      { metric: "Automação de processos", value: "100%" },
    ],
    tags: ["Automação", "Chatbot", "Integração WhatsApp", "Desenvolvimento Web"],
    link: "https://wa.me/SEULINKAQUI",
  },
  // {
  //   id: 2,
  //   title: "Identidade Visual Moderna",
  //   client: "God Of Barber",
  //   category: "Beleza & Estética",
  //   description: "Criamos uma identidade visual sofisticada e um sistema de agendamento online que elevou a marca a outro patamar.",
  //   image: "/imgs/cases/case-2.jpg",
  //   results: [
  //     { metric: "Aumento em agendamentos", value: "150%" },
  //     { metric: "Engajamento nas redes", value: "220%" },
  //     { metric: "Novos clientes", value: "+85%" },
  //   ],
  //   tags: ["Branding", "Design Gráfico", "Web Design"],
  //   link: "#",
  // },
  {
    id: 4,
    title: "De inexistente a digital: criamos o primeiro canal online da 1UmPrint",
    client: "1Um Print Comunicação",
    category: "Comunicação Visual",
    description:
      "Criamos o primeiro site da empresa, estruturado do zero com foco em conversão. O projeto inclui design responsivo, identidade sólida, páginas otimizadas e um formulário inteligente que acelera o atendimento ao permitir que o cliente informe produto, quantidade e dados pessoais já no primeiro contato.",
    image: "/imgs/cases/case-4.jpg",
    video: "imgs/cases/videos/case-4-preview.mp4",
    results: [
      { metric: "Presença Digital", value: "100%" },
      { metric: "Formulário inteligente", value: "Redução de etapas no atendimento" },
      { metric: "Conversão", value: "Otimizada" },
    ],
    tags: ["Web Design", "SEO", "Otimização", "Formulário Inteligente"],
    link: "https://umprintcomunicação.com.br/",
  },
  // {
  //   id: 5,
  //   title: "Portal Corporativo Integrado",
  //   client: "PlansCoop",
  //   category: "Cooperativismo",
  //   description: "Portal completo para gestão de cooperados, com área do associado e sistema de comunicação interna.",
  //   image: "/imgs/cases/case-5.jpg",
  //   results: [
  //     { metric: "Usuários ativos", value: "15k+" },
  //     { metric: "Satisfação do usuário", value: "94%" },
  //     { metric: "Redução em custos", value: "40%" },
  //   ],
  //   tags: ["Portal", "Sistema Web", "Integração"],
  //   link: "#",
  // },
  {
    id: 6,
    title: "Transforme Sua Produção com Som Profissional de Cinema",
    client: "AK Produções",
    category: "Produção de Áudio",
    description:
      "Especialistas em som para narrativas      audiovisuais com +20 anos de experiência. Dublagem,   legendagem, mixagem e produção sonora para cinema, TV e streaming.",
    image: "/imgs/cases/case-6.jpg",
    video: "imgs/cases/videos/case-6-preview.mp4",
    results: [
      { metric: "Anos de experiência", value: "20+" },
      { metric: "Clientes premium", value: "Netflix, HBO, BBC" },
      { metric: "Serviços oferecidos", value: "6" },
    ],
    tags: ["Dublagem", "Mixagem de Áudio", "Legendagem", "Produção Sonora"],
    link: "https://royalblue-eel-104842.hostingersite.com/",
  },
];

/**
 * Componente Card individual de case
 *
 * Layout com altura uniforme usando flexbox:
 * - Imagem com altura fixa (240px/280px/320px)
 * - Conteúdo com flex-grow para preencher espaço
 * - Elementos com line-clamp para truncar textos longos
 * - CTA sempre posicionado no final com mt-auto
 *
 * Features:
 * - Vídeo de preview no hover (se disponível)
 * - Animações suaves de hover
 * - Layout responsivo mobile-first
 */
const CaseCard = ({ caseStudy }: { caseStudy: CaseStudy }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-100/60 dark:border-slate-800/80 shadow-elegant transition-all duration-700 hover:shadow-glow hover:-translate-y-3 h-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Efeito de borda gradiente no hover */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-400/25 via-purple-300/15 to-indigo-400/25 opacity-0 transition-opacity duration-700 group-hover:opacity-100 -z-10"></div>

      {/* Container de imagem com altura fixa para uniformidade */}
      <div className="relative w-full h-[240px] sm:h-[280px] md:h-[320px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex-shrink-0">
        {/* Vídeo exibido ao passar mouse (se disponível) */}
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

        <ResponsiveImage
          src={caseStudy.image}
          alt={caseStudy.title}
          className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 50vw, 800px"
          loading="lazy"
          onError={() => setImageError(true)}
        />

        {/* Overlay escuro no hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"></div>

        {/* Badge de categoria */}
        <div className="absolute left-6 top-6 z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/95 dark:bg-slate-900/90 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-100 shadow-lg shadow-purple-900/10 dark:shadow-black/40 backdrop-blur-md transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:via-violet-600 group-hover:to-purple-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-primary/30">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-violet-600 group-hover:from-white group-hover:to-white shadow-sm"></span>
            {caseStudy.category}
          </span>
        </div>

        {/* Botão flutuante de ver case (aparece no hover) */}
        {caseStudy.link && (
          <a
            href={caseStudy.link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-6 right-6 z-10 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 translate-y-4"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Ver case completo: ${caseStudy.title}`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-2xl shadow-purple-900/20 dark:shadow-black/40 ring-2 ring-white/50 dark:ring-slate-800 hover:scale-110 transition-transform">
              <ArrowRight className="h-6 w-6 text-primary transition-transform group-hover:translate-x-1" />
            </div>
          </a>
        )}
      </div>

      {/* Container de conteúdo - flex-grow garante preenchimento de espaço */}
      <div className="flex flex-col flex-grow p-6 sm:p-8 lg:p-10">
        {/* Nome do cliente com linha decorativa */}
        <div className="mb-3 sm:mb-4 flex items-center gap-3">
          <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-primary via-violet-600 to-purple-600 shadow-sm"></div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
            {caseStudy.client}
          </p>
        </div>

        {/* Título - line-clamp-3 trunca em 3 linhas, min-h garante altura uniforme */}
        <h2 className="mb-4 sm:mb-5 text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold leading-tight text-slate-900 dark:text-white transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:via-violet-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent line-clamp-3 min-h-[4.5rem] sm:min-h-[5rem]">
          {caseStudy.title}
        </h2>

        {/* Descrição - line-clamp-4 trunca em 4 linhas, min-h garante altura uniforme */}
        <p className="mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base text-slate-600 dark:text-slate-300 line-clamp-4 min-h-[5.5rem] sm:min-h-[6rem]">
          {caseStudy.description}
        </p>

        {/* Grid de resultados - SEMPRE 3 colunas (grid-cols-3) */}
        <div className="mb-6 sm:mb-8 grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-slate-50/80 to-purple-50/30 dark:from-slate-900/60 dark:to-slate-800/60 p-3 sm:p-4 md:p-5 shadow-sm">
          {caseStudy.results.map((result, index) => (
            <div key={index} className="text-center group/stat p-1 sm:p-2">
              <p className="mb-1 sm:mb-1.5 text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-br from-primary via-violet-600 to-purple-600 bg-clip-text text-transparent transition-transform group-hover/stat:scale-110 duration-300 line-clamp-2">
                {result.value}
              </p>
              <p className="text-[9px] sm:text-[10px] md:text-xs leading-tight text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                {result.metric}
              </p>
            </div>
          ))}
        </div>

        {/* Container de tags com altura mínima para uniformidade */}
        <div className="mb-6 sm:mb-8 flex flex-wrap gap-1.5 sm:gap-2 min-h-[2.5rem] sm:min-h-[3rem] content-start">
          {caseStudy.tags.map((tag, index) => (
            <span
              key={index}
              className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-200 transition-all duration-500 hover:border-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-violet-500/10 hover:text-primary hover:shadow-sm h-fit"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Espaçador flexível que empurra o CTA para o final */}
        <div className="flex-grow"></div>

        {/* Link CTA - mt-auto garante que fique sempre no final do card */}
        {caseStudy.link && (
          <a
            href={caseStudy.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-flex items-center gap-3 font-bold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent transition-all hover:gap-5 text-sm sm:text-base mt-auto"
          >
            Ver case completo
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary transition-all group-hover/link:translate-x-2 group-hover/link:text-violet-600" />
          </a>
        )}
      </div>

      {/* Linha de acento inferior (anima no hover) */}
      <div className="absolute bottom-0 left-0 h-1.5 w-0 bg-gradient-to-r from-primary via-violet-600 to-purple-600 transition-all duration-700 group-hover:w-full shadow-lg shadow-primary/30"></div>
    </article>
  );
};

/**
 * Componente principal da página de Cases
 *
 * Features:
 * - Filtro por categoria dinâmico
 * - Grid responsivo (1 col mobile, 2 cols desktop)
 * - Hero section com breadcrumb e estatísticas
 * - CTA section ao final
 *
 * Layout:
 * - Hero: 60-75vh com padrão de fundo animado
 * - Filtros: Botões pill com categoria "all" e categorias únicas
 * - Grid: gap-10 em md, gap-14 em lg para respiração visual
 */
export const CaseStudies = () => {
  const [filter, setFilter] = useState<string>("all");

  // Extrai categorias únicas dos cases
  const categories = ["all", ...Array.from(new Set(caseStudies.map((c) => c.category)))];

  // Filtra cases baseado na categoria selecionada
  const filteredCases =
    filter === "all" ? caseStudies : caseStudies.filter((c) => c.category === filter);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] md:min-h-[75vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-50/80 via-white to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 pb-16 md:pb-24 pt-20 md:pt-32 lg:pt-40">
        {/* Esferas decorativas de fundo com animação float */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-primary/60 to-purple-400/40 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-br from-violet-400/40 to-indigo-300/40 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-purple-300/30 to-primary/40 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>
        {/* Padrão hexagonal rotacionando */}
        <img
          src={backgroundPattern}
          alt="Background"
          width={1000}
          height={1000}
          loading="lazy"
          className="absolute inset-0 object-cover opacity-[0.08] dark:opacity-[0.12] top-[500px] left-[100px] w-[1000px] animate-diamond-rotate dark:brightness-125 dark:saturate-150"
        />

        <div className="container relative z-10 mx-auto">
          {/* Breadcrumb de navegação */}
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

          {/* Título e subtítulo da página */}
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-4 inline-block animate-fade-in">
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/8 to-violet-500/8 px-5 py-2.5 text-sm font-semibold text-primary shadow-sm border border-primary/10">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-violet-500 animate-pulse shadow-lg shadow-primary/50"></span>
                Portfólio
              </span>
            </div>
            <h1
              className="mb-6 md:mb-8 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold tracking-tight text-slate-900 dark:text-white animate-fade-in leading-[1.1]"
              style={{ animationDelay: "0.1s" }}
            >
              Nossos Cases de{" "}
              <span className="bg-gradient-to-r from-primary via-violet-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                Sucesso
              </span>
            </h1>
            <p
              className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed text-slate-600 animate-slide-up font-light"
              style={{ animationDelay: "0.2s" }}
            >
              Descubra como transformamos desafios em resultados excepcionais para nossos clientes
            </p>

            {/* Mini estatísticas com animação de hover */}
            <div
              className="mt-8 md:mt-12 flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="group text-center transition-transform hover:scale-105 duration-300">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  50+
                </div>
                <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500 font-medium group-hover:text-primary transition-colors">
                  Projetos
                </div>
              </div>
              <div className="group text-center transition-transform hover:scale-105 duration-300">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  98%
                </div>
                <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500 font-medium group-hover:text-primary transition-colors">
                  Satisfação
                </div>
              </div>
              <div className="group text-center transition-transform hover:scale-105 duration-300">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  6+
                </div>
                <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500 font-medium group-hover:text-primary transition-colors">
                  Setores
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fade de transição para próxima seção */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-950"></div>
      </section>

      {/* Seção de filtros por categoria */}
      <section className="relative bg-white dark:bg-slate-950 px-4 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-7">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Filtrar por setor
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category, index) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`group relative rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                    filter === category
                      ? "bg-gradient-to-r from-primary via-violet-600 to-purple-600 text-white shadow-md shadow-primary/20"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-primary dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  aria-label={`Filtrar cases por ${category === "all" ? "todos os setores" : category}`}
                  aria-pressed={filter === category}
                >
                  {category === "all" ? "Todos os Cases" : category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid de cases */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-950 px-4 py-32">
        {/* Elementos sutis de fundo decorativo */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
          <div className="absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/20 to-violet-200/20 dark:from-primary/15 dark:to-purple-500/15 blur-3xl animate-float" />
          <div
            className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-200/20 to-indigo-200/20 dark:from-purple-500/15 dark:to-indigo-500/15 blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="container relative z-10 mx-auto">
          {/* Badge com contador de projetos */}
          <div className="mb-16 text-center">
            <div className="mb-4 inline-block">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-7 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-md shadow-primary/10 dark:shadow-black/40">
                <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-primary to-violet-600 animate-pulse shadow-sm"></span>
                {filteredCases.length} {filteredCases.length === 1 ? "Projeto" : "Projetos"}
              </span>
            </div>
          </div>

          {/* Grid responsivo: 1 coluna mobile, 2 colunas desktop */}
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

          {/* Estado vazio quando nenhum case é encontrado */}
          {filteredCases.length === 0 && (
            <div className="py-32 text-center">
              <div className="mx-auto mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
                <svg
                  className="h-12 w-12 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-xl font-semibold text-slate-900 mb-2">Nenhum case encontrado</p>
              <p className="text-slate-600">Tente selecionar outro setor</p>
            </div>
          )}
        </div>
      </section>

      {/* Seção CTA final */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-950 px-4 py-24">
        <div className="container relative mx-auto">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
              Vamos transformar sua ideia em realidade?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-slate-600 dark:text-slate-300">
              Converse com nossa equipe e descubra como podemos ajudar seu negócio
            </p>
            <a
              href="https://wa.me/5531997382935"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary via-violet-600 to-purple-600 px-8 py-4 font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
            >
              Falar com especialista
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
