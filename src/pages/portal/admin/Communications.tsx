/**
 * Dashboard de Comunicacoes (portal admin).
 *
 * Mostra metricas de rastreio dos e-mails enviados pelo portal:
 * total enviado, taxa de entrega, taxa de abertura (pixel) e taxa de
 * clique (link encurtado). Inclui serie temporal, desempenho por tipo
 * de comunicacao e tabela das comunicacoes recentes.
 *
 * Fonte: tabelas `communications` e `tracking_events` (migration
 * 20260518120000_communication_tracking.sql).
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { loadCommunications, loadTrackingEvents } from "@/lib/portal-data";
import { useAdminClients } from "@/hooks/useAdminClients";
import { getClientDisplayName } from "@/lib/portal";
import { supabase } from "@/integrations/supabase/client";
import { Button, Card, CardContent, cn } from "@/design-system";
import { BarChart as BarChartIcon, Eye, ExternalLink, Send, Users } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/admin/AdminEmptyState";
import MetricTile from "@/components/portal/shared/MetricTile";
import PortalLoading from "@/components/portal/shared/PortalLoading";
import StatusBadge from "@/components/portal/shared/StatusBadge";

type Channel = "all" | "email" | "whatsapp";
const CHANNELS: { value: Channel; label: string }[] = [
  { value: "all", label: "Todos os canais" },
  { value: "email", label: "Somente e-mail" },
  { value: "whatsapp", label: "Somente WhatsApp" },
];

const CHART_COLORS = {
  brand: "hsl(var(--elk-primary))",
  accent: "hsl(var(--elk-accent))",
  success: "hsl(var(--elk-success))",
  warning: "hsl(var(--elk-warning))",
  destructive: "hsl(var(--elk-destructive))",
  grid: "hsl(var(--elk-border))",
  muted: "hsl(var(--elk-muted-foreground))",
};

/** Rotulos em PT-BR para o campo `kind` das comunicacoes. */
const KIND_LABELS: Record<string, string> = {
  invoice_due: "Lembrete de fatura",
  charge_overdue: "Cobrança vencida",
  inadimplencia_warning: "Aviso de inadimplência",
  installment_paid: "Parcela paga",
  document_added: "Documento adicionado",
  proposal_sent: "Proposta enviada",
  proposal_expiry: "Proposta expirando",
  proposal_expired: "Proposta expirada",
  contract_validation: "Validação de contrato",
  project_created: "Projeto criado",
  project_stage: "Mudança de etapa",
  project_completed: "Projeto concluído",
  client_welcome: "Boas-vindas (cliente)",
  client_action: "Ação necessária",
  ticket_opened: "Ticket aberto",
  ticket_updated: "Ticket atualizado",
  notification: "Comunicado",
  team_welcome: "Boas-vindas (equipe)",
  password_reset: "Redefinição de senha",
};

/**
 * Classifica a audiencia de cada tipo de comunicacao. Sem isso, todas as
 * mensagens caem no balde "cliente" e a UI mostra "Sem cliente vinculado"
 * para envios que sao deliberadamente internos (boas-vindas de membro novo
 * ou alerta de ticket pra equipe de suporte).
 *
 *   "cliente"  → destinatario e o cliente da Elkys
 *   "equipe"   → destinatario e um membro da equipe interna
 *   "sistema"  → fluxo automatico sem alvo humano fixo (recuperacao de senha)
 */
type Audience = "cliente" | "equipe" | "sistema";

const KIND_AUDIENCE: Record<string, Audience> = {
  team_welcome: "equipe",
  ticket_opened: "equipe",
  password_reset: "sistema",
};

function audienceOf(kind: string): Audience {
  return KIND_AUDIENCE[kind] ?? "cliente";
}

function audienceLabel(aud: Audience): string {
  if (aud === "equipe") return "Equipe Elkys";
  if (aud === "sistema") return "Sistema (envio automático)";
  return "Cliente";
}

function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}

const PERIODS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
] as const;

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function pct(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function formatDayShort(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Tooltip simples reutilizado pelos graficos. */
interface TooltipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: { name?: string; value?: number; color?: string };
}
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      {label ? <p className="mb-1 font-semibold text-foreground">{label}</p> : null}
      {payload.map((entry, i) => (
        <p key={`${entry.name}-${i}`} className="text-muted-foreground">
          <span
            className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
            style={{ backgroundColor: entry.color ?? entry.payload?.color }}
          />
          {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Carregamento auxiliar — team_members p/ resolver email->nome em comms
 * internas. Tabela pequena (dezenas de linhas), cache longo.
 * -------------------------------------------------------------------------- */

interface TeamMemberLite {
  email: string;
  full_name: string;
}

async function loadTeamMembersLite(): Promise<TeamMemberLite[]> {
  const { data } = await supabase.from("team_members").select("email, full_name");
  return (data ?? []).filter((t): t is TeamMemberLite => !!t.email && !!t.full_name);
}

type AudienceTab = "cliente" | "equipe" | "sistema";
const AUDIENCE_TABS: { value: AudienceTab; label: string; description: string }[] = [
  {
    value: "cliente",
    label: "Clientes",
    description: "Mensagens enviadas para a carteira (cobranças, propostas, projetos, suporte).",
  },
  {
    value: "equipe",
    label: "Equipe Elkys",
    description: "Alertas internos. Boas-vindas de novo membro e tickets abertos por clientes.",
  },
  {
    value: "sistema",
    label: "Sistema",
    description: "Envios automáticos sem alvo humano fixo (recuperação de senha).",
  },
];

export default function Communications() {
  const [days, setDays] = useState<number>(30);
  const [channel, setChannel] = useState<Channel>("all");
  const [audienceTab, setAudienceTab] = useState<AudienceTab>("cliente");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [clientSearch, setClientSearch] = useState<string>("");

  const sinceIso = useMemo(() => new Date(Date.now() - days * 86_400_000).toISOString(), [days]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-communications", days],
    queryFn: async () => {
      const [comms, events] = await Promise.all([
        loadCommunications(sinceIso),
        loadTrackingEvents(sinceIso),
      ]);
      if (comms.error) throw comms.error;
      if (events.error) throw events.error;
      return { communications: comms.data, events: events.data };
    },
    staleTime: 60_000,
  });

  // Mapa de client_id para nome — usado para resolver "Cliente arquivado".
  // useAdminClients retorna o array direto (ja inclui inativos: nao ha filtro
  // is_active na query). Use clientsBundle como array — antes o codigo
  // acessava .clients e o map ficava sempre vazio.
  const { data: clientsBundle } = useAdminClients();
  const allClients = clientsBundle ?? [];
  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of allClients) {
      map.set(c.id, getClientDisplayName(c));
    }
    return map;
  }, [allClients]);

  // Mapa email->nome dos membros da equipe — resolve audience='equipe' para
  // mostrar quem realmente recebeu o envio interno em vez do generico
  // "Equipe Elkys".
  const { data: teamMembers } = useQuery({
    queryKey: ["admin-team-members-lite"],
    queryFn: loadTeamMembersLite,
    staleTime: 5 * 60 * 1000,
  });
  const teamNameByEmail = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of teamMembers ?? []) {
      map.set(m.email.toLowerCase(), m.full_name);
    }
    return map;
  }, [teamMembers]);

  // Filtro de cliente — lista ordenada por nome para o combobox.
  const clientFilterOptions = useMemo(() => {
    const list = allClients
      .map((c) => ({ id: c.id, name: getClientDisplayName(c), active: c.is_active }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const q = clientSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => c.name.toLowerCase().includes(q));
  }, [allClients, clientSearch]);

  const selectedClientName =
    clientFilter !== "all" ? (clientNameById.get(clientFilter) ?? "Cliente arquivado") : null;

  const metrics = useMemo(() => {
    const rawComms = data?.communications ?? [];
    const events = data?.events ?? [];

    // Aplica filtro de AUDIENCIA (aba selecionada). Cada aba mostra so
    // mensagens daquela audiencia — isso e que faz a tela parar de misturar
    // e-mail interno com cliente, ja que sao decisoes operacionais diferentes.
    const audienceFiltered = rawComms.filter((c) => audienceOf(c.kind) === audienceTab);

    // Aplica filtro de cliente (so faz sentido na aba Clientes; nas outras
    // o select fica oculto e clientFilter='all').
    const comms =
      clientFilter === "all"
        ? audienceFiltered
        : audienceFiltered.filter((c) => c.client_id === clientFilter);
    const commIds = new Set(comms.map((c) => c.id));
    const scopedEvents =
      clientFilter === "all" ? events : events.filter((e) => commIds.has(e.communication_id));

    // Eventos por canal.
    const emailClickIds = new Set(
      scopedEvents
        .filter((e) => e.event_type === "click" && (e.channel ?? "email") === "email")
        .map((e) => e.communication_id)
    );
    const waClickIds = new Set(
      scopedEvents
        .filter((e) => e.event_type === "click" && e.channel === "whatsapp")
        .map((e) => e.communication_id)
    );
    const openIds = new Set(
      scopedEvents.filter((e) => e.event_type === "open").map((e) => e.communication_id)
    );

    const emailSentComms = comms.filter((c) => c.email_status === "sent");
    const waSentComms = comms.filter((c) => c.whatsapp_status === "sent");

    const inScopeComms =
      channel === "email"
        ? emailSentComms
        : channel === "whatsapp"
          ? waSentComms
          : (() => {
              const seen = new Set<string>();
              const merged: typeof comms = [];
              for (const c of [...emailSentComms, ...waSentComms]) {
                if (!seen.has(c.id)) {
                  seen.add(c.id);
                  merged.push(c);
                }
              }
              return merged;
            })();

    const didOpen = (id: string) => channel !== "whatsapp" && openIds.has(id);
    const didClick = (id: string) => {
      if (channel === "email") return emailClickIds.has(id);
      if (channel === "whatsapp") return waClickIds.has(id);
      return emailClickIds.has(id) || waClickIds.has(id);
    };

    const totalSent = inScopeComms.length;
    const opens = inScopeComms.filter((c) => didOpen(c.id)).length;
    const clicks = inScopeComms.filter((c) => didClick(c.id)).length;
    // Para a taxa "clique / abertura" precisamos comparar e-mail com e-mail
    // (denominadores compativeis). Se misturarmos cliques de WhatsApp com
    // aberturas — que so existem em e-mail —, a taxa pode passar de 100%.
    const emailClicksOnly = inScopeComms.filter((c) => emailClickIds.has(c.id)).length;
    const waOnlyClicks = inScopeComms.filter(
      (c) => waClickIds.has(c.id) && !emailClickIds.has(c.id)
    ).length;
    // "Clicou sem abrir" e legitimo: pixel bloqueado (Outlook, proxy do
    // Gmail/Apple Mail, modo offline). A leitura aconteceu, o pixel nao
    // chegou a disparar. Listamos quem foi pra dar nome e nao apenas
    // contagem — gestor consegue acionar individualmente.
    const clickedWithoutOpenList = inScopeComms
      .filter((c) => emailClickIds.has(c.id) && !openIds.has(c.id))
      .map((c) => {
        const aud = audienceOf(c.kind);
        let name: string;
        if (aud === "cliente") {
          name = c.client_id
            ? (clientNameById.get(c.client_id) ?? "Cliente arquivado")
            : "Cliente não identificado";
        } else if (aud === "equipe") {
          const email = c.recipient_email?.toLowerCase();
          name = (email ? teamNameByEmail.get(email) : undefined) ?? c.recipient_email ?? "Equipe";
        } else {
          name = c.recipient_email ?? "Sistema";
        }
        return {
          id: c.id,
          name,
          email: c.recipient_email,
          kind: kindLabel(c.kind),
          createdAt: c.created_at,
        };
      });
    const clickedWithoutOpen = clickedWithoutOpenList.length;
    const emailFailed = comms.filter((c) => c.email_status === "failed").length;
    const waFailed = comms.filter((c) => c.whatsapp_status === "failed").length;

    // Serie temporal com linhas separadas por canal.
    const byDay = new Map<
      string,
      { emailSent: number; waSent: number; emailClick: number; waClick: number; open: number }
    >();
    const bucket = (iso: string) => {
      const key = iso.slice(0, 10);
      if (!byDay.has(key))
        byDay.set(key, { emailSent: 0, waSent: 0, emailClick: 0, waClick: 0, open: 0 });
      return byDay.get(key)!;
    };
    for (const c of emailSentComms) bucket(c.created_at).emailSent += 1;
    for (const c of waSentComms) bucket(c.created_at).waSent += 1;
    for (const e of scopedEvents) {
      const b = bucket(e.created_at);
      if (e.event_type === "open") b.open += 1;
      else if (e.event_type === "click") {
        if (e.channel === "whatsapp") b.waClick += 1;
        else b.emailClick += 1;
      }
    }
    const timeSeries = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({ label: formatDayShort(key), ...v }));

    // Desempenho por tipo — separa cliques por canal pra responder
    // "qual canal funciona melhor pra cada tipo de mensagem".
    const byKindMap = new Map<
      string,
      { sent: number; open: number; emailClicks: number; waClicks: number }
    >();
    for (const c of inScopeComms) {
      if (!byKindMap.has(c.kind))
        byKindMap.set(c.kind, { sent: 0, open: 0, emailClicks: 0, waClicks: 0 });
      const k = byKindMap.get(c.kind)!;
      k.sent += 1;
      if (didOpen(c.id)) k.open += 1;
      if (emailClickIds.has(c.id)) k.emailClicks += 1;
      if (waClickIds.has(c.id)) k.waClicks += 1;
    }
    const byKind = [...byKindMap.entries()]
      .map(([kind, v]) => ({ kind: kindLabel(kind), ...v }))
      .sort((a, b) => b.sent - a.sent);

    // Distribuicao por canal — quanto da operacao roda por e-mail vs WhatsApp.
    // Quando "all", contamos cada canal independentemente (uma comm pode ter
    // ido pelos 2). Quando filtra um canal, mostra so esse fatiamento.
    const channelPie =
      channel === "email"
        ? [{ name: "E-mail", value: emailSentComms.length, color: CHART_COLORS.brand }]
        : channel === "whatsapp"
          ? [{ name: "WhatsApp", value: waSentComms.length, color: CHART_COLORS.success }]
          : [
              { name: "E-mail", value: emailSentComms.length, color: CHART_COLORS.brand },
              { name: "WhatsApp", value: waSentComms.length, color: CHART_COLORS.success },
            ].filter((d) => d.value > 0);

    // Funis SEPARADOS por canal — uma comm geralmente tenta os 2 canais ao
    // mesmo tempo, mas cada um tem ciclo proprio. Misturar num funil unico
    // gera taxas malucas (clique total / abertura so-de-email > 100%).
    // "Tentou" = comm tem destinatario daquele canal.
    const emailAttempted = comms.filter((c) => !!c.recipient_email).length;
    const waAttempted = comms.filter((c) => !!c.recipient_phone).length;
    const emailSentCount = emailSentComms.length;
    const waSentCount = waSentComms.length;
    const emailOpensCount = emailSentComms.filter((c) => openIds.has(c.id)).length;
    const emailClicksCount = emailSentComms.filter((c) => emailClickIds.has(c.id)).length;
    const waClicksCount = waSentComms.filter((c) => waClickIds.has(c.id)).length;

    const emailFunnel = [
      { stage: "Tentados", value: emailAttempted, color: CHART_COLORS.muted },
      { stage: "Entregues", value: emailSentCount, color: CHART_COLORS.brand },
      { stage: "Abertos", value: emailOpensCount, color: CHART_COLORS.accent },
      { stage: "Clicados", value: emailClicksCount, color: CHART_COLORS.success },
    ];
    const waFunnel = [
      { stage: "Tentados", value: waAttempted, color: CHART_COLORS.muted },
      { stage: "Entregues", value: waSentCount, color: CHART_COLORS.brand },
      { stage: "Clicados", value: waClicksCount, color: CHART_COLORS.success },
    ];

    // Preferencia de canal por cliente — so faz sentido na aba Clientes.
    // Para cada cliente que recebeu mensagens, contamos cliques em cada
    // canal e classificamos a preferencia. E o sinal mais util pra decidir
    // "vamos investir mais em qual canal pra esse cliente".
    const clientPrefMap = new Map<
      string,
      { emailClicks: number; waClicks: number; emailReached: boolean; waReached: boolean }
    >();
    if (audienceTab === "cliente") {
      for (const c of comms) {
        if (!c.client_id) continue;
        if (!clientPrefMap.has(c.client_id)) {
          clientPrefMap.set(c.client_id, {
            emailClicks: 0,
            waClicks: 0,
            emailReached: false,
            waReached: false,
          });
        }
        const p = clientPrefMap.get(c.client_id)!;
        if (c.email_status === "sent") p.emailReached = true;
        if (c.whatsapp_status === "sent") p.waReached = true;
        if (emailClickIds.has(c.id)) p.emailClicks += 1;
        if (waClickIds.has(c.id)) p.waClicks += 1;
      }
    }
    const prefBuckets = { onlyEmail: 0, prefEmail: 0, equal: 0, prefWA: 0, onlyWA: 0, silent: 0 };
    for (const [, p] of clientPrefMap) {
      const e = p.emailClicks;
      const w = p.waClicks;
      if (e === 0 && w === 0) prefBuckets.silent += 1;
      else if (e > 0 && w === 0) prefBuckets.onlyEmail += 1;
      else if (w > 0 && e === 0) prefBuckets.onlyWA += 1;
      else if (e > w) prefBuckets.prefEmail += 1;
      else if (w > e) prefBuckets.prefWA += 1;
      else prefBuckets.equal += 1;
    }
    const channelPreferencePie = [
      {
        name: "Só clica no e-mail",
        value: prefBuckets.onlyEmail,
        color: CHART_COLORS.brand,
      },
      {
        name: "Prefere e-mail (multi-canal)",
        value: prefBuckets.prefEmail,
        color: CHART_COLORS.accent,
      },
      {
        name: "Engaja igual nos 2",
        value: prefBuckets.equal,
        color: CHART_COLORS.warning,
      },
      {
        name: "Prefere WhatsApp (multi-canal)",
        value: prefBuckets.prefWA,
        color: CHART_COLORS.success,
      },
      {
        name: "Só clica no WhatsApp",
        value: prefBuckets.onlyWA,
        color: CHART_COLORS.destructive,
      },
      {
        name: "Recebe e não clica",
        value: prefBuckets.silent,
        color: CHART_COLORS.muted,
      },
    ].filter((d) => d.value > 0);

    // Cobertura por canal — quantos clientes receberam por cada canal.
    // Mostra quem so esta nos contatos de um canal vs cobertura dupla.
    let coverageOnlyEmail = 0;
    let coverageOnlyWA = 0;
    let coverageBoth = 0;
    for (const [, p] of clientPrefMap) {
      if (p.emailReached && p.waReached) coverageBoth += 1;
      else if (p.emailReached) coverageOnlyEmail += 1;
      else if (p.waReached) coverageOnlyWA += 1;
    }
    const coveragePie = [
      { name: "Cobertura dupla", value: coverageBoth, color: CHART_COLORS.success },
      { name: "Só e-mail entrega", value: coverageOnlyEmail, color: CHART_COLORS.brand },
      { name: "Só WhatsApp entrega", value: coverageOnlyWA, color: CHART_COLORS.warning },
    ].filter((d) => d.value > 0);

    // Envios por dia da semana — padrao de operacao. Cliques separados por
    // canal pra revelar se cliente prefere WhatsApp no fim de semana e
    // e-mail nos dias uteis, por exemplo.
    const weekdayMap = new Array(7).fill(null).map((_, i) => ({
      label: WEEKDAY_LABELS[i],
      sent: 0,
      open: 0,
      emailClicks: 0,
      waClicks: 0,
    }));
    for (const c of inScopeComms) {
      const dow = new Date(c.created_at).getDay();
      weekdayMap[dow].sent += 1;
      if (didOpen(c.id)) weekdayMap[dow].open += 1;
      if (emailClickIds.has(c.id)) weekdayMap[dow].emailClicks += 1;
      if (waClickIds.has(c.id)) weekdayMap[dow].waClicks += 1;
    }
    // Reordena pra comecar na segunda (operacao real).
    const byWeekday = [...weekdayMap.slice(1), weekdayMap[0]];

    // Breakdown por cliente — apenas comms de audiencia "cliente". Esconde
    // quando ja ha filtro de cliente aplicado (ranking vira irrelevante).
    const clientOnlyComms = inScopeComms.filter(
      (c) => audienceOf(c.kind) === "cliente" && c.client_id
    );
    const byClientMap = new Map<
      string,
      {
        clientId: string;
        sent: number;
        open: number;
        emailClicks: number;
        waClicks: number;
      }
    >();
    for (const c of clientOnlyComms) {
      const key = c.client_id as string;
      if (!byClientMap.has(key))
        byClientMap.set(key, {
          clientId: key,
          sent: 0,
          open: 0,
          emailClicks: 0,
          waClicks: 0,
        });
      const k = byClientMap.get(key)!;
      k.sent += 1;
      if (didOpen(c.id)) k.open += 1;
      if (emailClickIds.has(c.id)) k.emailClicks += 1;
      if (waClickIds.has(c.id)) k.waClicks += 1;
    }
    const byClient = [...byClientMap.values()]
      .map((v) => {
        const totalClicks = v.emailClicks + v.waClicks;
        // Marca preferencia de canal pra ser exibida no ranking.
        let pref: "email" | "whatsapp" | "tie" | "none";
        if (totalClicks === 0) pref = "none";
        else if (v.emailClicks > v.waClicks) pref = "email";
        else if (v.waClicks > v.emailClicks) pref = "whatsapp";
        else pref = "tie";
        return {
          ...v,
          totalClicks,
          pref,
          name: clientNameById.get(v.clientId) ?? "Cliente arquivado",
        };
      })
      .sort((a, b) => b.sent - a.sent)
      .slice(0, 10);

    // Tabela de recentes — resolve nome do cliente OU do membro da equipe.
    const recent = comms.slice(0, 50).map((c) => {
      const aud = audienceOf(c.kind);
      let displayTarget: string;
      if (aud === "cliente") {
        displayTarget = c.client_id
          ? (clientNameById.get(c.client_id) ?? "Cliente arquivado")
          : "Cliente não identificado";
      } else if (aud === "equipe") {
        // Resolve email -> nome do membro. Fallback usa o email cru pra nao
        // perder informacao (era so "Equipe Elkys" antes).
        const email = c.recipient_email?.toLowerCase();
        const memberName = email ? teamNameByEmail.get(email) : undefined;
        displayTarget = memberName ?? c.recipient_email ?? "Equipe Elkys";
      } else {
        // Sistema: usa email se houver (caso do password_reset), senao label.
        displayTarget = c.recipient_email ?? "Sistema";
      }
      return {
        id: c.id,
        kind: kindLabel(c.kind),
        audience: aud,
        recipientEmail: c.recipient_email ?? "Sem e-mail",
        recipientPhone: c.recipient_phone ?? null,
        displayTarget,
        createdAt: c.created_at,
        emailStatus: c.email_status,
        whatsappStatus: c.whatsapp_status,
        opened: openIds.has(c.id),
        emailClicked: emailClickIds.has(c.id),
        waClicked: waClickIds.has(c.id),
      };
    });

    return {
      total: comms.length,
      totalSent,
      opens,
      clicks,
      emailClicksOnly,
      waOnlyClicks,
      clickedWithoutOpen,
      clickedWithoutOpenList,
      emailFailed,
      waFailed,
      timeSeries,
      byKind,
      byClient,
      channelPie,
      emailFunnel,
      waFunnel,
      emailAttempted,
      waAttempted,
      emailSentCount,
      waSentCount,
      emailOpensCount,
      emailClicksCount,
      waClicksCount,
      channelPreferencePie,
      coveragePie,
      prefBuckets,
      coverageBoth,
      coverageOnlyEmail,
      coverageOnlyWA,
      totalClients: clientPrefMap.size,
      byWeekday,
      recent,
    };
  }, [data, channel, audienceTab, clientFilter, clientNameById, teamNameByEmail]);

  if (isLoading) return <PortalLoading />;

  if (isError) {
    return (
      <AdminEmptyState
        icon={BarChartIcon}
        title="Não foi possível carregar as métricas"
        description="Ocorreu um erro ao buscar os dados de comunicação. Tente novamente."
      />
    );
  }

  const hasData = metrics.total > 0;
  const isClientFiltered = clientFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Abas de audiencia — cada aba e uma operacao distinta. Mistura de
          comms com cliente, equipe e sistema na mesma tela mascara o que
          importa: pra cliente queremos saber preferencia de canal; pra
          equipe queremos saber se chegou; pra sistema e basicamente log. */}
      <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card p-1.5 sm:flex-row">
        {AUDIENCE_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setAudienceTab(t.value);
              if (t.value !== "cliente") {
                setClientFilter("all");
                setClientSearch("");
              }
            }}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-left text-sm transition-colors",
              audienceTab === t.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <span className="block font-semibold">{t.label}</span>
            <span
              className={cn(
                "block text-[11px] leading-snug",
                audienceTab === t.value ? "text-primary-foreground/80" : "text-muted-foreground"
              )}
            >
              {t.description}
            </span>
          </button>
        ))}
      </div>

      {/* Filtros: periodo + canal */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Período
          </span>
          {PERIODS.map((p) => (
            <Button
              key={p.days}
              type="button"
              variant={days === p.days ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(p.days)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Canal
          </span>
          {CHANNELS.map((ch) => (
            <Button
              key={ch.value}
              type="button"
              variant={channel === ch.value ? "default" : "outline"}
              size="sm"
              onClick={() => setChannel(ch.value)}
            >
              {ch.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Filtro por cliente — aplica em todos os graficos e tabelas.
          So aparece na aba Clientes, ja que comms internas nao tem
          client_id e o select ficaria vazio. */}
      {audienceTab === "cliente" ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5">
            <div className="flex-1">
              <label
                htmlFor="comms-client-filter"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Filtrar por cliente
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="comms-client-search"
                  type="search"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Buscar cliente pelo nome..."
                  className="flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[280px]"
                />
                <select
                  id="comms-client-filter"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-1"
                >
                  <option value="all">Todos os clientes</option>
                  {clientFilterOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.active ? "" : " (arquivado)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {isClientFiltered ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Exibindo: <strong className="text-foreground">{selectedClientName}</strong>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setClientFilter("all");
                    setClientSearch("");
                  }}
                >
                  Limpar filtro
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Cards de topo (adaptam ao canal selecionado) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label={
            channel === "email"
              ? "E-mails enviados"
              : channel === "whatsapp"
                ? "WhatsApp enviados"
                : "Mensagens enviadas"
          }
          value={String(metrics.totalSent)}
          icon={Send}
          tone="primary"
          hint={`${metrics.total} comunicações no período`}
        />
        <MetricTile
          label="Taxa de entrega"
          value={pct(metrics.totalSent, metrics.total)}
          icon={BarChartIcon}
          tone="secondary"
          hint={
            metrics.emailFailed + metrics.waFailed > 0
              ? `${metrics.emailFailed + metrics.waFailed} falha(s) no período`
              : "Enviados sem erro / total"
          }
        />
        <MetricTile
          label="Taxa de abertura"
          value={channel === "whatsapp" ? "Não medido" : pct(metrics.opens, metrics.totalSent)}
          icon={Eye}
          tone="accent"
          hint={
            channel === "whatsapp"
              ? "WhatsApp não rastreia abertura"
              : `${metrics.opens} abertura(s), sinal indicativo`
          }
        />
        <MetricTile
          label="Taxa de clique"
          value={pct(metrics.clicks, metrics.totalSent)}
          icon={ExternalLink}
          tone="success"
          hint={`${metrics.clicks} clique(s), sinal mais confiável`}
        />
      </div>

      {!hasData ? (
        <AdminEmptyState
          icon={BarChartIcon}
          title={
            isClientFiltered
              ? "Nenhuma comunicação para este cliente no período"
              : "Sem comunicações no período"
          }
          description="Quando o portal enviar e-mails, o rastreio de abertura e clique aparecerá aqui."
        />
      ) : (
        <>
          {/* Funis SEPARADOS por canal — cada canal tem seu proprio ciclo
              (e-mail tem abertura, WhatsApp nao). Comparar lado a lado deixa
              imediato qual canal entrega e engaja melhor. */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="mb-3 space-y-1">
                  <h2 className="text-sm font-semibold text-foreground">Funil de e-mail</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Tentados → Entregues → Abertos (pixel) → Clicados (link).
                  </p>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart
                      data={metrics.emailFunnel}
                      layout="vertical"
                      margin={{ top: 8, right: 32, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid
                        horizontal={false}
                        stroke={CHART_COLORS.grid}
                        strokeOpacity={0.15}
                      />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="stage"
                        width={80}
                        tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fillOpacity: 0.06 }} />
                      <Bar dataKey="value" name="Mensagens" radius={[0, 4, 4, 0]}>
                        {metrics.emailFunnel.map((entry) => (
                          <Cell key={`em-${entry.stage}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                  <p>
                    <strong className="text-foreground">
                      {pct(metrics.emailSentCount, metrics.emailAttempted)}
                    </strong>{" "}
                    entrega
                  </p>
                  <p>
                    <strong className="text-foreground">
                      {pct(metrics.emailOpensCount, metrics.emailSentCount)}
                    </strong>{" "}
                    abertura
                  </p>
                  <p title="Apples-to-apples: só cliques de e-mail sobre aberturas de e-mail">
                    <strong className="text-foreground">
                      {pct(metrics.emailClicksCount, metrics.emailOpensCount)}
                    </strong>{" "}
                    clique / abertura
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="mb-3 space-y-1">
                  <h2 className="text-sm font-semibold text-foreground">Funil de WhatsApp</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Tentados → Entregues → Clicados. WhatsApp não mede abertura.
                  </p>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart
                      data={metrics.waFunnel}
                      layout="vertical"
                      margin={{ top: 8, right: 32, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid
                        horizontal={false}
                        stroke={CHART_COLORS.grid}
                        strokeOpacity={0.15}
                      />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="stage"
                        width={80}
                        tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fillOpacity: 0.06 }} />
                      <Bar dataKey="value" name="Mensagens" radius={[0, 4, 4, 0]}>
                        {metrics.waFunnel.map((entry) => (
                          <Cell key={`wa-${entry.stage}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <p>
                    <strong className="text-foreground">
                      {pct(metrics.waSentCount, metrics.waAttempted)}
                    </strong>{" "}
                    entrega
                  </p>
                  <p>
                    <strong className="text-foreground">
                      {pct(metrics.waClicksCount, metrics.waSentCount)}
                    </strong>{" "}
                    clique / enviado
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {metrics.clickedWithoutOpen > 0 ? (
            <Card>
              <CardContent className="space-y-3 p-4 sm:p-5">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-foreground">
                    Clicaram no e-mail sem o pixel registrar abertura
                  </h2>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {metrics.clickedWithoutOpen === 1
                      ? "Uma pessoa clicou"
                      : `${metrics.clickedWithoutOpen} pessoas clicaram`}{" "}
                    no link sem o pixel disparar. Normalmente Outlook, proxy de imagem do
                    Gmail/Apple Mail ou modo offline bloquearam a imagem que registra abertura. A
                    leitura aconteceu mesmo assim. Por isso a etapa &quot;Clicados&quot; do funil de
                    e-mail pode parecer maior que &quot;Abertos&quot;.
                  </p>
                </div>
                <ul className="divide-y divide-border/40 rounded-md border border-border/40 bg-background/50">
                  {metrics.clickedWithoutOpenList.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground" title={p.name}>
                          {p.name}
                        </p>
                        {p.email && p.email !== p.name ? (
                          <p className="truncate text-[11px] text-muted-foreground" title={p.email}>
                            {p.email}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-start gap-0.5 sm:items-end">
                        <span className="text-[11px] text-muted-foreground">{p.kind}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDateTime(p.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {/* Pizzas: distribuicao de volume por canal + (so na aba Clientes)
              preferencia de canal e cobertura. Respondem perguntas distintas:
              - Volume: "quanto da operacao roda em cada canal"
              - Preferencia: "qual canal cada cliente realmente engaja"
              - Cobertura: "quantos clientes temos contato nos dois canais" */}
          <div
            className={cn(
              "grid grid-cols-1 gap-4",
              audienceTab === "cliente" ? "lg:grid-cols-3" : "lg:grid-cols-1"
            )}
          >
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="mb-3 space-y-1">
                  <h2 className="text-sm font-semibold text-foreground">Volume por canal</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Quantas mensagens entregues por cada canal. Uma mesma comunicação conta nos dois
                    quando saiu pelos dois.
                  </p>
                </div>
                {metrics.channelPie.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">Sem dados.</p>
                ) : (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={metrics.channelPie}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={88}
                          paddingAngle={2}
                        >
                          {metrics.channelPie.map((entry, i) => (
                            <Cell key={`ch-${i}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {audienceTab === "cliente" ? (
              <>
                <Card>
                  <CardContent className="p-4 sm:p-5">
                    <div className="mb-3 space-y-1">
                      <h2 className="text-sm font-semibold text-foreground">
                        Preferência de canal por cliente
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        Pra cada cliente que recebeu mensagens, qual canal ele realmente clica.
                        Direciona onde investir engajamento.
                      </p>
                    </div>
                    {metrics.channelPreferencePie.length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">
                        Ainda sem cliques no período.
                      </p>
                    ) : (
                      <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <PieChart>
                            <Pie
                              data={metrics.channelPreferencePie}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={48}
                              outerRadius={88}
                              paddingAngle={2}
                            >
                              {metrics.channelPreferencePie.map((entry, i) => (
                                <Cell key={`pref-${i}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<ChartTooltip />} />
                            <Legend
                              wrapperStyle={{ fontSize: 10 }}
                              formatter={(v) => <span className="text-[10px]">{v}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 sm:p-5">
                    <div className="mb-3 space-y-1">
                      <h2 className="text-sm font-semibold text-foreground">
                        Cobertura de contato
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        Quantos clientes a Elkys consegue alcançar nos dois canais vs um só. Cliente
                        com cobertura única é risco se aquele canal falhar.
                      </p>
                    </div>
                    {metrics.coveragePie.length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">Sem dados.</p>
                    ) : (
                      <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <PieChart>
                            <Pie
                              data={metrics.coveragePie}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={48}
                              outerRadius={88}
                              paddingAngle={2}
                            >
                              {metrics.coveragePie.map((entry, i) => (
                                <Cell key={`cov-${i}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>

          {/* Serie temporal: linhas por canal. Quando temos < 2 dias com
              atividade, o LineChart fica visualmente vazio porque linha
              precisa de >= 2 pontos. Mostramos explicacao em vez do grafico
              vago. */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3 space-y-1">
                <h2 className="text-sm font-semibold text-foreground">
                  Envios e engajamento por canal
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Mensagens disparadas e cliques por dia, separados por canal.
                </p>
              </div>
              {metrics.timeSeries.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 text-center">
                  <p className="px-4 text-xs text-muted-foreground">
                    Sem atividade registrada no período selecionado para esta audiência.
                  </p>
                </div>
              ) : metrics.timeSeries.length === 1 ? (
                <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 text-center">
                  <p className="px-4 text-xs text-muted-foreground">
                    Só houve atividade em {metrics.timeSeries[0].label}. Aumente o período para ver
                    a evolução ao longo do tempo.
                  </p>
                </div>
              ) : (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart
                      data={metrics.timeSeries}
                      margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke={CHART_COLORS.grid}
                        strokeOpacity={0.15}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {channel !== "whatsapp" ? (
                        <>
                          <Line
                            type="monotone"
                            dataKey="emailSent"
                            name="E-mail enviado"
                            stroke={CHART_COLORS.brand}
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="emailClick"
                            name="Clique e-mail"
                            stroke={CHART_COLORS.brand}
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                            dot={false}
                          />
                        </>
                      ) : null}
                      {channel !== "email" ? (
                        <>
                          <Line
                            type="monotone"
                            dataKey="waSent"
                            name="WhatsApp enviado"
                            stroke={CHART_COLORS.success}
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="waClick"
                            name="Clique WhatsApp"
                            stroke={CHART_COLORS.success}
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                            dot={false}
                          />
                        </>
                      ) : null}
                      {channel !== "whatsapp" ? (
                        <Line
                          type="monotone"
                          dataKey="open"
                          name="Abertura e-mail"
                          stroke={CHART_COLORS.accent}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      ) : null}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Envios por dia da semana: padrao operacional */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3 space-y-1">
                <h2 className="text-sm font-semibold text-foreground">
                  Volume e engajamento por dia da semana
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Distribuição agregada no período. Útil para entender quando a régua de comunicação
                  opera com mais intensidade e quando o engajamento responde melhor.
                </p>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart
                    data={metrics.byWeekday}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    barGap={2}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke={CHART_COLORS.grid}
                      strokeOpacity={0.15}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fillOpacity: 0.06 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="sent" name="Enviadas" fill={CHART_COLORS.muted} radius={2} />
                    {channel !== "whatsapp" ? (
                      <Bar
                        dataKey="open"
                        name="Aberturas (e-mail)"
                        fill={CHART_COLORS.accent}
                        radius={2}
                      />
                    ) : null}
                    {channel !== "whatsapp" ? (
                      <Bar
                        dataKey="emailClicks"
                        name="Cliques e-mail"
                        fill={CHART_COLORS.brand}
                        radius={2}
                      />
                    ) : null}
                    {channel !== "email" ? (
                      <Bar
                        dataKey="waClicks"
                        name="Cliques WhatsApp"
                        fill={CHART_COLORS.success}
                        radius={2}
                      />
                    ) : null}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Desempenho por tipo — separa cliques por canal pra responder
              "que tipo de mensagem o cliente clica no WhatsApp e qual ele
              prefere ver pelo e-mail". */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3 space-y-1">
                <h2 className="text-sm font-semibold text-foreground">
                  Desempenho por tipo de comunicação
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Volume entregue, aberturas (só e-mail) e cliques separados por canal. Para cada
                  tipo de mensagem, qual canal converte melhor.
                </p>
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart
                    data={metrics.byKind}
                    layout="vertical"
                    margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
                    barGap={2}
                    barSize={8}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke={CHART_COLORS.grid}
                      strokeOpacity={0.15}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="kind"
                      width={150}
                      tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fillOpacity: 0.06 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="sent" name="Enviados" fill={CHART_COLORS.muted} radius={2} />
                    <Bar
                      dataKey="open"
                      name="Aberturas (e-mail)"
                      fill={CHART_COLORS.accent}
                      radius={2}
                    />
                    <Bar
                      dataKey="emailClicks"
                      name="Cliques e-mail"
                      fill={CHART_COLORS.brand}
                      radius={2}
                    />
                    <Bar
                      dataKey="waClicks"
                      name="Cliques WhatsApp"
                      fill={CHART_COLORS.success}
                      radius={2}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top 10 clientes — so na aba Clientes e sem filtro de cliente */}
          {audienceTab === "cliente" && !isClientFiltered && metrics.byClient.length > 0 ? (
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-foreground">
                      Top 10 clientes por engajamento
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Apenas mensagens enviadas para clientes da carteira (envios para a equipe
                      Elkys e fluxos de sistema não entram neste ranking).
                    </p>
                  </div>
                  <Users size={18} className="shrink-0 text-muted-foreground" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/60 text-[10px] uppercase tracking-wide text-muted-foreground">
                        <th className="py-2 font-semibold">Cliente</th>
                        <th className="px-3 py-2 text-right font-semibold">Enviadas</th>
                        {channel !== "whatsapp" ? (
                          <th className="px-3 py-2 text-right font-semibold">Aberturas</th>
                        ) : null}
                        {channel !== "whatsapp" ? (
                          <th className="px-3 py-2 text-right font-semibold">Cliq. e-mail</th>
                        ) : null}
                        {channel !== "email" ? (
                          <th className="px-3 py-2 text-right font-semibold">Cliq. WhatsApp</th>
                        ) : null}
                        <th className="px-3 py-2 text-right font-semibold">Preferência</th>
                        <th className="px-3 py-2 text-right font-semibold">Taxa clique</th>
                        <th className="px-3 py-2 text-right font-semibold">Ver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.byClient.map((row) => (
                        <tr
                          key={row.clientId}
                          className="border-b border-border/40 last:border-0 hover:bg-muted/40"
                        >
                          <td
                            className="max-w-[240px] truncate py-2.5 font-medium text-foreground"
                            title={row.name}
                          >
                            {row.name}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                            {row.sent}
                          </td>
                          {channel !== "whatsapp" ? (
                            <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                              {row.open}
                            </td>
                          ) : null}
                          {channel !== "whatsapp" ? (
                            <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                              {row.emailClicks}
                            </td>
                          ) : null}
                          {channel !== "email" ? (
                            <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                              {row.waClicks}
                            </td>
                          ) : null}
                          <td className="px-3 py-2.5 text-right">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                row.pref === "email"
                                  ? "bg-primary/10 text-primary"
                                  : row.pref === "whatsapp"
                                    ? "bg-success/15 text-success"
                                    : row.pref === "tie"
                                      ? "bg-warning/15 text-warning"
                                      : "bg-muted text-muted-foreground"
                              )}
                              title={
                                row.pref === "tie"
                                  ? `Empate: ${row.emailClicks} e-mail × ${row.waClicks} WhatsApp`
                                  : undefined
                              }
                            >
                              {row.pref === "email"
                                ? "E-mail"
                                : row.pref === "whatsapp"
                                  ? "WhatsApp"
                                  : row.pref === "tie"
                                    ? "Empate"
                                    : "Sem clique"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums font-medium text-foreground">
                            {pct(row.totalClicks, row.sent)}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setClientFilter(row.clientId)}
                              className="text-[11px] font-medium text-primary hover:underline"
                            >
                              Filtrar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Tabela de recentes — colunas separadas por canal */}
          <Card>
            <CardContent className="p-0">
              <h2 className="border-b border-border/60 px-4 py-3 text-sm font-semibold text-foreground sm:px-5">
                Comunicações recentes
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2 font-semibold sm:px-5">Tipo</th>
                      <th className="px-4 py-2 font-semibold">Para quem</th>
                      <th className="px-4 py-2 font-semibold">Contato</th>
                      <th className="px-4 py-2 font-semibold">Enviado em</th>
                      <th className="px-4 py-2 font-semibold">E-mail</th>
                      <th className="px-4 py-2 font-semibold">WhatsApp</th>
                      <th
                        className="px-4 py-2 font-semibold"
                        title="Abertura é medida só no e-mail (pixel invisível). WhatsApp não tem como medir."
                      >
                        Abriu (e-mail)
                      </th>
                      <th className="px-4 py-2 font-semibold">Clicou e-mail</th>
                      <th className="px-4 py-2 font-semibold">Clicou WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recent.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border/40 last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-4 py-2.5 font-medium text-foreground sm:px-5">
                          {row.kind}
                        </td>
                        <td
                          className="max-w-[220px] px-4 py-2.5"
                          title={`${audienceLabel(row.audience)} • ${row.displayTarget}`}
                        >
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              row.audience === "cliente"
                                ? "bg-primary/10 text-primary"
                                : row.audience === "equipe"
                                  ? "bg-accent/10 text-accent"
                                  : "bg-muted text-muted-foreground"
                            )}
                          >
                            {row.audience === "cliente"
                              ? "Cliente"
                              : row.audience === "equipe"
                                ? "Equipe"
                                : "Sistema"}
                          </span>
                          <p className="mt-1 truncate text-foreground" title={row.displayTarget}>
                            {row.displayTarget}
                          </p>
                        </td>
                        <td
                          className="max-w-[220px] truncate px-4 py-2.5 text-muted-foreground"
                          title={`${row.recipientEmail}${row.recipientPhone ? ` • ${row.recipientPhone}` : ""}`}
                        >
                          <span className="block truncate">{row.recipientEmail}</span>
                          {row.recipientPhone ? (
                            <span className="block truncate text-[11px] opacity-80">
                              {row.recipientPhone}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {formatDateTime(row.createdAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge
                            tone={
                              row.emailStatus === "sent"
                                ? "success"
                                : row.emailStatus === "failed"
                                  ? "destructive"
                                  : "muted"
                            }
                            label={
                              row.emailStatus === "sent"
                                ? "Enviado"
                                : row.emailStatus === "failed"
                                  ? "Falhou"
                                  : row.emailStatus === "pending"
                                    ? "Pendente"
                                    : "Não enviado"
                            }
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          {row.whatsappStatus ? (
                            <StatusBadge
                              tone={
                                row.whatsappStatus === "sent"
                                  ? "success"
                                  : row.whatsappStatus === "failed"
                                    ? "destructive"
                                    : "muted"
                              }
                              label={
                                row.whatsappStatus === "sent"
                                  ? "Enviado"
                                  : row.whatsappStatus === "failed"
                                    ? "Falhou"
                                    : "Pulado"
                              }
                            />
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Não aplicável</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.emailStatus === "sent" ? (
                            <DotIndicator on={row.opened} />
                          ) : (
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                              n/a
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.emailStatus === "sent" ? (
                            <DotIndicator on={row.emailClicked} />
                          ) : (
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                              n/a
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.whatsappStatus === "sent" ? (
                            <DotIndicator on={row.waClicked} />
                          ) : (
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                              n/a
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="space-y-1.5 rounded-lg border border-border/50 bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p>
          <strong className="text-foreground">Como ler abertura e clique:</strong> a abertura de
          e-mail é medida por um pixel invisível e é apenas indicativa. Clientes de e-mail (Gmail,
          Outlook, Apple Mail) que usam proxy de imagem podem inflar ou atrasar a contagem. O clique
          no link encurtado é o sinal mais confiável de engajamento real.
        </p>
        <p>
          <strong className="text-foreground">&quot;Clicou sem abrir&quot;:</strong> sim, acontece.
          O Outlook bloqueia imagens por padrão, o Gmail/Apple Mail passa o pixel por proxy e modo
          offline impede o disparo. A pessoa lê o e-mail e clica no link mesmo assim, mas o pixel
          nunca chega a ser carregado. Por isso a coluna &quot;Abriu&quot; pode estar vazia em
          mensagens que tiveram clique no e-mail.
        </p>
        <p>
          <strong className="text-foreground">WhatsApp não rastreia abertura:</strong> mensagens de
          texto no WhatsApp não carregam pixel. A coluna &quot;Abriu (e-mail)&quot; só fala do
          e-mail. O clique no link do WhatsApp é rastreado em &quot;Clicou WhatsApp&quot; e é
          independente do clique do e-mail. A mesma comunicação pode receber clique nos dois canais.
        </p>
        <p>
          <strong className="text-foreground">Taxa &quot;clique / abertura&quot;:</strong> compara
          apenas cliques de e-mail com aberturas de e-mail (mesmo denominador). Cliques exclusivos
          do WhatsApp aparecem em destaque separado abaixo do funil, para não inflar a métrica acima
          de 100%.
        </p>
      </div>
    </div>
  );
}

function DotIndicator({ on }: { on: boolean }) {
  return (
    <span
      className={cn("inline-flex h-2.5 w-2.5 rounded-full", on ? "bg-success" : "bg-border")}
      title={on ? "Sim" : "Não"}
      aria-label={on ? "Sim" : "Não"}
    />
  );
}
