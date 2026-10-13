import { useQuery } from "@tanstack/react-query";
import { Client } from "@/entities";

export function useDownlineUsernames(sessionUsername: string | undefined, sessionRole: string | undefined) {
  return useQuery({
    queryKey: ['downline-usernames', sessionUsername],
    queryFn: async () => {
      if (!sessionUsername) return null;
      const role = sessionRole?.toLowerCase();
      // Only Company sees all — return null meaning no filter
      if (role === 'company') return null;

      // Server scope includes every descendant in the six-role hierarchy.
      const accounts = await Client.list('-created_at', 10000);
      if (accounts.length === 10000) throw new Error('Downline exceeds display limit; use a filtered report.');
      return accounts.map((c: any) => c.username).filter((name: string) => name && name !== sessionUsername);
    },
    enabled: !!sessionUsername,
    staleTime: 30000, // Cache for 30 seconds
  });
}
