import { HexAvatar, type HexAvatarProps } from "@/design-system";
import { getProfileInitials } from "@/lib/profile";

interface NameAvatarProps extends Omit<HexAvatarProps, "fallback" | "alt"> {
  name?: string | null;
  photoUrl?: string | null;
}

/**
 * Exibe o avatar de uma pessoa. Prioriza a foto fornecida; se não
 * houver, cai para as iniciais (primeiro nome + sobrenome via
 * getProfileInitials) sobre o gradiente padrão do design system ELKYS.
 *
 * Todos os avatares sem foto usam o mesmo gradient-primary para manter
 * consistência visual com a identidade da marca — nunca variar cor
 * por usuário.
 */
export default function NameAvatar({ name, photoUrl, ...rest }: NameAvatarProps) {
  const initials = getProfileInitials(name, "?");
  const hasPhoto = typeof photoUrl === "string" && photoUrl.trim().length > 0;

  return (
    <HexAvatar src={hasPhoto ? photoUrl : null} alt={name ?? ""} fallback={initials} {...rest} />
  );
}
