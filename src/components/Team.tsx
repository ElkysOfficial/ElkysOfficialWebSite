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
    name: "Nome do Membro",
    role: "CEO & Founder",
    bio: "Breve descrição sobre a experiência e expertise do membro da equipe.",
    image: "/imgs/team/member-1.jpg",
    linkedin: "https://linkedin.com/in/",
  },
  {
    id: 2,
    name: "Nome do Membro",
    role: "CTO",
    bio: "Breve descrição sobre a experiência e expertise do membro da equipe.",
    image: "/imgs/team/member-2.jpg",
    linkedin: "https://linkedin.com/in/",
  },
  {
    id: 3,
    name: "Nome do Membro",
    role: "Head of Design",
    bio: "Breve descrição sobre a experiência e expertise do membro da equipe.",
    image: "/imgs/team/member-3.jpg",
    linkedin: "https://linkedin.com/in/",
  },
  {
    id: 4,
    name: "Nome do Membro",
    role: "Lead Developer",
    bio: "Breve descrição sobre a experiência e expertise do membro da equipe.",
    image: "/imgs/team/member-4.jpg",
    linkedin: "https://linkedin.com/in/",
  },
  {
    id: 5,
    name: "Nome do Membro",
    role: "Marketing Director",
    bio: "Breve descrição sobre a experiência e expertise do membro da equipe.",
    image: "/imgs/team/member-5.jpg",
    linkedin: "https://linkedin.com/in/",
  },
  {
    id: 6,
    name: "Nome do Membro",
    role: "Product Manager",
    bio: "Breve descrição sobre a experiência e expertise do membro da equipe.",
    image: "/imgs/team/member-6.jpg",
    linkedin: "https://linkedin.com/in/",
  },
  {
    id: 7,
    name: "Nome do Membro",
    role: "Senior Developer",
    bio: "Breve descrição sobre a experiência e expertise do membro da equipe.",
    image: "/imgs/team/member-7.jpg",
    linkedin: "https://linkedin.com/in/",
  },
  {
    id: 8,
    name: "Nome do Membro",
    role: "UX Designer",
    bio: "Breve descrição sobre a experiência e expertise do membro da equipe.",
    image: "/imgs/team/member-8.jpg",
    linkedin: "https://linkedin.com/in/",
  },
];

const TeamMemberCard = ({ member }: { member: TeamMember }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative">
      {/* Card Container */}
      <div className="relative overflow-hidden rounded-2xl bg-white transition-all duration-500 hover:shadow-elegant">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {!imageError ? (
            <img
              src={member.image}
              alt={member.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-4xl font-light text-primary">
                  {member.name.charAt(0)}
                </span>
              </div>
            </div>
          )}

          {/* LinkedIn Overlay - Appears on hover */}
          <div className="absolute inset-0 bg-primary/95 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-center justify-center">
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="transform scale-75 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100"
            >
              <div className="rounded-full bg-white p-4 shadow-glow transition-transform hover:scale-110">
                <Linkedin className="h-8 w-8 text-primary" />
              </div>
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="mb-1 text-xl font-semibold text-foreground transition-colors">
            {member.name}
          </h3>
          <p className="mb-3 text-sm font-medium text-primary">
            {member.role}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {member.bio}
          </p>
        </div>
      </div>
    </div>
  );
};

export const Team = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-24 md:py-32">
      <div className="container mx-auto px-4">
        {/* Header - Apple-style minimal */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Nossa Equipe
          </h2>
          <p className="text-lg text-muted-foreground md:text-xl">
            Conheça as pessoas que tornam tudo possível
          </p>
        </div>

        {/* Grid - Responsive layout */}
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 lg:grid-cols-4">
          {teamMembers.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>

      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-full opacity-30">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
      </div>
    </section>
  );
};
