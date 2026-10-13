// Run only once from an operator-controlled environment with Supabase service role.
// This is a bootstrap helper, NEVER served to the browser or executed on login.
// REQUIRED env: V2_SUPABASE_URL, V2_SUPABASE_SERVICE_ROLE_KEY
// Recommended: configure Supabase Auth email templates/redirect first.
import { createClient } from "@supabase/supabase-js";

const url = process.env.V2_SUPABASE_URL;
const key = process.env.V2_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
  throw new Error("Missing secure V2 Supabase URL or service credentials");
}
if (!url.includes("xnmzkoczfrnjfdoxvdlz")) {
  throw new Error("Safety block: this helper ONLY works on the approved fresh BPEXCH-V2 project");
}
const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const email = "bpexch1@gmail.com";
const username = "Book";
const { data: company, error: existingError } = await supabase
  .from("v2_profiles")
  .select("id,username,email,role")
  .eq("role", "company")
  .limit(1);
if (existingError) throw new Error("Could not confirm empty Company bootstrap state");
if (company?.length) {
  if (company[0].username === username && company[0].email === email) {
    console.log("V2 Company profile already present; no new account created.");
    process.exit(0);
  }
  throw new Error("Different Company already exists: abort to prevent duplicate bootstrap.");
}
// Invite the verified owner to set a NEW strong password privately via email.
// Avoid writing or printing previously exposed passwords or service-role keys.
const invited = await supabase.auth.admin.inviteUserByEmail(email, {
  data: { username, account_role: "company" },
});
if (invited.error || !invited.data.user?.id) {
  throw new Error("Secure invite failed. Check SMTP, rate limits and Auth email configuration.");
}
const id = invited.data.user.id;
const inserted = await supabase.from("v2_profiles").insert({
  id,
  username,
  email,
  display_name: "Book",
  role: "company",
  parent_id: null,
  status: "active",
}).select("id,username,role").single();
if (inserted.error || !inserted.data) {
  // Avoid leaving an unlinked Auth principal when creation fails.
  const rollback = await supabase.auth.admin.deleteUser(id);
  if (rollback.error) throw new Error("Company profile insert failed; manual Auth cleanup required.");
  throw new Error("Company profile insert failed; Auth invitation was rolled back.");
}
console.log("V2 Book Company invite created and Company profile linked.");
console.log("Account must accept the invitation and configure a new password to sign in.");
