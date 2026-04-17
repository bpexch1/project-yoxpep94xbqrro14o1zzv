import { useLocation, useNavigate } from "react-router-dom";
import { 
  CheckCircle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  User, 
  Calendar, 
  FileText,
  CreditCard,
  ChevronLeft,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TransactionState {
  type: 'deposit' | 'withdrawal';
  tab: 'cash' | 'credit';
  clientUsername: string;
  amount: number;
  description: string;
  beforeBalance: number;
  afterBalance: number;
  timestamp: string;
}

export default function TransactionStatement() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as TransactionState | null;

  if (!state) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No transaction data</h2>
          <p className="text-gray-500 mb-6">We couldn't find the details for this transaction.</p>
          <Button onClick={() => navigate('/accounts')} className="w-full">
            Back to Accounts
          </Button>
        </div>
      </div>
    );
  }

  const isDeposit = state.type === 'deposit';
  const colorClass = isDeposit ? "bg-[#16a085]" : "bg-[#e74c3c]";
  const textColorClass = isDeposit ? "text-[#16a085]" : "text-[#e74c3c]";

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-[#f8f9fa] font-roboto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-w-md w-full animate-in fade-in zoom-in duration-300">
        {/* Top Banner */}
        <div className={cn("p-8 text-center text-white", colorClass)}>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            {isDeposit ? "Deposit" : "Withdrawal"} Successful
          </h1>
          <p className="text-white/80 text-sm mt-1">Transaction has been processed</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Client & Type */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client</p>
                <p className="font-bold text-gray-800">{state.clientUsername}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Method</p>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                state.tab === 'cash' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
              )}>
                {state.tab}
              </span>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Amount */}
          <div className="text-center py-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Transaction Amount</p>
            <p className={cn("text-3xl font-black", textColorClass)}>
              {isDeposit ? "+" : "-"}{state.amount.toLocaleString()} Rs.
            </p>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Details */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <FileText className="w-4 h-4" />
                <span>Description</span>
              </div>
              <span className="font-medium text-gray-700 text-right max-w-[200px] truncate">
                {state.description}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <ArrowUpCircle className="w-4 h-4" />
                <span>Before Balance</span>
              </div>
              <span className="font-medium text-gray-700">
                {state.beforeBalance.toLocaleString()} Rs.
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <CreditCard className="w-4 h-4" />
                <span>After Balance</span>
              </div>
              <span className={cn("font-bold", textColorClass)}>
                {state.afterBalance.toLocaleString()} Rs.
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Date & Time</span>
              </div>
              <span className="font-medium text-gray-700">
                {new Date(state.timestamp).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
          </div>

          <div className="h-px bg-gray-100 pt-2" />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-2 border-gray-200 text-gray-600 hover:bg-gray-50"
              onClick={() => navigate('/accounts')}
            >
              <LayoutDashboard className="w-4 h-4" />
              Accounts
            </Button>
            <Button 
              className="flex-1 gap-2 bg-[#16a085] hover:bg-[#138d75]"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
              New Action
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-8 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
        Official Transaction Receipt
      </p>
    </div>
  );
}
