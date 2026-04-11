import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/entities";
import Landing from "./Landing";

export default function Index() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await User.me();
        if (user.role === "administrator") {
          navigate("/accounts", { replace: true });
        } else {
          setShowLanding(true);
        }
      } catch (error) {
        // Not logged in → show landing
        setShowLanding(true);
      } finally {
        setChecking(false);
      }
    }
    checkAuth();
  }, [navigate]);

  if (checking) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (showLanding) return <Landing />;
  return null;
}
