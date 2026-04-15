import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button, Card, CardContent, Field, Input, Label, Textarea, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type SupportTicket = Pick<
  Database["public"]["Tables"]["support_tickets"]["Row"],
  "id" | "subject" | "status" | "priority" | "category" | "in_warranty" | "created_at"
>;

type Props = {
  projectId: string;
  acceptedAt: string | null;
  warrantyPeriodDays: number;
  className?: string;
};

const SELECT_CLASS =
  "flex h-9 min-h-[36px] w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Card de Suporte do Projeto — lista chamados vinculados e permite
 * abrir novo via RPC open_project_support_ticket que calcula garantia
 * automaticamente baseado em accepted_at + warranty_period_days.
 *
 * Auditoria PROBLEMA 15: vincula Aceite ↔ Suporte, fechando o loop do
 * fluxo Cliente 360 dentro do ProjectDetail.
 */
export default function ProjectSupportCard({
  projectId,
  acceptedAt,
  warrantyPeriodDays,
  className,
}: Props) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("outro");
  const [priority, setPriority] = useState("media");

  const warrantyUntil = acceptedAt
    ? new Date(new Date(acceptedAt).getTime() + warrantyPeriodDays * 86400000)
    : null;
  const isWarrantyActive = warrantyUntil ? warrantyUntil >= new Date() : false;

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, subject, status, priority, category, in_warranty, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (!error) setTickets((data as SupportTicket[]) ?? []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  async function handleOpen() {
    if (opening) return;
    if (!subject.trim() || !body.trim()) {
      toast.error("Preencha assunto e descrição.");
      return;
    }
    setOpening(true);
    try {
      const { error } = await supabase.rpc("open_project_support_ticket", {
        p_project_id: projectId,
        p_subject: subject.trim(),
        p_body: body.trim(),
        p_category: category,
        p_priority: priority,
      });
      if (error) {
        toast.error("Erro ao abrir chamado.", { description: error.message });
        return;
      }
      toast.success("Chamado aberto.");
      setSubject("");
      setBody("");
      setCategory("outro");
      setPriority("media");
      setShowForm(false);
      void loadTickets();
    } finally {
      setOpening(false);
    }
  }

  return (
    <Card className={cn("rounded-2xl border-border/80 bg-card/95", className)}>
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Suporte do projeto
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {loading
                ? "Carregando..."
                : tickets.length === 0
                  ? "Nenhum chamado"
                  : `${tickets.length} chamado${tickets.length > 1 ? "s" : ""}`}
            </p>
          </div>
          {acceptedAt ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                isWarrantyActive
                  ? "bg-success/10 text-success"
                  : "bg-muted/40 text-muted-foreground"
              )}
              title={
                isWarrantyActive && warrantyUntil
                  ? `Garantia ativa até ${formatDateTime(warrantyUntil.toISOString())}`
                  : "Garantia expirada"
              }
            >
              {isWarrantyActive ? "Garantia ativa" : "Garantia expirada"}
            </span>
          ) : null}
        </div>

        {!showForm ? (
          <Button size="sm" onClick={() => setShowForm(true)}>
            Abrir chamado
          </Button>
        ) : (
          <div className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-3">
            <Field>
              <Label className="text-[10px] uppercase tracking-wide">Assunto</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-xs"
              />
            </Field>
            <Field>
              <Label className="text-[10px] uppercase tracking-wide">Descrição</Label>
              <Textarea
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="text-xs"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field>
                <Label className="text-[10px] uppercase tracking-wide">Categoria</Label>
                <select
                  className={SELECT_CLASS}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="bug">Bug</option>
                  <option value="duvida">Dúvida</option>
                  <option value="acesso">Acesso</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="conteudo">Conteúdo</option>
                  <option value="outro">Outro</option>
                </select>
              </Field>
              <Field>
                <Label className="text-[10px] uppercase tracking-wide">Prioridade</Label>
                <select
                  className={SELECT_CLASS}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </Field>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={opening} onClick={() => void handleOpen()}>
                {opening ? "Abrindo..." : "Abrir"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {tickets.length > 0 ? (
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li
                key={t.id}
                className={cn(
                  "rounded-xl border p-3",
                  t.in_warranty
                    ? "border-success/30 bg-success/5"
                    : "border-border/75 bg-background/70"
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{t.subject}</span>
                  {t.in_warranty ? (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                      Garantia
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {STATUS_LABEL[t.status] ?? t.status} · {t.category} · {t.priority} ·{" "}
                  {formatDateTime(t.created_at)}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
