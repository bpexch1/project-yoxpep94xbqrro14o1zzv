import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Accounts from "./pages/Accounts";
import NotFound from "./pages/NotFound";
import { BrandingBadge } from "./components/BrandingBadge";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/reports/current-position" element={<Accounts />} />
            <Route path="/reports/daily-pl" element={<Accounts />} />
            <Route path="/reports/daily" element={<Accounts />} />
            <Route path="/reports/book-detail" element={<Accounts />} />
            <Route path="/reports/final-sheet" element={<Accounts />} />
            <Route path="/reports/commission" element={<Accounts />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <BrandingBadge />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
