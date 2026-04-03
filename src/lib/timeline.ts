import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TimelineInsert = Database["public"]["Tables"]["timeline_events"]["Insert"];

export async function insertTimelineEvent(event: TimelineInsert) {
  const { error } = await supabase.from("timeline_events").insert(event);
  if (error) throw error;
}

export async function insertTimelineEvents(events: TimelineInsert[]) {
  if (events.length === 0) return;

  const { error } = await supabase.from("timeline_events").insert(events);
  if (error) throw error;
}
