import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Client, Transaction } from "@/entities";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ArrowRightLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettlePLPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState("0.00");
  const [description, setDescription] = useState("P/L to Cash transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: clients, isLoading: isFetching } = useQuery({
    queryKey: ["client", username],
    queryFn: () => Client.filter({ username }),
    enabled: !!username,
  });

  const client = clients?.[0];

  useEffect(() => {
    if (client) {
      const plAmount = client.pl_downline || 0;
      setAmount(plAmount > 0 ? plAmount.toString() : "0");
      setDescription("P/L to Cash transfer");
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    const settleAmount = parseFloat(amount);
    if (isNaN(settleAmount) || settleAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter an amount greater than 0",
      });
      return;
    }

    const maxAmount = client.pl_downline || 0;
    if (maxAmount <= 0) {
      toast({
        variant: "destructive",
        title: "No P/L to settle",
        description: "This client has no P/L balance available to settle.",
      });
      return;
    }

    if (settleAmount > maxAmount) {
      toast({
        variant: "destructive",
        title: "Amount exceeds balance",
        description: `Max amount to transfer is ${maxAmount.toLocaleString()} Rs.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await Client.update(client.id, {
        pl_downline: (client.pl_downline || 0) - settleAmount,
        cash: (client.cash || 0) + settleAmount,
      });

      await Transaction.create({
        client_username: client.username,
        type: 'cash',
        amount: settleAmount,
        description: description,
        before_balance: client.cash || 0,
        after_balance: (client.cash || 0) + settleAmount,
      });

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", username] });
      
      navigate(-1);
    } catch (err) {
      console.error("Settle P/L Error:", err);
      toast({
        variant: "destructive",
        title: "Settlement Failed",
        description: "An error occurred while settling the account.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a9e71]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Client not found</h1>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ChevronLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#ececed", fontFamily: '"Roboto Condensed", HelveticaNeue, Helvetica, Arial, sans-serif', fontSize: "1rem", color: "#212529" }}>
      <main className="max-w-[720px] mx-auto px-[5px] py-4 lg:py-6">
        
        {/* Header Bar */}
        <div className="flex items-center gap-3 mb-6 bg-[#254465] p-4 rounded shadow-sm border border-[#1e3650]">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Settle P/L Account</h1>
            <p className="text-sm text-gray-200 font-bold uppercase tracking-wider">
              @{client.username}
            </p>
          </div>
        </div>

        {/* Settlement Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded shadow-sm border border-[#dee2e6] overflow-hidden">
          <div className="p-6 space-y-6">
            
            <div className="bg-[#e6f2fc] border border-[#b8daff] rounded p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#254465] mt-0.5 flex-shrink-0" />
              <div className="text-sm text-[#254465] font-semibold">
                Settling P/L will deduct the specified amount from the downline P/L balance and add it to the client's cash balance.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#f8f9fa] p-4 rounded border border-[#dee2e6]">
                <p className="text-[11px] font-bold text-[#6c757d] uppercase mb-1">Available P/L</p>
                <p className="text-xl font-bold text-[#00b181]">
                  {(client?.pl_downline || 0).toLocaleString()} Rs.
                </p>
              </div>
              <div className="bg-[#f8f9fa] p-4 rounded border border-[#dee2e6]">
                <p className="text-[11px] font-bold text-[#6c757d] uppercase mb-1">Current Cash</p>
                <p className="text-xl font-bold text-[#254465]">
                  {(client?.cash || 0).toLocaleString()} Rs.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#212529] uppercase mb-2 tracking-wide">Settlement Amount (Rs.)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded px-4 py-3 pl-12 text-lg font-bold focus:outline-none focus:ring-1 focus:ring-[#00b181] focus:border-[#00b181] transition-all bg-white text-[#212529]"
                  placeholder="0.00"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs.</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-2 italic">
                * Maximum allowed transfer is {(client?.pl_downline || 0).toLocaleString()} Rs.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#212529] uppercase mb-2 tracking-wide">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#00b181] focus:border-[#00b181] transition-all bg-white text-[#212529]"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-[#f8f9fa] border-t border-[#dee2e6] flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#00b181] hover:bg-[#4dbd74] text-white font-bold px-8 py-2.5 h-auto rounded shadow flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  Settle Now
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 flex justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="text-sm font-bold text-[#6c757d] hover:text-[#212529] transition-colors"
          >
            Cancel and Return
          </button>
        </div>
      </main>
    </div>
  );
}
