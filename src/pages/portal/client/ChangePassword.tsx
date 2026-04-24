import { useState, useId } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { getSupabaseFunctionAuthHeaders } from "@/lib/supabase-functions";

// ---------- password rules ----------
type Rule = { key: string; label: string; test: (pw: string) => boolean };

const RULES: Rule[] = [
  { key: "length", label: "Mínimo 8 caracteres", test: (pw) => pw.length >= 8 },
  { key: "upper", label: "Letra maiúscula (A–Z)", test: (pw) => /[A-Z]/.test(pw) },
  { key: "lower", label: "Letra minúscula (a–z)", test: (pw) => /[a-z]/.test(pw) },
  { key: "number", label: "Número (0–9)", test: (pw) => /[0-9]/.test(pw) },
  {
    key: "special",
    label: "Caractere especial (!@#$%&*…)",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

function strengthScore(pw: string): number {
  return RULES.filter((r) => r.test(pw)).length;
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

// ---------- component ----------
export default function ChangePassword() {
  const navigate = useNavigate();
  const pwId = useId();
  const confirmId = useId();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = strengthScore(password);
  const allPassed = score === RULES.length;
  const confirmMatch = confirm.length > 0 && password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!allPassed) {
      setError("A senha não atende a todos os requisitos.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      const authHeaders = await getSupabaseFunctionAuthHeaders();
      const { error: completionError } = await supabase.functions.invoke("complete-first-access", {
        headers: authHeaders,
      });
      if (completionError) throw completionError;

      toast.success("Senha alterada com sucesso!", {
        description: "Você já pode usar sua nova senha nos próximos acessos.",
      });
      navigate("/portal/cliente", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
          {/* Accent bar */}
          <div className="h-1 bg-gradient-primary" />

          <div className="px-6 pt-7 pb-6 sm:px-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Defina sua senha</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Este é seu primeiro acesso. Crie uma senha segura para proteger sua conta.
              </p>
            </div>

            {/* Error */}
            <div
              className={cn(
                "mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-destructive text-sm text-center transition-all duration-200 overflow-hidden",
                error ? "opacity-100 max-h-20" : "max-h-0 opacity-0 mb-0 py-0 border-0"
              )}
            >
              {error}
            </div>

            {/* Form */}
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5">
              {/* Password field */}
              <div className="space-y-1.5">
                <label htmlFor={pwId} className="text-sm font-medium text-foreground">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    id={pwId}
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Digite sua nova senha"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showPw ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {/* Strength bar – always rendered to prevent layout shift */}
              <div
                className={cn(
                  "space-y-1.5 transition-opacity duration-200",
                  password.length > 0 ? "opacity-100" : "opacity-0"
                )}
              >
                <div className="flex gap-1">
                  {Array.from({ length: RULES.length }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-all duration-300",
                        i < score ? STRENGTH_COLORS[score] : "bg-border"
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Força:{" "}
                  <span className="text-foreground">{STRENGTH_LABELS[score] || "\u00A0"}</span>
                </p>
              </div>

              {/* Rules checklist */}
              <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-1.5">
                {RULES.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <div key={rule.key} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200",
                          passed
                            ? "bg-success text-white"
                            : "border border-border bg-background text-muted-foreground"
                        )}
                      >
                        {passed ? "✓" : "○"}
                      </span>
                      <span
                        className={cn(
                          "text-xs transition-colors duration-200",
                          passed ? "text-success font-medium" : "text-muted-foreground"
                        )}
                      >
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Confirm field */}
              <div className="space-y-1.5">
                <label htmlFor={confirmId} className="text-sm font-medium text-foreground">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    id={confirmId}
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    className={cn(
                      "flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors",
                      confirm.length > 0
                        ? confirmMatch
                          ? "border-success focus-visible:ring-success"
                          : "border-destructive focus-visible:ring-destructive"
                        : "border-input"
                    )}
                    placeholder="Repita a senha"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showConfirm ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <p
                  className={cn(
                    "text-xs font-medium transition-opacity duration-200",
                    confirm.length > 0 ? "opacity-100" : "opacity-0",
                    confirmMatch ? "text-success" : "text-destructive"
                  )}
                >
                  {confirm.length > 0
                    ? confirmMatch
                      ? "Senhas coincidem."
                      : "Senhas não coincidem."
                    : "\u00A0"}
                </p>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={submitting}
                  loadingText="Salvando..."
                  disabled={!allPassed || !confirmMatch}
                >
                  Definir nova senha
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
