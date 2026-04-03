import { useState, useId } from "react";
import { Link } from "react-router-dom";

import { ArrowLeft, Mail } from "@/assets/icons";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/design-system";
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
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Recuperar senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviaremos um link de redefinição para o e-mail cadastrado.
          </p>
        </div>

        <Card className="border-border/70 bg-card/92">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Esqueci minha senha</CardTitle>
            <CardDescription>
              Digite o e-mail associado à sua conta no Portal Elkys.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
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
                <p className="text-xs text-muted-foreground">
                  Não recebeu? Verifique a caixa de spam ou tente novamente em alguns minutos.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
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
                {error ? (
                  <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting || !email.trim()}>
                    {submitting ? "Enviando..." : "Enviar link de redefinição"}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
