import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/create-user" element={<CreateUser />} />
            <Route path="/create-company-account" element={<CreateCompanyAccount />} />
            <Route path="/reports/book-detail" element={<BookDetail />} />
            <Route path="/reports/book-detail-2" element={<BookDetail2 />} />
            <Route path="/reports/daily-pl" element={<DailyPL />} />
            <Route path="/reports/daily-report" element={<DailyReport />} />
            <Route path="/reports/final-sheet" element={<FinalSheet />} />
            <Route path="/current-position" element={<CurrentPosition />} />
            <Route path="/account-view" element={<AccountView />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/user-profile" element={<UserProfile />} />
            <Route path="/user-statement" element={<UserStatement />} />
            <Route path="/user-result" element={<UserResult />} />
            <Route path="/user-profit-loss" element={<UserProfitLoss />} />
            <Route path="/user-bet-history" element={<UserBetHistory />} />
            <Route path="/match-detail" element={<MatchDetail />} />
            <Route path="/accounts/edit-client" element={<EditClientPage />} />
            <Route path="/accounts/cash-credit" element={<CashCreditPage />} />
            <Route path="/accounts/settle-pl" element={<SettlePLPage />} />
            <Route path="/accounts/ledger" element={<LedgerPage />} />
            <Route path="/bet-lock" element={<BetLock />} />
            <Route path="/settle-match" element={<SettleMatch />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Analytics />
          <SpeedInsights />
          <BrandingBadge />
        </TooltipProvider>
      </BrowserRouter>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;