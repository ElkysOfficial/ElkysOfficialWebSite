import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { CheckCircle, Home, Users } from "@/assets/icons";
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

type ClientForm = {
  client_type: ClientType;
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  cargo_representante: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  city: string;
  state: string;
  country: string;
  client_since: string;
  notes_internal: string;
};

const STEPS = [
  { label: "Identificação", description: "Dados da empresa e do contato principal.", icon: Users },
  { label: "Endereço", description: "Dados institucionais e de localização.", icon: Home },
  {
    label: "Revisao",
    description: "Conferencia antes de criar o acesso e o cadastro.",
    icon: CheckCircle,
  },
] as const;

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
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [lastResolvedCep, setLastResolvedCep] = useState("");
  const [form, setForm] = useState<ClientForm>({
    client_type: "pj",
    full_name: "",
    email: "",
    phone: "",
    cpf: "",
    cnpj: "",
    razao_social: "",
    nome_fantasia: "",
    cargo_representante: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    city: "",
    state: "",
    country: "Brasil",
    client_since: formatDateInput(new Date().toISOString().slice(0, 10)),
    notes_internal: "",
  });

  const setField = <K extends keyof ClientForm>(field: K, value: ClientForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
  };

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
      if (!form.email.includes("@")) return "Informe um e-mail valido.";
      if (unmaskDigits(form.phone).length < 10) return "Informe um telefone valido.";
      if (!isValidCPF(unmaskDigits(form.cpf))) return "Informe um CPF valido.";
      if (form.client_type === "pj") {
        if (!isValidCNPJ(unmaskDigits(form.cnpj))) return "Informe um CNPJ valido.";
        if (form.razao_social.trim().length < 3) return "Informe a razao social.";
      }
    }

    if (step >= 1) {
      if (form.cep.trim() && unmaskDigits(form.cep).length !== 8) return "Informe um CEP valido.";
      if (!parseFormDate(form.client_since)) return "Informe uma data valida para cliente desde.";
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
          cpf: unmaskDigits(form.cpf),
          cnpj: form.cnpj ? unmaskDigits(form.cnpj) : null,
          phone: unmaskDigits(form.phone),
          address:
            [form.logradouro, form.numero, form.complemento].filter(Boolean).join(", ") || null,
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
          client_since: parseFormDate(form.client_since) ?? new Date().toISOString().slice(0, 10),
          monthly_value: 0,
          project_total_value: 0,
          must_change_password: true,
          scope_summary: form.notes_internal.trim() || null,
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
        body: { email: form.email, name: form.full_name, temp_password: tempPassword },
        headers: authHeaders,
      });

      if (emailError) {
        console.warn("[client-create] send-client-welcome:", emailError.message);
      }

      toast.success("Cliente criado com sucesso.", {
        description: "Agora vamos para o primeiro projeto desse cliente.",
      });
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

      <Card className="border-border/70 bg-card/92 shadow-card">
        <CardHeader className="gap-4 border-b border-border/60">
          <div className="space-y-2">
            <CardTitle className="text-xl">{STEPS[step].label}</CardTitle>
            <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
          </div>
          <StepIndicator current={step} />
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {formError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {formError}
            </div>
          ) : null}

          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field className="md:col-span-2">
                <Label htmlFor="client_type">Tipo de cliente</Label>
                <select
                  id="client_type"
                  name="client_type"
                  value={form.client_type}
                  onChange={(event) => setField("client_type", event.target.value as ClientType)}
                  className={selectClass}
                >
                  <option value="pf">Pessoa fisica</option>
                  <option value="pj">Pessoa juridica</option>
                </select>
              </Field>

              <Field>
                <Label htmlFor="full_name" required>
                  Contato principal
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
                <Label htmlFor="cpf" required>
                  CPF do representante
                </Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={form.cpf}
                  onChange={(event) => setField("cpf", maskCPF(event.target.value))}
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
                      Razao social
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
                </>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <Label htmlFor="cep">CEP{cepLoading ? " - buscando..." : ""}</Label>
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
                <Label htmlFor="numero">Numero</Label>
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
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="space-y-4 rounded-xl border border-border/70 bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cliente
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <ReviewRow
                    label="Tipo"
                    value={form.client_type === "pj" ? "Pessoa juridica" : "Pessoa fisica"}
                  />
                  <ReviewRow label="Contato" value={form.full_name} />
                  <ReviewRow label="E-mail" value={form.email} />
                  <ReviewRow label="Telefone" value={form.phone} />
                  <ReviewRow label="CPF" value={form.cpf} />
                  <ReviewRow label="CNPJ" value={form.cnpj} />
                  <ReviewRow label="Razao social" value={form.razao_social} />
                  <ReviewRow label="Nome fantasia" value={form.nome_fantasia} />
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-border/70 bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Endereço
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <ReviewRow label="CEP" value={form.cep} />
                  <ReviewRow label="Logradouro" value={form.logradouro} />
                  <ReviewRow label="Numero" value={form.numero} />
                  <ReviewRow label="Complemento" value={form.complemento} />
                  <ReviewRow label="Bairro" value={form.bairro} />
                  <ReviewRow label="Cidade" value={form.city} />
                  <ReviewRow label="Estado" value={form.state} />
                  <ReviewRow label="Cliente desde" value={form.client_since} />
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
              <Button type="button" disabled={submitting} onClick={() => void handleSubmit()}>
                {submitting ? "Criando..." : "Criar cliente"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
