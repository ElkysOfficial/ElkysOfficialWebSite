import type { ComponentType } from "react";
import type { IconProps } from "@/assets/icons";
import {
  Search,
  FileText,
  Target,
  Code,
  CheckCircle,
  Shield,
  Eye,
  Zap,
  Clock,
  Cog,
  Network,
  Wrench,
  TrendingUp,
} from "@/assets/icons";

// ============================================================================
// TYPES
// ============================================================================

export interface ProcessStep {
  number: number;
  title: string;
  description: string;
  icon: ComponentType<IconProps>;
  clientParticipation: boolean;
  duration?: string;
}

export interface DetailedProcessStep extends ProcessStep {
  details: string[];
  deliverables: string[];
}

export interface ServiceProcessStep {
  number: number;
  title: string;
  description: string;
  icon: ComponentType<IconProps>;
  clientParticipation: boolean;
  deliverables: string[];
}

export interface ServiceProcess {
  serviceSlug: string;
  heading: string;
  subtitle: string;
  steps: ServiceProcessStep[];
}

export interface WorkPhilosophy {
  heading: string;
  paragraphs: string[];
  highlights: Array<{ icon: ComponentType<IconProps>; label: string }>;
}

// ============================================================================
// ABOUT — FILOSOFIA DE TRABALHO
// ============================================================================

export const workPhilosophy: WorkPhilosophy = {
  heading: "Hexa Design System",
  paragraphs: [
    "O HDS estrutura cada projeto em 6 etapas com escopo fechado, entregáveis documentados e validação obrigatória entre etapas. O resultado: previsibilidade de prazo, controle de escopo e rastreabilidade de ponta a ponta, trazendo mais segurança e controle para os nossos clientes.",
  ],
  highlights: [
    { icon: Search, label: "Diagnóstico antes de proposta" },
    { icon: Eye, label: "Visibilidade total do progresso" },
    { icon: CheckCircle, label: "Entregas quinzenais validadas" },
    { icon: Shield, label: "Suporte pós-entrega" },
  ],
};

// ============================================================================
// HOME — ETAPAS RESUMIDAS (6 passos)
// ============================================================================

export const homepageSummarySteps: ProcessStep[] = [
  {
    number: 1,
    title: "Diagnóstico e Entendimento",
    description:
      "Escutamos seu desafio, mapeamos necessidades e avaliamos viabilidade técnica antes de qualquer proposta.",
    icon: Search,
    clientParticipation: true,
  },
  {
    number: 2,
    title: "Proposta Técnica",
    description:
      "Apresentamos escopo, cronograma, investimento e condições com total clareza. Sem surpresas.",
    icon: FileText,
    clientParticipation: true,
  },
  {
    number: 3,
    title: "Arquitetura e Planejamento",
    description:
      "Definimos a arquitetura da solução, stack tecnológica e roadmap de entregas antes de escrever a primeira linha de código.",
    icon: Target,
    clientParticipation: false,
  },
  {
    number: 4,
    title: "Desenvolvimento Iterativo",
    description:
      "Construímos em ciclos curtos com entregas frequentes, demos ao vivo e ajustes validados a cada etapa.",
    icon: Code,
    clientParticipation: true,
  },
  {
    number: 5,
    title: "Validação e Entrega",
    description:
      "Testes rigorosos, homologação conjunta e deploy em produção com acompanhamento técnico dedicado.",
    icon: CheckCircle,
    clientParticipation: true,
  },
  {
    number: 6,
    title: "Suporte e Evolução",
    description:
      "Monitoramento pós-lançamento, correções prioritárias e planejamento de evoluções contínuas.",
    icon: Shield,
    clientParticipation: false,
  },
];

// ============================================================================
// HOME — ETAPAS DETALHADAS (8 fases legado — mantido para compatibilidade)
// ============================================================================

export const detailedProcessSteps: DetailedProcessStep[] = [
  {
    number: 1,
    title: "Imersão",
    description:
      "Entendemos seu negócio, mapeamos desafios e identificamos o resultado esperado antes de qualquer proposta.",
    icon: Search,
    clientParticipation: true,
    duration: "1–3 dias",
    details: [
      "Cada projeto no HDS começa por entender o contexto real do cliente. Antes de falar de tecnologia, investigamos o modelo de negócio, os processos internos, as dores operacionais e o resultado que a solução precisa gerar.",
      "O objetivo desta fase é garantir que a equipe técnica tenha domínio suficiente do cenário para propor a abordagem mais eficaz — eliminando retrabalho e decisões baseadas em suposições.",
    ],
    deliverables: [
      "Briefing estruturado do projeto",
      "Mapa de necessidades e restrições",
      "Identificação de riscos e dependências",
    ],
  },
  {
    number: 2,
    title: "Diagnóstico",
    description:
      "Avaliamos viabilidade técnica, complexidade e a abordagem mais eficaz para a sua operação.",
    icon: Eye,
    clientParticipation: true,
    duration: "3–5 dias",
    details: [
      "Com o contexto mapeado, a equipe de engenharia analisa viabilidade, integrações necessárias, requisitos de performance e restrições de infraestrutura. Cada variável é avaliada para fundamentar decisões técnicas sólidas.",
      "O diagnóstico do HDS é o que diferencia uma proposta genérica de uma solução projetada para o seu cenário. Toda a arquitetura e estimativa de prazo partem deste documento.",
    ],
    deliverables: [
      "Documento de diagnóstico técnico",
      "Análise de viabilidade e riscos",
      "Recomendação de abordagem técnica",
    ],
  },
  {
    number: 3,
    title: "Acordo Formal",
    description:
      "Escopo, cronograma, investimento e responsabilidades formalizados com total transparência.",
    icon: FileText,
    clientParticipation: true,
    duration: "2 á 3 dias",
    details: [
      "A proposta no HDS detalha escopo funcional, cronograma com marcos de entrega, investimento e condições contratuais. Cada item é apresentado para que a decisão seja tomada com segurança e clareza.",
      "O projeto só avança quando ambos os lados estão alinhados. O acordo formal define critérios de aceite, marcos de validação e responsabilidades de cada parte.",
    ],
    deliverables: [
      "Proposta comercial e técnica detalhada",
      "Cronograma com marcos de entrega",
      "Contrato com SLA e critérios de aceite",
    ],
  },
  {
    number: 4,
    title: "Arquitetura",
    description:
      "Definição técnica da solução, stack tecnológica e estrutura de entrega antes do primeiro código.",
    icon: Target,
    clientParticipation: false,
    duration: "5–7 dias",
    details: [
      "Nossos engenheiros definem a arquitetura da solução: modelagem de dados, estrutura de APIs, padrões de desenvolvimento e estratégia de testes. Nada é improvisado.",
      "O planejamento inclui priorização do backlog por valor de negócio, definição dos ciclos de entrega e configuração dos ambientes de desenvolvimento, teste e homologação.",
    ],
    deliverables: [
      "Documento de arquitetura técnica",
      "Backlog priorizado por valor de negócio",
      "Ambientes de desenvolvimento e teste",
      "Protótipos ou wireframes quando aplicável",
    ],
  },
  {
    number: 5,
    title: "Engenharia",
    description:
      "Construção iterativa em ciclos quinzenais com validação contínua e demonstrações ao vivo.",
    icon: Code,
    clientParticipation: true,
    duration: "Ciclos de 14 dias",
    details: [
      "O HDS opera em ciclos de 14 dias. Cada ciclo entrega funcionalidades testáveis e demonstráveis, com sessão de validação ao vivo com os stakeholders ao final de cada sprint.",
      "Esse modelo garante que desvios sejam identificados cedo, ajustes de escopo sejam controlados e o produto final reflita exatamente o que foi validado em cada etapa.",
    ],
    deliverables: [
      "Funcionalidades entregues por ciclo",
      "Demonstrações ao vivo com stakeholders",
      "Relatório de progresso por sprint",
      "Acesso ao ambiente de homologação",
    ],
  },
  {
    number: 6,
    title: "Validação",
    description:
      "Testes automatizados, revisão de segurança e aprovação formal como gate para produção.",
    icon: CheckCircle,
    clientParticipation: true,
    duration: "5 á 10 dias",
    details: [
      "Antes da ativação, a solução passa por rodadas de testes unitários, integração, performance e segurança. O ambiente de homologação fica disponível para que o cliente execute seus próprios cenários de validação.",
      "Nenhum deploy acontece sem aprovação formal. O termo de aceite é o gate que garante que o que vai para produção foi validado por ambas as partes.",
    ],
    deliverables: [
      "Relatório de testes com cobertura",
      "Ambiente de homologação acessível",
      "Termo de aceite formal",
      "Checklist de ativação revisado",
    ],
  },
  {
    number: 7,
    title: "Ativação",
    description:
      "Deploy estruturado com monitoramento em tempo real e plano de contingência pronto.",
    icon: Zap,
    clientParticipation: true,
    duration: "1–3 dias",
    details: [
      "A ativação segue um protocolo estruturado: migração de dados, configuração de ambiente, monitoramento em tempo real e validação final com o cliente.",
      "Mantemos plano de rollback pronto para execução imediata. Após a ativação, a equipe técnica monitora o sistema nas primeiras 48 horas para garantir estabilidade total.",
    ],
    deliverables: [
      "Sistema operacional em produção",
      "Plano de rollback documentado",
      "Monitoramento ativo configurado",
      "Capacitação da equipe do cliente",
    ],
  },
  {
    number: 8,
    title: "Evolução",
    description:
      "Suporte dedicado, monitoramento contínuo e planejamento de evoluções com a mesma disciplina.",
    icon: Shield,
    clientParticipation: false,
    duration: "Contínuo",
    details: [
      "O compromisso do HDS não termina no deploy. Oferecemos suporte técnico dedicado com correções prioritárias, monitoramento de performance e acompanhamento da adoção pelo time do cliente.",
      "Para projetos com demanda contínua, estruturamos ciclos de evolução com backlog priorizado, mantendo o mesmo rigor e transparência de todas as fases anteriores.",
    ],
    deliverables: [
      "Canal de suporte técnico dedicado",
      "Monitoramento de performance em produção",
      "Relatório mensal de operação",
      "Roadmap de evolução quando aplicável",
    ],
  },
];

// ============================================================================
// COMO TRABALHAMOS — 6 etapas CONSOLIDADAS (HDS)
// ============================================================================

export const processSteps6: DetailedProcessStep[] = [
  {
    number: 1,
    title: "Imersão & Diagnóstico",
    description:
      "Entendemos o negócio, mapeamos riscos e avaliamos viabilidade técnica antes de qualquer proposta.",
    icon: Search,
    clientParticipation: true,
    duration: "3 á 7 dias",
    details: [
      "Cada projeto no HDS começa por entender o contexto real do cliente. Antes de falar de tecnologia, investigamos o modelo de negócio, os processos internos, as dores operacionais e o resultado que a solução precisa gerar.",
      "A equipe de engenharia analisa viabilidade, integrações necessárias, requisitos de performance e restrições de infraestrutura. O diagnóstico do HDS é o que diferencia uma proposta genérica de uma solução projetada para o seu cenário.",
    ],
    deliverables: [
      "Briefing estruturado do projeto",
      "Mapa de necessidades e restrições",
      "Documento de diagnóstico técnico",
      "Análise de viabilidade e riscos",
      "Recomendação de abordagem técnica",
    ],
  },
  {
    number: 2,
    title: "Acordo Formal",
    description:
      "Escopo, cronograma, investimento e responsabilidades formalizados com total transparência.",
    icon: FileText,
    clientParticipation: true,
    duration: "2 á 3 dias",
    details: [
      "A proposta no HDS detalha escopo funcional, cronograma com marcos de entrega, investimento e condições contratuais. Cada item é apresentado para que a decisão seja tomada com segurança e clareza.",
      "O projeto só avança quando ambos os lados estão alinhados. O acordo formal define critérios de aceite, marcos de validação e responsabilidades de cada parte.",
    ],
    deliverables: [
      "Proposta comercial e técnica detalhada",
      "Cronograma com marcos de entrega",
      "Contrato com SLA e critérios de aceite",
    ],
  },
  {
    number: 3,
    title: "Arquitetura",
    description:
      "Definição técnica, modelagem de dados, backlog priorizado e configuração de ambientes antes do primeiro ciclo.",
    icon: Target,
    clientParticipation: false,
    duration: "5 á 10 dias",
    details: [
      "Nossos engenheiros definem a arquitetura da solução: modelagem de dados, estrutura de APIs, padrões de desenvolvimento e estratégia de testes. Nada é improvisado.",
      "O planejamento inclui priorização do backlog por valor de negócio, definição dos ciclos de entrega e configuração dos ambientes de desenvolvimento, teste e homologação.",
    ],
    deliverables: [
      "Documento de arquitetura técnica",
      "Backlog priorizado por valor de negócio",
      "Ambientes de desenvolvimento e teste",
      "Protótipos ou wireframes quando aplicável",
    ],
  },
  {
    number: 4,
    title: "Engenharia",
    description:
      "Construção iterativa em ciclos quinzenais com validação contínua e demonstrações ao vivo.",
    icon: Code,
    clientParticipation: true,
    duration: "Ciclos de 14 dias",
    details: [
      "O HDS opera em ciclos de 14 dias. Cada ciclo entrega funcionalidades testáveis e demonstráveis, com sessão de validação ao vivo com os stakeholders ao final de cada sprint.",
      "Esse modelo garante que desvios sejam identificados cedo, ajustes de escopo sejam controlados e o produto final reflita exatamente o que foi validado em cada etapa.",
    ],
    deliverables: [
      "Funcionalidades entregues por ciclo",
      "Demonstrações ao vivo com stakeholders",
      "Relatório de progresso por sprint",
      "Acesso ao ambiente de homologação",
    ],
  },
  {
    number: 5,
    title: "Validação & Ativação",
    description:
      "Testes rigorosos, aprovação formal e deploy estruturado com monitoramento em tempo real.",
    icon: CheckCircle,
    clientParticipation: true,
    duration: "5 á 10 dias",
    details: [
      "Antes da ativação, a solução passa por rodadas de testes unitários, integração, performance e segurança. O ambiente de homologação fica disponível para que o cliente execute seus próprios cenários de validação.",
      "A ativação segue um protocolo estruturado: migração de dados, configuração de ambiente, monitoramento em tempo real e validação final. Mantemos plano de rollback pronto e monitoramento ativo nas primeiras 48 horas.",
    ],
    deliverables: [
      "Relatório de testes com cobertura",
      "Termo de aceite formal",
      "Sistema operacional em produção",
      "Plano de rollback documentado",
      "Monitoramento ativo configurado",
    ],
  },
  {
    number: 6,
    title: "Evolução",
    description:
      "Suporte dedicado, monitoramento contínuo e planejamento de evoluções com a mesma disciplina.",
    icon: Shield,
    clientParticipation: false,
    duration: "Contínuo",
    details: [
      "O compromisso do HDS não termina no deploy. Oferecemos suporte técnico dedicado com correções prioritárias, monitoramento de performance e acompanhamento da adoção pelo time do cliente.",
      "Para projetos com demanda contínua, estruturamos ciclos de evolução com backlog priorizado, mantendo o mesmo rigor e transparência de todas as fases anteriores.",
    ],
    deliverables: [
      "Canal de suporte técnico dedicado",
      "Monitoramento de performance em produção",
      "Relatório mensal de operação",
      "Roadmap de evolução quando aplicável",
    ],
  },
];

// ============================================================================
// HOME — CARDS INFORMATIVOS (metodologia, cronograma, participação)
// ============================================================================

export const processInfoCards = [
  {
    icon: Clock,
    title: "Ciclos quinzenais de entrega",
    description:
      "Cada ciclo do HDS entrega funcionalidades testáveis em 14 dias. Demonstração ao vivo, relatório de progresso e alinhamento de prioridades ao final de cada sprint.",
    items: [
      "Entregas demonstráveis a cada 2 semanas",
      "Sessões de validação com stakeholders",
      "Checkpoints formais de aprovação",
      "Controle de escopo a cada ciclo",
    ],
  },
  {
    icon: Eye,
    title: "Governança compartilhada",
    description:
      "Você participa das decisões que impactam o resultado, valida entregas em primeira mão e acompanha cada etapa em tempo real.",
    items: [
      "Aprovação de escopo e prioridades",
      "Validação de entregas a cada sprint",
      "Acesso direto ao ambiente de homologação",
      "Comunicação direta com a equipe técnica",
    ],
  },
  {
    icon: Shield,
    title: "Suporte pós-entrega",
    description:
      "O projeto não termina no deploy. Garantimos estabilidade operacional, capacitação e um caminho claro para evoluções futuras.",
    items: [
      "Suporte técnico pós-ativação dedicado",
      "Capacitação da equipe do cliente",
      "Monitoramento ativo em produção",
      "Planejamento estruturado de evoluções",
    ],
  },
];

// ============================================================================
// SERVICE DETAIL — PROCESSOS POR SERVIÇO
// ============================================================================

export const serviceProcesses: ServiceProcess[] = [
  {
    serviceSlug: "desenvolvimento-sob-demanda",
    heading: "Como este projeto é conduzido",
    subtitle:
      "Do levantamento de requisitos ao suporte pós-lançamento, cada fase é documentada e validada.",
    steps: [
      {
        number: 1,
        title: "Discovery e Requisitos",
        description:
          "Levantamento completo de necessidades, mapeamento de funcionalidades e definição de prioridades com seu time.",
        icon: Search,
        clientParticipation: true,
        deliverables: [
          "Documento de requisitos",
          "User stories priorizadas",
          "Protótipo navegável",
        ],
      },
      {
        number: 2,
        title: "Arquitetura e Prototipagem",
        description:
          "Definição da estrutura técnica, modelagem de dados e validação do protótipo funcional.",
        icon: Target,
        clientParticipation: true,
        deliverables: ["Diagrama de arquitetura", "Modelo de dados", "Protótipo aprovado"],
      },
      {
        number: 3,
        title: "Sprints de Desenvolvimento",
        description:
          "Construção iterativa com demos a cada 14 dias, testes contínuos e ajustes validados.",
        icon: Code,
        clientParticipation: true,
        deliverables: ["Entregas funcionais por sprint", "Demo ao vivo", "Relatório de progresso"],
      },
      {
        number: 4,
        title: "Deploy e Suporte",
        description:
          "Implantação em produção com monitoramento ativo, treinamento e plano de suporte contínuo.",
        icon: Shield,
        clientParticipation: true,
        deliverables: ["Ambiente de produção", "Documentação técnica", "Plano de suporte"],
      },
    ],
  },
  {
    serviceSlug: "automacao-e-rpa",
    heading: "Como este projeto é conduzido",
    subtitle:
      "Do mapeamento de processos à ativação monitorada, cada automação é validada antes de entrar em operação.",
    steps: [
      {
        number: 1,
        title: "Mapeamento de Processos",
        description:
          "Análise detalhada dos fluxos atuais, identificação de gargalos e priorização dos pontos de automação.",
        icon: Search,
        clientParticipation: true,
        deliverables: [
          "Mapa de processos",
          "Pontos de automação priorizados",
          "Análise de ROI estimado",
        ],
      },
      {
        number: 2,
        title: "Desenho da Automação",
        description: "Definição do fluxo automatizado, regras de negócio e tratamento de exceções.",
        icon: FileText,
        clientParticipation: true,
        deliverables: ["Fluxograma técnico", "Regras de negócio documentadas", "Plano de testes"],
      },
      {
        number: 3,
        title: "Desenvolvimento e Testes",
        description:
          "Implementação da automação com testes em ambiente controlado e validação de cenários de exceção.",
        icon: Cog,
        clientParticipation: false,
        deliverables: ["Automação funcional", "Relatório de testes", "Documentação operacional"],
      },
      {
        number: 4,
        title: "Ativação e Monitoramento",
        description:
          "Deploy em produção com dashboards de acompanhamento e alertas configurados para garantir estabilidade.",
        icon: Zap,
        clientParticipation: true,
        deliverables: ["Dashboard de monitoramento", "Alertas configurados", "Runbook operacional"],
      },
    ],
  },
  {
    serviceSlug: "integracoes-de-sistemas",
    heading: "Como este projeto é conduzido",
    subtitle:
      "Do diagnóstico do ecossistema à observabilidade em produção, cada integração é projetada para resiliência.",
    steps: [
      {
        number: 1,
        title: "Diagnóstico do Ecossistema",
        description:
          "Mapeamento de todos os sistemas, APIs existentes, fluxos de dados e pontos de falha atuais.",
        icon: Search,
        clientParticipation: true,
        deliverables: [
          "Mapa de integrações",
          "Análise de APIs existentes",
          "Diagnóstico de gargalos",
        ],
      },
      {
        number: 2,
        title: "Projeto de Integração",
        description:
          "Definição de contratos de API, padrões de comunicação e estratégia de resiliência.",
        icon: Network,
        clientParticipation: true,
        deliverables: ["Diagrama de integração", "Contratos de API", "Estratégia de fallback"],
      },
      {
        number: 3,
        title: "Desenvolvimento e Testes de Carga",
        description:
          "Implementação das integrações com testes unitários, de integração e de carga para garantir performance.",
        icon: Code,
        clientParticipation: false,
        deliverables: [
          "APIs implementadas",
          "Relatório de testes de carga",
          "Documentação técnica",
        ],
      },
      {
        number: 4,
        title: "Ativação e Observabilidade",
        description:
          "Deploy com monitoramento de ponta a ponta, logs estruturados e dashboards de operação.",
        icon: Eye,
        clientParticipation: true,
        deliverables: [
          "Integrações em produção",
          "Dashboard de monitoramento",
          "Runbook de operação",
        ],
      },
    ],
  },
  {
    serviceSlug: "consultoria-tecnica-e-devops",
    heading: "Como este projeto é conduzido",
    subtitle:
      "Da auditoria técnica ao acompanhamento de resultados, cada recomendação é implementável e mensurável.",
    steps: [
      {
        number: 1,
        title: "Auditoria Técnica",
        description:
          "Análise completa de arquitetura, código-fonte, infraestrutura e práticas de desenvolvimento.",
        icon: Search,
        clientParticipation: true,
        deliverables: ["Relatório de auditoria", "Score de maturidade técnica", "Mapa de riscos"],
      },
      {
        number: 2,
        title: "Roadmap de Melhorias",
        description:
          "Plano priorizado com recomendações práticas, estimativa de impacto e sequência de execução.",
        icon: FileText,
        clientParticipation: true,
        deliverables: ["Roadmap priorizado", "Estimativa de impacto", "Plano de ação"],
      },
      {
        number: 3,
        title: "Implementação Assistida",
        description:
          "Execução das melhorias junto com seu time, incluindo pipelines, práticas e treinamento.",
        icon: Wrench,
        clientParticipation: true,
        deliverables: ["Pipelines CI/CD", "Práticas implementadas", "Treinamento da equipe"],
      },
      {
        number: 4,
        title: "Acompanhamento e Métricas",
        description:
          "Monitoramento dos indicadores de melhoria e ajustes contínuos até atingir as metas definidas.",
        icon: TrendingUp,
        clientParticipation: false,
        deliverables: [
          "Dashboard de métricas",
          "Relatório de evolução",
          "Recomendações de próximos passos",
        ],
      },
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export function getServiceProcess(slug: string): ServiceProcess | undefined {
  return serviceProcesses.find((sp) => sp.serviceSlug === slug);
}
