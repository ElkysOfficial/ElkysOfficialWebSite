import { useState } from "react";
import { toast } from "sonner";

import { Button, Field, Input, Label, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  contractId: string;
  projectId: string;
  clientId: string;
  versionNo: number;
  existingUrl?: string | null;
  onSaved?: () => void;
  className?: string;
};

/**
 * PA19 — form inline para o juridico colar a URL do PDF do contrato.
 * Grava em documents com type='contrato' + contract_id + project_id +
 * client_id preenchidos automaticamente pelo contrato. Se o contrato
 * ja tem link, este form substitui (updates) — so existe um documento
 * tipo contrato por contract_id por convencao.
 *
 * Reaproveita Field/Input/Button do design system. Visual compacto
 * para caber na linha da lista em Contracts.tsx.
 */
export default function AddContractLinkForm({
  contractId,
  projectId,
  clientId,
  versionNo,
  existingUrl,
  onSaved,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(existingUrl ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Informe a URL do PDF do contrato.");
      return;
    }

    setSaving(true);
    try {
      // Upsert: busca documento existente tipo contrato deste contract_id
      // e faz update. Se nao existe, insert.
      const { data: existing } = await supabase
        .from("documents")
        .select("id")
        .eq("contract_id", contractId)
        .eq("type", "contrato")
        .maybeSingle();

      const label = `Contrato v${versionNo}`;

      if (existing?.id) {
        const { error } = await supabase
          .from("documents")
          .update({ url: trimmed, label })
          .eq("id", existing.id);
        if (error) {
          toast.error("Erro ao atualizar link.", { description: error.message });
          return;
        }
        toast.success("Link do contrato atualizado.");
      } else {
        const { error } = await supabase.from("documents").insert({
          contract_id: contractId,
          project_id: projectId,
          client_id: clientId,
          type: "contrato",
          label,
          url: trimmed,
        });
        if (error) {
          toast.error("Erro ao salvar link.", { description: error.message });
          return;
        }
        toast.success("Link do contrato anexado.");
      }

      setOpen(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" className={className} onClick={() => setOpen(true)}>
        {existingUrl ? "Atualizar link do PDF" : "Anexar link do PDF"}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "w-full space-y-2 rounded-xl border border-border/70 bg-background/70 p-3",
        className
      )}
    >
      <Field>
        <Label className="text-[10px] uppercase tracking-wide">URL do contrato (PDF)</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/..."
          className="text-xs"
        />
      </Field>
      <div className="flex gap-2">
        <Button size="sm" disabled={saving} onClick={() => void handleSave()}>
          {saving ? "Salvando..." : "Salvar link"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={saving}
          onClick={() => {
            setOpen(false);
            setUrl(existingUrl ?? "");
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
