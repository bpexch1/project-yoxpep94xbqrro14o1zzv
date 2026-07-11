import { supabase } from "@/lib/supabaseClient";

const SESSION_KEY = "clientSession";

/**
 * Sign in user with email and password using Supabase
 */
export async function signInClient(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Fetch user profile from profiles table
    const profile = await getClientProfile(data.user.id);

    const sessionData = {
      id: data.user.id,
      email: data.user.email,
      token: data.session.access_token,
      username: profile?.username || data.user.email?.split("@")[0],
      full_name: profile?.full_name || "",
      role: profile?.role || "client",
      credit_received: profile?.credit_received || 0,
      credit_remaining: profile?.credit_remaining || 0,
      cash: profile?.cash || 0,
      pl_downline: profile?.pl_downline || 0,
      balance_upline: profile?.balance_upline || 0,
      status: profile?.status || "active",
    };

    setClientSession(sessionData);
    return { success: true, data: sessionData };
  } catch (error: any) {
    console.error("Sign in error:", error.message);
    throw new Error(error.message || "Sign in failed");
  }
}

/**
 * Sign up a new user with email and password using Supabase
 */
export async function signUpClient(
  email: string,
  password: string,
  username: string,
  fullName?: string
) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName || "",
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // Create profile record in profiles table
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: data.user.id,
          username: username.toLowerCase(),
          email,
          full_name: fullName || "",
          role: "client",
          status: "active",
          credit_received: 0,
          credit_remaining: 0,
          cash: 0,
          pl_downline: 0,
          balance_upline: 0,
        },
      ]);

      if (profileError) {
        console.error("Profile creation error:", profileError.message);
      }
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Sign up error:", error.message);
    throw new Error(error.message || "Sign up failed");
  }
}

/**
 * Get user profile from Supabase profiles table
 */
export async function getClientProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("Get profile error:", error.message);
      return null;
    }

    return data || null;
  } catch (error: any) {
    console.error("Get profile error:", error.message);
    return null;
  }
}

/**
 * Set client session in localStorage
 */
export const setClientSession = (sessionData: any) => {
  if (sessionData) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

/**
 * Get current session from localStorage
 */
export const getClientSession = () => {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
};

/**
 * Clear client session (logout)
 */
export const clearClientSession = async () => {
  localStorage.removeItem(SESSION_KEY);

  // Also sign out from Supabase
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Sign out error:", error);
  }
};

/**
 * Refresh session token from Supabase
 */
export async function refreshClientSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      throw new Error(error.message);
    }

    if (data?.session) {
      // Update token in localStorage
      const currentSession = getClientSession();
      if (currentSession) {
        currentSession.token = data.session.access_token;
        setClientSession(currentSession);
      }
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Refresh session error:", error.message);
    throw error;
  }
}

/**
 * Listen to auth state changes
 */
export function onClientAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const { data: authListener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);

      // Update localStorage when auth state changes
      if (event === "SIGNED_IN" && session) {
        const currentSession = getClientSession();
        if (currentSession) {
          currentSession.token = session.access_token;
          setClientSession(currentSession);
        }
      } else if (event === "SIGNED_OUT") {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  );

  return authListener?.subscription.unsubscribe;
}

/**
 * Reset password (send reset email)
 */
export async function resetClientPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Reset password error:", error.message);
    throw error;
  }
}

/**
 * Update user password
 */
export async function updateClientPassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Update password error:", error.message);
    throw error;
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentClientUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.warn("Get user error:", error.message);
      return null;
    }

    return data.user;
  } catch (error: any) {
    console.error("Get user error:", error.message);
    return null;
  }
}
