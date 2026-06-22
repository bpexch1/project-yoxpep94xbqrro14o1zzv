import Login from "./pages/Login";



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
import UserStatement from "./pages/UserStatement";
import UserResult from "./pages/UserResult";
import UserProfitLoss from "./pages/UserProfitLoss";
import UserBetHistory from "./pages/UserBetHistory";
import MatchDetail from "./pages/MatchDetail";
import EditClientPage from "./pages/accounts/EditClientPage";
import CashCreditPage from "./pages/accounts/CashCreditPage";
import SettlePLPage from "./pages/accounts/SettlePLPage";
import LedgerPage from "./pages/accounts/LedgerPage";
import BetLock from "./pages/BetLock";
import SettleMatch from "./pages/SettleMatch";
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
            {/* Direct Login Page path "/" aur "/login" dono par set hai */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />

            {/* Admin & Other Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/accounts/create" element={<CreateAccount />} />
            <Route path="/accounts/create-company" element={<CreateCompanyAccount />} />
            <Route path="/reports/book-detail" element={<BookDetail />} />
            <Route path="/reports/book-detail-2" element={<BookDetail2 />} />
            <Route path="/reports/daily-pl" element={<DailyPL />} />
            <Route path="/reports/daily" element={<DailyReport />} />
            <Route path="/reports/final-sheet" element={<FinalSheet />} />
            <Route path="/reports/commission" element={<Commission />} />
            <Route path="/current-position" element={<CurrentPosition />} />
            <Route path="/play/current-position" element={<CurrentPosition />} />
            <Route path="/accounts/view/:username" element={<AccountView />} />
            <Route path="/accounts/edit/:username" element={<AccountEdit />} />
            <Route path="/accounts/cash-credit/:username" element={<CashCredit />} />
            <Route path="/accounts/settle-pl/:username" element={<SettlePL />} />
            <Route path="/accounts/ledger/:username" element={<Ledger />} />
            <Route path="/bet-lock" element={<BetLock />} />
            <Route path="/settle-match" element={<SettleMatch />} />
            <Route path="/play" element={<UserDashboard />} />
            <Route path="/casino" element={<UserDashboard />} />
            <Route path="/play/profile" element={<UserProfile />} />
            <Route path="/play/statement" element={<UserStatement />} />
            <Route path="/play/result" element={<UserResult />} />
            <Route path="/play/profit-loss" element={<UserProfitLoss />} />
            <Route path="/play/bets" element={<UserBetHistory />} />
            <Route path="/play/match/:matchId" element={<MatchDetail />} />
            
            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
