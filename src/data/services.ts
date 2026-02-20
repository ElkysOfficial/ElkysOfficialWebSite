import type { ComponentType } from "react";
import type { IconProps } from "@/assets/icons";
import { Code, Cog, Network, Wrench } from "@/assets/icons";

export interface ServiceBenefit {
  title: string;
  description: string;
}

export interface ServiceDetail {
  longDescription: string[];
  benefits: ServiceBenefit[];
  technologies: string[];
  useCases: string[];
}

export interface Service {
  icon: ComponentType<IconProps>;
  title: string;
  slug: string;
  description: string;
  features: string[];
  gradient: string;
  detail: ServiceDetail;
}

export const services: Service[] = [
  {
    icon: Code,
    slug: "desenvolvimento-sob-demanda",
    title: "Desenvolvimento Sob Demanda",
    description:
      "Projetamos e desenvolvemos aplicações sob medida, com arquitetura definida para performance, segurança e manutenibilidade a longo prazo.",
    features: [
      "Aplicações web e mobile com arquitetura escalável",
      "Sistemas de gestão e operações empresariais",
      "Plataformas de e-commerce e marketplaces",
      "Dashboards analíticos e relatórios executivos",
    ],
    gradient: "from-accent to-accent-light",
    detail: {
      longDescription: [
        "Cada empresa tem processos, regras de negócio e desafios únicos. Soluções prontas podem funcionar no início, mas rapidamente se tornam um gargalo quando o negócio cresce. Nosso serviço de desenvolvimento sob demanda resolve exatamente esse problema: construímos software feito sob medida para a sua operação.",
        "Trabalhamos com metodologias ágeis, entregas incrementais e comunicação transparente. Desde a fase de discovery até o deploy em produção, cada etapa é documentada e validada com o seu time. O resultado é um produto digital que realmente resolve problemas reais, sem funcionalidades desnecessárias.",
        "Nossa stack é moderna e orientada a performance: React, Node.js, TypeScript, bancos relacionais e NoSQL, infraestrutura cloud-native. Cada escolha técnica é fundamentada no contexto do projeto, priorizando manutenibilidade, segurança e escalabilidade.",
      ],
      benefits: [
        {
          title: "Arquitetura Escalável",
          description:
            "Sistemas projetados para crescer junto com o seu negócio, sem necessidade de reescritas custosas no futuro.",
        },
        {
          title: "Código Limpo e Documentado",
          description:
            "Base de código organizada, testada e documentada, facilitando manutenção e evolução por qualquer equipe técnica.",
        },
        {
          title: "Entregas Incrementais",
          description:
            "Metodologia ágil com sprints curtos e demos frequentes, garantindo alinhamento contínuo com suas expectativas.",
        },
        {
          title: "Suporte Pós-Entrega",
          description:
            "Acompanhamento técnico após o lançamento, incluindo monitoramento, correções e evoluções planejadas.",
        },
      ],
      technologies: [
        "React",
        "React Native",
        "Node.js",
        "TypeScript",
        "PostgreSQL",
        "MongoDB",
        "AWS",
        "Docker",
        "Next.js",
        "Tailwind CSS",
      ],
      useCases: [
        "Plataforma SaaS de busca inteligente de vagas com IA integrada",
        "Sistema de gestão operacional para empresa de logística com 200+ usuários",
        "Marketplace B2B para distribuidora com catálogo de 10 mil produtos",
        "Dashboard executivo com indicadores em tempo real para rede de franquias",
      ],
    },
  },
  {
    icon: Cog,
    slug: "automacao-e-rpa",
    title: "Automação e RPA",
    description:
      "Eliminamos gargalos operacionais com automações que reduzem custo, erro humano e tempo de execução em processos críticos.",
    features: [
      "Automação de processos de negócio (BPA)",
      "Integração entre sistemas legados e modernos",
      "Fluxos de trabalho automatizados com monitoramento",
      "Bots e assistentes para atendimento e operações",
    ],
    gradient: "from-accent to-accent-light",
    detail: {
      longDescription: [
        "Processos manuais repetitivos consomem tempo, geram erros e impedem que sua equipe foque no que realmente importa. Nossa especialidade é identificar esses gargalos e substituí-los por automações inteligentes que funcionam 24/7 com precisão e rastreabilidade.",
        "Atuamos desde o mapeamento de processos até a implementação de bots RPA, pipelines de dados automatizados e integrações entre sistemas. Cada automação é monitorada em tempo real, com alertas e dashboards que garantem visibilidade total sobre a operação.",
        "Combinamos ferramentas de mercado com desenvolvimento customizado para entregar soluções que se encaixam perfeitamente no fluxo de trabalho da sua empresa, sem forçar adaptações desnecessárias na sua operação.",
      ],
      benefits: [
        {
          title: "Redução de Custos Operacionais",
          description:
            "Automações que eliminam tarefas manuais repetitivas, liberando sua equipe para atividades estratégicas de maior valor.",
        },
        {
          title: "Zero Erro Humano",
          description:
            "Processos automatizados executam com precisão absoluta, eliminando retrabalho e inconsistências de dados.",
        },
        {
          title: "Operação 24/7",
          description:
            "Automações que funcionam ininterruptamente, processando dados e executando tarefas mesmo fora do horário comercial.",
        },
        {
          title: "Monitoramento em Tempo Real",
          description:
            "Dashboards e alertas que garantem visibilidade total sobre cada processo automatizado.",
        },
      ],
      technologies: [
        "Python",
        "Selenium",
        "Puppeteer",
        "Node.js",
        "n8n",
        "Apache Airflow",
        "Redis",
        "PostgreSQL",
        "Docker",
        "AWS Lambda",
      ],
      useCases: [
        "Automação de conciliação financeira que reduziu 40h mensais de trabalho manual",
        "Bot de monitoramento de preços com atualização automática de catálogo de fornecedores",
        "Pipeline de ETL automatizado para consolidação de dados de 5 sistemas diferentes",
        "Automação de onboarding de clientes com validação documental e criação de acessos",
      ],
    },
  },
  {
    icon: Network,
    slug: "integracoes-de-sistemas",
    title: "Integrações de Sistemas",
    description:
      "Conectamos sistemas, APIs e plataformas para criar um ecossistema operacional unificado e confiável.",
    features: [
      "APIs RESTful e microserviços",
      "Integração com ERPs, CRMs e plataformas fiscais",
      "Sincronização de dados em tempo real",
      "Middlewares customizados com alta disponibilidade",
    ],
    gradient: "from-accent to-accent-light",
    detail: {
      longDescription: [
        "Empresas em crescimento acumulam sistemas: ERP, CRM, plataforma fiscal, e-commerce, ferramentas de BI. Quando esses sistemas não conversam entre si, o resultado são dados duplicados, processos manuais de conciliação e decisões baseadas em informações desatualizadas.",
        "Nosso trabalho é conectar esse ecossistema de forma inteligente e confiável. Desenvolvemos APIs, middlewares e pipelines de dados que garantem sincronização em tempo real, tratamento de erros robusto e rastreabilidade completa de cada transação.",
        "Cada integração é projetada com resiliência em mente: filas de mensagens, retry automático, circuit breakers e logs detalhados. O resultado é uma operação unificada onde a informação flui de ponta a ponta sem intervenção manual.",
      ],
      benefits: [
        {
          title: "Dados Unificados",
          description:
            "Informação consistente e atualizada em todos os sistemas, eliminando retrabalho de conciliação manual.",
        },
        {
          title: "Arquitetura Resiliente",
          description:
            "Integrações com retry automático, circuit breakers e filas de mensagens que garantem confiabilidade mesmo sob falhas.",
        },
        {
          title: "Escalabilidade Horizontal",
          description:
            "Middlewares projetados para suportar aumento de volume sem degradação de performance ou perda de dados.",
        },
        {
          title: "Rastreabilidade Completa",
          description:
            "Logs detalhados e dashboards de monitoramento para cada transação processada entre sistemas.",
        },
      ],
      technologies: [
        "REST APIs",
        "GraphQL",
        "RabbitMQ",
        "Apache Kafka",
        "Node.js",
        "TypeScript",
        "PostgreSQL",
        "Redis",
        "Docker",
        "AWS",
      ],
      useCases: [
        "Integração bidirecional entre ERP TOTVS e plataforma de e-commerce com sincronização de estoque em tempo real",
        "Middleware de processamento fiscal conectando 3 sistemas com emissão automática de NF-e",
        "Pipeline de dados integrando CRM, BI e sistema de atendimento para visão 360° do cliente",
        "API gateway customizada para unificar 8 microsserviços com autenticação centralizada",
      ],
    },
  },
  {
    icon: Wrench,
    slug: "consultoria-tecnica-e-devops",
    title: "Consultoria Técnica e DevOps",
    description:
      "Avaliamos sua infraestrutura e processos de desenvolvimento para identificar riscos, gargalos e oportunidades de melhoria técnica.",
    features: [
      "Auditoria de arquitetura e código-fonte",
      "Implementação de pipelines CI/CD",
      "Code review e práticas de qualidade",
      "Otimização de performance e custos de infraestrutura",
    ],
    gradient: "from-accent to-accent-light",
    detail: {
      longDescription: [
        "Muitas empresas investem em tecnologia sem uma estratégia técnica clara. O resultado são sistemas frágeis, deploys arriscados, infraestrutura superdimensionada e equipes travadas por débito técnico acumulado. Nossa consultoria existe para mudar esse cenário.",
        "Começamos com um diagnóstico completo: analisamos arquitetura, código-fonte, infraestrutura, pipelines de deploy e práticas de desenvolvimento. A partir dessa análise, entregamos um roadmap priorizado com recomendações práticas e implementáveis.",
        "Além do diagnóstico, implementamos as melhorias junto com o seu time: pipelines CI/CD automatizados, monitoramento e observabilidade, práticas de code review, testes automatizados e otimização de custos de infraestrutura cloud.",
      ],
      benefits: [
        {
          title: "Diagnóstico Técnico Completo",
          description:
            "Análise detalhada de arquitetura, código, infraestrutura e processos com relatório executivo e roadmap de melhorias.",
        },
        {
          title: "Deploy Seguro e Automatizado",
          description:
            "Pipelines CI/CD que eliminam deploys manuais, reduzem riscos e permitem entregas frequentes com confiança.",
        },
        {
          title: "Redução de Custos Cloud",
          description:
            "Otimização de recursos de infraestrutura que pode reduzir custos em até 40% sem comprometer performance.",
        },
        {
          title: "Cultura de Qualidade",
          description:
            "Implementação de práticas de code review, testes automatizados e observabilidade que elevam o nível técnico do time.",
        },
      ],
      technologies: [
        "GitHub Actions",
        "GitLab CI",
        "Docker",
        "Kubernetes",
        "Terraform",
        "AWS",
        "Grafana",
        "Prometheus",
        "SonarQube",
        "Jest",
      ],
      useCases: [
        "Auditoria de arquitetura que identificou 12 vulnerabilidades críticas em sistema financeiro",
        "Implementação de CI/CD que reduziu tempo de deploy de 4 horas para 15 minutos",
        "Otimização de infraestrutura AWS com economia de R$ 8.000/mês sem perda de performance",
        "Reestruturação de práticas de desenvolvimento com redução de 60% nos bugs em produção",
      ],
    },
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
