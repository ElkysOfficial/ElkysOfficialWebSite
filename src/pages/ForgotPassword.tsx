import { useState, useId } from "react";
import { Link } from "react-router-dom";

import { ArrowLeft, Mail } from "@/assets/icons";
import { Button, cn } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPassword() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }

    setSubmitting(true);
    try {
      // Always shows success to avoid email enumeration
      await supabase.functions.invoke("send-password-reset", {
        body: { email: email.trim().toLowerCase() },
      });
      setSent(true);
    } catch {
      // Still show success to avoid leaking existence of accounts
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-5">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
          {/* Accent bar */}
          <div className="h-1 bg-gradient-primary" />

          <div className="px-6 pt-7 pb-6 sm:px-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Recuperar senha</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enviaremos um link de redefinição para o e-mail cadastrado.
              </p>
            </div>

            {sent ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail size={24} className="text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Verifique seu e-mail</p>
                  <p className="text-sm text-muted-foreground">
                    Se o endereço <strong>{email}</strong> estiver cadastrado, você receberá um link
                    para redefinir sua senha em breve.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground/70">
                  Não recebeu? Verifique a caixa de spam ou tente novamente em alguns minutos.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-border/60"
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                >
                  Tentar outro e-mail
                </Button>
              </div>
            ) : (
              <>
                {/* Error */}
                <div
                  className={cn(
                    "mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-destructive text-sm text-center transition-all duration-200 overflow-hidden",
                    error ? "opacity-100 max-h-20" : "max-h-0 opacity-0 mb-0 py-0 border-0"
                  )}
                >
                  {error}
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label htmlFor={emailId} className="text-sm font-medium text-foreground">
                      E-mail
                    </label>
                    <div className="relative">
                      <input
                        id={emailId}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        autoFocus
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="seu@email.com.br"
                      />
                      <Mail
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      loading={submitting}
                      loadingText="Enviando..."
                      disabled={!email.trim()}
                    >
                      Enviar link de redefinição
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
