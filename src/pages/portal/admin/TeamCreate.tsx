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
} from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { maskPhone } from "@/lib/masks";
import { getSupabaseFunctionAuthHeaders } from "@/lib/supabase-functions";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_OPTIONS: { value: AppRole; label: string; description: string }[] = [
  {
    value: "admin_super",
    label: "Super Admin",
    description: "Acesso total - pode criar, editar e excluir tudo",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Acesso total exceto exclusões e cadastros de usuários",
  },
  {
    value: "marketing",
    label: "Marketing",
    description: "Acesso a clientes, métricas e informações comerciais",
  },
  {
    value: "developer",
    label: "Desenvolvedor",
    description: "Acesso a clientes e documentação técnica",
  },
  {
    value: "support",
    label: "Suporte",
    description: "Acesso exclusivo às solicitações de suporte",
  },
];

const selectClass =
  "flex h-10 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const teamSchema = z.object({
  full_name: z.string().min(3, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
  system_role: z.enum(["admin_super", "admin", "marketing", "developer", "support"]),
  status: z.enum(["active", "inactive"]),
});

type TeamForm = z.infer<typeof teamSchema>;

function generateTempPassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const specials = "!@#$%&*";
  const all = upper + lower + digits + specials;
  const rand = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  const base = [rand(upper), rand(lower), rand(digits), rand(specials)];
  for (let i = 0; i < 6; i++) base.push(rand(all));
  return base.sort(() => Math.random() - 0.5).join("");
}

export default function AdminTeamCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      status: "active",
      system_role: "developer",
    },
  });

  const selectedRole = watch("system_role");
  const roleInfo = ROLE_OPTIONS.find((r) => r.value === selectedRole);

  const onSubmit = async (data: TeamForm) => {
    setSubmitting(true);
    setFormError(null);
    let createdUserId: string | null = null;
    let shouldRollbackUser = false;

    try {
      const roleLabel =
        ROLE_OPTIONS.find((r) => r.value === data.system_role)?.label ?? data.system_role;
      const tempPassword = generateTempPassword();
      const authHeaders = await getSupabaseFunctionAuthHeaders();

      // 1. Create auth user via Admin API (no Supabase confirmation email)
      const { data: createData, error: createError } = await supabase.functions.invoke(
        "create-user",
        {
          body: { email: data.email, password: tempPassword, full_name: data.full_name },
          headers: authHeaders,
        }
      );
      if (createError) throw new Error(`create-user: ${createError.message}`);
      if (createData?.error) throw new Error(String(createData.error));
      if (!createData?.user_id)
        throw new Error("Não foi possível criar o usuário. Verifique o e-mail.");
      const newUserId = createData.user_id as string;
      createdUserId = newUserId;
      shouldRollbackUser = true;

      // 2. Insert team member record
      const { error: memberError } = await supabase.from("team_members").insert({
        user_id: newUserId ?? null,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        role_title: roleLabel,
        system_role: data.system_role,
        is_active: data.status === "active",
        must_change_password: true,
      });
      if (memberError) throw memberError;

      // 3. Assign role in user_roles
      if (newUserId) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: newUserId, role: data.system_role });

        if (roleError) throw roleError;
      }

      shouldRollbackUser = false;

      // 4. Send welcome email
      const { error: emailError } = await supabase.functions.invoke("send-team-welcome", {
        body: {
          email: data.email,
          name: data.full_name,
          temp_password: tempPassword,
          role_label: roleLabel,
        },
        headers: authHeaders,
      });
      if (emailError) {
        console.warn("[send-team-welcome] email error:", emailError.message);
      }

      toast.success("Membro cadastrado com sucesso.", {
        description: `${data.full_name} receberá um e-mail com as credenciais de acesso.`,
      });
      navigate("/portal/admin/equipe", { replace: true });
    } catch (submitError) {
      if (shouldRollbackUser && createdUserId) {
        try {
          await supabase.functions.invoke("delete-user", {
            body: { user_id: createdUserId },
            headers: await getSupabaseFunctionAuthHeaders(),
          });
        } catch (rollbackError) {
          console.error("[team-create] rollback delete-user failed", rollbackError);
        }
      }

      const message =
        submitError instanceof Error ? submitError.message : "Não foi possível cadastrar o membro.";
      setFormError(
        message.includes("already registered") || message.includes("duplicate key")
          ? "E-mail já cadastrado."
          : message
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link to="/portal/admin/equipe" className={buttonVariants({ variant: "outline" })}>
          Voltar para equipe
        </Link>
      </div>

      <Card className="border-border/70 bg-card/92">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-lg">Dados do membro</CardTitle>
          <CardDescription>
            Registre nome, contato, cargo e nível de acesso do integrante.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {formError ? (
            <div className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {formError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <Label>Nome completo *</Label>
              <Input {...register("full_name")} placeholder="Nome do membro" />
              {errors.full_name ? <ErrorText>{errors.full_name.message}</ErrorText> : null}
            </Field>

            <Field>
              <Label>E-mail *</Label>
              <Input {...register("email")} type="email" placeholder="email@elkys.com.br" />
              {errors.email ? <ErrorText>{errors.email.message}</ErrorText> : null}
            </Field>

            <Field>
              <Label>Telefone</Label>
              <Controller
                name="phone"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Input
                    {...field}
                    onChange={(event) => field.onChange(maskPhone(event.target.value))}
                    placeholder="(31) 99999-9999"
                  />
                )}
              />
            </Field>

            <Field>
              <Label>Cargo / Nível de acesso *</Label>
              <select {...register("system_role")} className={selectClass}>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {roleInfo ? (
                <p className="mt-1 text-xs text-muted-foreground">{roleInfo.description}</p>
              ) : null}
              {errors.system_role ? <ErrorText>{errors.system_role.message}</ErrorText> : null}
            </Field>

            <Field>
              <Label>Status *</Label>
              <select {...register("status")} className={selectClass}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
              {errors.status ? <ErrorText>{errors.status.message}</ErrorText> : null}
            </Field>

            <div className="flex justify-end md:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando membro..." : "Salvar membro"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
