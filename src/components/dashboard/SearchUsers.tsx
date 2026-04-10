import { Search } from "lucide-react";

export function SearchUsers() {
  return (
    <section className="bg-white rounded shadow-sm overflow-hidden border">
      <div className="bg-slate-50 px-4 py-2 border-b flex items-center gap-2 text-sm font-bold text-slate-700">
        <Search className="w-4 h-4 text-slate-900 fill-slate-900" />
        Search-Users
      </div>
      <div className="p-4 flex gap-2">
        <input
          type="text"
          placeholder="Username"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button className="bg-emerald-500 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-1 shadow-sm hover:bg-emerald-600 transition-colors">
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>
    </section>
  );
}
