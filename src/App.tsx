import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Accounts from "./pages/Accounts";
import DailyPL from "./pages/DailyPL";
import DailyReport from "./pages/DailyReport";
import BookDetail from "./pages/BookDetail";
import FinalSheet from "./pages/FinalSheet";
import CommissionReport from "./pages/CommissionReport";
import CurrentPosition from "./pages/CurrentPosition";
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
            <Route path="/reports/current-position" element={<CurrentPosition />} />
            <Route path="/reports/daily-pl" element={<DailyPL />} />
            <Route path="/reports/daily" element={<DailyReport />} />
            <Route path="/reports/book-detail" element={<BookDetail />} />
            <Route path="/reports/final-sheet" element={<FinalSheet />} />
            <Route path="/reports/commission" element={<CommissionReport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <BrandingBadge />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
