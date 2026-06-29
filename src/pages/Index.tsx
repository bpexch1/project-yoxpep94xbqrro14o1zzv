import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClientSession } from "@/hooks/useClientSession"; // Path structure check kar lijiyega

export default function Index() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Session check karne ka function
    const checkAuth = async () => {
      try {
        const session = await getClientSession();
        if (session) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        navigate("/login", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Jab tak navigation faisla nahi hota, tab tak full screen loader dikhein
  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#0F1419", // Aapka background color
        color: "#00b181" // Aapka theme color
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid rgba(0, 177, 129, 0.1)",
          borderTop: "4px solid #00b181",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return null;
}
