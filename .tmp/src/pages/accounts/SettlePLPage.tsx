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
    <div className="min-h-screen bg-[#f0f0f0] font-roboto">
      <main className="max-w-[720px] mx-auto p-4 lg:p-6">
        
        {/* Header Bar */}
        <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#2c3e50]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#2c3e50]">Settle P/L Account</h1>
            <p className="text-sm text-[#7f8c8d] font-bold uppercase tracking-wider">
              @{client.username}
            </p>
          </div>
        </div>

        {/* Settlement Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-6">
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                Settling P/L will deduct the specified amount from the downline P/L balance and add it to the client's cash balance.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-[10px] font-bold text-[#7f8c8d] uppercase mb-1">Available P/L</p>
                <p className="text-xl font-bold text-[#1a9e71]">
                  {(client?.pl_downline || 0).toLocaleString()} Rs.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-[10px] font-bold text-[#7f8c8d] uppercase mb-1">Current Cash</p>
                <p className="text-xl font-bold text-[#3498db]">
                  {(client?.cash || 0).toLocaleString()} Rs.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2c3e50] uppercase mb-2 tracking-wide">Settlement Amount (Rs.)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-4 pl-12 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#1a9e71]/10 focus:border-[#1a9e71] transition-all bg-gray-50"
                  placeholder="0.00"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs.</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 italic">
                * Maximum allowed transfer is {(client?.pl_downline || 0).toLocaleString()} Rs.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2c3e50] uppercase mb-2 tracking-wide">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a9e71]/10 focus:border-[#1a9e71] transition-all bg-gray-50"
              />
            </div>
          </div>

          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1a9e71] hover:bg-[#158c61] text-white font-bold px-12 py-3 h-auto rounded-lg shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-5 h-5" />
                  Settle Now
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 flex justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="text-sm font-bold text-[#7f8c8d] hover:text-[#2c3e50] transition-colors"
          >
            Cancel and Return
          </button>
        </div>
      </main>
    </div>
  );
}
