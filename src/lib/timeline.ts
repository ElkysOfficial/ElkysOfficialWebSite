/**
 * Helpers para inserir eventos na timeline do projeto/cliente.
 *
 * Chamados fire-and-forget apos operacoes de negocio (aprovacao,
 * transicao de status, upload de documento, etc.).
 *
 * @module timeline
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TimelineInsert = Database["public"]["Tables"]["timeline_events"]["Insert"];

/** Insere um unico evento na timeline. Lanca erro se falhar. */
export async function insertTimelineEvent(event: TimelineInsert) {
  const { error } = await supabase.from("timeline_events").insert(event);
  if (error) throw error;
}

/** Insere multiplos eventos em batch. Ignora array vazio. */
export async function insertTimelineEvents(events: TimelineInsert[]) {
  if (events.length === 0) return;

  const { error } = await supabase.from("timeline_events").insert(events);
  if (error) throw error;
}
