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
    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-tight">
        <Filter className="w-3.5 h-3.5 text-emerald-500" />
        Search-Users
      </div>
      <div className="p-4 flex items-center gap-3">
        <span className="text-sm text-slate-600 font-medium w-20 shrink-0">Username</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
        />
        <button
          onClick={handleSearch}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-5 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
        >
          <Search className="w-3.5 h-3.5" />
          Search
        </button>
      </div>
    </div>
  );
}
