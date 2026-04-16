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

      // Level 1: direct children
      const level1 = await Client.filter({ parent_username: sessionUsername }, '-created_at');
      const level1Names: string[] = level1.map((c: any) => c.username).filter(Boolean);

      // Level 2: grandchildren
      const level2Names: string[] = [];
      for (const uname of level1Names) {
        const children = await Client.filter({ parent_username: uname }, '-created_at');
        children.forEach((c: any) => { if (c.username) level2Names.push(c.username); });
      }

      // Level 3: great-grandchildren
      const level3Names: string[] = [];
      for (const uname of level2Names) {
        const children = await Client.filter({ parent_username: uname }, '-created_at');
        children.forEach((c: any) => { if (c.username) level3Names.push(c.username); });
      }

      // Combine all levels and remove duplicates
      const allNames = Array.from(new Set([...level1Names, ...level2Names, ...level3Names]));
      return allNames;
    },
    enabled: !!sessionUsername,
    staleTime: 30000, // Cache for 30 seconds
  });
}
