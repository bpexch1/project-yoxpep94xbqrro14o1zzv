import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import CreateUser from "./pages/CreateUser";
import CreateCompanyAccount from "./pages/CreateCompanyAccount";
import CurrentPosition from "./pages/CurrentPosition";
import AccountView from "./pages/AccountView";
import BetLock from "./pages/BetLock";
import SettleMatch from "./pages/SettleMatch";

import UserDashboard from "./pages/UserDashboard";
import UserProfile from "./pages/UserProfile";
import UserStatement from "./pages/UserStatement";
import UserResult from "./pages/UserResult";
import UserProfitLoss from "./pages/UserProfitLoss";
import UserBetHistory from "./pages/UserBetHistory";

import MatchDetail from "./pages/MatchDetail";
import FootballMatchDetail from "./pages/FootballMatchDetail";
import TennisMatchDetail from "./pages/TennisMatchDetail";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <Routes>

              {/* Login */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />

              {/* Admin */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/accounts/create" element={<CreateUser />} />
              <Route
                path="/accounts/create-company"
                element={<CreateCompanyAccount />}
              />
              <Route
                path="/accounts/view/:username"
                element={<AccountView />}
              />

              <Route
                path="/current-position"
                element={<CurrentPosition />}
              />

              <Route path="/bet-lock" element={<BetLock />} />
              <Route path="/settle-match" element={<SettleMatch />} />

              {/* User */}
              <Route path="/play" element={<UserDashboard />} />
              <Route path="/casino" element={<UserDashboard />} />

              <Route
                path="/play/profile"
                element={<UserProfile />}
              />

              <Route
                path="/play/statement"
                element={<UserStatement />}
              />

              <Route
                path="/play/result"
                element={<UserResult />}
              />

              <Route
                path="/play/profit-loss"
                element={<UserProfitLoss />}
              />

              <Route
                path="/play/bets"
                element={<UserBetHistory />}
              />

              {/* Match Pages */}
              <Route
                path="/play/match/:matchId"
                element={<MatchDetail />}
              />

              <Route
                path="/football/:matchId"
                element={<FootballMatchDetail />}
              />

              <Route
                path="/tennis/:matchId"
                element={<TennisMatchDetail />}
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </BrowserRouter>

        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}