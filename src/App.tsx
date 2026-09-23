import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import CreateUser from "@/pages/CreateUser";
import CreateCompanyAccount from "@/pages/CreateCompanyAccount";
import BookDetail from "@/pages/reports/BookDetail";
import BookDetail2 from "@/pages/reports/BookDetail2";
import DailyPL from "@/pages/reports/DailyPL";
import DailyReport from "@/pages/reports/DailyReport";
import FinalSheet from "@/pages/reports/FinalSheet";
import CommissionReport from "@/pages/reports/CommissionReport";
import CurrentPosition from "@/pages/CurrentPosition";
import AccountView from "@/pages/AccountView";
import UserDashboard from "@/pages/UserDashboard";
import UserProfile from "@/pages/UserProfile";
import UserStatement from "@/pages/UserStatement";
import UserResult from "@/pages/UserResult";
import UserProfitLoss from "@/pages/UserProfitLoss";
import UserBetHistory from "@/pages/UserBetHistory";
import MatchDetail from "@/pages/MatchDetail";
import EditClientPage from "@/pages/accounts/EditClientPage";
import CashCreditPage from "@/pages/accounts/CashCreditPage";
import SettlePLPage from "@/pages/accounts/SettlePLPage";
import LedgerPage from "@/pages/accounts/LedgerPage";
import BetLock from "@/pages/BetLock";
import SettleMatch from "@/pages/SettleMatch";
import ApiSettings from "@/pages/ApiSettings";
import NotFound from "@/pages/NotFound";
import { BrandingBadge } from "@/components/BrandingBadge";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlobalRouteLoader } from "@/components/ui/GlobalRouteLoader";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GlobalRouteLoader />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/Users/Login" element={<Login />} />
            <Route path="/users/login" element={<Login />} />
            
            {/* Protected Admin Routes */}
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/accounts" element={<AppLayout><Accounts /></AppLayout>} />
            <Route path="/accounts/create" element={<AppLayout><CreateUser /></AppLayout>} />
            <Route path="/Users/Create" element={<AppLayout><CreateUser /></AppLayout>} />
            <Route path="/Users/Creat" element={<AppLayout><CreateUser /></AppLayout>} />
            <Route path="/users/create" element={<AppLayout><CreateUser /></AppLayout>} />
            <Route path="/accounts/create-company" element={<AppLayout><CreateCompanyAccount /></AppLayout>} />
            <Route path="/reports/book-detail" element={<AppLayout><BookDetail /></AppLayout>} />
            <Route path="/reports/book-detail-2" element={<AppLayout><BookDetail2 /></AppLayout>} />
            <Route path="/reports/daily-pl" element={<AppLayout><DailyPL /></AppLayout>} />
            <Route path="/reports/daily" element={<AppLayout><DailyReport /></AppLayout>} />
            <Route path="/reports/final-sheet" element={<AppLayout><FinalSheet /></AppLayout>} />
            <Route path="/reports/commission" element={<AppLayout><CommissionReport /></AppLayout>} />
            <Route path="/Reports/Commission" element={<AppLayout><CommissionReport /></AppLayout>} />
            <Route path="/current-position" element={<AppLayout><CurrentPosition /></AppLayout>} />
            <Route path="/CurrentPosition" element={<AppLayout><CurrentPosition /></AppLayout>} />
            <Route path="/accounts/current-position" element={<AppLayout><CurrentPosition /></AppLayout>} />
            <Route path="/Accounts/CurrentPosition" element={<AppLayout><CurrentPosition /></AppLayout>} />
            <Route path="/accounts/current-position/:username" element={<AppLayout><CurrentPosition /></AppLayout>} />
            <Route path="/Accounts/CurrentPosition/:username" element={<AppLayout><CurrentPosition /></AppLayout>} />
            <Route path="/Users/CurrentPosition/:username" element={<AppLayout><CurrentPosition /></AppLayout>} />
            <Route path="/play/current-position" element={<CurrentPosition />} />
            <Route path="/Customer/LiveMatch" element={<CurrentPosition />} />
            <Route path="/customer/livematch" element={<CurrentPosition />} />
            <Route path="/Customer/CurrentPosition" element={<CurrentPosition />} />
            <Route path="/accounts/view/:username" element={<AppLayout><AccountView /></AppLayout>} />
            <Route path="/Accounts/View/:username" element={<AppLayout><AccountView /></AppLayout>} />
            <Route path="/accounts/edit/:username" element={<AppLayout><EditClientPage /></AppLayout>} />
            <Route path="/Accounts/Edit/:username" element={<AppLayout><EditClientPage /></AppLayout>} />
            <Route path="/Users/Edit/:username" element={<AppLayout><EditClientPage /></AppLayout>} />
            <Route path="/accounts/cash-credit/:username" element={<AppLayout><CashCreditPage /></AppLayout>} />
            <Route path="/Accounts/CashCredit/:username" element={<AppLayout><CashCreditPage /></AppLayout>} />
            <Route path="/Accounts/Cash/:username" element={<AppLayout><CashCreditPage /></AppLayout>} />
            <Route path="/Accounts/Credit/:username" element={<AppLayout><CashCreditPage /></AppLayout>} />
            <Route path="/Accounts/Cr/:username" element={<AppLayout><CashCreditPage /></AppLayout>} />
            <Route path="/accounts/settle-pl/:username" element={<AppLayout><SettlePLPage /></AppLayout>} />
            <Route path="/Accounts/SettlePL/:username" element={<AppLayout><SettlePLPage /></AppLayout>} />
            <Route path="/accounts/ledger/:username" element={<AppLayout><LedgerPage /></AppLayout>} />
            <Route path="/Accounts/Ledger/:username" element={<AppLayout><LedgerPage /></AppLayout>} />
            <Route path="/accounts/ledger" element={<AppLayout><LedgerPage /></AppLayout>} />
            <Route path="/Accounts/Ledger" element={<AppLayout><LedgerPage /></AppLayout>} />
            <Route path="/accounts/clients" element={<AppLayout><Accounts /></AppLayout>} />
            <Route path="/Accounts/Clients" element={<AppLayout><Accounts /></AppLayout>} />
            <Route path="/bet-lock" element={<AppLayout><BetLock /></AppLayout>} />
            <Route path="/settle-match" element={<AppLayout><SettleMatch /></AppLayout>} />
            <Route path="/api-settings" element={<AppLayout><ApiSettings /></AppLayout>} />
            <Route path="/api-diagnostics" element={<AppLayout><ApiSettings /></AppLayout>} />
            
            {/* User Client Routes */}
            <Route path="/play" element={<UserDashboard />} />
            <Route path="/casino" element={<UserDashboard />} />
            <Route path="/play/casino" element={<UserDashboard />} />
            <Route path="/casino-games" element={<UserDashboard />} />
            <Route path="/casino/games" element={<UserDashboard />} />
            <Route path="/world-casino" element={<UserDashboard />} />
            <Route path="/worldcasino" element={<UserDashboard />} />
            <Route path="/WorldCasino" element={<UserDashboard />} />
            <Route path="/play/world-casino" element={<UserDashboard />} />
            <Route path="/star-casino" element={<UserDashboard />} />
            <Route path="/starcasino" element={<UserDashboard />} />
            <Route path="/StarCasino" element={<UserDashboard />} />
            <Route path="/play/star-casino" element={<UserDashboard />} />
            <Route path="/galaxy-casino" element={<UserDashboard />} />
            <Route path="/play/galaxy-casino" element={<UserDashboard />} />
            <Route path="/betfair-games" element={<UserDashboard />} />
            <Route path="/betfairgames" element={<UserDashboard />} />
            <Route path="/BetFairGames" element={<UserDashboard />} />
            <Route path="/play/betfair-games" element={<UserDashboard />} />
            <Route path="/Customer/Casino" element={<UserDashboard />} />
            <Route path="/customer/casino" element={<UserDashboard />} />
            <Route path="/Customer/WorldCasino" element={<UserDashboard />} />
            <Route path="/customer/worldcasino" element={<UserDashboard />} />
            <Route path="/Customer/StarCasino" element={<UserDashboard />} />
            <Route path="/customer/starcasino" element={<UserDashboard />} />
            <Route path="/Customer/BetfairGames" element={<UserDashboard />} />
            <Route path="/customer/betfairgames" element={<UserDashboard />} />
            <Route path="/play/profile" element={<UserProfile />} />
            <Route path="/Customer/Profile" element={<UserProfile />} />
            <Route path="/customer/profile" element={<UserProfile />} />
            <Route path="/play/statement" element={<UserStatement />} />
            <Route path="/play/ledger" element={<UserStatement />} />
            <Route path="/Customer/Statement" element={<UserStatement />} />
            <Route path="/Customer/Ledger" element={<UserStatement />} />
            <Route path="/customer/ledger" element={<UserStatement />} />
            <Route path="/Customer/LiveMarket" element={<UserDashboard />} />
            <Route path="/customer/livemarket" element={<UserDashboard />} />
            <Route path="/Common/Dashboard" element={<UserDashboard />} />
            <Route path="/common/dashboard" element={<UserDashboard />} />
            <Route path="/play/result" element={<UserResult />} />
            <Route path="/Customer/Result" element={<UserResult />} />
            <Route path="/customer/result" element={<UserResult />} />
            <Route path="/play/profit-loss" element={<UserProfitLoss />} />
            <Route path="/Customer/ProfitLoss" element={<UserProfitLoss />} />
            <Route path="/customer/profitloss" element={<UserProfitLoss />} />
            <Route path="/play/bets" element={<UserBetHistory />} />
            <Route path="/Customer/BetHistory" element={<UserBetHistory />} />
            <Route path="/customer/bethistory" element={<UserBetHistory />} />
            <Route path="/play/match/:matchId" element={<MatchDetail />} />
            <Route path="/Customer/EventDetail" element={<MatchDetail />} />
            <Route path="/Common/EventDetail" element={<MatchDetail />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <BrandingBadge />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
