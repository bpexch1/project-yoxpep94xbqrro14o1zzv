import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X, User, LogOut, RefreshCw } from "lucide-react";

interface Match {
  id: string;
  title?: string;
  team1?: string;
  team2?: string;
  status?: string;
  sport?: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cricketMatches, setCricketMatches] = useState<Match[]>([]);
  const [footballMatches, setFootballMatches] = useState<Match[]>([]);
  const [tennisMatches, setTennisMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/matches", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure data is array before filtering
        const matches = Array.isArray(data) ? data : [];
        setCricketMatches(matches.filter((m: Match) => m.sport === "cricket"));
        setFootballMatches(matches.filter((m: Match) => m.sport === "football"));
        setTennisMatches(matches.filter((m: Match) => m.sport === "tennis"));
      } else {
        // Set empty arrays on error
        setCricketMatches([]);
        setFootballMatches([]);
        setTennisMatches([]);
      }
    } catch (error) {
      setCricketMatches([]);
      setFootballMatches([]);
      setTennisMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast({ title: "Logged out" });
    navigate("/login");
  };

  const getAmount = (match: Match, idx: number) => {
    return "0";
  };

  const filteredCricket = Array.isArray(cricketMatches) 
    ? cricketMatches.filter(m => 
        (m.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.team1 || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.team2 || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredFootball = Array.isArray(footballMatches)
    ? footballMatches.filter(m =>
        (m.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.team1 || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.team2 || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredTennis = Array.isArray(tennisMatches)
    ? tennisMatches.filter(m =>
        (m.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.team1 || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.team2 || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">BPEXCH</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.username} ({user?.role})</span>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Search */}
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search Users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-800 border-slate-700"
          />
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
        </div>
      </div>

      {/* Sport Highlights */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sport Highlights</h2>
          <Button variant="ghost" size="sm" onClick={fetchMatches} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Cricket Section */}
        {filteredCricket.length > 0 && (
          <div className="mb-6">
            <h3 className="text-emerald-400 font-semibold mb-2">Cricket</h3>
            <div className="space-y-2">
              {filteredCricket.map((match, idx) => (
                <div key={match.id || idx} className="bg-slate-800 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{match.title || `${match.team1} v ${match.team2}`}</p>
                      <p className="text-sm text-slate-400">Match Odds</p>
                      {match.status === "live" && (
                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">LIVE</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-mono">{getAmount(match, idx)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Football Section */}
        {filteredFootball.length > 0 && (
          <div className="mb-6">
            <h3 className="text-emerald-400 font-semibold mb-2">Football</h3>
            <div className="space-y-2">
              {filteredFootball.map((match, idx) => (
                <div key={match.id || idx} className="bg-slate-800 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{match.title || `${match.team1} v ${match.team2}`}</p>
                      <p className="text-sm text-slate-400">Match Odds</p>
                      {match.status === "live" && (
                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">LIVE</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-mono">{getAmount(match, idx + 20)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tennis Section */}
        {filteredTennis.length > 0 && (
          <div className="mb-6">
            <h3 className="text-emerald-400 font-semibold mb-2">Tennis</h3>
            <div className="space-y-2">
              {filteredTennis.map((match, idx) => (
                <div key={match.id || idx} className="bg-slate-800 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{match.title || `${match.team1} v ${match.team2}`}</p>
                      <p className="text-sm text-slate-400">Match Odds</p>
                      {match.status === "live" && (
                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">LIVE</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-mono">{getAmount(match, idx + 40)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredCricket.length === 0 && filteredFootball.length === 0 && filteredTennis.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>No matches available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;