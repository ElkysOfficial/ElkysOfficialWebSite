import { Linkedin } from "lucide-react";
import { useState } from "react";

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  image: string;
  linkedin: string;
}

const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Lucelho Silva",
    role: "Founder",
    bio: "Profissional com ampla experiência em tecnologia, automação e arquitetura de soluções. Lidera produtos digitais com foco em eficiência, segurança e impacto real para o cliente.",
    image: "/imgs/team/member-1.webp",
    linkedin: "https://linkedin.com/in/lucelhosilva",
  },
  {
    id: 2,
    name: "Thiago Michaelsen",
    role: "Co-Founder",
    bio: "Atua há anos na organização de operações, processos e gestão estratégica. Especialista em transformar demandas complexas em entregas claras, consistentes e de alto padrão.",
    image: "/imgs/team/member-2.webp",
    linkedin: "https://linkedin.com/in/",
  },
  {
    id: 3,
    name: "Matheus Urban",
    role: "Lead Developer",
    bio: "Desenvolvedor experiente em arquiteturas modernas, performance e escalabilidade. Responsável por garantir código robusto, seguro e preparado para crescer junto com o cliente.",
    image: "/imgs/team/member-3.webp",
    linkedin: "https://linkedin.com/in/",
  },
  {
    id: 4,
    name: "Priscilla trevizan",
    role: "Full Stack Developer",
    bio: "Domínio completo em front-end e back-end, entregando sistemas bem estruturados, estáveis e com excelente experiência para o usuário final.",
    image: "/imgs/team/member-4.webp",
    linkedin: "https://linkedin.com/in/",
  },
  {
    id: 5,
    name: "Martim Cavalho",
    role: "UX/UI Designer",
    bio: "Expert em criar interfaces funcionais e intuitivas. Une pesquisa, usabilidade e design moderno para garantir que cada cliente tenha uma experiência simples e eficiente.",
    image: "/imgs/team/member-5.webp",
    linkedin: "https://linkedin.com/in/",
  },
  {
    id: 6,
    name: "Douglas Monteiro",
    role: "UX/UI Designer",
    bio: "Profissional com forte atuação em design centrado no usuário. Converte necessidades reais em soluções visuais claras, acessíveis e de alto impacto.",
    image: "/imgs/team/member-6.webp",
    linkedin: "https://linkedin.com/in/",
  },
  {
    id: 7,
    name: "Gustavo Archein",
    role: "Product Manager",
    bio: "Profundo conhecimento em gestão de produtos, definição de estratégia e análise de mercado. Mantém o produto alinhado às expectativas do cliente e às metas de negócio.",
    image: "/imgs/team/member-7.webp",
    linkedin: "https://linkedin.com/in/",
  },
  {
    id: 8,
    name: "Matheus Mello",
    role: "Customer Success & Business Development",
    bio: "Experiência sólida em relacionamento com clientes, acompanhamento de resultados e expansão comercial. Garante satisfação contínua e constrói relações duradouras e de confiança.",
    image: "/imgs/team/member-8.webp",
    linkedin: "https://linkedin.com/in/",
  },
];

const TeamMemberCard = ({ member }: { member: TeamMember }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative h-full">
      {/* Gradient Border Effect on Hover */}
      <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-primary/0 via-violet-500/0 to-purple-600/0 opacity-0 blur transition-all duration-500 group-hover:from-primary/30 group-hover:via-violet-500/30 group-hover:to-purple-600/30 group-hover:opacity-100"></div>

      {/* Card Container */}
      <div className="relative h-full overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200/50 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary/10 group-hover:-translate-y-2 flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 flex-shrink-0">
          {!imageError ? (
            <img
              src={member.image}
              srcSet={`${member.image.replace('.webp', '-400w.webp')} 400w, ${member.image.replace('.webp', '-800w.webp')} 800w`}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              alt={member.name}
              width={800}
              height={800}
              loading="lazy"
              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-violet-500/10 flex items-center justify-center">
                <span className="text-4xl font-semibold bg-gradient-to-br from-primary to-violet-600 bg-clip-text text-transparent">
                  {member.name.charAt(0)}
                </span>
              </div>
            </div>
          )}

          {/* Gradient Purple Overlay - Shows photo through gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-violet-600/70 to-purple-600/80 opacity-0 transition-all duration-700 group-hover:opacity-100 flex items-center justify-center">
            {/* Subtle inner gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>

            {/* LinkedIn Button */}
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 transform translate-y-8 opacity-0 transition-all duration-700 delay-150 group-hover:translate-y-0 group-hover:opacity-100"
              aria-label={`Visitar perfil do LinkedIn de ${member.name}`}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl shadow-black/20 transition-all duration-300 hover:scale-110 hover:shadow-white/40 hover:bg-gradient-to-br hover:from-white hover:to-slate-50">
                <Linkedin className="h-9 w-9 text-primary transition-all duration-300" />
              </div>
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="p-7 lg:p-8 flex flex-col flex-grow">
          {/* Decorative Line */}
          <div className="mb-4 h-0.5 w-0 bg-gradient-to-r from-primary via-violet-600 to-purple-600 transition-all duration-500 group-hover:w-12"></div>

          <h3 className="mb-2 text-xl font-bold text-slate-900 transition-all duration-500 lg:text-2xl group-hover:text-primary">
            {member.name}
          </h3>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 transition-colors duration-500 group-hover:text-primary">
            {member.role}
          </p>
          <p className="text-sm leading-relaxed text-slate-600 flex-grow">
            {member.bio}
          </p>
        </div>

        {/* Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-violet-600 to-purple-600 transition-all duration-500 group-hover:w-full"></div>
      </div>
    </div>
  );
};

export const Team = () => {
  const [showAll, setShowAll] = useState(false);
  const displayedMembers = showAll ? teamMembers : teamMembers.slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white py-24 md:py-32">
      <div className="container mx-auto px-4">
        {/* Header - Consistent with other sections */}
        <div className="mx-auto mb-20 max-w-3xl text-center">
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl animate-fade-in leading-tight">
            Nossa{' '}
            <span className="bg-gradient-to-r from-primary via-violet-600 to-purple-600 bg-clip-text text-transparent">
              Equipe
            </span>
          </h2>
          <p className="text-lg text-slate-600 md:text-xl leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Especialistas dedicados a transformar sua visão em realidade
          </p>
        </div>

        {/* Grid - Show 4 initially, all when expanded */}
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {displayedMembers.map((member, index) => (
            <div
              key={member.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <TeamMemberCard member={member} />
            </div>
          ))}
        </div>

        {/* Ver Mais Button */}
        {teamMembers.length > 4 && (
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={() => setShowAll(!showAll)}
              className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary via-violet-600 to-purple-600 px-8 py-4 font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
              aria-label={showAll ? 'Ver menos membros da equipe' : 'Ver mais membros da equipe'}
              aria-expanded={showAll}
            >
              {showAll ? 'Ver Menos' : 'Ver Mais'}
              <svg
                className={`h-5 w-5 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <div className="absolute left-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/40 to-violet-300/40 blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-purple-300/30 to-indigo-300/40 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>
    </section>
  );
};
