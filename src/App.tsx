import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
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
import CurrentPosition from "./pages/CurrentPosition";
import AccountView from "./pages/AccountView";
import UserDashboard from "./pages/UserDashboard";
import UserProfile from "./pages/UserProfile";
import MatchDetail from "./pages/MatchDetail";
import EditClientPage from "./pages/accounts/EditClientPage";
import CashCreditPage from "./pages/accounts/CashCreditPage";
import SettlePLPage from "./pages/accounts/SettlePLPage";
import LedgerPage from "./pages/accounts/LedgerPage";
import TransactionStatement from "./pages/accounts/TransactionStatement";
import BetLock from "./pages/BetLock";
import NotFound from "./pages/NotFound";
import { BrandingBadge } from "./components/BrandingBadge";
import { AppLayout } from "./components/layout/AppLayout";

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
            
            {/* Protected Admin Routes */}
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/accounts" element={<AppLayout><Accounts /></AppLayout>} />
            <Route path="/accounts/create" element={<AppLayout><CreateUser /></AppLayout>} />
            <Route path="/accounts/create-company" element={<AppLayout><CreateCompanyAccount /></AppLayout>} />
            <Route path="/reports/book-detail" element={<AppLayout><BookDetail /></AppLayout>} />
            <Route path="/reports/book-detail-2" element={<AppLayout><BookDetail2 /></AppLayout>} />
            <Route path="/reports/daily-pl" element={<AppLayout><DailyPL /></AppLayout>} />
            <Route path="/reports/daily" element={<AppLayout><DailyReport /></AppLayout>} />
            <Route path="/reports/final-sheet" element={<AppLayout><FinalSheet /></AppLayout>} />
            <Route path="/reports/commission" element={<AppLayout><Accounts /></AppLayout>} />
            <Route path="/current-position" element={<AppLayout><CurrentPosition /></AppLayout>} />
            <Route path="/accounts/view/:username" element={<AppLayout><AccountView /></AppLayout>} />
            <Route path="/accounts/edit/:username" element={<AppLayout><EditClientPage /></AppLayout>} />
            <Route path="/accounts/cash-credit/:username" element={<AppLayout><CashCreditPage /></AppLayout>} />
            <Route path="/accounts/settle-pl/:username" element={<AppLayout><SettlePLPage /></AppLayout>} />
            <Route path="/accounts/ledger/:username" element={<AppLayout><LedgerPage /></AppLayout>} />
            <Route path="/accounts/transaction-statement" element={<AppLayout><TransactionStatement /></AppLayout>} />
            <Route path="/bet-lock" element={<AppLayout><BetLock /></AppLayout>} />
            <Route path="/play" element={<UserDashboard />} />
            <Route path="/play/profile" element={<UserProfile />} />
            <Route path="/play/match/:matchId" element={<MatchDetail />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <BrandingBadge />
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
