import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, AlertTriangle } from "lucide-react";
import { Match } from "@/entities";
import { marketAmount } from "@/lib/adminUiPolicy";

interface DisplayMatchItem {
  id: string;
  title: string;
  sport: string;
  amount: string;
  isLive: boolean;
  matchTime?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchUsername, setSearchUsername] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUsername.trim()) {
      navigate(`/accounts?search=${encodeURIComponent(searchUsername.trim())}`);
    }
  };

  // Fetch DB matches
  const { data: dbMatches = [], refetch, isFetching, isError } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: () => Match.list("-created_at", 50),
    staleTime: 10000,
  });

  const handleRefresh = () => {
    refetch();
  };

  // Build Soccer Matches
  const soccerMatches: DisplayMatchItem[] = useMemo(() => {
    const list: DisplayMatchItem[] = [];
    const addedTitles = new Set<string>();

    const dbSoccer = (Array.isArray(dbMatches) ? dbMatches : []).filter(
      (m: any) => m && (m.sport?.toLowerCase() === "soccer" || m.sport?.toLowerCase() === "football")
    );

    if (dbSoccer.length === 0) {
      return [];
    }

    dbSoccer.forEach((m: any, idx: number) => {
      const titleBase = m.title || `${m.team1 || "Team A"} v ${m.team2 || "Team B"}`;
      const title = titleBase.includes("/ Match Odds") ? titleBase : `${titleBase} / Match Odds`;
      const key = title.toLowerCase().trim();
      if (!addedTitles.has(key)) {
        addedTitles.add(key);
        const status = String(m.status || m.api_status || "").toLowerCase();
        const isLive = status === "live" || status === "inplay" || status === "started";
        list.push({
          id: m.id || `live-fb-${idx}`,
          title,
          sport: "Soccer",
          amount: marketAmount(m.total_matched),
          isLive,
        });
      }
    });

    return list;
  }, [dbMatches]);

  // Build Cricket Matches
  const cricketMatches: DisplayMatchItem[] = useMemo(() => {
    const list: DisplayMatchItem[] = [];
    const addedTitles = new Set<string>();

    const dbCricket = (Array.isArray(dbMatches) ? dbMatches : []).filter(
      (m: any) => m && m.sport?.toLowerCase() === "cricket"
    );

    if (dbCricket.length === 0) {
      return [];
    }

    dbCricket.forEach((m: any, idx: number) => {
      const titleBase = m.title || `${m.team1 || "Team A"} v ${m.team2 || "Team B"}`;
      const title = titleBase.includes("/ Match Odds") ? titleBase : `${titleBase} / Match Odds`;
      const key = title.toLowerCase().trim();
      if (!addedTitles.has(key)) {
        addedTitles.add(key);
        const status = String(m.status || m.api_status || "").toLowerCase();
        const isLive = status === "live" || status === "inplay" || status === "started";
        list.push({
          id: m.id || `live-ck-${idx}`,
          title,
          sport: "Cricket",
          amount: marketAmount(m.total_matched),
          isLive,
        });
      }
    });

    return list;
  }, [dbMatches]);

  // Build Tennis Matches
  const tennisMatches: DisplayMatchItem[] = useMemo(() => {
    const list: DisplayMatchItem[] = [];
    const addedTitles = new Set<string>();

    const dbTennis = (Array.isArray(dbMatches) ? dbMatches : []).filter(
      (m: any) => m && m.sport?.toLowerCase() === "tennis"
    );

    if (dbTennis.length === 0) {
      return [];
    }

    dbTennis.forEach((m: any, idx: number) => {
      const titleBase = m.title || `${m.team1 || "Player 1"} v ${m.team2 || "Player 2"}`;
      const title = titleBase.includes("/ Match Odds") ? titleBase : `${titleBase} / Match Odds`;
      const key = title.toLowerCase().trim();
      if (!addedTitles.has(key)) {
        addedTitles.add(key);
        const status = String(m.status || m.api_status || "").toLowerCase();
        const isLive = status === "live" || status === "inplay" || status === "started";
        list.push({
          id: m.id || `live-tn-${idx}`,
          title,
          sport: "Tennis",
          amount: marketAmount(m.total_matched),
          isLive,
        });
      }
    });

    return list;
  }, [dbMatches]);

  const handleMatchClick = (match: DisplayMatchItem) => {
    navigate(`/admin/market/${match.id}`);
  };

  const totalHighlightsCount = soccerMatches.length + cricketMatches.length + tennisMatches.length;

  if (isError) return <div role="alert" className="card card-body">Unable to load markets. <button className="btn btn-primary" onClick={() => void refetch()}>Retry</button></div>;

  return (
    <div
      className="w-full reference-dashboard"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: "1rem",
        color: "rgb(35, 40, 44)",
      }}
    >
      {/* 1. Search-Users Card */}
      <div
        className="bg-white rounded-[0.25rem] border border-[rgb(200,206,211)] mb-3 "
      >
        {/* Card Header */}
        <div
          className="flex items-center gap-2 px-3 py-2 bg-[#f0f3f5] border-b border-[rgb(200,206,211)]"
        >
          <Filter size={14} className="text-[rgb(35,40,44)] shrink-0" strokeWidth={2.5} />
          <span className="font-bold text-[1rem] text-[rgb(35,40,44)]">Search-Users</span>
        </div>

        {/* Card Body */}
        <div className="p-3 reference-search-body">
          <form onSubmit={handleSearch} className="flex items-center reference-search-form">
            <input
              type="text"
              placeholder="Username"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="flex-1 h-[34px] border border-[#c8ced3] border-r-0 rounded-l-sm px-3 text-[1rem] text-[#495057] bg-white outline-none focus:border-[#00B181]"
            />
            <button
              type="submit"
              className="h-[34px] bg-[#00B181] hover:bg-[#009e74] text-white border border-[#00B181] rounded-r-sm px-3.5 text-[1rem] font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <Search size={14} strokeWidth={2.5} />
              Search
            </button>
          </form>
        </div>
      </div>

      {/* 2. Sport Highlights Card */}
      <div
        className="bg-white rounded-sm border border-[#c8ced3] mb-4 "
      >
        {/* Card Header */}
        <div
          className="flex items-center gap-2.5 px-3 py-2 bg-[#f0f3f5] border-b border-[#c8ced3]"
        >
          <span className="font-bold text-[1rem] text-[#23282C]">Sport Highlights</span>
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="bg-[#00B181] hover:bg-[#009e74] text-white rounded-sm px-2 py-0.5 text-[12px] font-bold transition-colors disabled:opacity-75"
          >
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Tables Container */}
        <div className="reference-highlights-body">
          {/* Soccer Table */}
          {soccerMatches.length > 0 && (
            <table className="table table-bordered table-striped table-sm mb-0">
              <thead>
                <tr className="bg-[#f0f3f5]">
                  <th className="text-left font-bold text-[1rem] text-[rgb(35,40,44)] border-[rgb(200,206,211)]">
                    Soccer
                  </th>
                  <th className="text-left font-bold text-[1rem] text-[rgb(35,40,44)] border-[rgb(200,206,211)] w-[120px]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {soccerMatches.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => handleMatchClick(m)}
                    className="hover:bg-gray-50 cursor-pointer bg-white"
                  >
                    <td className="border-[rgb(200,206,211)] font-bold text-[1rem] text-[#009e74] leading-tight py-1.5 px-2">
                      <span>{m.title}</span>
                      {m.isLive && (
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1b5e20] ml-1.5 align-middle " />
                      )}
                    </td>
                    <td className="border-[rgb(200,206,211)] text-[rgb(35,40,44)] text-[1rem] py-1.5 px-2">
                      {m.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Cricket Table */}
          {cricketMatches.length > 0 && (
            <table className="table table-bordered table-striped table-sm mb-0">
              <thead>
                <tr className="bg-[#f0f3f5]">
                  <th className="text-left font-bold text-[1rem] text-[rgb(35,40,44)] border-[rgb(200,206,211)]">
                    Cricket
                  </th>
                  <th className="text-left font-bold text-[1rem] text-[rgb(35,40,44)] border-[rgb(200,206,211)] w-[120px]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {cricketMatches.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => handleMatchClick(m)}
                    className="hover:bg-gray-50 cursor-pointer bg-white"
                  >
                    <td className="border-[rgb(200,206,211)] font-bold text-[1rem] text-[#009e74] leading-tight py-1.5 px-2">
                      <span>{m.title}</span>
                      {m.isLive && (
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1b5e20] ml-1.5 align-middle " />
                      )}
                    </td>
                    <td className="border-[rgb(200,206,211)] text-[rgb(35,40,44)] text-[1rem] py-1.5 px-2">
                      {m.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Tennis Table */}
          {tennisMatches.length > 0 && (
            <table className="table table-bordered table-striped table-sm mb-0">
              <thead>
                <tr className="bg-[#f0f3f5]">
                  <th className="text-left font-bold text-[1rem] text-[rgb(35,40,44)] border-[rgb(200,206,211)]">
                    Tennis
                  </th>
                  <th className="text-left font-bold text-[1rem] text-[rgb(35,40,44)] border-[rgb(200,206,211)] w-[120px]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {tennisMatches.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => handleMatchClick(m)}
                    className="hover:bg-gray-50 cursor-pointer bg-white"
                  >
                    <td className="border-[rgb(200,206,211)] font-bold text-[1rem] text-[#009e74] leading-tight py-1.5 px-2">
                      <span>{m.title}</span>
                      {m.isLive && (
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1b5e20] ml-1.5 align-middle " />
                      )}
                    </td>
                    <td className="border-[rgb(200,206,211)] text-[rgb(35,40,44)] text-[1rem] py-1.5 px-2">
                      {m.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Status when empty */}
          {totalHighlightsCount === 0 && (
            <div className="p-8 text-center text-gray-500 text-[1rem]">
              <div className="flex items-center justify-center gap-2 text-amber-700 font-bold mb-2">
                <AlertTriangle size={18} />
                <span>No Active Matches Currently Available</span>
              </div>
              <p className="text-xs text-gray-500">Please click Refresh or check back shortly.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
