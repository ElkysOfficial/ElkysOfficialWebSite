import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { CheckCircle, Home, Users } from "@/assets/icons";
import AlertBanner from "@/components/portal/shared/AlertBanner";
import DraftBanner from "@/components/portal/shared/DraftBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useFormDraftAutoSave } from "@/hooks/useFormDraftAutoSave";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorText,
  Field,
  Input,
  Label,
  Textarea,
  buttonVariants,
  cn,
} from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { lookupAddressByCep } from "@/lib/cep";
import { getSupabaseFunctionAuthHeaders } from "@/lib/supabase-functions";
import {
  formatDateInput,
  getLocalDateIso,
  isValidCNPJ,
  isValidCPF,
  maskCEP,
  maskCNPJ,
  maskCPF,
  maskDate,
  maskPhone,
  parseFormDate,
  unmaskDigits,
} from "@/lib/masks";

type ClientType = "pf" | "pj";
type Gender = "masculino" | "feminino" | "";
type FormaPagamento = "pix" | "boleto" | "cartao" | "transferencia" | "dinheiro" | "";
type CanalAssinatura = "manual" | "govbr" | "clicksign" | "docusign" | "eletronico" | "";
type RegimeTributario = "mei" | "simples" | "lucro_presumido" | "lucro_real" | "";

type ClientForm = {
  client_type: ClientType;
  gender: Gender;
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  contato_secundario: string;
  cpf: string;
  rg: string;
  birth_date: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  cargo_representante: string;
  inscricao_estadual: string;
  inscricao_municipal: string;
  cnae: string;
  regime_tributario: RegimeTributario;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  city: string;
  state: string;
  country: string;
  client_since: string;
  // Financeiro
  email_financeiro: string;
  responsavel_financeiro: string;
  responsavel_financeiro_phone: string;
  forma_pagamento: FormaPagamento;
  limite_credito: string;
  // Contratual
  canal_assinatura: CanalAssinatura;
  sla_hours: string;
  // CRM
  owner_id: string;
  notes_internal: string;
};

const STEPS = [
  {
    label: "Identificação",
    description: "Dados pessoais ou institucionais do cliente.",
    icon: Users,
  },
  { label: "Contato & Endereço", description: "Canais de contato e localização.", icon: Home },
  {
    label: "Comercial",
    description: "Dados financeiros, contratuais e responsável interno.",
    icon: Users,
  },
  {
    label: "Revisão",
    description: "Conferência antes de criar o acesso e o cadastro.",
    icon: CheckCircle,
  },
] as const;

type TeamOption = { user_id: string; full_name: string };

const selectClass =
  "flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function generateTempPassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const specials = "!@#$%&*";
  const all = upper + lower + digits + specials;
  const rand = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  const base = [rand(upper), rand(lower), rand(digits), rand(specials)];
  for (let index = 0; index < 6; index += 1) base.push(rand(all));
  return base.sort(() => Math.random() - 0.5).join("");
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const done = index < current;
        const active = index === current;

        return (
          <div
            key={step.label}
            className={cn(
              "rounded-xl border p-4 transition-all",
              active
                ? "border-primary/25 bg-primary-soft/70 shadow-card-hover"
                : done
                  ? "border-border/70 bg-background/90"
                  : "border-border/60 bg-background/65"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-card text-foreground">
                <Icon size={18} />
              </div>
              <div className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-md border border-border/70 bg-background px-2 text-xs font-semibold tracking-wide">
                {done ? <CheckCircle size={14} /> : String(index + 1).padStart(2, "0")}
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <p className="text-sm font-semibold text-foreground">{step.label}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export default function AdminClientCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [lastResolvedCep, setLastResolvedCep] = useState("");
  const [form, setForm] = useState<ClientForm>({
    client_type: "pj",
    gender: "",
    full_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    contato_secundario: "",
    cpf: "",
    rg: "",
    birth_date: "",
    cnpj: "",
    razao_social: "",
    nome_fantasia: "",
    cargo_representante: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    cnae: "",
    regime_tributario: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    city: "",
    state: "",
    country: "Brasil",
    client_since: formatDateInput(getLocalDateIso()),
    email_financeiro: "",
    responsavel_financeiro: "",
    responsavel_financeiro_phone: "",
    forma_pagamento: "",
    limite_credito: "",
    canal_assinatura: "",
    sla_hours: "",
    owner_id: "",
    notes_internal: "",
  });

  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("team_members")
        .select("user_id, full_name")
        .eq("is_active", true)
        .not("user_id", "is", null)
        .order("full_name", { ascending: true });
      if (active && data) {
        setTeamOptions(
          data
            .filter((t): t is { user_id: string; full_name: string } => !!t.user_id)
            .map((t) => ({ user_id: t.user_id, full_name: t.full_name }))
        );
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setField = <K extends keyof ClientForm>(field: K, value: ClientForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
  };

  /* ── Auto-save de rascunho local ── */
  const draftKey = `elkys:admin:client-create:draft:${user?.id ?? "anon"}`;
  const {
    hasDraft: hasLocalDraft,
    draftSavedAt: localDraftSavedAt,
    restore: restoreLocalDraft,
    discard: discardLocalDraft,
    clearDraft: clearLocalDraft,
  } = useFormDraftAutoSave<ClientForm>({
    storageKey: draftKey,
    values: form,
    onRestore: (restored) => setForm(restored),
    autoRestore: false,
  });

  useEffect(() => {
    const cepDigits = unmaskDigits(form.cep);

    if (cepDigits.length !== 8) {
      setCepLoading(false);
      if (lastResolvedCep) setLastResolvedCep("");
      return;
    }

    if (cepDigits === lastResolvedCep) return;

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setCepLoading(true);

      try {
        const address = await lookupAddressByCep(cepDigits);
        if (!active || !address) return;

        setForm((current) => {
          if (unmaskDigits(current.cep) !== cepDigits) return current;

          return {
            ...current,
            logradouro: address.logradouro || current.logradouro,
            complemento: address.complemento || current.complemento,
            bairro: address.bairro || current.bairro,
            city: address.city || current.city,
            state: address.state || current.state,
            country: current.country.trim() || address.country,
          };
        });
      } catch {
        // keep manual editing available
      } finally {
        if (active) {
          setLastResolvedCep(cepDigits);
          setCepLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.cep, lastResolvedCep]);

  const validateStep = () => {
    if (step >= 0) {
      if (form.full_name.trim().length < 3) return "Informe o nome do contato principal.";
      if (!form.email.includes("@")) return "Informe um e-mail válido.";
      if (!isValidCPF(unmaskDigits(form.cpf))) return "Informe um CPF válido.";
      if (form.birth_date && !parseFormDate(form.birth_date))
        return "Informe uma data de nascimento válida.";
      if (form.client_type === "pj") {
        if (!isValidCNPJ(unmaskDigits(form.cnpj))) return "Informe um CNPJ válido.";
        if (form.razao_social.trim().length < 3) return "Informe a razão social.";
      }
    }

    if (step >= 1) {
      if (unmaskDigits(form.phone).length < 10) return "Informe um telefone válido.";
      if (form.whatsapp && unmaskDigits(form.whatsapp).length < 10)
        return "Informe um WhatsApp válido ou deixe em branco.";
      if (form.cep.trim() && unmaskDigits(form.cep).length !== 8) return "Informe um CEP válido.";
      if (!parseFormDate(form.client_since)) return "Informe uma data válida para cliente desde.";
    }

    if (step >= 2) {
      if (form.email_financeiro && !form.email_financeiro.includes("@"))
        return "Informe um e-mail financeiro válido ou deixe em branco.";
      if (
        form.responsavel_financeiro_phone &&
        unmaskDigits(form.responsavel_financeiro_phone).length < 10
      )
        return "Informe um telefone válido para o responsável financeiro.";
      if (form.limite_credito && Number.isNaN(Number(form.limite_credito)))
        return "Informe um limite de crédito numérico.";
      if (form.sla_hours && Number.isNaN(Number(form.sla_hours)))
        return "Informe um SLA numérico em horas.";
    }

    return null;
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) {
      setFormError(error);
      return;
    }
    setStep((current) => current + 1);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const error = validateStep();
    if (error) {
      setFormError(error);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    let createdUserId: string | null = null;
    let shouldRollbackUser = false;

    try {
      const tempPassword = generateTempPassword();
      const authHeaders = await getSupabaseFunctionAuthHeaders();

      const { data: createData, error: createError } = await supabase.functions.invoke(
        "create-user",
        {
          body: { email: form.email, password: tempPassword, full_name: form.full_name },
          headers: authHeaders,
        }
      );

      if (createError) throw new Error(`create-user: ${createError.message}`);
      if (createData?.error) throw new Error(String(createData.error));
      if (!createData?.user_id) throw new Error("Não foi possível criar o acesso do cliente.");

      createdUserId = createData.user_id as string;
      shouldRollbackUser = true;

      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({
          user_id: createdUserId,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          // cpf NULL quando vazio (PJ não tem CPF). Antes enviava '' e a
          // segunda criação de PJ violava UNIQUE.
          cpf: form.cpf ? unmaskDigits(form.cpf) || null : null,
          cnpj: form.cnpj ? unmaskDigits(form.cnpj) : null,
          phone: unmaskDigits(form.phone),
          whatsapp: form.whatsapp ? unmaskDigits(form.whatsapp) : null,
          contato_secundario: form.contato_secundario.trim() || null,
          gender: form.gender || null,
          rg: form.rg.trim() || null,
          birth_date: parseFormDate(form.birth_date),
          logradouro: form.logradouro || null,
          numero: form.numero || null,
          complemento: form.complemento || null,
          bairro: form.bairro || null,
          city: form.city || null,
          state: form.state || null,
          cep: form.cep.trim() ? unmaskDigits(form.cep) : null,
          country: form.country || "Brasil",
          client_type: form.client_type,
          razao_social: form.razao_social || null,
          nome_fantasia: form.nome_fantasia || null,
          cargo_representante: form.cargo_representante || null,
          inscricao_estadual: form.inscricao_estadual.trim() || null,
          inscricao_municipal: form.inscricao_municipal.trim() || null,
          cnae: form.cnae.trim() || null,
          regime_tributario: form.regime_tributario || null,
          client_since: parseFormDate(form.client_since) ?? getLocalDateIso(),
          email_financeiro: form.email_financeiro.trim() || null,
          responsavel_financeiro: form.responsavel_financeiro.trim() || null,
          responsavel_financeiro_phone: form.responsavel_financeiro_phone
            ? unmaskDigits(form.responsavel_financeiro_phone)
            : null,
          forma_pagamento: form.forma_pagamento || null,
          limite_credito: form.limite_credito ? Number(form.limite_credito) : null,
          canal_assinatura: form.canal_assinatura || null,
          sla_hours: form.sla_hours ? Number(form.sla_hours) : null,
          owner_id: form.owner_id || null,
          notes_internal: form.notes_internal.trim() || null,
          must_change_password: true,
        })
        .select("id, full_name")
        .single();

      if (clientError || !clientData) throw clientError ?? new Error("Falha ao criar cliente.");

      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ user_id: createdUserId, role: "cliente" }, { onConflict: "user_id,role" });

      if (roleError) throw roleError;

      shouldRollbackUser = false;

      const { error: emailError } = await supabase.functions.invoke("send-client-welcome", {
        body: {
          email: form.email,
          name: form.full_name,
          temp_password: tempPassword,
          gender: form.gender || null,
          client_type: form.client_type,
          nome_fantasia: form.nome_fantasia || null,
        },
        headers: authHeaders,
      });

      if (emailError) {
        console.warn("[client-create] send-client-welcome:", emailError.message);
      }

      toast.success("Cliente criado com sucesso.", {
        description: "Agora vamos para o primeiro projeto desse cliente.",
      });
      clearLocalDraft();
      navigate(`/portal/admin/projetos/novo?clientId=${clientData.id}`, { replace: true });
    } catch (error) {
      if (shouldRollbackUser && createdUserId) {
        // Clean up in reverse order: role → client record → auth user
        const { error: roleCleanup } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", createdUserId);
        if (roleCleanup) {
          console.warn("[client-create] rollback user_roles:", roleCleanup.message);
        }

        const { error: clientCleanup } = await supabase
          .from("clients")
          .delete()
          .eq("user_id", createdUserId);
        if (clientCleanup) {
          console.warn("[client-create] rollback client:", clientCleanup.message);
        }

        try {
          await supabase.functions.invoke("delete-user", {
            body: { user_id: createdUserId },
            headers: await getSupabaseFunctionAuthHeaders(),
          });
        } catch (rollbackError) {
          console.error("[client-create] rollback delete-user failed", rollbackError);
        }
      }

      setFormError(error instanceof Error ? error.message : "Não foi possível criar o cliente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex justify-end">
        <Link to="/portal/admin/clientes" className={buttonVariants({ variant: "outline" })}>
          Voltar
        </Link>
      </div>

      {hasLocalDraft && (
        <DraftBanner
          savedAt={localDraftSavedAt}
          onRestore={restoreLocalDraft}
          onDiscard={discardLocalDraft}
          title="Rascunho de cliente encontrado"
        />
      )}

      <Card className="border-border/70 bg-card/92 shadow-card">
        <CardHeader className="gap-4 border-b border-border/60">
          <div className="space-y-2">
            <CardTitle className="text-xl">{STEPS[step].label}</CardTitle>
            <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
          </div>
          <StepIndicator current={step} />
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {formError ? <AlertBanner tone="destructive" title={formError} /> : null}

          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <Label htmlFor="client_type">Tipo de cliente</Label>
                <select
                  id="client_type"
                  name="client_type"
                  value={form.client_type}
                  onChange={(event) => setField("client_type", event.target.value as ClientType)}
                  className={selectClass}
                >
                  <option value="pf">Pessoa física</option>
                  <option value="pj">Pessoa jurídica</option>
                </select>
              </Field>
              <Field>
                <Label htmlFor="gender">Tratamento formal</Label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={(event) => setField("gender", event.target.value as Gender)}
                  className={selectClass}
                >
                  <option value="">Prezado(a) — não informado</option>
                  <option value="masculino">Sr. (masculino)</option>
                  <option value="feminino">Sra. (feminino)</option>
                </select>
              </Field>

              <Field>
                <Label htmlFor="full_name" required>
                  {form.client_type === "pj" ? "Nome do representante" : "Nome completo"}
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={form.full_name}
                  onChange={(event) => setField("full_name", event.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="email" required>
                  E-mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="cpf" required>
                  CPF {form.client_type === "pj" ? "do representante" : ""}
                </Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={form.cpf}
                  onChange={(event) => setField("cpf", maskCPF(event.target.value))}
                />
              </Field>
              <Field>
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  name="rg"
                  value={form.rg}
                  onChange={(event) => setField("rg", event.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="birth_date">Data de nascimento</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  value={form.birth_date}
                  onChange={(event) => setField("birth_date", maskDate(event.target.value))}
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                />
              </Field>

              {form.client_type === "pj" ? (
                <>
                  <Field>
                    <Label htmlFor="cnpj" required>
                      CNPJ
                    </Label>
                    <Input
                      id="cnpj"
                      name="cnpj"
                      value={form.cnpj}
                      onChange={(event) => setField("cnpj", maskCNPJ(event.target.value))}
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="razao_social" required>
                      Razão social
                    </Label>
                    <Input
                      id="razao_social"
                      name="razao_social"
                      value={form.razao_social}
                      onChange={(event) => setField("razao_social", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="nome_fantasia">Nome fantasia</Label>
                    <Input
                      id="nome_fantasia"
                      name="nome_fantasia"
                      value={form.nome_fantasia}
                      onChange={(event) => setField("nome_fantasia", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="cargo_representante">Cargo do representante</Label>
                    <Input
                      id="cargo_representante"
                      name="cargo_representante"
                      value={form.cargo_representante}
                      onChange={(event) => setField("cargo_representante", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="inscricao_estadual">Inscrição estadual</Label>
                    <Input
                      id="inscricao_estadual"
                      name="inscricao_estadual"
                      value={form.inscricao_estadual}
                      onChange={(event) => setField("inscricao_estadual", event.target.value)}
                      placeholder="ISENTO ou número"
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="inscricao_municipal">Inscrição municipal</Label>
                    <Input
                      id="inscricao_municipal"
                      name="inscricao_municipal"
                      value={form.inscricao_municipal}
                      onChange={(event) => setField("inscricao_municipal", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="cnae">CNAE principal</Label>
                    <Input
                      id="cnae"
                      name="cnae"
                      value={form.cnae}
                      onChange={(event) => setField("cnae", event.target.value)}
                      placeholder="0000-0/00"
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="regime_tributario">Regime tributário</Label>
                    <select
                      id="regime_tributario"
                      name="regime_tributario"
                      value={form.regime_tributario}
                      onChange={(event) =>
                        setField("regime_tributario", event.target.value as RegimeTributario)
                      }
                      className={selectClass}
                    >
                      <option value="">Não informado</option>
                      <option value="mei">MEI</option>
                      <option value="simples">Simples Nacional</option>
                      <option value="lucro_presumido">Lucro Presumido</option>
                      <option value="lucro_real">Lucro Real</option>
                    </select>
                  </Field>
                </>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <Label htmlFor="phone" required>
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={(event) => setField("phone", maskPhone(event.target.value))}
                  />
                </Field>
                <Field>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    value={form.whatsapp}
                    onChange={(event) => setField("whatsapp", maskPhone(event.target.value))}
                    placeholder="Deixe em branco se for igual ao telefone"
                  />
                </Field>
                <Field className="md:col-span-2">
                  <Label htmlFor="contato_secundario">Contato secundário</Label>
                  <Input
                    id="contato_secundario"
                    name="contato_secundario"
                    value={form.contato_secundario}
                    onChange={(event) => setField("contato_secundario", event.target.value)}
                    placeholder="Nome + telefone/e-mail de backup"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <Label htmlFor="cep">CEP{cepLoading ? " — buscando..." : ""}</Label>
                  <Input
                    id="cep"
                    name="cep"
                    value={form.cep}
                    onChange={(event) => setField("cep", maskCEP(event.target.value))}
                    placeholder="00000-000"
                  />
                </Field>
                <Field>
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    name="logradouro"
                    value={form.logradouro}
                    onChange={(event) => setField("logradouro", event.target.value)}
                  />
                </Field>
                <Field>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    name="numero"
                    value={form.numero}
                    onChange={(event) => setField("numero", event.target.value)}
                  />
                </Field>
                <Field>
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    name="complemento"
                    value={form.complemento}
                    onChange={(event) => setField("complemento", event.target.value)}
                  />
                </Field>
                <Field>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    name="bairro"
                    value={form.bairro}
                    onChange={(event) => setField("bairro", event.target.value)}
                  />
                </Field>
                <Field>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={(event) => setField("city", event.target.value)}
                  />
                </Field>
                <Field>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    name="state"
                    value={form.state}
                    onChange={(event) => setField("state", event.target.value.toUpperCase())}
                  />
                </Field>
                <Field>
                  <Label htmlFor="client_since">Cliente desde</Label>
                  <Input
                    id="client_since"
                    name="client_since"
                    value={form.client_since}
                    onChange={(event) => setField("client_since", maskDate(event.target.value))}
                    placeholder="DD/MM/AAAA"
                    inputMode="numeric"
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-6">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Financeiro
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <Label htmlFor="email_financeiro">E-mail financeiro</Label>
                    <Input
                      id="email_financeiro"
                      name="email_financeiro"
                      type="email"
                      value={form.email_financeiro}
                      onChange={(event) => setField("email_financeiro", event.target.value)}
                      placeholder="Deixe em branco para usar o e-mail principal"
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="responsavel_financeiro">Responsável financeiro</Label>
                    <Input
                      id="responsavel_financeiro"
                      name="responsavel_financeiro"
                      value={form.responsavel_financeiro}
                      onChange={(event) => setField("responsavel_financeiro", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="responsavel_financeiro_phone">
                      Telefone do responsável financeiro
                    </Label>
                    <Input
                      id="responsavel_financeiro_phone"
                      name="responsavel_financeiro_phone"
                      value={form.responsavel_financeiro_phone}
                      onChange={(event) =>
                        setField("responsavel_financeiro_phone", maskPhone(event.target.value))
                      }
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="forma_pagamento">Forma de pagamento</Label>
                    <select
                      id="forma_pagamento"
                      name="forma_pagamento"
                      value={form.forma_pagamento}
                      onChange={(event) =>
                        setField("forma_pagamento", event.target.value as FormaPagamento)
                      }
                      className={selectClass}
                    >
                      <option value="">Não informado</option>
                      <option value="pix">PIX</option>
                      <option value="boleto">Boleto</option>
                      <option value="cartao">Cartão</option>
                      <option value="transferencia">Transferência</option>
                      <option value="dinheiro">Dinheiro</option>
                    </select>
                  </Field>
                  <Field>
                    <Label htmlFor="limite_credito">Limite de crédito (R$)</Label>
                    <Input
                      id="limite_credito"
                      name="limite_credito"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.limite_credito}
                      onChange={(event) => setField("limite_credito", event.target.value)}
                    />
                  </Field>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contratual
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <Label htmlFor="canal_assinatura">Canal de assinatura</Label>
                    <select
                      id="canal_assinatura"
                      name="canal_assinatura"
                      value={form.canal_assinatura}
                      onChange={(event) =>
                        setField("canal_assinatura", event.target.value as CanalAssinatura)
                      }
                      className={selectClass}
                    >
                      <option value="">Não informado</option>
                      <option value="manual">Manual (físico)</option>
                      <option value="govbr">gov.br</option>
                      <option value="clicksign">Clicksign</option>
                      <option value="docusign">DocuSign</option>
                      <option value="eletronico">Eletrônico (outro)</option>
                    </select>
                  </Field>
                  <Field>
                    <Label htmlFor="sla_hours">SLA contratado (horas)</Label>
                    <Input
                      id="sla_hours"
                      name="sla_hours"
                      type="number"
                      min={0}
                      value={form.sla_hours}
                      onChange={(event) => setField("sla_hours", event.target.value)}
                    />
                  </Field>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  CRM interno
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <Label htmlFor="owner_id">Responsável interno (owner)</Label>
                    <select
                      id="owner_id"
                      name="owner_id"
                      value={form.owner_id}
                      onChange={(event) => setField("owner_id", event.target.value)}
                      className={selectClass}
                    >
                      <option value="">Não atribuído</option>
                      {teamOptions.map((t) => (
                        <option key={t.user_id} value={t.user_id}>
                          {t.full_name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field className="md:col-span-2">
                    <Label htmlFor="notes_internal">Observações internas</Label>
                    <Textarea
                      id="notes_internal"
                      name="notes_internal"
                      rows={4}
                      value={form.notes_internal}
                      onChange={(event) => setField("notes_internal", event.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div className="space-y-4 rounded-xl border border-border/70 bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Identificação
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <ReviewRow
                    label="Tipo"
                    value={form.client_type === "pj" ? "Pessoa jurídica" : "Pessoa física"}
                  />
                  <ReviewRow
                    label="Tratamento"
                    value={
                      form.gender === "masculino"
                        ? "Sr."
                        : form.gender === "feminino"
                          ? "Sra."
                          : "Prezado(a)"
                    }
                  />
                  <ReviewRow
                    label={form.client_type === "pj" ? "Representante" : "Nome"}
                    value={form.full_name}
                  />
                  <ReviewRow label="E-mail" value={form.email} />
                  <ReviewRow label="CPF" value={form.cpf} />
                  <ReviewRow label="RG" value={form.rg} />
                  <ReviewRow label="Data de nascimento" value={form.birth_date} />
                  {form.client_type === "pj" ? (
                    <>
                      <ReviewRow label="CNPJ" value={form.cnpj} />
                      <ReviewRow label="Razão social" value={form.razao_social} />
                      <ReviewRow label="Nome fantasia" value={form.nome_fantasia} />
                      <ReviewRow label="Cargo" value={form.cargo_representante} />
                      <ReviewRow label="Inscrição estadual" value={form.inscricao_estadual} />
                      <ReviewRow label="Inscrição municipal" value={form.inscricao_municipal} />
                      <ReviewRow label="CNAE" value={form.cnae} />
                      <ReviewRow label="Regime tributário" value={form.regime_tributario} />
                    </>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-border/70 bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contato & Endereço
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <ReviewRow label="Telefone" value={form.phone} />
                  <ReviewRow label="WhatsApp" value={form.whatsapp} />
                  <ReviewRow label="Contato secundário" value={form.contato_secundario} />
                  <ReviewRow label="CEP" value={form.cep} />
                  <ReviewRow label="Logradouro" value={form.logradouro} />
                  <ReviewRow label="Número" value={form.numero} />
                  <ReviewRow label="Complemento" value={form.complemento} />
                  <ReviewRow label="Bairro" value={form.bairro} />
                  <ReviewRow label="Cidade" value={form.city} />
                  <ReviewRow label="Estado" value={form.state} />
                  <ReviewRow label="Cliente desde" value={form.client_since} />
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-border/70 bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Comercial
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <ReviewRow label="E-mail financeiro" value={form.email_financeiro} />
                  <ReviewRow label="Resp. financeiro" value={form.responsavel_financeiro} />
                  <ReviewRow label="Tel. financeiro" value={form.responsavel_financeiro_phone} />
                  <ReviewRow label="Forma de pagamento" value={form.forma_pagamento} />
                  <ReviewRow label="Limite de crédito" value={form.limite_credito} />
                  <ReviewRow label="Canal de assinatura" value={form.canal_assinatura} />
                  <ReviewRow label="SLA (h)" value={form.sla_hours} />
                  <ReviewRow
                    label="Owner"
                    value={teamOptions.find((t) => t.user_id === form.owner_id)?.full_name ?? ""}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((current) => current - 1)}
              >
                Voltar
              </Button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Proximo
              </Button>
            ) : (
              <Button
                type="button"
                loading={submitting}
                loadingText="Criando..."
                onClick={() => void handleSubmit()}
              >
                Criar cliente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
