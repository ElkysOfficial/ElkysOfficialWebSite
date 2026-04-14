import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Building2, CheckCircle } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import CollapsibleSection from "@/components/portal/CollapsibleSection";
import ContactLinks from "@/components/portal/ContactLinks";
import PortalLoading from "@/components/portal/PortalLoading";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  buttonVariants,
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
  cn,
} from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  formatBRL,
  isValidCNPJ,
  isValidCPF,
  maskCEP,
  maskCNPJ,
  maskCPF,
  maskCurrency,
  maskDate,
  maskPhone,
  toCents,
  unmaskCurrency,
  unmaskDigits,
} from "@/lib/masks";
import { lookupAddressByCep } from "@/lib/cep";
import { getSupabaseFunctionAuthHeaders } from "@/lib/supabase-functions";
import StatusBadge from "@/components/portal/StatusBadge";
import {
  CHARGE_STATUS_META,
  PROJECT_STATUS_META,
  TICKET_STATUS_META,
  TICKET_PRIORITY_META,
  formatPortalDate,
  formatPortalDateTime,
  getClientDisplayName,
} from "@/lib/portal";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];
type ProjectContract = Database["public"]["Tables"]["project_contracts"]["Row"];
type ProjectSubscription = Database["public"]["Tables"]["project_subscriptions"]["Row"];
type ContractStatus = Database["public"]["Enums"]["contract_status"];
type ContractType = Database["public"]["Enums"]["contract_type"];
type ClientOrigin = Database["public"]["Enums"]["client_origin"];
type ClientProject = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  | "id"
  | "name"
  | "status"
  | "current_stage"
  | "started_at"
  | "delivered_at"
  | "expected_delivery_date"
  | "solution_type"
>;
type ClientCharge = Pick<
  Database["public"]["Tables"]["charges"]["Row"],
  | "id"
  | "description"
  | "amount"
  | "due_date"
  | "status"
  | "origin_type"
  | "paid_at"
  | "is_historical"
>;
type ClientTicket = Pick<
  Database["public"]["Tables"]["support_tickets"]["Row"],
  "id" | "subject" | "status" | "priority" | "category" | "created_at" | "updated_at"
>;
type ClientProposal = Pick<
  Database["public"]["Tables"]["proposals"]["Row"],
  | "id"
  | "title"
  | "status"
  | "total_amount"
  | "valid_until"
  | "created_at"
  | "sent_at"
  | "approved_at"
>;
type ClientTimelineEvent = Pick<
  Database["public"]["Tables"]["timeline_events"]["Row"],
  "id" | "event_type" | "title" | "summary" | "occurred_at"
>;
type ClientType = "pf" | "pj";
type TabKey =
  | "dados"
  | "contrato"
  | "projetos"
  | "financeiro"
  | "suporte"
  | "propostas"
  | "timeline";
type DialogAction = "toggle-active" | "delete" | null;
type EditingSection = "dados" | "contrato" | null;

type GeneralFormValues = {
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
};

type ContractFormValues = {
  monthly_value: string;
  project_total_value: string;
  client_since: string;
  payment_due_day: string;
  contract_status: ContractStatus | "";
  contract_type: ContractType | "";
  client_origin: ClientOrigin | "";
  contract_start: string;
  contract_end: string;
  scope_summary: string;
  tags_input: string;
};

type GeneralFormErrors = Partial<Record<keyof GeneralFormValues, string>>;
type ContractFormErrors = Partial<Record<keyof ContractFormValues, string>>;

const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  ativo: "Ativo",
  inadimplente: "Inadimplente",
  cancelado: "Cancelado",
};

const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  projeto: "Projeto",
  recorrente: "Recorrente",
  hibrido: "Híbrido",
};

const ORIGIN_LABEL: Record<ClientOrigin, string> = {
  lead: "Lead",
  indicacao: "Indicação",
  inbound: "Inbound",
};

const selectClass =
  "flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateInput(date: string | null) {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

function parseFormDate(value?: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  const isoDate = `${year}-${month}-${day}`;
  const parsed = new Date(`${isoDate}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getFullYear() !== Number(year)) return null;
  if (parsed.getMonth() + 1 !== Number(month)) return null;
  if (parsed.getDate() !== Number(day)) return null;

  return isoDate;
}

function buildAddress({
  logradouro,
  numero,
  complemento,
}: Pick<GeneralFormValues, "logradouro" | "numero" | "complemento">) {
  return [logradouro.trim(), numero.trim(), complemento.trim()].filter(Boolean).join(", ") || null;
}

function normalizeTags(tagsInput: string) {
  return Array.from(
    new Set(
      tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getGeneralFormDefaults(client: Client): GeneralFormValues {
  return {
    client_type: client.client_type === "pf" ? "pf" : "pj",
    full_name: client.full_name,
    email: client.email,
    phone: client.phone ? maskPhone(client.phone) : "",
    cpf: maskCPF(client.cpf),
    cnpj: client.cnpj ? maskCNPJ(client.cnpj) : "",
    razao_social: client.razao_social ?? "",
    nome_fantasia: client.nome_fantasia ?? "",
    cargo_representante: client.cargo_representante ?? "",
    cep: client.cep ? maskCEP(client.cep) : "",
    logradouro: client.logradouro ?? "",
    numero: client.numero ?? "",
    complemento: client.complemento ?? "",
    bairro: client.bairro ?? "",
    city: client.city ?? "",
    state: client.state ?? "",
    country: client.country ?? "Brasil",
  };
}

function deriveContractSnapshot(
  client: Client,
  contracts: ProjectContract[] = [],
  subscriptions: ProjectSubscription[] = []
) {
  const latestContract =
    [...contracts].sort((left, right) => right.created_at.localeCompare(left.created_at))[0] ??
    null;
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status !== "encerrada"
  );
  const primarySubscription = activeSubscriptions[0] ?? subscriptions[0] ?? null;

  const derivedMonthlyValue =
    Number(client.monthly_value) > 0
      ? Number(client.monthly_value)
      : activeSubscriptions.reduce((sum, subscription) => sum + toCents(subscription.amount), 0) /
        100;
  const derivedProjectTotal =
    Number(client.project_total_value) > 0
      ? Number(client.project_total_value)
      : Number(latestContract?.total_amount ?? 0);
  const derivedDueDay = client.payment_due_day ?? primarySubscription?.due_day ?? null;
  const derivedContractType =
    client.contract_type ??
    (derivedProjectTotal > 0 && derivedMonthlyValue > 0
      ? "hibrido"
      : derivedMonthlyValue > 0
        ? "recorrente"
        : derivedProjectTotal > 0
          ? "projeto"
          : "");
  const derivedContractStatus =
    client.contract_status ??
    (derivedProjectTotal > 0 || derivedMonthlyValue > 0
      ? client.is_active
        ? "ativo"
        : "cancelado"
      : "");
  const derivedContractStart =
    client.contract_start ??
    latestContract?.starts_at ??
    latestContract?.signed_at ??
    primarySubscription?.starts_on ??
    client.client_since;
  const derivedContractEnd =
    client.contract_end ?? latestContract?.ends_at ?? primarySubscription?.ends_on ?? null;
  const derivedScopeSummary = client.scope_summary ?? latestContract?.scope_summary ?? "";

  return {
    monthly_value: derivedMonthlyValue,
    project_total_value: derivedProjectTotal,
    payment_due_day: derivedDueDay,
    contract_status: derivedContractStatus,
    contract_type: derivedContractType,
    contract_start: derivedContractStart,
    contract_end: derivedContractEnd,
    client_origin: client.client_origin ?? "",
    scope_summary: derivedScopeSummary,
    tags: client.tags,
  };
}

function getContractFormDefaults(
  client: Client,
  contracts: ProjectContract[] = [],
  subscriptions: ProjectSubscription[] = []
): ContractFormValues {
  const snapshot = deriveContractSnapshot(client, contracts, subscriptions);

  return {
    monthly_value: formatBRL(Number(snapshot.monthly_value ?? 0)),
    project_total_value: formatBRL(Number(snapshot.project_total_value ?? 0)),
    client_since: formatDateInput(client.client_since),
    payment_due_day: snapshot.payment_due_day ? String(snapshot.payment_due_day) : "",
    contract_status: snapshot.contract_status,
    contract_type: snapshot.contract_type,
    client_origin: snapshot.client_origin,
    contract_start: formatDateInput(snapshot.contract_start),
    contract_end: formatDateInput(snapshot.contract_end),
    scope_summary: snapshot.scope_summary,
    tags_input: snapshot.tags.join(", "),
  };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value || "-"}</span>
    </div>
  );
}

function GeneralClientForm({
  client,
  saving,
  onCancel,
  onSave,
}: {
  client: Client;
  saving: boolean;
  onCancel: () => void;
  onSave: (values: GeneralFormValues) => Promise<void>;
}) {
  const [form, setForm] = useState<GeneralFormValues>(() => getGeneralFormDefaults(client));
  const [errors, setErrors] = useState<GeneralFormErrors>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [lastResolvedCep, setLastResolvedCep] = useState("");

  useEffect(() => {
    setForm(getGeneralFormDefaults(client));
    setErrors({});
    setLastResolvedCep("");
  }, [client]);

  const setField = <K extends keyof GeneralFormValues>(field: K, value: GeneralFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: GeneralFormErrors = {};
    const cpfDigits = unmaskDigits(form.cpf);
    const phoneDigits = unmaskDigits(form.phone);
    const cnpjDigits = unmaskDigits(form.cnpj);

    if (form.full_name.trim().length < 3) nextErrors.full_name = "Informe o nome completo.";
    if (!isValidEmail(form.email.trim())) nextErrors.email = "Informe um e-mail válido.";
    if (!isValidCPF(cpfDigits)) nextErrors.cpf = "CPF inválido.";
    if (form.phone.trim() && phoneDigits.length < 10) nextErrors.phone = "Telefone inválido.";

    if (form.client_type === "pj") {
      if (!isValidCNPJ(cnpjDigits)) nextErrors.cnpj = "CNPJ inválido.";
      if (form.razao_social.trim().length < 3) {
        nextErrors.razao_social = "Razão social obrigatória para cliente PJ.";
      }
    }

    if (form.cep.trim() && unmaskDigits(form.cep).length !== 8) nextErrors.cep = "CEP inválido.";

    return nextErrors;
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Revise os dados gerais antes de salvar.");
      return;
    }

    await onSave(form);
  };

  return (
    <Card className="border-border/70 bg-card/92">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">Editar dados gerais</CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <CollapsibleSection
            title="Identificação e contato"
            description="Tipo de cliente, nome, e-mail, telefone e documentos."
            defaultOpen
          >
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
                  <option value="pf">Pessoa Física</option>
                  <option value="pj">Pessoa Jurídica</option>
                </select>
              </Field>

              <Field>
                <Label htmlFor="full_name">Nome completo / representante</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={form.full_name}
                  onChange={(event) => setField("full_name", event.target.value)}
                />
                <ErrorText className={errors.full_name ? "" : "invisible"}>
                  {errors.full_name || "\u00A0"}
                </ErrorText>
              </Field>

              <Field>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                />
                <ErrorText className={errors.email ? "" : "invisible"}>
                  {errors.email || "\u00A0"}
                </ErrorText>
              </Field>

              <Field>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={(event) => setField("phone", maskPhone(event.target.value))}
                  placeholder="(31) 99999-9999"
                />
                <ErrorText className={errors.phone ? "" : "invisible"}>
                  {errors.phone || "\u00A0"}
                </ErrorText>
              </Field>

              <Field>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={form.cpf}
                  onChange={(event) => setField("cpf", maskCPF(event.target.value))}
                  placeholder="000.000.000-00"
                />
                <ErrorText className={errors.cpf ? "" : "invisible"}>
                  {errors.cpf || "\u00A0"}
                </ErrorText>
              </Field>

              {form.client_type === "pj" ? (
                <>
                  <Field>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      name="cnpj"
                      value={form.cnpj}
                      onChange={(event) => setField("cnpj", maskCNPJ(event.target.value))}
                      placeholder="00.000.000/0000-00"
                    />
                    <ErrorText className={errors.cnpj ? "" : "invisible"}>
                      {errors.cnpj || "\u00A0"}
                    </ErrorText>
                  </Field>

                  <Field>
                    <Label htmlFor="razao_social">Razão social</Label>
                    <Input
                      id="razao_social"
                      name="razao_social"
                      value={form.razao_social}
                      onChange={(event) => setField("razao_social", event.target.value)}
                    />
                    <ErrorText className={errors.razao_social ? "" : "invisible"}>
                      {errors.razao_social || "\u00A0"}
                    </ErrorText>
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
          </CollapsibleSection>

          <CollapsibleSection
            title="Endereço"
            description="CEP, logradouro, cidade, estado e país. O CEP preenche os demais automaticamente."
            defaultOpen
          >
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
                <ErrorText className={errors.cep ? "" : "invisible"}>
                  {errors.cep || "\u00A0"}
                </ErrorText>
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
                  maxLength={2}
                />
              </Field>

              <Field>
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  name="country"
                  value={form.country}
                  onChange={(event) => setField("country", event.target.value)}
                />
              </Field>
            </div>
          </CollapsibleSection>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving} loadingText="Salvando...">
              Salvar dados gerais
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ContractClientForm({
  client,
  contracts,
  subscriptions,
  saving,
  onCancel,
  onSave,
}: {
  client: Client;
  contracts: ProjectContract[];
  subscriptions: ProjectSubscription[];
  saving: boolean;
  onCancel: () => void;
  onSave: (values: ContractFormValues) => Promise<void>;
}) {
  const [form, setForm] = useState<ContractFormValues>(() =>
    getContractFormDefaults(client, contracts, subscriptions)
  );
  const [errors, setErrors] = useState<ContractFormErrors>({});

  useEffect(() => {
    setForm(getContractFormDefaults(client, contracts, subscriptions));
    setErrors({});
  }, [client, contracts, subscriptions]);

  const setField = <K extends keyof ContractFormValues>(field: K, value: ContractFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: ContractFormErrors = {};
    const monthlyValue = unmaskCurrency(form.monthly_value);
    const projectValue = unmaskCurrency(form.project_total_value);
    const paymentDueDay = form.payment_due_day ? Number(form.payment_due_day) : null;

    if (form.monthly_value.trim().length === 0 || Number.isNaN(monthlyValue)) {
      nextErrors.monthly_value = "Informe o valor mensal.";
    }

    if (form.project_total_value.trim().length === 0 || Number.isNaN(projectValue)) {
      nextErrors.project_total_value = "Informe o valor do projeto.";
    }

    if (!parseFormDate(form.client_since)) {
      nextErrors.client_since = "Informe uma data válida para cliente desde.";
    }

    if (form.contract_start && !parseFormDate(form.contract_start)) {
      nextErrors.contract_start = "Data de início inválida.";
    }

    if (form.contract_end && !parseFormDate(form.contract_end)) {
      nextErrors.contract_end = "Data de fim inválida.";
    }

    const contractStartIso = parseFormDate(form.contract_start);
    const contractEndIso = parseFormDate(form.contract_end);
    if (contractStartIso && contractEndIso && contractEndIso < contractStartIso) {
      nextErrors.contract_end = "A data de fim não pode ser anterior ao início.";
    }

    if (
      paymentDueDay !== null &&
      (!Number.isInteger(paymentDueDay) || paymentDueDay < 1 || paymentDueDay > 31)
    ) {
      nextErrors.payment_due_day = "Informe um dia de vencimento entre 1 e 31.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Revise os dados contratuais antes de salvar.");
      return;
    }

    await onSave(form);
  };

  return (
    <Card className="border-border/70 bg-card/92">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">Editar contrato</CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="monthly_value">Valor mensal</Label>
              <Input
                id="monthly_value"
                name="monthly_value"
                value={form.monthly_value}
                onChange={(event) => setField("monthly_value", maskCurrency(event.target.value))}
                placeholder="R$ 0,00"
              />
              <ErrorText className={errors.monthly_value ? "" : "invisible"}>
                {errors.monthly_value || "\u00A0"}
              </ErrorText>
            </Field>

            <Field>
              <Label htmlFor="project_total_value">Valor total do projeto</Label>
              <Input
                id="project_total_value"
                name="project_total_value"
                value={form.project_total_value}
                onChange={(event) =>
                  setField("project_total_value", maskCurrency(event.target.value))
                }
                placeholder="R$ 0,00"
              />
              <ErrorText className={errors.project_total_value ? "" : "invisible"}>
                {errors.project_total_value || "\u00A0"}
              </ErrorText>
            </Field>

            <Field>
              <Label htmlFor="client_since">Cliente desde</Label>
              <Input
                id="client_since"
                name="client_since"
                value={form.client_since}
                onChange={(event) => setField("client_since", maskDate(event.target.value))}
                placeholder="DD/MM/AAAA"
              />
              <ErrorText className={errors.client_since ? "" : "invisible"}>
                {errors.client_since || "\u00A0"}
              </ErrorText>
            </Field>

            <Field>
              <Label htmlFor="payment_due_day">Dia de vencimento</Label>
              <Input
                id="payment_due_day"
                name="payment_due_day"
                type="number"
                min={1}
                max={31}
                value={form.payment_due_day}
                onChange={(event) => setField("payment_due_day", event.target.value)}
                placeholder="10"
              />
              <ErrorText className={errors.payment_due_day ? "" : "invisible"}>
                {errors.payment_due_day || "\u00A0"}
              </ErrorText>
            </Field>

            <Field>
              <Label htmlFor="contract_status">Status do contrato</Label>
              <select
                id="contract_status"
                name="contract_status"
                value={form.contract_status}
                onChange={(event) =>
                  setField("contract_status", event.target.value as ContractStatus | "")
                }
                className={selectClass}
              >
                <option value="">Selecionar</option>
                <option value="ativo">Ativo</option>
                <option value="inadimplente">Inadimplente</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </Field>

            <Field>
              <Label htmlFor="contract_type">Tipo de contrato</Label>
              <select
                id="contract_type"
                name="contract_type"
                value={form.contract_type}
                onChange={(event) =>
                  setField("contract_type", event.target.value as ContractType | "")
                }
                className={selectClass}
              >
                <option value="">Selecionar</option>
                <option value="projeto">Projeto</option>
                <option value="recorrente">Recorrente</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </Field>

            <Field>
              <Label htmlFor="client_origin">Origem</Label>
              <select
                id="client_origin"
                name="client_origin"
                value={form.client_origin}
                onChange={(event) =>
                  setField("client_origin", event.target.value as ClientOrigin | "")
                }
                className={selectClass}
              >
                <option value="">Selecionar</option>
                <option value="lead">Lead</option>
                <option value="indicacao">Indicação</option>
                <option value="inbound">Inbound</option>
              </select>
            </Field>

            <Field>
              <Label htmlFor="contract_start">Início do contrato</Label>
              <Input
                id="contract_start"
                name="contract_start"
                value={form.contract_start}
                onChange={(event) => setField("contract_start", maskDate(event.target.value))}
                placeholder="DD/MM/AAAA"
              />
              <ErrorText className={errors.contract_start ? "" : "invisible"}>
                {errors.contract_start || "\u00A0"}
              </ErrorText>
            </Field>

            <Field>
              <Label htmlFor="contract_end">Fim do contrato</Label>
              <Input
                id="contract_end"
                name="contract_end"
                value={form.contract_end}
                onChange={(event) => setField("contract_end", maskDate(event.target.value))}
                placeholder="DD/MM/AAAA"
              />
              <ErrorText className={errors.contract_end ? "" : "invisible"}>
                {errors.contract_end || "\u00A0"}
              </ErrorText>
            </Field>

            <Field className="md:col-span-2">
              <Label htmlFor="tags_input">Tags</Label>
              <Input
                id="tags_input"
                name="tags_input"
                value={form.tags_input}
                onChange={(event) => setField("tags_input", event.target.value)}
                placeholder="vip, recorrente, parceiro estratégico"
              />
            </Field>

            <Field className="md:col-span-2">
              <Label htmlFor="scope_summary">Escopo resumido</Label>
              <Textarea
                id="scope_summary"
                name="scope_summary"
                value={form.scope_summary}
                onChange={(event) => setField("scope_summary", event.target.value)}
                rows={4}
                placeholder="Descreva brevemente o escopo do contrato."
              />
            </Field>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar contrato"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AdminClientDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAdmin, isSuperAdmin } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [contracts, setContracts] = useState<ProjectContract[]>([]);
  const [subscriptions, setSubscriptions] = useState<ProjectSubscription[]>([]);
  const [clientProjects, setClientProjects] = useState<ClientProject[]>([]);
  const [clientCharges, setClientCharges] = useState<ClientCharge[]>([]);
  const [clientTickets, setClientTickets] = useState<ClientTicket[]>([]);
  const [clientTimeline, setClientTimeline] = useState<ClientTimelineEvent[]>([]);
  const [clientProposals, setClientProposals] = useState<ClientProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const editParam = searchParams.get("edit") as EditingSection;
  const isEditMode = editParam === "dados" || editParam === "contrato";
  const [tab, setTab] = useState<TabKey>(editParam === "contrato" ? "contrato" : "dados");
  const [editingSection, setEditingSection] = useState<EditingSection>(
    isEditMode ? editParam : null
  );
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const [actionLoading, setActionLoading] = useState<
    "general" | "contract" | "toggle-active" | "delete" | null
  >(null);

  const loadClient = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    const [
      clientRes,
      contractsRes,
      subscriptionsRes,
      projectsRes,
      chargesRes,
      ticketsRes,
      timelineRes,
      proposalsRes,
    ] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("project_contracts")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("project_subscriptions")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("projects")
        .select(
          "id, name, status, current_stage, started_at, delivered_at, expected_delivery_date, solution_type"
        )
        .eq("client_id", id)
        .order("started_at", { ascending: false }),
      supabase
        .from("charges")
        .select("id, description, amount, due_date, status, origin_type, paid_at, is_historical")
        .eq("client_id", id)
        .order("due_date", { ascending: false }),
      supabase
        .from("support_tickets")
        .select("id, subject, status, priority, category, created_at, updated_at")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("timeline_events")
        .select("id, event_type, title, summary, occurred_at")
        .eq("client_id", id)
        .order("occurred_at", { ascending: false })
        .limit(50),
      supabase
        .from("proposals")
        .select("id, title, status, total_amount, valid_until, created_at, sent_at, approved_at")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
    ]);

    setClient(clientRes.data ?? null);
    setContracts(contractsRes.data ?? []);
    setSubscriptions(subscriptionsRes.data ?? []);
    setClientProjects((projectsRes.data ?? []) as ClientProject[]);
    setClientCharges((chargesRes.data ?? []) as ClientCharge[]);
    setClientTickets((ticketsRes.data ?? []) as ClientTicket[]);
    setClientTimeline((timelineRes.data ?? []) as ClientTimelineEvent[]);
    setClientProposals((proposalsRes.data ?? []) as ClientProposal[]);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void loadClient();
  }, [loadClient]);

  const handleSaveGeneral = async (values: GeneralFormValues) => {
    if (!client) return;

    setActionLoading("general");

    const previousIdentity = {
      full_name: client.full_name,
      email: client.email,
      phone: client.phone,
    };

    const nextIdentity = {
      full_name: values.full_name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() ? unmaskDigits(values.phone) : null,
    };

    const identityChanged =
      client.user_id !== null &&
      (previousIdentity.full_name !== nextIdentity.full_name ||
        previousIdentity.email !== nextIdentity.email ||
        (previousIdentity.phone ?? null) !== nextIdentity.phone);

    let authHeaders: Record<string, string> | null = null;

    try {
      if (identityChanged && client.user_id) {
        authHeaders = await getSupabaseFunctionAuthHeaders();
        const { data: updateUserData, error: updateUserError } = await supabase.functions.invoke(
          "update-user",
          {
            body: {
              user_id: client.user_id,
              ...nextIdentity,
            },
            headers: authHeaders,
          }
        );

        if (updateUserError || updateUserData?.error) {
          throw new Error(updateUserError?.message ?? String(updateUserData?.error));
        }
      }

      const payload: ClientUpdate = {
        client_type: values.client_type,
        full_name: nextIdentity.full_name,
        email: nextIdentity.email,
        phone: nextIdentity.phone,
        cpf: unmaskDigits(values.cpf),
        cnpj: values.client_type === "pj" ? unmaskDigits(values.cnpj) || null : null,
        razao_social: values.client_type === "pj" ? values.razao_social.trim() || null : null,
        nome_fantasia: values.client_type === "pj" ? values.nome_fantasia.trim() || null : null,
        cargo_representante:
          values.client_type === "pj" ? values.cargo_representante.trim() || null : null,
        cep: values.cep.trim() ? unmaskDigits(values.cep) : null,
        logradouro: values.logradouro.trim() || null,
        numero: values.numero.trim() || null,
        complemento: values.complemento.trim() || null,
        bairro: values.bairro.trim() || null,
        city: values.city.trim() || null,
        state: values.state.trim().toUpperCase() || null,
        country: values.country.trim() || "Brasil",
        address: buildAddress(values),
        updated_at: new Date().toISOString(),
      };

      const { error: clientUpdateError } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", client.id);

      if (clientUpdateError) {
        if (identityChanged && client.user_id && authHeaders) {
          await supabase.functions.invoke("update-user", {
            body: {
              user_id: client.user_id,
              ...previousIdentity,
            },
            headers: authHeaders,
          });
        }

        throw clientUpdateError;
      }

      toast.success("Dados gerais atualizados.");
      setEditingSection(null);
      await loadClient();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível atualizar os dados gerais.";
      toast.error("Erro ao atualizar cliente.", { description: message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveContract = async (values: ContractFormValues) => {
    if (!client) return;

    setActionLoading("contract");

    try {
      const payload: ClientUpdate = {
        monthly_value: unmaskCurrency(values.monthly_value),
        project_total_value: unmaskCurrency(values.project_total_value),
        client_since: parseFormDate(values.client_since) ?? client.client_since,
        payment_due_day: values.payment_due_day ? Number(values.payment_due_day) : null,
        contract_status: values.contract_status || null,
        contract_type: values.contract_type || null,
        client_origin: values.client_origin || null,
        contract_start: parseFormDate(values.contract_start),
        contract_end: parseFormDate(values.contract_end),
        scope_summary: values.scope_summary.trim() || null,
        tags: normalizeTags(values.tags_input),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("clients").update(payload).eq("id", client.id);

      if (error) throw error;

      toast.success("Contrato atualizado.");
      setEditingSection(null);
      await loadClient();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível atualizar o contrato.";
      toast.error("Erro ao atualizar contrato.", { description: message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async () => {
    if (!client || !isAdmin) return;

    const nextIsActive = !client.is_active;
    setActionLoading("toggle-active");

    try {
      const { error: clientStatusError } = await supabase
        .from("clients")
        .update({
          is_active: nextIsActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", client.id);

      if (clientStatusError) throw clientStatusError;

      if (client.user_id) {
        let roleError: Error | null = null;

        if (nextIsActive) {
          const { error } = await supabase
            .from("user_roles")
            .upsert({ user_id: client.user_id, role: "cliente" }, { onConflict: "user_id,role" });
          if (error) roleError = new Error(error.message);
        } else {
          const { error } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", client.user_id)
            .eq("role", "cliente");
          if (error) roleError = new Error(error.message);
        }

        if (roleError) {
          await supabase
            .from("clients")
            .update({
              is_active: client.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq("id", client.id);
          throw roleError;
        }
      }

      if (nextIsActive && !client.user_id) {
        toast.success(
          "Cliente reativado, mas sem acesso ao portal porque não há usuário vinculado."
        );
      } else {
        toast.success(nextIsActive ? "Cliente reativado." : "Cliente inativado.");
      }

      setDialogAction(null);
      await loadClient();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível atualizar o status do cliente.";
      toast.error("Erro ao alterar status.", { description: message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClient = async () => {
    if (!client || !isSuperAdmin) return;

    setActionLoading("delete");

    try {
      if (client.user_id) {
        const authHeaders = await getSupabaseFunctionAuthHeaders();
        const { data: deleteUserData, error: deleteUserError } = await supabase.functions.invoke(
          "delete-user",
          {
            body: { user_id: client.user_id },
            headers: authHeaders,
          }
        );

        if (deleteUserError || deleteUserData?.error) {
          throw new Error(deleteUserError?.message ?? String(deleteUserData?.error));
        }
      }

      const { error: deleteClientError } = await supabase
        .from("clients")
        .delete()
        .eq("id", client.id);

      if (deleteClientError) {
        toast.error("O acesso foi removido, mas o cadastro ainda existe.", {
          description: deleteClientError.message,
        });
        setDialogAction(null);
        await loadClient();
        return;
      }

      toast.success(
        "Cliente removido. Documentos e registros vinculados foram apagados em cascata."
      );
      navigate("/portal/admin/clientes", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível remover o cliente.";
      toast.error("Erro ao remover cliente.", { description: message });
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "dados", label: "Dados gerais" },
    { key: "contrato", label: "Contrato" },
    { key: "projetos", label: `Projetos (${clientProjects.length})` },
    {
      key: "financeiro",
      label: `Financeiro (${clientCharges.filter((c) => !c.is_historical).length})`,
    },
    { key: "suporte", label: `Suporte (${clientTickets.length})` },
    { key: "propostas", label: `Propostas (${clientProposals.length})` },
    { key: "timeline", label: "Timeline" },
  ];

  if (loading) return <PortalLoading />;

  if (!client) {
    return (
      <AdminEmptyState
        icon={Building2}
        title="Cliente não encontrado"
        description="O cliente pode ter sido removido ou o link está incorreto."
        action={
          <Link to="/portal/admin/clientes" className={buttonVariants({ variant: "default" })}>
            Voltar para carteira
          </Link>
        }
      />
    );
  }

  const dialogTitle =
    dialogAction === "delete"
      ? "Remover cliente"
      : client.is_active
        ? "Inativar cliente"
        : "Reativar cliente";

  const dialogDescription =
    dialogAction === "delete"
      ? `Tem certeza que deseja remover ${getClientDisplayName(client)}? Essa ação apaga o cadastro do cliente e remove os documentos e registros vinculados no banco de dados.`
      : client.is_active
        ? "Ao inativar, o cliente sai da carteira ativa e o acesso ao portal é bloqueado enquanto o cadastro permanece salvo."
        : "Ao reativar, o cliente volta para a carteira ativa e o acesso ao portal é restaurado quando existir usuário vinculado.";
  const contractSnapshot = deriveContractSnapshot(client, contracts, subscriptions);

  return (
    <div className="space-y-6">
      <AlertDialog
        open={dialogAction !== null}
        title={dialogTitle}
        description={dialogDescription}
        confirmLabel={
          dialogAction === "delete" ? "Remover" : client.is_active ? "Inativar" : "Reativar"
        }
        cancelLabel="Cancelar"
        destructive={dialogAction === "delete"}
        loading={actionLoading === dialogAction}
        loadingLabel={dialogAction === "delete" ? "Removendo..." : "Salvando..."}
        onConfirm={() =>
          dialogAction === "delete" ? void handleDeleteClient() : void handleToggleActive()
        }
        onCancel={() => setDialogAction(null)}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary dark:bg-primary/15">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{getClientDisplayName(client)}</h1>
            <p className="text-sm text-muted-foreground">{client.email}</p>
          </div>
        </div>

        <Link to="/portal/admin/clientes" className={buttonVariants({ variant: "outline" })}>
          Voltar
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            client.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}
        >
          <CheckCircle size={12} />
          {client.is_active ? "Conta ativa" : "Conta inativa"}
        </span>

        {client.contract_status ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
              client.contract_status === "ativo"
                ? "bg-success/10 text-success"
                : client.contract_status === "inadimplente"
                  ? "bg-warning/10 text-warning"
                  : "bg-destructive/10 text-destructive"
            )}
          >
            {CONTRACT_STATUS_LABEL[client.contract_status]}
          </span>
        ) : null}

        {client.contract_type ? (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {CONTRACT_TYPE_LABEL[client.contract_type]}
          </span>
        ) : null}

        {client.tags.length > 0
          ? client.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))
          : null}
      </div>

      <div className="flex gap-1 rounded-lg border border-border/60 bg-card p-1">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              if (isEditMode) setEditingSection(key);
            }}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all",
              tab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "dados" ? (
        editingSection === "dados" ? (
          <GeneralClientForm
            client={client}
            saving={actionLoading === "general"}
            onCancel={() => setEditingSection(null)}
            onSave={handleSaveGeneral}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border/70 bg-card/92">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-base">Contato</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
                <InfoRow label="Nome" value={client.full_name} />
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Contato
                  </span>
                  <ContactLinks
                    email={client.email}
                    phone={client.phone}
                    phoneDisplay={client.phone ? maskPhone(client.phone) : null}
                    whatsappMessage={`Olá ${getClientDisplayName(client).split(" ")[0]}, aqui é da Elkys. Tudo bem?`}
                  />
                </div>
                <InfoRow label="CPF" value={client.cpf ? maskCPF(client.cpf) : null} />
                {client.client_type === "pj" ? (
                  <>
                    <InfoRow label="CNPJ" value={client.cnpj ? maskCNPJ(client.cnpj) : null} />
                    <InfoRow label="Razão Social" value={client.razao_social} />
                    <InfoRow label="Nome Fantasia" value={client.nome_fantasia} />
                    <InfoRow label="Cargo do Representante" value={client.cargo_representante} />
                  </>
                ) : null}
                <InfoRow
                  label="Tipo"
                  value={client.client_type === "pj" ? "Pessoa Jurídica" : "Pessoa Física"}
                />
                <InfoRow
                  label="Origem"
                  value={client.client_origin ? ORIGIN_LABEL[client.client_origin] : null}
                />
                <InfoRow label="Cliente desde" value={formatDate(client.client_since)} />
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/92">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-base">Endereço</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
                <InfoRow label="CEP" value={client.cep ? maskCEP(client.cep) : null} />
                <InfoRow label="Logradouro" value={client.logradouro} />
                <InfoRow label="Número" value={client.numero} />
                <InfoRow label="Complemento" value={client.complemento} />
                <InfoRow label="Bairro" value={client.bairro} />
                <InfoRow label="Cidade" value={client.city} />
                <InfoRow label="Estado" value={client.state} />
                <InfoRow label="País" value={client.country} />
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/92 xl:col-span-2">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-base">Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 pt-5 sm:grid-cols-3">
                <InfoRow
                  label="Valor mensal"
                  value={formatBRL(Number(contractSnapshot.monthly_value))}
                />
                <InfoRow
                  label="Valor do projeto"
                  value={formatBRL(Number(contractSnapshot.project_total_value))}
                />
                <InfoRow
                  label="Dia de vencimento"
                  value={
                    contractSnapshot.payment_due_day
                      ? `Dia ${contractSnapshot.payment_due_day}`
                      : null
                  }
                />
              </CardContent>
            </Card>
          </div>
        )
      ) : null}

      {tab === "contrato" ? (
        editingSection === "contrato" ? (
          <ContractClientForm
            client={client}
            contracts={contracts}
            subscriptions={subscriptions}
            saving={actionLoading === "contract"}
            onCancel={() => setEditingSection(null)}
            onSave={handleSaveContract}
          />
        ) : (
          <Card className="border-border/70 bg-card/92">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base">Informações do contrato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {!client.payment_due_day && subscriptions.length > 0 ? (
                <div className="rounded-lg border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                  Alguns dados desta leitura foram preenchidos automáticamente com base nas
                  assinaturas e contratos já vinculados ao cliente.
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow
                  label="Status do contrato"
                  value={
                    contractSnapshot.contract_status ? (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          contractSnapshot.contract_status === "ativo"
                            ? "bg-success/10 text-success"
                            : contractSnapshot.contract_status === "inadimplente"
                              ? "bg-warning/10 text-warning"
                              : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {CONTRACT_STATUS_LABEL[contractSnapshot.contract_status]}
                      </span>
                    ) : null
                  }
                />
                <InfoRow
                  label="Tipo de contrato"
                  value={
                    contractSnapshot.contract_type
                      ? CONTRACT_TYPE_LABEL[contractSnapshot.contract_type]
                      : null
                  }
                />
                <InfoRow label="Início" value={formatDate(contractSnapshot.contract_start)} />
                <InfoRow
                  label="Fim"
                  value={
                    contractSnapshot.contract_end
                      ? formatDate(contractSnapshot.contract_end)
                      : "Sem data definida (renovável)"
                  }
                />
                <InfoRow
                  label="Dia de vencimento"
                  value={
                    contractSnapshot.payment_due_day
                      ? `Dia ${contractSnapshot.payment_due_day}`
                      : null
                  }
                />
                <InfoRow
                  label="Origem"
                  value={
                    contractSnapshot.client_origin
                      ? ORIGIN_LABEL[contractSnapshot.client_origin]
                      : null
                  }
                />
                {client.tags.length > 0 ? (
                  <div className="sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Tags
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {client.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {contractSnapshot.scope_summary ? (
                  <div className="sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Escopo
                    </span>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">
                      {contractSnapshot.scope_summary}
                    </p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )
      ) : null}

      {/* Projetos tab */}
      {tab === "projetos" ? (
        clientProjects.length === 0 ? (
          <Card className="border-dashed border-border/70 bg-card/80">
            <CardContent className="flex min-h-[160px] items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum projeto vinculado a este cliente.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {clientProjects.map((project) => {
              const statusMeta =
                PROJECT_STATUS_META[project.status as keyof typeof PROJECT_STATUS_META];
              const todayStr = new Date().toISOString().slice(0, 10);
              const isOverdue =
                project.status === "em_andamento" &&
                !!project.expected_delivery_date &&
                project.expected_delivery_date < todayStr &&
                !project.delivered_at;

              return (
                <Link
                  key={project.id}
                  to={`/portal/admin/projetos/${project.id}`}
                  className="block rounded-xl border border-border/60 bg-card/92 p-4 transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <h4 className="text-sm font-semibold text-foreground">{project.name}</h4>
                      <div className="flex flex-wrap items-center gap-2">
                        {statusMeta && (
                          <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
                        )}
                        {project.solution_type && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {project.solution_type}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                            Atrasado
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      <p>Etapa: {project.current_stage || "—"}</p>
                      {project.expected_delivery_date && (
                        <p>Previsao: {formatPortalDate(project.expected_delivery_date)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : null}

      {/* Financeiro tab */}
      {tab === "financeiro"
        ? (() => {
            const operationalCharges = clientCharges.filter((c) => !c.is_historical);
            const totalPaid =
              operationalCharges
                .filter((c) => c.status === "pago")
                .reduce((sum, c) => sum + toCents(c.amount), 0) / 100;
            const totalOverdue =
              operationalCharges
                .filter((c) => c.status === "atrasado")
                .reduce((sum, c) => sum + toCents(c.amount), 0) / 100;
            const totalPending =
              operationalCharges
                .filter((c) => c.status === "pendente" || c.status === "agendada")
                .reduce((sum, c) => sum + toCents(c.amount), 0) / 100;

            return (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/60 bg-background/70 p-3 pl-4 relative overflow-hidden">
                    <span className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl bg-success" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Pago
                    </p>
                    <p className="mt-1 text-base font-semibold text-success">
                      {formatBRL(totalPaid)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/70 p-3 pl-4 relative overflow-hidden">
                    <span className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl bg-destructive" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Em atraso
                    </p>
                    <p className="mt-1 text-base font-semibold text-destructive">
                      {formatBRL(totalOverdue)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/70 p-3 pl-4 relative overflow-hidden">
                    <span className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl bg-warning" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Pendente / Futura
                    </p>
                    <p className="mt-1 text-base font-semibold text-warning">
                      {formatBRL(totalPending)}
                    </p>
                  </div>
                </div>

                {operationalCharges.length === 0 ? (
                  <Card className="border-dashed border-border/70 bg-card/80">
                    <CardContent className="flex min-h-[160px] items-center justify-center py-8 text-center">
                      <p className="text-sm text-muted-foreground">Nenhuma cobrança registrada.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="overflow-hidden border-border/70 bg-card/92">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[550px] text-sm">
                        <thead>
                          <tr className="border-b border-border/60 bg-muted/30">
                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              Descrição
                            </th>
                            <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              Valor
                            </th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              Vencimento
                            </th>
                            <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {operationalCharges.map((charge) => {
                            const statusMeta =
                              CHARGE_STATUS_META[charge.status as keyof typeof CHARGE_STATUS_META];
                            return (
                              <tr key={charge.id} className="transition-colors hover:bg-muted/20">
                                <td className="max-w-[200px] truncate px-4 py-3 text-foreground">
                                  {charge.description}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                                  {formatBRL(Number(charge.amount))}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {formatPortalDate(charge.due_date)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {statusMeta && (
                                    <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </div>
            );
          })()
        : null}

      {/* Suporte tab */}
      {tab === "suporte" ? (
        clientTickets.length === 0 ? (
          <Card className="border-dashed border-border/70 bg-card/80">
            <CardContent className="flex min-h-[160px] items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhum ticket de suporte registrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {clientTickets.map((ticket) => {
              const statusMeta =
                TICKET_STATUS_META[ticket.status as keyof typeof TICKET_STATUS_META];
              const priorityMeta =
                TICKET_PRIORITY_META[ticket.priority as keyof typeof TICKET_PRIORITY_META];

              return (
                <div key={ticket.id} className="rounded-xl border border-border/60 bg-card/92 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <h4 className="text-sm font-semibold text-foreground">{ticket.subject}</h4>
                      <div className="flex flex-wrap items-center gap-2">
                        {statusMeta && (
                          <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
                        )}
                        {priorityMeta && (
                          <StatusBadge label={priorityMeta.label} tone={priorityMeta.tone} />
                        )}
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {ticket.category}
                        </span>
                      </div>
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {formatPortalDateTime(ticket.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : null}

      {/* Propostas tab */}
      {tab === "propostas" ? (
        clientProposals.length === 0 ? (
          <Card className="border-dashed border-border/70 bg-card/80">
            <CardContent className="flex min-h-[160px] items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma proposta vinculada a este cliente.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {clientProposals.map((proposal) => {
              const statusMap: Record<
                string,
                {
                  label: string;
                  tone: "accent" | "success" | "warning" | "destructive" | "secondary";
                }
              > = {
                rascunho: { label: "Rascunho", tone: "secondary" },
                enviada: { label: "Enviada", tone: "accent" },
                aprovada: { label: "Aprovada", tone: "success" },
                rejeitada: { label: "Rejeitada", tone: "destructive" },
                expirada: { label: "Expirada", tone: "warning" },
              };
              const meta = statusMap[proposal.status] ?? statusMap.enviada;
              return (
                <Link
                  key={proposal.id}
                  to={`/portal/admin/propostas/${proposal.id}`}
                  className="block rounded-xl border border-border/60 bg-card/92 p-4 transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <h4 className="text-sm font-semibold text-foreground">{proposal.title}</h4>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {formatBRL(Number(proposal.total_amount))}
                      </p>
                      {proposal.valid_until && (
                        <p className="text-[11px] text-muted-foreground">
                          Valida ate {formatPortalDate(proposal.valid_until)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : null}

      {/* Timeline tab */}
      {tab === "timeline" ? (
        clientTimeline.length === 0 ? (
          <Card className="border-dashed border-border/70 bg-card/80">
            <CardContent className="flex min-h-[160px] items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhum evento registrado na timeline.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative space-y-0 pl-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/60" />
            {clientTimeline.map((event) => (
              <div key={event.id} className="relative pb-4">
                <div className="absolute -left-6 top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-border bg-card">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div className="rounded-lg border border-border/50 bg-card/92 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{event.title}</h4>
                    <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                      {formatPortalDateTime(event.occurred_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {event.summary}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {event.event_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
