/**
 * Hook que resolve o registro `clients` do usuario autenticado.
 *
 * No portal do cliente, o usuario logado precisa saber qual
 * client_id ele representa. A resolucao busca primeiro por
 * clients.user_id e, se nao encontrar, por client_contacts.auth_user_id.
 *
 * Retorna o objeto completo do cliente (ou null se nao vinculado).
 * Cache longo (5min) porque o vinculo nao muda durante a sessao.
 *
 * Usado por: todas as paginas do portal do cliente
 *
 * @example
 * const { data: client } = useClientId();
 * if (client) console.log(client.id, client.full_name);
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { resolveClientForUser } from "@/lib/portal-data";

export function useClientId() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-id", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await resolveClientForUser(user.id);
      if (res.error) throw res.error;
      return res.client;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
