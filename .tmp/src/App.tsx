import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import CreateUser from "./pages/CreateUser";
import CreateCompanyAccount from "./pages/CreateCompanyAccount";
import BookDetail from "./pages/reports/BookDetail";
import BookDetail2 from "./pages/reports/BookDetail2";
import DailyPL from "./pages/reports/DailyPL";
import DailyReport from "./pages/reports/DailyReport";
import FinalSheet from "./pages/reports/FinalSheet";
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
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/accounts/create" element={<CreateUser />} />
            <Route path="/accounts/create-company" element={<CreateCompanyAccount />} />
            <Route path="/reports/book-detail" element={<BookDetail />} />
            <Route path="/reports/book-detail-2" element={<BookDetail2 />} />
            <Route path="/reports/daily-pl" element={<DailyPL />} />
            <Route path="/reports/daily" element={<DailyReport />} />
            <Route path="/reports/final-sheet" element={<FinalSheet />} />
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
