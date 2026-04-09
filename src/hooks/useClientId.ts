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
