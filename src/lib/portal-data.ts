/**
 * Camada de dados do portal — funcoes async que encapsulam queries ao Supabase.
 *
 * Todas retornam `{ data, error }` para tratamento uniforme nos componentes.
 * Usadas pelos hooks `useAdmin*` e `useClient*` com React Query.
 *
 * @module portal-data
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type {
  PortalCharge,
  PortalClient,
  PortalDocument,
  PortalNextStep,
  PortalProject,
  PortalProjectContract,
  PortalProjectInstallment,
  PortalProjectSubscription,
  PortalTimelineEvent,
} from "@/lib/portal";

type PortalTicket = Database["public"]["Tables"]["support_tickets"]["Row"];

/** Resolve o registro `clients` vinculado ao auth user (via user_id ou client_contacts). */
export async function resolveClientForUser(userId: string) {
  const directClientRes = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (directClientRes.data) {
    return { client: directClientRes.data as PortalClient, error: directClientRes.error };
  }

  if (directClientRes.error) {
    return { client: null, error: directClientRes.error };
  }

  // Resolve via client_contacts — any linked contact, primary first.
  // Aligns with the RLS function get_client_id_for_portal_user which does not filter is_primary.
  const contactRes = await supabase
    .from("client_contacts")
    .select("client_id")
    .eq("auth_user_id", userId)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (contactRes.error) {
    return { client: null, error: contactRes.error };
  }

  if (!contactRes.data?.client_id) {
    return { client: null, error: null };
  }

  const clientRes = await supabase
    .from("clients")
    .select("*")
    .eq("id", contactRes.data.client_id)
    .maybeSingle();

  return { client: (clientRes.data as PortalClient | null) ?? null, error: clientRes.error };
}

/** Lista todos os projetos de um cliente, ordenados do mais recente. */
export async function loadProjectsForClient(clientId: string) {
  const projectsRes = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return {
    projects: (projectsRes.data as PortalProject[] | null) ?? [],
    error: projectsRes.error,
  };
}

/** Carrega um projeto pelo ID (retorna null se nao encontrado). */
export async function loadProjectById(projectId: string) {
  const projectRes = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
  return {
    project: (projectRes.data as PortalProject | null) ?? null,
    error: projectRes.error,
  };
}

/** Lista cobrancas de um cliente (todas, incluindo historicas). */
export async function loadChargesForClient(clientId: string) {
  const chargesRes = await supabase
    .from("charges")
    .select("*")
    .eq("client_id", clientId)
    .order("due_date", { ascending: false });

  return {
    charges: (chargesRes.data as PortalCharge[] | null) ?? [],
    error: chargesRes.error,
  };
}

/** Lista cobrancas de um projeto especifico, ordenadas por vencimento. */
export async function loadChargesForProject(projectId: string, clientId: string) {
  const chargesRes = await supabase
    .from("charges")
    .select("*")
    .eq("project_id", projectId)
    .eq("client_id", clientId)
    .order("due_date", { ascending: true });

  return {
    charges: (chargesRes.data as PortalCharge[] | null) ?? [],
    error: chargesRes.error,
  };
}

/** Lista contratos vinculados a um projeto. */
export async function loadContractsForProject(projectId: string) {
  const res = await supabase
    .from("project_contracts")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return { contracts: (res.data as PortalProjectContract[] | null) ?? [], error: res.error };
}

/** Lista parcelas (installments) de um projeto. */
export async function loadInstallmentsForProject(projectId: string) {
  const res = await supabase
    .from("project_installments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  return { installments: (res.data as PortalProjectInstallment[] | null) ?? [], error: res.error };
}

/** Lista assinaturas recorrentes de um projeto. */
export async function loadSubscriptionsForProject(projectId: string) {
  const res = await supabase
    .from("project_subscriptions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return {
    subscriptions: (res.data as PortalProjectSubscription[] | null) ?? [],
    error: res.error,
  };
}

/** Lista proximos passos (pendencias) de um projeto. Filtra por visibilidade se necessario. */
export async function loadNextStepsForProject(projectId: string, onlyClientVisible = false) {
  let query = supabase
    .from("project_next_steps")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (onlyClientVisible) query = query.eq("client_visible", true);

  const res = await query;

  return { nextSteps: (res.data as PortalNextStep[] | null) ?? [], error: res.error };
}

/** Lista eventos da timeline de um projeto (ordem decrescente). */
export async function loadTimelineForProject(projectId: string, clientVisibleOnly = false) {
  let query = supabase
    .from("timeline_events")
    .select("*")
    .eq("project_id", projectId)
    .order("occurred_at", { ascending: false });

  if (clientVisibleOnly) query = query.in("visibility", ["cliente", "ambos"]);

  const res = await query;

  return { events: (res.data as PortalTimelineEvent[] | null) ?? [], error: res.error };
}

/** Lista documentos do cliente, opcionalmente filtrados por projeto. */
export async function loadDocumentsForProject(clientId: string, projectId?: string) {
  let query = supabase
    .from("documents")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (projectId) query = query.eq("project_id", projectId);

  const res = await query;
  return { documents: (res.data as PortalDocument[] | null) ?? [], error: res.error };
}

/** Lista tickets de suporte de um cliente. */
export async function loadSupportTicketsForClient(clientId: string) {
  const res = await supabase
    .from("support_tickets")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return { tickets: (res.data as PortalTicket[] | null) ?? [], error: res.error };
}
