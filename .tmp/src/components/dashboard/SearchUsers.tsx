import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { motion } from "framer-motion";

interface SearchUsersProps {
  onSearch?: (username: string) => void;
}

export function SearchUsers({ onSearch }: SearchUsersProps) {
  const [username, setUsername] = useState("");

  const handleSearch = () => {
    if (onSearch) onSearch(username);
  };

  return (
    <div className="bg-white rounded border shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b px-4 py-2 flex items-center gap-2 text-sm font-bold text-slate-700">
        <Filter className="w-4 h-4" />
        Search-Users
      </div>
      <div className="p-4 flex flex-wrap sm:flex-nowrap gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="flex-1 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSearch}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <Search className="w-4 h-4" />
          Search
        </motion.button>
      </div>
    </div>
  );
}
