import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Client, Transaction } from "@/entities";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ArrowRightLeft } from "lucide-react";

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
      
      toast({
        title: "Success",
        description: `Rs. ${settleAmount.toLocaleString()} settled to cash for ${client.username}`,
      });
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

  const arialFont = { fontFamily: "Arial, Helvetica, sans-serif" };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-[#ececec] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#12b886]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#ececec] flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-[#333] mb-4">Client not found</h1>
        <button onClick={() => navigate(-1)} className="bg-white border border-[#cccccc] px-4 h-10 rounded-[4px] font-bold text-[#333]">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ececec] pb-12" style={arialFont}>
      <main className="max-w-[420px] mx-auto p-3">
        
        {/* Header Bar */}
        <div className="flex items-center gap-3 mb-3 bg-[#f3f3f3] p-3 rounded-[6px] border border-[#d4d4d4]">
          <button 
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#333]" />
          </button>
          <div>
            <h1 className="text-[15px] font-bold text-[#333]">Settle P/L</h1>
            <p className="text-[11px] text-[#12b886] font-bold uppercase tracking-wider">
              {client.username}
            </p>
          </div>
        </div>

        {/* Settlement Form Card */}
        <form onSubmit={handleSubmit} className="bg-[#f3f3f3] rounded-[6px] border border-[#d4d4d4] overflow-hidden">
          <div className="p-4 space-y-4">
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-3 rounded-[4px] border border-[#d0d0d0] text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">P/L Balance</p>
                <p className="text-[15px] font-bold text-[#12b886]">
                  {(client?.pl_downline || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-3 rounded-[4px] border border-[#d0d0d0] text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">Cash Balance</p>
                <p className="text-[15px] font-bold text-[#3498db]">
                  {(client?.cash || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#333] uppercase mb-1.5">Settlement Amount</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-[#cccccc] rounded-[4px] px-3 h-10 text-[16px] font-bold focus:outline-none focus:border-[#12b886] bg-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#333] uppercase mb-1.5">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-[#cccccc] rounded-[4px] px-3 h-10 text-[13px] focus:outline-none focus:border-[#12b886] bg-white"
              />
            </div>
          </div>

          <div className="p-3 bg-[#ececec] flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#12b886] text-white font-bold px-8 h-[40px] rounded-[4px] flex items-center gap-2 active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
              Settle Now
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
