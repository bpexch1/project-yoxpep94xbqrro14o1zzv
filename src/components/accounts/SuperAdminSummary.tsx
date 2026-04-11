import { Users, Users2, CreditCard, Banknote, TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface SuperAdminSummaryProps {
  clients: any[];
  isLoading: boolean;
}

const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  iconColor = "text-gray-500", 
  iconBg = "bg-gray-100",
  valueColor = "text-gray-900",
  isLoading = false 
}: { 
  label: string; 
  value: string | number; 
  icon: any; 
  iconColor?: string;
  iconBg?: string;
  valueColor?: string;
  isLoading?: boolean;
}) => (
  <div className="bg-white border border-gray-200 rounded p-3 flex items-center justify-between shadow-sm">
    <div className="space-y-1">
      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider leading-none">{label}</p>
      {isLoading ? (
        <div className="h-5 w-16 bg-gray-100 animate-pulse rounded" />
      ) : (
        <p className={`text-sm font-bold ${valueColor}`}>{value}</p>
      )}
    </div>
    <div className={`${iconBg} p-1.5 rounded-full`}>
      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
    </div>
  </div>
);

export function SuperAdminSummary({ clients, isLoading }: SuperAdminSummaryProps) {
  const stats = {
    activeClients: clients.filter(c => c.status === "active").length,
    totalClients: clients.length,
    totalCredit: clients.reduce((sum, c) => sum + (Number(c.credit_remaining) || 0), 0),
    totalCash: clients.reduce((sum, c) => sum + (Number(c.cash) || 0), 0),
    totalPL: clients.reduce((sum, c) => sum + (Number(c.pl_downline) || 0), 0),
    totalBalance: clients.reduce((sum, c) => sum + (Number(c.balance_upline) || 0), 0),
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <section className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden mb-3">
      <div className="px-3 py-2 border-b border-gray-200 bg-slate-50 flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-700 tracking-tight">NomanSA8592 - Overview</span>
      </div>
      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatCard
          label="Active Clients"
          value={stats.activeClients}
          icon={Users}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Clients"
          value={stats.totalClients}
          icon={Users2}
          iconColor="text-gray-600"
          iconBg="bg-gray-100"
          isLoading={isLoading}
        />
        <StatCard
          label="Credit Remaining"
          value={formatCurrency(stats.totalCredit)}
          icon={CreditCard}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Cash"
          value={formatCurrency(stats.totalCash)}
          icon={Banknote}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          isLoading={isLoading}
        />
        <StatCard
          label="P/L Downline"
          value={formatCurrency(stats.totalPL)}
          icon={stats.totalPL >= 0 ? TrendingUp : TrendingDown}
          iconColor={stats.totalPL >= 0 ? "text-emerald-600" : "text-red-600"}
          iconBg={stats.totalPL >= 0 ? "bg-emerald-50" : "bg-red-50"}
          valueColor={stats.totalPL >= 0 ? "text-emerald-600" : "text-red-600"}
          isLoading={isLoading}
        />
        <StatCard
          label="Balance Upline"
          value={formatCurrency(stats.totalBalance)}
          icon={Wallet}
          iconColor={stats.totalBalance >= 0 ? "text-emerald-600" : "text-red-600"}
          iconBg={stats.totalBalance >= 0 ? "bg-emerald-50" : "bg-red-50"}
          valueColor={stats.totalBalance >= 0 ? "text-emerald-600" : "text-red-600"}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}
