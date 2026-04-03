import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";

import {
  buttonVariants,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorText,
  Field,
  Input,
  Label,
  Textarea,
} from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import {
  formatBRL,
  maskCurrency,
  maskDate,
  parseFormDate,
  sanitizeInteger,
  unmaskCurrency,
} from "@/lib/masks";

const CATEGORIES = ["Infraestrutura", "Ferramentas", "Marketing", "Pessoal", "Impostos", "Outros"];

const ENTRY_MODES = [
  {
    value: "unica",
    label: "Unica",
    description: "Cria um unico lancamento financeiro.",
  },
  {
    value: "parcelada",
    label: "Parcelada",
    description: "Divide o valor total em parcelas mensais.",
  },
  {
    value: "recorrente",
    label: "Recorrente",
    description: "Repete o mesmo valor por varios meses.",
  },
] as const;

const expenseSchema = z
  .object({
    description: z.string().min(3, "Descrição obrigatória"),
    category: z.string().min(1, "Categoria obrigatória"),
    amount: z.string().min(1, "Valor obrigatório"),
    expense_date: z.string().min(10, "Data inválida"),
    notes: z.string().optional(),
    entry_mode: z.enum(["unica", "parcelada", "recorrente"]),
    installments_count: z.string().optional(),
    recurrence_months: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!parseFormDate(data.expense_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expense_date"],
        message: "Data inválida",
      });
    }

    if (data.entry_mode === "parcelada") {
      const installments = Number(data.installments_count);
      if (!data.installments_count || Number.isNaN(installments) || installments < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["installments_count"],
          message: "Informe ao menos 2 parcelas",
        });
      }
    }

    if (data.entry_mode === "recorrente") {
      const months = Number(data.recurrence_months);
      if (!data.recurrence_months || Number.isNaN(months) || months < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recurrence_months"],
          message: "Informe ao menos 2 meses",
        });
      }
    }
  });

type ExpenseForm = z.infer<typeof expenseSchema>;

function addMonthsToIsoDate(baseDate: string, monthsToAdd: number) {
  const [year, month, day] = baseDate.split("-").map(Number);
  const base = new Date(year, month - 1, day);
  const target = new Date(year, month - 1 + monthsToAdd, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export default function AdminExpenseCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      entry_mode: "unica",
      installments_count: "2",
      recurrence_months: "12",
    },
  });

  const entryMode = watch("entry_mode");
  const amountValue = watch("amount");
  const installmentsCount = Number(watch("installments_count") || "0");
  const recurrenceMonths = Number(watch("recurrence_months") || "0");
  const totalAmount = unmaskCurrency(amountValue || "");
  const installmentValue =
    entryMode === "parcelada" && installmentsCount > 0 ? totalAmount / installmentsCount : 0;

  const onSubmit = async (data: ExpenseForm) => {
    setSubmitting(true);
    setFormError(null);

    try {
      const parsedExpenseDate = parseFormDate(data.expense_date);
      if (!parsedExpenseDate) {
        throw new Error("Data inválida.");
      }

      const total = unmaskCurrency(data.amount);
      const notes = data.notes?.trim() || null;
      const entries: Array<{
        description: string;
        category: string;
        amount: number;
        expense_date: string;
        notes: string | null;
      }> = [];

      if (data.entry_mode === "parcelada") {
        const count = Number(data.installments_count);
        const cents = Math.round(total * 100);
        const baseInstallment = Math.floor(cents / count);
        const remainder = cents - baseInstallment * count;

        for (let index = 0; index < count; index += 1) {
          const amountInCents = baseInstallment + (index < remainder ? 1 : 0);
          const installmentNumber = index + 1;
          entries.push({
            description: `${data.description} ${installmentNumber}/${count}`,
            category: data.category,
            amount: amountInCents / 100,
            expense_date: addMonthsToIsoDate(parsedExpenseDate, index),
            notes,
          });
        }
      } else if (data.entry_mode === "recorrente") {
        const count = Number(data.recurrence_months);

        for (let index = 0; index < count; index += 1) {
          entries.push({
            description: data.description,
            category: data.category,
            amount: total,
            expense_date: addMonthsToIsoDate(parsedExpenseDate, index),
            notes,
          });
        }
      } else {
        entries.push({
          description: data.description,
          category: data.category,
          amount: total,
          expense_date: parsedExpenseDate,
          notes,
        });
      }

      const { error } = await supabase.from("expenses").insert(entries);

      if (error) throw error;

      const successDescription =
        data.entry_mode === "parcelada"
          ? `${entries.length} parcelas foram adicionadas ao histórico financeiro.`
          : data.entry_mode === "recorrente"
            ? `${entries.length} lançamentos mensais foram programados.`
            : `${data.description} foi adicionada ao histórico financeiro.`;

      toast.success("Despesa cadastrada com sucesso.", {
        description: successDescription,
      });
      navigate("/portal/admin/financeiro", {
        replace: true,
        state: { financeTab: "despesas" },
      });
    } catch (submitError) {
      setFormError(
        submitError instanceof Error ? submitError.message : "Não foi possível registrar a despesa."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          to="/portal/admin/financeiro"
          state={{ financeTab: "despesas" }}
          className={buttonVariants({ variant: "outline" })}
        >
          Voltar para despesas
        </Link>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/70 bg-card/92">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-lg">Lançamento financeiro</CardTitle>
            <CardDescription>
              Informe descrição, categoria, valor e data do custo registrado.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {formError ? (
              <div className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {formError}
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <Field className="md:col-span-2">
                <Label>Formato do lançamento *</Label>
                <Controller
                  name="entry_mode"
                  control={control}
                  render={({ field }) => (
                    <div className="grid gap-3 md:grid-cols-3">
                      {ENTRY_MODES.map((item) => {
                        const active = field.value === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => field.onChange(item.value)}
                            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                              active
                                ? "border-primary bg-primary/10"
                                : "border-border/70 bg-background/60 hover:border-primary/30"
                            }`}
                          >
                            <p className="text-sm font-semibold text-foreground">{item.label}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </Field>

              <Field className="md:col-span-2">
                <Label>Descrição *</Label>
                <Input {...register("description")} placeholder="Ex: Servidor AWS" />
                {errors.description ? <ErrorText>{errors.description.message}</ErrorText> : null}
              </Field>

              <Field>
                <Label>Categoria *</Label>
                <select
                  {...register("category")}
                  className="flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Selecione</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category ? <ErrorText>{errors.category.message}</ErrorText> : null}
              </Field>

              <Field>
                <Label>Data *</Label>
                <Controller
                  name="expense_date"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={(event) => field.onChange(maskDate(event.target.value))}
                      placeholder="DD/MM/AAAA"
                    />
                  )}
                />
                {errors.expense_date ? <ErrorText>{errors.expense_date.message}</ErrorText> : null}
              </Field>

              <Field className={entryMode === "unica" ? "md:col-span-2" : ""}>
                <Label>{entryMode === "parcelada" ? "Valor total *" : "Valor *"}</Label>
                <Controller
                  name="amount"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={(event) => field.onChange(maskCurrency(event.target.value))}
                      placeholder="R$ 0,00"
                    />
                  )}
                />
                {errors.amount ? <ErrorText>{errors.amount.message}</ErrorText> : null}
              </Field>

              {entryMode === "parcelada" ? (
                <Field>
                  <Label>Quantidade de parcelas *</Label>
                  <Controller
                    name="installments_count"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        onChange={(event) => field.onChange(sanitizeInteger(event.target.value, 2))}
                        inputMode="numeric"
                        placeholder="Ex: 6"
                      />
                    )}
                  />
                  {errors.installments_count ? (
                    <ErrorText>{errors.installments_count.message}</ErrorText>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Valor por parcela: {formatBRL(installmentValue || 0)}
                    </p>
                  )}
                </Field>
              ) : null}

              {entryMode === "recorrente" ? (
                <Field>
                  <Label>Quantidade de meses *</Label>
                  <Controller
                    name="recurrence_months"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        onChange={(event) => field.onChange(sanitizeInteger(event.target.value, 2))}
                        inputMode="numeric"
                        placeholder="Ex: 12"
                      />
                    )}
                  />
                  {errors.recurrence_months ? (
                    <ErrorText>{errors.recurrence_months.message}</ErrorText>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      O sistema vai criar {Math.max(recurrenceMonths, 0)} lançamento(s) mensal(is)
                      com o mesmo valor.
                    </p>
                  )}
                </Field>
              ) : null}

              <Field className="md:col-span-2">
                <Label>Observação</Label>
                <Textarea
                  {...register("notes")}
                  placeholder="Contexto opcional para facilitar auditoria futura"
                />
              </Field>

              <div className="rounded-xl border border-border/70 bg-background/60 p-4 md:col-span-2">
                <p className="text-sm font-semibold text-foreground">Resumo antes de salvar</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Formato
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {entryMode === "unica"
                        ? "Lancamento unico"
                        : entryMode === "parcelada"
                          ? "Despesa parcelada"
                          : "Despesa recorrente mensal"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Quantidade
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {entryMode === "parcelada"
                        ? `${Math.max(installmentsCount || 0, 0)} parcela(s)`
                        : entryMode === "recorrente"
                          ? `${Math.max(recurrenceMonths || 0, 0)} mes(es)`
                          : "1 lancamento"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Valor
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {entryMode === "parcelada"
                        ? `${formatBRL(totalAmount || 0)} total · ${formatBRL(installmentValue || 0)} por parcela`
                        : formatBRL(totalAmount || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end md:col-span-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Salvando despesa..." : "Salvar despesa"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
