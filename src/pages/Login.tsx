import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input } from "@/design-system";
import { Field, Label, ErrorText } from "@/design-system";
import { Eye, Mail } from "@/assets/icons";
import { Link } from "react-router-dom";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(128),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { signInWithEmail, signInWithGoogle, user, isClient, isLoading, isTeamMember } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  useEffect(() => setMounted(true), []);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      if (isTeamMember) navigate("/portal/admin", { replace: true });
      else if (isClient) navigate("/portal/cliente", { replace: true });
    }
  }, [user, isClient, isLoading, isTeamMember, navigate]);

  const isDarkTheme = mounted && resolvedTheme === "dark";

  const onSubmit = async (data: LoginForm) => {
    setSubmitting(true);
    setAuthError(null);
    const { error } = await signInWithEmail(data.email, data.password);
    if (error) setAuthError(error);
    setSubmitting(false);
  };

  const handleGoogle = async () => {
    setAuthError(null);
    const { error } = await signInWithGoogle();
    if (error) setAuthError(error);
  };

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center overflow-hidden bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center overflow-hidden px-16 xl:px-24">
        <div className="mb-7 flex items-center">
          <a href="https://elkys.com.br">
            <img
              src={
                isDarkTheme
                  ? "/imgs/icons/lettering_elkys_login.webp"
                  : "/imgs/icons/lettering_elkys_purple_login.webp"
              }
              alt="Elkys"
              width={669}
              height={222}
              className="block h-auto w-[100px]"
            />
          </a>
        </div>
        <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-4">
          Portal do cliente
        </p>
        <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6">
          Acompanhe o seu projeto com clareza em cada etapa.
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-lg">
          Aqui você acompanha o desenvolvimento do seu projeto, consulta documentos, entregas,
          informações financeiras e canais de atendimento em um ambiente único, organizado e seguro.
        </p>
        <div className="flex gap-6 text-xs font-semibold tracking-widest text-foreground uppercase">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            Documentos
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            Financeiro
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            Atendimento
          </span>
        </div>
        <p className="text-muted-foreground text-sm mt-8">
          Acesse com o e-mail cadastrado para entrar no portal da sua conta.
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <a href="https://elkys.com.br">
              <img
                src={
                  isDarkTheme
                    ? "/imgs/icons/lettering_elkys_login.webp"
                    : "/imgs/icons/lettering_elkys_purple_login.webp"
                }
                alt="Elkys"
                width={80}
                height={80}
                className="mx-auto mb-4 block h-auto w-[80px] lg:hidden"
              />
            </a>
            <h2 className="text-2xl font-bold text-foreground">Acessar minha conta</h2>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Portal do cliente
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field>
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  {...register("email")}
                />
                <Mail
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
              </div>
              {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  <Eye size={18} />
                </button>
              </div>
              {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
            </Field>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleGoogle}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Entrar com Google
          </Button>

          <div className="mt-5 flex justify-center gap-4 text-xs text-primary">
            <Link to="/privacy-policy" className="hover:underline">
              Política de privacidade
            </Link>
            <Link to="/terms-of-service" className="hover:underline">
              Termos de uso
            </Link>
            <Link to="/cookie-policy" className="hover:underline">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
