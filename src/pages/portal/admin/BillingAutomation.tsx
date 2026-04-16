import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Bell, Clock, Receipt, Shield, Zap } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import PortalLoading from "@/components/portal/PortalLoading";
import {
  AlertDialog,
  Button,
  Card,
  CardContent,
  Input,
  Field,
  Label,
  Textarea,
  cn,
} from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatPortalDateTime } from "@/lib/portal";
import { getSupabaseFunctionAuthHeaders } from "@/lib/supabase-functions";

type RuleRow = Database["public"]["Tables"]["billing_rules"]["Row"];
type TemplateRow = Database["public"]["Tables"]["billing_templates"]["Row"];
type LogRow = Database["public"]["Tables"]["billing_actions_log"]["Row"];

type ActiveTab = "regras" | "templates" | "log";

const TEMPLATE_VARS = ["{{client_name}}", "{{amount}}", "{{due_date}}", "{{description}}"];

function formatTriggerDays(days: number): string {
  if (days < 0) return `${Math.abs(days)} dia(s) antes`;
  if (days === 0) return "No dia do vencimento";
  return `${days} dia(s) apos vencimento`;
}

export default function BillingAutomation() {
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ActiveTab>("regras");

  // Rule form
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleRow | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [ruleTriggerDays, setRuleTriggerDays] = useState("0");
  const [ruleActionType, setRuleActionType] = useState<"email" | "notificação">("email");
  const [ruleTemplateId, setRuleTemplateId] = useState<string>("");
  const [ruleSaving, setRuleSaving] = useState(false);

  // Template form
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null);
  const [tplName, setTplName] = useState("");
  const [tplSubject, setTplSubject] = useState("");
  const [tplBody, setTplBody] = useState("");
  const [tplType, setTplType] = useState<"cobrança" | "lembrete" | "agradecimento">("cobrança");
  const [tplSaving, setTplSaving] = useState(false);

  const [executingManual, setExecutingManual] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "rule" | "template";
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selectClass =
    "flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const loadData = useCallback(async () => {
    setLoading(true);
    const [rulesRes, templatesRes, logsRes] = await Promise.all([
      supabase.from("billing_rules").select("*").order("sort_order", { ascending: true }),
      supabase.from("billing_templates").select("*").order("created_at", { ascending: true }),
      supabase
        .from("billing_actions_log")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(50),
    ]);

    setRules((rulesRes.data ?? []) as RuleRow[]);
    setTemplates((templatesRes.data ?? []) as TemplateRow[]);
    setLogs((logsRes.data ?? []) as LogRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const templateMap = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates]);

  // Rule form handlers
  const resetRuleForm = () => {
    setRuleName("");
    setRuleTriggerDays("0");
    setRuleActionType("email");
    setRuleTemplateId("");
    setEditingRule(null);
    setShowRuleForm(false);
  };

  const startEditRule = (rule: RuleRow) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setRuleTriggerDays(String(rule.trigger_days));
    setRuleActionType(rule.action_type as "email" | "notificação");
    setRuleTemplateId(rule.template_id ?? "");
    setShowRuleForm(true);
  };

  const saveRule = async () => {
    if (!ruleName.trim()) {
      toast.error("Informe o nome da regra.");
      return;
    }
    setRuleSaving(true);

    const payload = {
      name: ruleName.trim(),
      trigger_days: Number(ruleTriggerDays),
      action_type: ruleActionType,
      template_id: ruleTemplateId || null,
      updated_at: new Date().toISOString(),
    };

    if (editingRule) {
      const { error } = await supabase
        .from("billing_rules")
        .update(payload)
        .eq("id", editingRule.id);
      if (error) {
        toast.error("Erro ao atualizar regra.");
        setRuleSaving(false);
        return;
      }
      toast.success("Regra atualizada.");
    } else {
      const { error } = await supabase.from("billing_rules").insert({
        ...payload,
        sort_order: rules.length + 1,
      });
      if (error) {
        toast.error("Erro ao criar regra.");
        setRuleSaving(false);
        return;
      }
      toast.success("Regra criada.");
    }

    setRuleSaving(false);
    resetRuleForm();
    void loadData();
  };

  const toggleRule = async (rule: RuleRow) => {
    const { error } = await supabase
      .from("billing_rules")
      .update({ is_active: !rule.is_active })
      .eq("id", rule.id);
    if (error) {
      toast.error("Erro ao alterar regra.");
      return;
    }
    void loadData();
  };

  const deleteRule = async (id: string) => {
    setDeleting(true);
    const { error } = await supabase.from("billing_rules").delete().eq("id", id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) {
      toast.error("Erro ao remover regra.");
      return;
    }
    toast.success("Regra removida.");
    void loadData();
  };

  // Template form handlers
  const resetTemplateForm = () => {
    setTplName("");
    setTplSubject("");
    setTplBody("");
    setTplType("cobrança");
    setEditingTemplate(null);
    setShowTemplateForm(false);
  };

  const startEditTemplate = (tpl: TemplateRow) => {
    setEditingTemplate(tpl);
    setTplName(tpl.name);
    setTplSubject(tpl.subject);
    setTplBody(tpl.body);
    setTplType(tpl.type as "cobrança" | "lembrete" | "agradecimento");
    setShowTemplateForm(true);
  };

  const saveTemplate = async () => {
    if (!tplName.trim() || !tplSubject.trim() || !tplBody.trim()) {
      toast.error("Preencha todos os campos do template.");
      return;
    }
    setTplSaving(true);

    const payload = {
      name: tplName.trim(),
      subject: tplSubject.trim(),
      body: tplBody.trim(),
      type: tplType,
      updated_at: new Date().toISOString(),
    };

    if (editingTemplate) {
      const { error } = await supabase
        .from("billing_templates")
        .update(payload)
        .eq("id", editingTemplate.id);
      if (error) {
        toast.error("Erro ao atualizar template.");
        setTplSaving(false);
        return;
      }
      toast.success("Template atualizado.");
    } else {
      const { error } = await supabase.from("billing_templates").insert(payload);
      if (error) {
        toast.error("Erro ao criar template.");
        setTplSaving(false);
        return;
      }
      toast.success("Template criado.");
    }

    setTplSaving(false);
    resetTemplateForm();
    void loadData();
  };

  const deleteTemplate = async (id: string) => {
    setDeleting(true);
    const { error } = await supabase.from("billing_templates").delete().eq("id", id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) {
      toast.error("Erro ao remover template.");
      return;
    }
    toast.success("Template removido.");
    void loadData();
  };

  // Manual execution
  const executeManually = async () => {
    setExecutingManual(true);
    try {
      const headers = await getSupabaseFunctionAuthHeaders();
      const { error } = await supabase.functions.invoke("process-billing-rules", {
        body: { triggered_by: "manual" },
        headers,
      });
      if (error) throw error;
      toast.success("Régua executada com sucesso. Verifique o log.");
    } catch {
      toast.error("Erro ao executar régua. Verifique se a edge function esta configurada.");
    }
    setExecutingManual(false);
    setTimeout(() => void loadData(), 2000);
  };

  if (loading) return <PortalLoading />;

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "regras", label: `Regras (${rules.length})` },
    { key: "templates", label: `Templates (${templates.length})` },
    { key: "log", label: `Log (${logs.length >= 50 ? "50+" : logs.length})` },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar + Execute button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border/60 bg-card p-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-all",
                tab === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Button type="button" onClick={() => void executeManually()} disabled={executingManual}>
          <Zap size={14} className="mr-1.5" />
          {executingManual ? "Executando..." : "Executar régua agora"}
        </Button>
      </div>

      {/* Rules tab */}
      {tab === "regras" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetRuleForm();
                setShowRuleForm(true);
              }}
            >
              Nova regra
            </Button>
          </div>

          {showRuleForm && (
            <Card className="rounded-2xl border-primary/30 bg-card/95">
              <CardContent className="space-y-4 p-4">
                <h3 className="text-sm font-semibold">
                  {editingRule ? "Editar regra" : "Nova regra"}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <Label>Nome</Label>
                    <Input
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      placeholder="Ex: Lembrete 3 dias antes"
                    />
                  </Field>
                  <Field>
                    <Label>Dias gatilho (negativo = antes, positivo = apos)</Label>
                    <Input
                      type="number"
                      value={ruleTriggerDays}
                      onChange={(e) => setRuleTriggerDays(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <Label>Tipo de acao</Label>
                    <select
                      value={ruleActionType}
                      onChange={(e) => setRuleActionType(e.target.value as "email" | "notificação")}
                      className={selectClass}
                    >
                      <option value="email">Email</option>
                      <option value="notificação">Notificação</option>
                    </select>
                  </Field>
                  <Field>
                    <Label>Template</Label>
                    <select
                      value={ruleTemplateId}
                      onChange={(e) => setRuleTemplateId(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Nenhum</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={() => void saveRule()} disabled={ruleSaving}>
                    {ruleSaving ? "Salvando..." : editingRule ? "Atualizar" : "Criar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetRuleForm}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {rules.length === 0 ? (
            <AdminEmptyState
              icon={Zap}
              title="Nenhuma regra configurada"
              description="Crie regras para automatizar lembretes e cobranças."
            />
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => {
                const tpl = rule.template_id ? templateMap.get(rule.template_id) : null;
                return (
                  <div
                    key={rule.id}
                    className={cn(
                      "rounded-xl border bg-card/92 p-4 transition-all",
                      rule.is_active ? "border-border/60" : "border-border/40 opacity-60"
                    )}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-foreground">{rule.name}</h4>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              rule.is_active
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {rule.is_active ? "Ativa" : "Inativa"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatTriggerDays(rule.trigger_days)} ·{" "}
                          {rule.action_type === "email" ? "Email" : "Notificação"}
                          {tpl ? ` · Template: ${tpl.name}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => void toggleRule(rule)}
                          className="rounded-md px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          {rule.is_active ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditRule(rule)}
                          className="rounded-md px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ type: "rule", id: rule.id, name: rule.name })
                          }
                          className="rounded-md px-2 py-1 text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Templates tab */}
      {tab === "templates" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Variaveis disponiveis: {TEMPLATE_VARS.join(", ")}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetTemplateForm();
                setShowTemplateForm(true);
              }}
            >
              Novo template
            </Button>
          </div>

          {showTemplateForm && (
            <Card className="rounded-2xl border-primary/30 bg-card/95">
              <CardContent className="space-y-4 p-4">
                <h3 className="text-sm font-semibold">
                  {editingTemplate ? "Editar template" : "Novo template"}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <Label>Nome</Label>
                    <Input
                      value={tplName}
                      onChange={(e) => setTplName(e.target.value)}
                      placeholder="Nome interno do template"
                    />
                  </Field>
                  <Field>
                    <Label>Tipo</Label>
                    <select
                      value={tplType}
                      onChange={(e) => setTplType(e.target.value as typeof tplType)}
                      className={selectClass}
                    >
                      <option value="cobrança">Cobrança</option>
                      <option value="lembrete">Lembrete</option>
                      <option value="agradecimento">Agradecimento</option>
                    </select>
                  </Field>
                </div>
                <Field>
                  <Label>Assunto do email</Label>
                  <Input
                    value={tplSubject}
                    onChange={(e) => setTplSubject(e.target.value)}
                    placeholder="Assunto que o cliente recebe"
                  />
                </Field>
                <Field>
                  <Label>Corpo da mensagem</Label>
                  <Textarea
                    value={tplBody}
                    onChange={(e) => setTplBody(e.target.value)}
                    rows={5}
                    placeholder="Ola {{client_name}}, sua cobrança..."
                  />
                </Field>
                <div className="flex gap-2">
                  <Button type="button" onClick={() => void saveTemplate()} disabled={tplSaving}>
                    {tplSaving ? "Salvando..." : editingTemplate ? "Atualizar" : "Criar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetTemplateForm}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {templates.length === 0 ? (
            <AdminEmptyState
              icon={Receipt}
              title="Nenhum template"
              description="Crie templates de email para as regras de cobrança."
            />
          ) : (
            <div className="space-y-2">
              {templates.map((tpl) => (
                <div key={tpl.id} className="rounded-xl border border-border/60 bg-card/92 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">{tpl.name}</h4>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {tpl.type}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground">Assunto: {tpl.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{tpl.body}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEditTemplate(tpl)}
                        className="rounded-md px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ type: "template", id: tpl.id, name: tpl.name })
                        }
                        className="rounded-md px-2 py-1 text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Log tab */}
      {tab === "log" && (
        <div className="space-y-2">
          {logs.length === 0 ? (
            <AdminEmptyState
              icon={Clock}
              title="Nenhuma execucao registrada"
              description="Quando a régua for executada, o histórico aparecerá aqui."
            />
          ) : (
            <Card className="overflow-hidden rounded-2xl border-border/80 bg-card/95">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Acao
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Disparado por
                      </th>
                      <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {logs.map((log) => (
                      <tr key={log.id} className="transition-colors hover:bg-muted/20">
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatPortalDateTime(log.sent_at)}
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground">{log.action_type}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {log.triggered_by === "manual" ? "Manual" : "Cron"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              log.status === "enviado"
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                            )}
                          >
                            {log.status === "enviado" ? "Enviado" : "Falha"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
      <AlertDialog
        open={!!deleteTarget}
        destructive
        title={
          deleteTarget?.type === "rule" ? "Remover regra de cobrança" : "Remover template de email"
        }
        description={`Tem certeza que deseja remover "${deleteTarget?.name ?? ""}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Remover"
        loading={deleting}
        loadingLabel="Removendo..."
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "rule") {
            void deleteRule(deleteTarget.id);
          } else {
            void deleteTemplate(deleteTarget.id);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
