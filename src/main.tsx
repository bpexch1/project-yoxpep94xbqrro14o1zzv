import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initClarity } from "./lib/clarity";

// Initialize Microsoft Clarity Analytics if Project ID is configured
initClarity();

createRoot(document.getElementById("root")!).render(<App />);
