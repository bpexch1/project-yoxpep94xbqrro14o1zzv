import { useEffect, useState } from 'react';
import { UserHeader } from '@/components/user/UserHeader';
import { BettingMatchCard } from '@/components/user/BettingMatchCard';
import { CasinoSection } from '@/components/user/CasinoSection';
import { RaceSection } from '@/components/user/RaceSection';
import { BetSlip } from '@/components/user/BetSlip';

export default function UserDashboard() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />
      <div className="flex flex-1">
        <div className="flex-1">
          <div className="p-4 space-y-4">
            <BettingMatchCard />
            <CasinoSection />
            <RaceSection />
          </div>
        </div>
        <div className="w-80 border-l border-border">
          <BetSlip />
        </div>
      </div>
    </div>
  );
}
