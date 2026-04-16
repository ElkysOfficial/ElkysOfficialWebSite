/**
 * Helpers para interagir com Supabase API diretamente nos testes E2E.
 * Permite verificar notificações, timeline events, e criar auth users.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

let adminClient: ReturnType<typeof createClient> | null = null;
let adminToken: string | null = null;

/**
 * Faz login como admin e retorna o supabase client autenticado.
 */
export async function getAdminClient() {
  if (adminClient && adminToken) return adminClient;

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({
    email: process.env.ADMIN_EMAIL ?? "",
    password: process.env.ADMIN_PASSWORD ?? "",
  });
  if (error) throw new Error(`Admin login failed: ${error.message}`);
  adminToken = data.session.access_token;
  adminClient = client;
  return client;
}

/**
 * Cria um auth user para um cliente existente (que foi convertido de lead).
 * Retorna o user_id criado.
 */
export async function createAuthForClient(
  clientId: string,
  password: string
): Promise<{ userId: string; email: string }> {
  const client = await getAdminClient();

  // Buscar dados do cliente
  const { data: clientData, error: clientError } = await client
    .from("clients")
    .select("email, full_name, user_id")
    .eq("id", clientId)
    .single();

  if (clientError || !clientData) {
    throw new Error(`Client not found: ${clientError?.message}`);
  }

  // Se já tem user_id, retorna
  if (clientData.user_id) {
    return { userId: clientData.user_id, email: clientData.email };
  }

  // Criar auth user via edge function
  const { data: createData, error: createError } = await client.functions.invoke("create-user", {
    body: {
      email: clientData.email,
      password,
      full_name: clientData.full_name,
    },
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  if (createError) throw new Error(`create-user failed: ${createError.message}`);
  if (createData?.error) {
    if (String(createData.error).includes("already registered")) {
      // Buscar user_id existente
      const { data: existingUser } = await client
        .from("clients")
        .select("user_id")
        .eq("id", clientId)
        .single();
      return { userId: existingUser?.user_id ?? "", email: clientData.email };
    }
    throw new Error(`create-user error: ${createData.error}`);
  }

  const userId = createData.user_id as string;

  // Atualizar clients com user_id
  await client
    .from("clients")
    .update({ user_id: userId, must_change_password: false })
    .eq("id", clientId);

  // Atribuir role "cliente"
  await client.from("user_roles").insert({ user_id: userId, role: "cliente" });

  return { userId, email: clientData.email };
}

/**
 * Busca o client_id pelo nome do lead convertido.
 */
export async function findClientByLeadName(leadName: string): Promise<string | null> {
  const client = await getAdminClient();
  const { data } = await client
    .from("leads")
    .select("converted_client_id")
    .ilike("name", `%${leadName}%`)
    .limit(1)
    .single();
  return data?.converted_client_id ?? null;
}

/**
 * Busca a proposta pelo título.
 */
export async function findProposalByTitle(
  title: string
): Promise<{ id: string; client_id: string | null; status: string } | null> {
  const client = await getAdminClient();
  const { data } = await client
    .from("proposals")
    .select("id, client_id, status")
    .ilike("title", `%${title}%`)
    .limit(1)
    .single();
  return data;
}

/**
 * Verifica se existem admin_notifications com determinado padrão.
 */
export async function countAdminNotifications(pattern: string): Promise<number> {
  const client = await getAdminClient();
  const { count } = await client
    .from("admin_notifications")
    .select("id", { count: "exact", head: true })
    .or(`title.ilike.%${pattern}%,body.ilike.%${pattern}%`);
  return count ?? 0;
}

/**
 * Verifica timeline events para um projeto.
 */
export async function getTimelineEventsForProject(
  projectName: string
): Promise<{ event_type: string; title: string }[]> {
  const client = await getAdminClient();

  // Encontrar project_id
  const { data: project } = await client
    .from("projects")
    .select("id")
    .ilike("name", `%${projectName}%`)
    .limit(1)
    .single();

  if (!project) return [];

  const { data: events } = await client
    .from("timeline_events")
    .select("event_type, title")
    .eq("project_id", project.id)
    .order("occurred_at", { ascending: true });

  return events ?? [];
}

/**
 * Logout admin client.
 */
export async function cleanupAdminClient() {
  if (adminClient) {
    await adminClient.auth.signOut();
    adminClient = null;
    adminToken = null;
  }
}
