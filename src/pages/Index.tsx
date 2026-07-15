import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getClientSession } from "@/hooks/useClientSession";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getClientSession();

    if (session) {
      // Client login hai
      if (session.role === "client") {
        navigate("/play", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } else {
      // Login nahi hai
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#0F1419",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "4px solid rgba(255,255,255,0.15)",
          borderTop: "4px solid #00b181",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
