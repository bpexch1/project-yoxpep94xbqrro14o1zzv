import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getClientSession } from "@/hooks/useClientAuth";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getClientSession();
    if (session) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
