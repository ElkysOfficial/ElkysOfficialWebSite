import { useState } from "react";
import { toast } from "sonner";

import { ExternalLink } from "@/assets/icons";
import { Button } from "@/design-system";

interface CopyLinkButtonProps {
  /** URL a copiar. Se omitida, usa `window.location.href`. */
  url?: string;
  /** Label do botao. Padrao "Copiar link". */
  label?: string;
  className?: string;
}

/**
 * Botao que copia a URL atual (ou fornecida) para o clipboard — util para
 * compartilhar deep-links internamente (Slack, e-mail). Feedback via toast.
 */
export default function CopyLinkButton({
  url,
  label = "Copiar link",
  className,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const target = url ?? (typeof window !== "undefined" ? window.location.href : "");
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      toast.success("Link copiado para a área de transferência");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar — verifique as permissões do navegador");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={() => void handleCopy()}
      aria-label={copied ? "Link copiado" : label}
    >
      <ExternalLink />
      {copied ? "Copiado!" : label}
    </Button>
  );
}
