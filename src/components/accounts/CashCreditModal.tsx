import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Client, Transaction } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CashCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any | null;
}

export function CashCreditModal({ isOpen, onClose, client }: CashCreditModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'cash' | 'credit'>('cash');
  
  const [depositDesc, setDepositDesc] = useState('');
  const [depositAmount, setDepositAmount] = useState('0');
  const [withdrawDesc, setWithdrawDesc] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('0');
  
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  useEffect(() => {
    if (!client) return;
    if (activeTab === 'cash') {
      setDepositDesc(`Cash payment to Book7801 from ${client.username}`);
      setWithdrawDesc(`Cash payment to ${client.username} from Book7801`);
    } else {
      setDepositDesc(`Credit Issued to ${client.username}`);
      setWithdrawDesc(`Credit Withdrawn from ${client.username}`);
    }
    setDepositAmount('0');
    setWithdrawAmount('0');
  }, [client, activeTab, isOpen]);

  const handleDeposit = async () => {
    if (!client) return;
    const amount = parseFloat(depositAmount) || 0;
    if (amount <= 0) {
      toast({ variant: "destructive", title: "Invalid amount", description: "Please enter an amount greater than 0" });
      return;
    }
    
    setIsSubmittingDeposit(true);
    try {
      if (activeTab === 'cash') {
        const before = client.cash || 0;
        await Transaction.create({
          client_username: client.username,
          type: 'cash',
          amount: amount,
          description: depositDesc,
          before_balance: before,
          after_balance: before + amount,
        });
        await Client.update(client.id, { cash: before + amount });
      } else {
        const beforeRec = client.credit_received || 0;
        const beforeRem = client.credit_remaining || 0;
        await Transaction.create({
          client_username: client.username,
          type: 'credit',
          amount: amount,
          description: depositDesc,
          before_balance: beforeRem,
          after_balance: beforeRem + amount,
        });
        await Client.update(client.id, {
          credit_received: beforeRec + amount,
          credit_remaining: beforeRem + amount,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Deposit Successful", description: `${amount} Rs. deposited to ${client.username}` });
      setDepositAmount('0');
      onClose();
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Deposit Failed" });
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const handleWithdraw = async () => {
    if (!client) return;
    const amount = parseFloat(withdrawAmount) || 0;
    if (amount <= 0) {
      toast({ variant: "destructive", title: "Invalid amount", description: "Please enter an amount greater than 0" });
      return;
    }
    
    setIsSubmittingWithdraw(true);
    try {
      if (activeTab === 'cash') {
        const before = client.cash || 0;
        await Transaction.create({
          client_username: client.username,
          type: 'cash',
          amount: -amount,
          description: withdrawDesc,
          before_balance: before,
          after_balance: before - amount,
        });
        await Client.update(client.id, { cash: before - amount });
      } else {
        const beforeRem = client.credit_remaining || 0;
        await Transaction.create({
          client_username: client.username,
          type: 'credit',
          amount: -amount,
          description: withdrawDesc,
          before_balance: beforeRem,
          after_balance: beforeRem - amount,
        });
        await Client.update(client.id, { credit_remaining: beforeRem - amount });
      }
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Withdraw Successful", description: `${amount} Rs. withdrawn from ${client.username}` });
      setWithdrawAmount('0');
      onClose();
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Withdraw Failed" });
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 max-w-sm overflow-hidden border-0 shadow-2xl [&>button]:hidden">
        {/* HEADER / TABS */}
        <div className="flex bg-white relative">
          <button
            onClick={() => setActiveTab('cash')}
            className={cn(
              "flex-1 py-4 text-base font-semibold transition-colors border-b-4",
              activeTab === 'cash' ? "bg-white text-blue-500 border-blue-500" : "bg-white text-emerald-500 border-transparent"
            )}
          >
            Cash
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={cn(
              "flex-1 py-4 text-base font-semibold transition-colors border-b-4",
              activeTab === 'credit' ? "bg-blue-500 text-white border-blue-500" : "bg-white text-emerald-500 border-transparent"
            )}
          >
            Credit
          </button>
          {/* Close button inside tab area as per reference feel */}
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* CONTENT - scrollable */}
        <div className="bg-gray-100 max-h-[85vh] overflow-y-auto">
          
          {/* White card: client name + summary table */}
          <div className="bg-white p-4 mb-3">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{client?.username}</h2>
            
            {/* Summary table */}
            <div className="border border-gray-200 rounded overflow-hidden text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white">
                    {activeTab === 'cash' ? (
                      <>
                        <th className="px-3 py-2 text-left text-gray-800 font-medium border-r border-gray-200 w-1/3">Credit</th>
                        <th className="px-3 py-2 text-left text-gray-800 font-medium border-r border-gray-200 w-1/3">Balance</th>
                        <th className="px-3 py-2 text-left text-gray-800 font-medium w-1/3">Max Withdraw</th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-2 text-left text-gray-800 font-medium border-r border-gray-200 w-1/3">Credit limit</th>
                        <th className="px-3 py-2 text-left text-gray-800 font-medium border-r border-gray-200 w-1/3">{client?.username} Credit</th>
                        <th className="px-3 py-2 text-left text-gray-800 font-medium w-1/3">{client?.username} Available Balance</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="border-t border-gray-200">
                  <tr className="bg-white">
                    {activeTab === 'cash' ? (
                      <>
                        <td className="px-3 py-2 font-bold border-r border-gray-200">{(client?.credit_remaining || 0).toLocaleString()} Rs.</td>
                        <td className="px-3 py-2 font-bold border-r border-gray-200">{(client?.cash || 0).toLocaleString()} Rs.</td>
                        <td className="px-3 py-2 font-bold">{Math.max(0, client?.cash || 0).toLocaleString()} Rs.</td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 font-bold border-r border-gray-200">{(client?.credit_received || 0).toLocaleString()} Rs.</td>
                        <td className="px-3 py-2 font-bold border-r border-gray-200">{(client?.credit_remaining || 0).toLocaleString()} Rs.</td>
                        <td className="px-3 py-2 font-bold">{(client?.credit_remaining || 0).toLocaleString()} Rs.</td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* DEPOSIT SECTION */}
          <div className="mb-3 px-2">
            <div className="rounded overflow-hidden border border-emerald-200">
              {/* Green header */}
              <div className="bg-emerald-500 px-4 py-2.5">
                {activeTab === 'cash' ? (
                  <p className="text-white text-sm">
                    <span className="font-bold uppercase">Deposit</span> Cash in <span className="font-bold">{client?.username}</span> Account
                  </p>
                ) : (
                  <p className="text-white text-sm font-medium">
                    Deposit Credit in {client?.username} Account
                  </p>
                )}
              </div>
              {/* White form */}
              <div className="bg-white px-4 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <input
                    type="text"
                    value={depositDesc}
                    onChange={(e) => setDepositDesc(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                  <div className="flex rounded overflow-hidden shadow-sm border border-gray-300 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                    <span className="bg-gray-100 px-4 py-2.5 text-sm text-gray-600 border-r border-gray-300 flex items-center font-medium">Rs.</span>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleDeposit}
                    disabled={isSubmittingDeposit}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-2 rounded shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                  >
                    {isSubmittingDeposit && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* WITHDRAW SECTION */}
          <div className="mb-6 px-2">
            <div className="rounded overflow-hidden border border-red-200">
              {/* Red header */}
              <div className="bg-red-500 px-4 py-2.5">
                {activeTab === 'cash' ? (
                  <p className="text-white text-sm">
                    <span className="font-bold uppercase">Withdraw</span> Cash from <span className="font-bold">{client?.username}</span> Account
                  </p>
                ) : (
                  <p className="text-white text-sm font-medium">
                    Withdraw Credit from {client?.username}
                  </p>
                )}
              </div>
              {/* White form */}
              <div className="bg-white px-4 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <input
                    type="text"
                    value={withdrawDesc}
                    onChange={(e) => setWithdrawDesc(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                  <div className="flex rounded overflow-hidden shadow-sm border border-gray-300 focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all">
                    <span className="bg-gray-100 px-4 py-2.5 text-sm text-gray-600 border-r border-gray-300 flex items-center font-medium">Rs.</span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleWithdraw}
                    disabled={isSubmittingWithdraw}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-2 rounded shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                  >
                    {isSubmittingWithdraw && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
