import { Client } from "@/entities";

/**
 * Verifies that targetUsername belongs to the session user's hierarchy.
 * Walks up the parent chain (max 5 levels) looking for sessionUsername.
 * Company role always returns true.
 */
export async function verifyInHierarchy(
  targetUsername: string,
  sessionUsername: string,
  sessionRole: string
): Promise<boolean> {
  if (!targetUsername || !sessionUsername) return false;
  
  // Normalize roles to lowercase for comparison
  const role = sessionRole?.toLowerCase();
  
  // Company role and SuperAdmin typically see everything in this app's context
  // but let's stick to the plan: "Company role always passes"
  if (role === "company" || role === "superadmin") return true;
  
  if (targetUsername === sessionUsername) return true;

  try {
    let currentUsername = targetUsername;
    // Walk up the hierarchy
    for (let depth = 0; depth < 6; depth++) {
      const records = await Client.filter({ username: currentUsername }, "-created_at", 1);
      const record = records?.[0];
      
      if (!record) return false;
      
      // If the session user is the parent of the current node, they own the hierarchy below
      if (record.parent_username === sessionUsername) return true;
      
      // If there's no more parent, we reached the top
      if (!record.parent_username) return false;
      
      currentUsername = record.parent_username;
    }
    return false;
  } catch (e) {
    console.error("hierarchyCheck error:", e);
    return false;
  }
}
