import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button, Card, CardContent, Field, Input, Label, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import {
  type OnboardingChecklist,
  type OnboardingItemKey,
  type OnboardingOwner,
  ONBOARDING_ITEM_KEYS,
  ONBOARDING_ITEM_LABEL,
  ONBOARDING_ITEM_HINT,
  ONBOARDING_OWNER_LABEL,
  countCompletedItems,
  isOnboardingComplete,
  parseOnboardingChecklist,
} from "@/lib/project-onboarding";

type Props = {
  projectId: string;
  initialChecklist: unknown;
  initialCompletedAt: string | null;
  onChange?: (checklist: OnboardingChecklist, completedAt: string | null) => void;
  className?: string;
};

const SELECT_CLASS =
  "flex h-9 min-h-[36px] w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

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
 * Card de Onboarding/Kickoff exibido em ProjectDetail.
 * Permite marcar 5 itens (escopo, materiais, acessos, cronograma, time)
 * com owner e nota. Habilita "Concluir onboarding" so quando todos os
 * 5 estao marcados.
 */
export default function ProjectOnboardingChecklist({
  projectId,
  initialChecklist,
  initialCompletedAt,
  onChange,
  className,
}: Props) {
  const [checklist, setChecklist] = useState<OnboardingChecklist>(() =>
    parseOnboardingChecklist(initialChecklist)
  );
  const [completedAt, setCompletedAt] = useState<string | null>(initialCompletedAt);
  const [saving, setSaving] = useState(false);

  // Reset state se o projeto carregado mudar.
  useEffect(() => {
    setChecklist(parseOnboardingChecklist(initialChecklist));
    setCompletedAt(initialCompletedAt);
  }, [projectId, initialChecklist, initialCompletedAt]);

  const completedCount = countCompletedItems(checklist);
  const totalCount = ONBOARDING_ITEM_KEYS.length;
  const allDone = isOnboardingComplete(checklist);
  const isConcluded = Boolean(completedAt);
  const readonly = isConcluded;

  function updateItem(
    key: OnboardingItemKey,
    patch: Partial<{ done: boolean; owner: OnboardingOwner; note: string }>
  ) {
    setChecklist((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? { done: false, owner: "elkys", note: "" }),
        ...patch,
      },
    }));
  }

  async function handleSave(opts: { conclude?: boolean } = {}) {
    if (saving) return;
    if (opts.conclude && !allDone) {
      toast.error("Marque todos os itens antes de concluir o onboarding.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        onboarding_checklist: checklist as unknown as never,
        updated_at: new Date().toISOString(),
      };
      const newCompletedAt = opts.conclude ? new Date().toISOString() : completedAt;
      if (opts.conclude) {
        payload.onboarding_completed_at = newCompletedAt;
      }
      const { error } = await supabase
        .from("projects")
        .update(payload as never)
        .eq("id", projectId);
      if (error) {
        toast.error("Erro ao salvar onboarding.", { description: error.message });
        return;
      }
      if (opts.conclude) setCompletedAt(newCompletedAt);
      onChange?.(checklist, opts.conclude ? newCompletedAt : completedAt);
      toast.success(opts.conclude ? "Onboarding concluído." : "Onboarding salvo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className={cn("rounded-2xl border-border/80 bg-card/95", className)}>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Onboarding / Kickoff
            </p>
            <p className="text-sm font-semibold text-foreground">
              {isConcluded ? (
                <span className="text-success">Concluído em {formatDateTime(completedAt)}</span>
              ) : (
                `${completedCount} de ${totalCount} itens prontos`
              )}
            </p>
          </div>
          {!isConcluded ? (
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold",
                allDone ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
              )}
            >
              {allDone ? "Pronto para concluir" : "Em andamento"}
            </span>
          ) : null}
        </div>

        <ol className="space-y-3">
          {ONBOARDING_ITEM_KEYS.map((key) => {
            const item = checklist[key]!;
            return (
              <li
                key={key}
                className={cn(
                  "rounded-xl border p-3",
                  item.done ? "border-success/30 bg-success/5" : "border-border/75 bg-background/70"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <label className="flex flex-1 min-w-0 cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={(e) => updateItem(key, { done: e.target.checked })}
                      disabled={readonly}
                      className="mt-1 h-4 w-4 rounded border-input"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {ONBOARDING_ITEM_LABEL[key]}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {ONBOARDING_ITEM_HINT[key]}
                      </p>
                    </div>
                  </label>
                  <Field className="w-32 shrink-0">
                    <Label className="text-[10px] uppercase tracking-wide">Responsável</Label>
                    <select
                      className={SELECT_CLASS}
                      value={item.owner}
                      disabled={readonly}
                      onChange={(e) =>
                        updateItem(key, { owner: e.target.value as OnboardingOwner })
                      }
                    >
                      {(["elkys", "cliente", "compartilhado"] as const).map((o) => (
                        <option key={o} value={o}>
                          {ONBOARDING_OWNER_LABEL[o]}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="mt-2">
                  <Input
                    value={item.note}
                    onChange={(e) => updateItem(key, { note: e.target.value })}
                    placeholder="Observação opcional"
                    disabled={readonly}
                    className="h-8 text-xs"
                  />
                </div>
              </li>
            );
          })}
        </ol>

        {!isConcluded ? (
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
            <Button
              variant="outline"
              size="sm"
              loading={saving}
              loadingText="Salvando..."
              onClick={() => void handleSave()}
            >
              Salvar
            </Button>
            <Button
              size="sm"
              disabled={saving || !allDone}
              onClick={() => void handleSave({ conclude: true })}
            >
              Concluir onboarding
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
