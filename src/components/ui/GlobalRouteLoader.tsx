import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CircularArcsLoader } from "./CircularArcsLoader";

export function GlobalRouteLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show spinner on route change
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 550);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search, location.key]);

  useEffect(() => {
    const handleManualTrigger = () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 550);
    };

    window.addEventListener("show-page-loader", handleManualTrigger);
    return () => window.removeEventListener("show-page-loader", handleManualTrigger);
  }, []);

  if (!loading) return null;

  return <CircularArcsLoader fullScreen size={110} />;
}
