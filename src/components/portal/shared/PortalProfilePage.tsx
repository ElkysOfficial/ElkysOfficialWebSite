import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { CheckCircle, FileText, Hexagon, Shield, X } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/admin/AdminEmptyState";
import AlertBanner from "@/components/portal/shared/AlertBanner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  HexAvatar,
  HexPattern,
  Input,
  Label,
  buttonVariants,
  cn,
} from "@/design-system";
import { useAsyncButton } from "@/hooks/useAsyncButton";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { maskPhone } from "@/lib/masks";
import {
  DEFAULT_PROFILE_AVATAR_TRANSFORM,
  areAvatarTransformsEqual,
  emitPortalProfileUpdated,
  getProfileAvatarImageStyle,
  getProfileInitials,
  isProfileAvatarTransformColumnError,
  resolveProfileAvatarTransform,
  type ProfileAvatarTransform,
} from "@/lib/profile";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];

const PROFILE_BUCKET = "profile-photos";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_RANGE_CLASSNAME =
  "h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:cursor-not-allowed disabled:opacity-50";

interface PortalProfilePageProps {
  portal: "admin" | "client";
}

interface ProfileFormState {
  fullName: string;
  phone: string;
}

type ProfileTab = "profile" | "account";

/* ── Password strength helpers ──────────────────────────────────── */

type PasswordRule = { key: string; label: string; test: (pw: string) => boolean };

const PASSWORD_RULES: PasswordRule[] = [
  { key: "length", label: "Mínimo 8 caracteres", test: (pw) => pw.length >= 8 },
  { key: "upper", label: "Letra maiúscula (A–Z)", test: (pw) => /[A-Z]/.test(pw) },
  { key: "lower", label: "Letra minúscula (a–z)", test: (pw) => /[a-z]/.test(pw) },
  { key: "number", label: "Número (0–9)", test: (pw) => /[0-9]/.test(pw) },
  { key: "special", label: "Caractere especial (!@#$%&*…)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function passwordStrengthScore(pw: string): number {
  return PASSWORD_RULES.filter((r) => r.test(pw)).length;
}

const STRENGTH_LABELS = ["", "Muito fraca", "Fraca", "Média", "Forte", "Muito forte"];
const STRENGTH_COLORS = [
  "",
  "bg-destructive",
  "bg-destructive",
  "bg-warning",
  "bg-primary",
  "bg-success",
];

function formatShortDate(value?: string | null) {
  if (!value) return "Sem registro";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatPortalEyebrow(portal: "admin" | "client") {
  return portal === "admin" ? "Portal administrativo" : "Portal do cliente";
}

function formatPortalDescription(portal: "admin" | "client") {
  return portal === "admin"
    ? "Atualize seus dados de identificação e mantenha sua presença no portal alinhada ao padrão Elkys."
    : "Gerencie sua identificação no portal e deixe seu acesso com a mesma assinatura visual da Elkys.";
}

export default function PortalProfilePage({ portal }: PortalProfilePageProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const userMetadata = user?.user_metadata;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ProfileFormState>({ fullName: "", phone: "" });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarTransform, setAvatarTransform] = useState<ProfileAvatarTransform>(
    DEFAULT_PROFILE_AVATAR_TRANSFORM
  );
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  // useAsyncButton: loading + success state do botao "Salvar alterações"
  // sao derivados do hook. O check verde aparece no CTA por ~1.6s apos
  // salvar com sucesso, reforcando o toast visualmente no mesmo lugar
  // que o usuario clicou.
  const { run: runSaveProfile, loading: saving, success: saved } = useAsyncButton();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [avatarEditorPreviewUrl, setAvatarEditorPreviewUrl] = useState<string | null>(null);
  const [avatarEditorTransform, setAvatarEditorTransform] = useState<ProfileAvatarTransform>(
    DEFAULT_PROFILE_AVATAR_TRANSFORM
  );
  const [avatarEditorSubmitting, setAvatarEditorSubmitting] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarEditorObjectUrlRef = useRef<string | null>(null);
  const metadataAvatarUrl =
    typeof userMetadata?.avatar_url === "string" ? userMetadata.avatar_url : null;
  const metadataAvatarZoom = userMetadata?.avatar_zoom;
  const metadataAvatarPositionX = userMetadata?.avatar_position_x;
  const metadataAvatarPositionY = userMetadata?.avatar_position_y;

  const displayName = useMemo(() => {
    const normalized = form.fullName.trim();
    if (normalized.length > 0) return normalized;
    return profile?.full_name?.trim() || user?.email?.split("@")[0] || "Perfil Elkys";
  }, [form.fullName, profile?.full_name, user?.email]);

  const initials = useMemo(() => getProfileInitials(displayName, "E"), [displayName]);
  const companionPhone = portal === "admin" ? teamMember?.phone : client?.phone;
  const readOnlyEmail = profile?.email || user?.email || "";

  /* ── Password change state ── */
  const [pwFormOpen, setPwFormOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwShowCurrent, setPwShowCurrent] = useState(false);
  const [pwShowNew, setPwShowNew] = useState(false);
  const [pwShowConfirm, setPwShowConfirm] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const pwNewId = useId();
  const pwConfirmId = useId();
  const pwScore = passwordStrengthScore(pwNew);
  const pwAllPassed = pwScore === PASSWORD_RULES.length;
  const pwConfirmMatch = pwConfirm.length > 0 && pwNew === pwConfirm;

  const resetPwForm = () => {
    setPwCurrent("");
    setPwNew("");
    setPwConfirm("");
    setPwShowCurrent(false);
    setPwShowNew(false);
    setPwShowConfirm(false);
    setPwError(null);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);

    if (!pwCurrent.trim()) {
      setPwError("Informe sua senha atual.");
      return;
    }
    if (!pwAllPassed) {
      setPwError("A nova senha não atende a todos os requisitos.");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("As senhas não coincidem.");
      return;
    }

    setPwSubmitting(true);
    try {
      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: readOnlyEmail,
        password: pwCurrent,
      });
      if (signInError) {
        setPwError("Senha atual incorreta.");
        setPwSubmitting(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: pwNew });
      if (updateError) throw updateError;

      toast.success("Senha alterada com sucesso!", {
        description: "Use sua nova senha nos próximos acessos.",
      });
      resetPwForm();
      setPwFormOpen(false);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setPwSubmitting(false);
    }
  };
  const persistedAvatarTransform = useMemo(
    () =>
      resolveProfileAvatarTransform({
        zoom: profile?.avatar_zoom,
        positionX: profile?.avatar_position_x,
        positionY: profile?.avatar_position_y,
      }),
    [profile?.avatar_position_x, profile?.avatar_position_y, profile?.avatar_zoom]
  );
  const avatarImageStyle = useMemo(
    () => getProfileAvatarImageStyle(avatarTransform),
    [avatarTransform]
  );
  const avatarEditorImageStyle = useMemo(
    () => getProfileAvatarImageStyle(avatarEditorTransform),
    [avatarEditorTransform]
  );
  const canSaveAvatarEditor = useMemo(
    () =>
      pendingAvatarFile !== null ||
      (avatarUrl !== null &&
        !areAvatarTransformsEqual(avatarEditorTransform, persistedAvatarTransform)),
    [avatarEditorTransform, avatarUrl, pendingAvatarFile, persistedAvatarTransform]
  );
  const profileTabs = [
    { id: "profile" as const, label: "Perfil", icon: Hexagon },
    { id: "account" as const, label: "Conta e segurança", icon: Shield },
  ];

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setHasLoaded(true);
      return;
    }

    setLoading(true);
    setPageError(null);

    const profilePromise = supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    const companionPromise =
      portal === "admin"
        ? supabase.from("team_members").select("*").eq("user_id", userId).maybeSingle()
        : supabase.from("clients").select("*").eq("user_id", userId).maybeSingle();

    const [profileRes, companionRes] = await Promise.all([profilePromise, companionPromise]);

    if (profileRes.error || !profileRes.data) {
      setPageError(profileRes.error?.message ?? "Perfil não encontrado.");
      setLoading(false);
      return;
    }

    const resolvedAvatar = profileRes.data.avatar_url?.trim() || metadataAvatarUrl;
    const resolvedAvatarTransform = resolveProfileAvatarTransform({
      zoom: profileRes.data.avatar_zoom ?? metadataAvatarZoom,
      positionX: profileRes.data.avatar_position_x ?? metadataAvatarPositionX,
      positionY: profileRes.data.avatar_position_y ?? metadataAvatarPositionY,
    });

    const companionData = !companionRes.error ? companionRes.data : null;

    setProfile(profileRes.data);
    setAvatarUrl(resolvedAvatar);
    setAvatarTransform(resolvedAvatarTransform);
    setForm({
      fullName: profileRes.data.full_name ?? "",
      phone:
        profileRes.data.phone ??
        (portal === "admin"
          ? (companionData as TeamMember | null)?.phone
          : (companionData as Client | null)?.phone) ??
        "",
    });

    if (portal === "admin") {
      setTeamMember((companionData as TeamMember | null) ?? null);
    } else {
      setClient((companionData as Client | null) ?? null);
    }

    setHasLoaded(true);
    setLoading(false);
  }, [
    metadataAvatarPositionX,
    metadataAvatarPositionY,
    metadataAvatarUrl,
    metadataAvatarZoom,
    portal,
    userId,
  ]);

  const clearAvatarEditorPreview = useCallback(() => {
    if (avatarEditorObjectUrlRef.current) {
      URL.revokeObjectURL(avatarEditorObjectUrlRef.current);
      avatarEditorObjectUrlRef.current = null;
    }
  }, []);

  const closeAvatarEditor = useCallback(() => {
    clearAvatarEditorPreview();
    setAvatarEditorOpen(false);
    setAvatarEditorPreviewUrl(null);
    setAvatarEditorTransform(DEFAULT_PROFILE_AVATAR_TRANSFORM);
    setPendingAvatarFile(null);
  }, [clearAvatarEditorPreview]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!avatarEditorOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !avatarEditorSubmitting) {
        closeAvatarEditor();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [avatarEditorOpen, avatarEditorSubmitting, closeAvatarEditor]);

  useEffect(
    () => () => {
      if (avatarEditorObjectUrlRef.current) {
        URL.revokeObjectURL(avatarEditorObjectUrlRef.current);
        avatarEditorObjectUrlRef.current = null;
      }
    },
    []
  );

  const openAvatarEditorForExistingPhoto = () => {
    if (!avatarUrl) return;

    clearAvatarEditorPreview();
    setPendingAvatarFile(null);
    setAvatarEditorPreviewUrl(avatarUrl);
    setAvatarEditorTransform(avatarTransform);
    setAvatarEditorOpen(true);
  };

  const handleFormChange =
    (field: keyof ProfileFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = field === "phone" ? maskPhone(event.target.value) : event.target.value;
      setForm((current) => ({ ...current, [field]: nextValue }));
    };

  const syncProfileMetadata = async (
    nextName: string,
    nextAvatarUrl: string | null,
    nextAvatarTransform: ProfileAvatarTransform = avatarTransform
  ) => {
    await supabase.auth.updateUser({
      data: {
        full_name: nextName,
        avatar_url: nextAvatarUrl,
        avatar_zoom: nextAvatarTransform.zoom,
        avatar_position_x: nextAvatarTransform.positionX,
        avatar_position_y: nextAvatarTransform.positionY,
      },
    });

    emitPortalProfileUpdated({
      fullName: nextName,
      avatarUrl: nextAvatarUrl,
      avatarTransform: nextAvatarTransform,
    });
  };

  const clearStoredAvatars = async () => {
    if (!user?.id) return;

    const { data: objects } = await supabase.storage
      .from(PROFILE_BUCKET)
      .list(user.id, { limit: 100 });
    if (!objects || objects.length === 0) return;

    await supabase.storage
      .from(PROFILE_BUCKET)
      .remove(objects.map((object) => `${user.id}/${object.name}`));
  };

  const persistAvatar = async (
    nextAvatarUrl: string | null,
    nextAvatarTransform: ProfileAvatarTransform = avatarTransform
  ) => {
    if (!user?.id) return;

    const profileUpdate = {
      avatar_url: nextAvatarUrl,
      avatar_zoom: nextAvatarTransform.zoom,
      avatar_position_x: nextAvatarTransform.positionX,
      avatar_position_y: nextAvatarTransform.positionY,
    };

    const { error } = await supabase.from("profiles").update(profileUpdate).eq("id", user.id);

    if (error) {
      if (!isProfileAvatarTransformColumnError(error.message)) throw error;

      const { error: fallbackError } = await supabase
        .from("profiles")
        .update({ avatar_url: nextAvatarUrl })
        .eq("id", user.id);

      if (fallbackError) throw fallbackError;
    }

    setAvatarUrl(nextAvatarUrl);
    setAvatarTransform(nextAvatarTransform);
    setProfile((current) =>
      current
        ? {
            ...current,
            avatar_url: nextAvatarUrl,
            avatar_zoom: nextAvatarTransform.zoom,
            avatar_position_x: nextAvatarTransform.positionX,
            avatar_position_y: nextAvatarTransform.positionY,
          }
        : current
    );
    await syncProfileMetadata(
      form.fullName.trim() || profile?.full_name || displayName,
      nextAvatarUrl,
      nextAvatarTransform
    );
  };

  const handlePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Formato inválido.", {
        description: "Use uma imagem JPG, PNG ou WEBP.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Arquivo muito grande.", {
        description: "Escolha uma imagem de até 5 MB.",
      });
      event.target.value = "";
      return;
    }

    clearAvatarEditorPreview();

    const previewUrl = URL.createObjectURL(file);
    avatarEditorObjectUrlRef.current = previewUrl;
    setPendingAvatarFile(file);
    setAvatarEditorPreviewUrl(previewUrl);
    setAvatarEditorTransform(DEFAULT_PROFILE_AVATAR_TRANSFORM);
    setAvatarEditorOpen(true);
    event.target.value = "";
  };

  const handleRemovePhoto = async () => {
    if (!user?.id || !avatarUrl) return;

    setUploadingPhoto(true);

    try {
      await clearStoredAvatars();
      await persistAvatar(null, DEFAULT_PROFILE_AVATAR_TRANSFORM);
      toast.success("Foto removida.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível remover a foto.";
      toast.error("Erro ao remover foto.", { description: message });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id || !profile) return;

    const nextName = form.fullName.trim();
    const nextPhoneDigits = form.phone.replace(/\D/g, "");

    if (nextName.length < 3) {
      toast.error("Nome incompleto.", {
        description: "Informe seu nome completo para salvar o perfil.",
      });
      return;
    }

    try {
      await runSaveProfile(async () => {
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: nextName,
            phone: nextPhoneDigits.length > 0 ? form.phone : null,
          })
          .eq("id", user.id);

        if (error) throw error;

        setProfile((current) =>
          current
            ? {
                ...current,
                full_name: nextName,
                phone: nextPhoneDigits.length > 0 ? form.phone : null,
              }
            : current
        );

        await syncProfileMetadata(nextName, avatarUrl, avatarTransform);
        toast.success("Perfil atualizado.");
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o perfil.";
      toast.error("Erro ao salvar perfil.", { description: message });
    }
  };

  const handleAvatarEditorTransformChange =
    (field: keyof ProfileAvatarTransform) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number(event.target.value);
      setAvatarEditorTransform((current) =>
        resolveProfileAvatarTransform({ ...current, [field]: nextValue })
      );
    };

  const handleResetAvatarEditor = () => {
    setAvatarEditorTransform(
      pendingAvatarFile ? DEFAULT_PROFILE_AVATAR_TRANSFORM : persistedAvatarTransform
    );
  };

  const uploadAvatarFile = async (file: File, nextAvatarTransform: ProfileAvatarTransform) => {
    if (!user?.id) return;

    await clearStoredAvatars();

    const extension = file.name.split(".").pop()?.toLowerCase() || "webp";
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from(PROFILE_BUCKET).upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(path);
    await persistAvatar(publicData.publicUrl, nextAvatarTransform);
  };

  const handleSaveAvatarEditor = async () => {
    if (!pendingAvatarFile && !avatarUrl) return;

    setAvatarEditorSubmitting(true);

    try {
      if (pendingAvatarFile) {
        setUploadingPhoto(true);
        await uploadAvatarFile(pendingAvatarFile, avatarEditorTransform);
        toast.success("Foto atualizada.");
      } else if (avatarUrl) {
        await persistAvatar(avatarUrl, avatarEditorTransform);
        toast.success("Enquadramento atualizado.");
      }

      closeAvatarEditor();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : pendingAvatarFile
            ? "Não foi possível enviar a foto."
            : "Não foi possível salvar o enquadramento da foto.";

      toast.error(pendingAvatarFile ? "Erro ao atualizar foto." : "Erro ao salvar enquadramento.", {
        description: message,
      });
    } finally {
      setAvatarEditorSubmitting(false);
      setUploadingPhoto(false);
    }
  };

  if (loading && !hasLoaded) {
    return (
      <div className="space-y-5">
        <div className="h-52 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-14 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-[28rem] animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (pageError || !profile) {
    return (
      <AdminEmptyState
        icon={FileText}
        title="Não foi possível carregar o seu perfil"
        description={`${pageError ?? "Os dados do seu perfil não foram encontrados."} Tente novamente em instantes.`}
        action={
          <Button type="button" onClick={() => void loadProfile()}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  const tabContent =
    activeTab === "profile" ? (
      <Card className="border-border/70 bg-card/92 shadow-card">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-lg">Informações pessoais</CardTitle>
          <CardDescription>
            Atualize os dados essenciais da sua identificação no Portal Elkys.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor={`${portal}-profile-name`}>Nome completo</Label>
              <Input
                id={`${portal}-profile-name`}
                value={form.fullName}
                onChange={handleFormChange("fullName")}
                placeholder="Digite seu nome completo"
              />
            </Field>

            <Field>
              <Label htmlFor={`${portal}-profile-email`}>E-mail</Label>
              <Input
                id={`${portal}-profile-email`}
                value={readOnlyEmail}
                disabled
                className="opacity-100"
              />
            </Field>

            <Field>
              <Label htmlFor={`${portal}-profile-phone`}>Telefone</Label>
              <Input
                id={`${portal}-profile-phone`}
                value={form.phone}
                onChange={handleFormChange("phone")}
                placeholder="(00) 00000-0000"
              />
            </Field>

            <Field>
              <Label htmlFor={`${portal}-profile-linked-phone`}>Telefone operacional</Label>
              <Input
                id={`${portal}-profile-linked-phone`}
                value={companionPhone || "Sem telefone operacional"}
                disabled
                className="opacity-100"
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => void handleSaveProfile()}
              loading={saving}
              loadingText="Salvando..."
              success={saved}
              successLabel="Salvo!"
            >
              Salvar alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    ) : (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
        <Card className="border-border/70 bg-card/92 shadow-card">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg">Conta</CardTitle>
            <CardDescription>Referências essenciais do seu acesso ao portal.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 pt-5 md:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-lg border border-border/70 bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                E-mail de acesso
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">{readOnlyEmail}</p>
            </div>

            <div className="rounded-lg border border-border/70 bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Atualizado em
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {formatShortDate(profile.updated_at)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/92 shadow-card">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg">Segurança</CardTitle>
            <CardDescription>Altere sua senha e mantenha o acesso protegido.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-5">
            {!pwFormOpen ? (
              <>
                <div className="rounded-lg border border-primary/10 bg-primary-soft/60 p-4 dark:bg-primary/10">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    <Shield size={14} />
                    <span>Proteção da conta</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    Troque sua senha sempre que precisar e mantenha o acesso ao portal protegido.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => {
                    resetPwForm();
                    setPwFormOpen(true);
                  }}
                >
                  Alterar senha
                </Button>
              </>
            ) : (
              <form onSubmit={(e) => void handlePasswordChange(e)} className="space-y-4">
                <Field>
                  <Label>Senha atual</Label>
                  <div className="relative">
                    <Input
                      type={pwShowCurrent ? "text" : "password"}
                      value={pwCurrent}
                      onChange={(e) => setPwCurrent(e.target.value)}
                      autoComplete="current-password"
                      placeholder="Digite sua senha atual"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setPwShowCurrent((v) => !v)}
                      tabIndex={-1}
                    >
                      {pwShowCurrent ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </Field>

                <Field>
                  <Label htmlFor={pwNewId}>Nova senha</Label>
                  <div className="relative">
                    <Input
                      id={pwNewId}
                      type={pwShowNew ? "text" : "password"}
                      value={pwNew}
                      onChange={(e) => setPwNew(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Crie uma senha forte"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setPwShowNew((v) => !v)}
                      tabIndex={-1}
                    >
                      {pwShowNew ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>

                  <div
                    className={cn(
                      "mt-2 space-y-2 transition-opacity duration-200",
                      pwNew.length > 0 ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <div className="flex gap-1">
                      {Array.from({ length: PASSWORD_RULES.length }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1.5 flex-1 rounded-full transition-colors",
                            i < pwScore ? STRENGTH_COLORS[pwScore] : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {STRENGTH_LABELS[pwScore] || "\u00A0"}
                    </p>
                    <ul className="space-y-1">
                      {PASSWORD_RULES.map((rule) => {
                        const passed = rule.test(pwNew);
                        return (
                          <li key={rule.key} className="flex items-center gap-1.5">
                            {passed ? (
                              <CheckCircle size={12} className="text-success" />
                            ) : (
                              <X size={12} className="text-muted-foreground" />
                            )}
                            <span
                              className={cn(
                                "text-xs",
                                passed ? "text-success" : "text-muted-foreground"
                              )}
                            >
                              {rule.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Field>

                <Field>
                  <Label htmlFor={pwConfirmId}>Confirmar nova senha</Label>
                  <div className="relative">
                    <Input
                      id={pwConfirmId}
                      type={pwShowConfirm ? "text" : "password"}
                      value={pwConfirm}
                      onChange={(e) => setPwConfirm(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Repita a nova senha"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setPwShowConfirm((v) => !v)}
                      tabIndex={-1}
                    >
                      {pwShowConfirm ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-xs font-medium transition-opacity duration-200",
                      pwConfirm.length > 0 ? "opacity-100" : "opacity-0",
                      pwConfirmMatch ? "text-success" : "text-destructive"
                    )}
                  >
                    {pwConfirm.length > 0
                      ? pwConfirmMatch
                        ? "Senhas coincidem"
                        : "Senhas não coincidem"
                      : "\u00A0"}
                  </p>
                </Field>

                {pwError && <AlertBanner tone="destructive" title={pwError} />}

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetPwForm();
                      setPwFormOpen(false);
                    }}
                    disabled={pwSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    loading={pwSubmitting}
                    loadingText="Salvando..."
                    disabled={!pwAllPassed || !pwConfirmMatch}
                  >
                    Alterar senha
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="space-y-4">
      <Card className="hex-card-container overflow-hidden border-border/70 bg-card/92 shadow-card">
        <HexPattern variant="subtle" className="h-28 w-28 opacity-[0.08] dark:opacity-[0.14]" />
        <CardContent className="relative z-10 p-4 md:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Hexagon size={14} />
                  <span>{formatPortalEyebrow(portal)}</span>
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[1.9rem]">
                    {displayName}
                  </h1>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {formatPortalDescription(portal)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex min-h-[36px] items-center rounded-md border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  {readOnlyEmail}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/70 p-3 shadow-sm lg:justify-self-center">
              <div className="mx-auto flex max-w-[220px] flex-col items-center space-y-3 text-center">
                <HexAvatar
                  size="hero"
                  src={avatarUrl}
                  fallback={initials}
                  alt={`Foto de ${displayName}`}
                  imageStyle={avatarImageStyle}
                  backgroundClassName="scale-[1.12] md:scale-[1.15]"
                  contentInsetClassName="inset-[5.5%] md:inset-[6%]"
                  className="mx-auto h-32 w-32 md:h-36 md:w-36"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  className="hidden"
                  onChange={(event) => void handlePhotoSelected(event)}
                />

                <div className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-2">
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="sm:col-span-2 lg:col-span-2"
                  >
                    {uploadingPhoto
                      ? "Enviando foto..."
                      : avatarUrl
                        ? "Trocar foto"
                        : "Adicionar foto"}
                  </Button>

                  {avatarUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openAvatarEditorForExistingPhoto}
                      disabled={avatarEditorSubmitting || uploadingPhoto}
                    >
                      Ajustar foto
                    </Button>
                  ) : null}

                  {avatarUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleRemovePhoto()}
                      disabled={uploadingPhoto}
                    >
                      Remover foto
                    </Button>
                  ) : null}
                </div>

                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  Use JPG, PNG ou WEBP com até 5 MB. Após selecionar, você poderá ajustar zoom e
                  posicionamento no editor.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border/70 bg-card/92 p-1 shadow-card">
        <div className="grid gap-1 sm:grid-cols-2" role="tablist" aria-label="Seções do perfil">
          {profileTabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                id={`${portal}-${id}-tab`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${portal}-${id}-panel`}
                className={cn(
                  "flex min-h-[50px] items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium tracking-wide transition-all duration-200 ease-out",
                  isActive
                    ? "border-border/80 bg-background text-foreground shadow-sm"
                    : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-background/65 hover:text-foreground"
                )}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <section
        id={`${portal}-${activeTab}-panel`}
        role="tabpanel"
        aria-labelledby={`${portal}-${activeTab}-tab`}
        tabIndex={0}
      >
        {tabContent}
      </section>

      {avatarEditorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-secondary-dark/35 backdrop-blur-sm"
            onClick={closeAvatarEditor}
            aria-label="Fechar editor de foto"
            disabled={avatarEditorSubmitting}
          />

          <div className="relative z-10 w-full max-w-4xl">
            <Card className="overflow-hidden border-border/70 bg-card shadow-xl">
              <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="hex-card-container border-b border-border/60 bg-gradient-subtle lg:border-b-0 lg:border-r">
                  <HexPattern
                    variant="subtle"
                    className="h-32 w-32 opacity-[0.08] dark:opacity-[0.14]"
                  />
                  <div className="relative z-10 flex min-h-[340px] items-center justify-center p-6 md:min-h-[420px]">
                    <HexAvatar
                      size="hero"
                      src={avatarEditorPreviewUrl}
                      fallback={initials}
                      alt={`Pré-visualização da foto de ${displayName}`}
                      imageStyle={avatarEditorImageStyle}
                      backgroundClassName="scale-[1.12] md:scale-[1.16]"
                      contentInsetClassName="inset-[5.25%] md:inset-[5.75%]"
                      className="h-56 w-56 md:h-72 md:w-72"
                    />
                  </div>
                </div>

                <div className="space-y-5 p-5 md:p-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">
                      Ajustar foto do perfil
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Enquadre a imagem para destacar melhor o rosto no avatar do portal e na
                      sidebar.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>Zoom</span>
                        <span>{Math.round(avatarEditorTransform.zoom * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="2.4"
                        step="0.05"
                        value={avatarEditorTransform.zoom}
                        onChange={handleAvatarEditorTransformChange("zoom")}
                        className={AVATAR_RANGE_CLASSNAME}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>Posição horizontal</span>
                        <span>{avatarEditorTransform.positionX}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={avatarEditorTransform.positionX}
                        onChange={handleAvatarEditorTransformChange("positionX")}
                        className={AVATAR_RANGE_CLASSNAME}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>Posição vertical</span>
                        <span>{avatarEditorTransform.positionY}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={avatarEditorTransform.positionY}
                        onChange={handleAvatarEditorTransformChange("positionY")}
                        className={AVATAR_RANGE_CLASSNAME}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetAvatarEditor}
                      disabled={avatarEditorSubmitting}
                    >
                      Centralizar
                    </Button>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeAvatarEditor}
                        disabled={avatarEditorSubmitting}
                      >
                        Cancelar
                      </Button>

                      <Button
                        type="button"
                        onClick={() => void handleSaveAvatarEditor()}
                        loading={avatarEditorSubmitting}
                        loadingText="Salvando..."
                        disabled={!canSaveAvatarEditor}
                      >
                        {pendingAvatarFile ? "Salvar foto" : "Salvar enquadramento"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
