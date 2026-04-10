import React, { useState } from "react";
import { Search, Filter } from "lucide-react";

interface SearchUsersProps {
  onSearch?: (username: string) => void;
}

export function SearchUsers({ onSearch }: SearchUsersProps) {
  const [username, setUsername] = useState("");

  const handleSearch = () => {
    if (onSearch) onSearch(username);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
        <Filter className="w-3.5 h-3.5 text-emerald-500" />
        Search-Users
      </div>
      <div className="p-4 flex flex-wrap sm:flex-nowrap gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all bg-slate-50 focus:bg-white"
        />
        <button
          onClick={handleSearch}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>
    </div>
  );
}
