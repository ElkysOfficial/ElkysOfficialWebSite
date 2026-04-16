import { Mail, Phone } from "@/assets/icons";
import { cn } from "@/design-system";

interface ContactLinksProps {
  email?: string | null;
  phone?: string | null;
  phoneDisplay?: string | null;
  /**
   * Mensagem opcional pré-preenchida no WhatsApp. Útil pra contextualizar
   * o contato com o nome do lead/cliente ou a situação em curso.
   */
  whatsappMessage?: string;
  /**
   * Quando true, exibe os botões lado a lado em vez de empilhados.
   * Default é inline (horizontal).
   */
  inline?: boolean;
  className?: string;
}

/**
 * Ícone minimal do WhatsApp — inline SVG para não depender do pacote
 * de ícones e manter o peso da página baixo.
 */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      width="16"
      height="16"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/**
 * Normaliza um número de telefone brasileiro para o formato exigido
 * pelos links tel: e wa.me — apenas dígitos, com DDI 55 como prefixo.
 */
function normalizePhone(phone: string): { tel: string; wa: string } {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return { tel: "", wa: "" };
  // Assume já estar com DDI quando começa com 55 e tem 12 ou 13 dígitos
  const hasCountryCode = (digits.length === 12 || digits.length === 13) && digits.startsWith("55");
  const tel = hasCountryCode ? `+${digits}` : `+55${digits}`;
  const wa = hasCountryCode ? digits : `55${digits}`;
  return { tel, wa };
}

/**
 * Renderiza links clicáveis para email, telefone e WhatsApp quando
 * disponíveis. Cada link abre o app nativo apropriado via esquemas
 * mailto:, tel: e https://wa.me. Mantém consistência visual em todas
 * as telas onde exibimos dados de contato de leads, clientes e contatos.
 */
export default function ContactLinks({
  email,
  phone,
  phoneDisplay,
  whatsappMessage,
  inline = false,
  className,
}: ContactLinksProps) {
  const trimmedEmail = email?.trim() || "";
  const trimmedPhone = phone?.trim() || "";
  const { tel, wa } = trimmedPhone ? normalizePhone(trimmedPhone) : { tel: "", wa: "" };

  const hasAny = trimmedEmail || tel;
  if (!hasAny) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const baseLink =
    "inline-flex items-center gap-1.5 rounded-md border border-border/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary-soft hover:text-primary";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", inline && "gap-1.5", className)}>
      {trimmedEmail ? (
        <a
          href={`mailto:${trimmedEmail}`}
          className={baseLink}
          title={`Enviar e-mail para ${trimmedEmail}`}
        >
          <Mail size={14} />
          <span className="truncate max-w-[220px]">{trimmedEmail}</span>
        </a>
      ) : null}
      {tel ? (
        <a href={`tel:${tel}`} className={baseLink} title={`Ligar para ${phoneDisplay ?? phone}`}>
          <Phone size={14} />
          <span>{phoneDisplay ?? phone}</span>
        </a>
      ) : null}
      {wa ? (
        <a
          href={`https://wa.me/${wa}${
            whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : ""
          }`}
          target="_blank"
          rel="noopener noreferrer"
          className={baseLink}
          title={`Abrir conversa no WhatsApp`}
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          <span>WhatsApp</span>
        </a>
      ) : null}
    </div>
  );
}
