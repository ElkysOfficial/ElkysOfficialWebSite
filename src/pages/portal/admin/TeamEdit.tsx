import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Link, useNavigate, useParams } from "react-router-dom";

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
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];

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
  phone: z.string().optional(),
  system_role: z.enum(["admin_super", "admin", "marketing", "developer", "support"]),
  status: z.enum(["active", "inactive"]),
});

type TeamForm = z.infer<typeof teamSchema>;

export default function AdminTeamEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<TeamForm>({ resolver: zodResolver(teamSchema) });

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const { data, error } = await supabase.from("team_members").select("*").eq("id", id).single();

      if (error || !data) {
        setLoadError(error?.message ?? "Membro não encontrado.");
        setLoading(false);
        return;
      }

      setMember(data);
      reset({
        full_name: data.full_name,
        phone: data.phone ? maskPhone(data.phone) : "",
        system_role: data.system_role as AppRole,
        status: data.is_active ? "active" : "inactive",
      });
      setLoading(false);
    })();
  }, [id, reset]);

  const selectedRole = watch("system_role");
  const roleInfo = ROLE_OPTIONS.find((r) => r.value === selectedRole);

  const onSubmit = async (data: TeamForm) => {
    if (!member) return;
    setSubmitting(true);
    setFormError(null);

    try {
      const roleLabel =
        ROLE_OPTIONS.find((r) => r.value === data.system_role)?.label ?? data.system_role;

      const { error: updateError } = await supabase
        .from("team_members")
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
          role_title: roleLabel,
          system_role: data.system_role,
          is_active: data.status === "active",
        })
        .eq("id", member.id);

      if (updateError) throw updateError;

      // Update role in user_roles if changed
      if (member.user_id && data.system_role !== member.system_role) {
        await supabase
          .from("user_roles")
          .update({ role: data.system_role })
          .eq("user_id", member.user_id);
      }

      toast.success("Membro atualizado com sucesso.");
      navigate("/portal/admin/equipe", { replace: true });
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Não foi possível atualizar o membro.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl border border-border/50 bg-card/60"
          />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link to="/portal/admin/equipe" className={buttonVariants({ variant: "outline" })}>
          Voltar para equipe
        </Link>
      </div>

      <Card className="border-border/70 bg-card/92">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-lg">Editar membro</CardTitle>
          <CardDescription>Atualize os dados de {member?.full_name}.</CardDescription>
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
              <Label>E-mail</Label>
              <Input
                value={member?.email ?? ""}
                disabled
                className="cursor-not-allowed opacity-60"
              />
              <p className="mt-1 text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
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
                {submitting ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
