import { Menu, ChevronDown } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-slate-800 text-white h-12 flex items-center justify-between px-4 shadow-md font-mono text-xs">
      <div className="flex items-center gap-4">
        <Menu className="w-5 h-5 cursor-pointer" />
        <div className="flex items-center gap-1 cursor-pointer">
          <span>NomanSA8592 (SuperAdmin)</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-center gap-2 font-bold tracking-tight">
        <span>B: 0</span>
        <span>Exp: 0</span>
      </div>
    </header>
  );
}
