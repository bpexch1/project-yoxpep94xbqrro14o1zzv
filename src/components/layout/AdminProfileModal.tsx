import React, { useState } from "react";
import { X, Key, Shield, User, Wallet, Users, CheckCircle, Loader2 } from "lucide-react";
import { ClientSession } from "@/hooks/useClientAuth";
import { Client } from "@/entities";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ClientSession | null;
  roleLabel: string;
}

export function AdminProfileModal({ isOpen, onClose, session, roleLabel }: AdminProfileModalProps) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: clientRecord, refetch } = useQuery({
    queryKey: ["admin-profile-data", session?.username],
    queryFn: async () => {
      if (!session?.username) return null;
      const records = await Client.filter({ username: session.username }, "-created_at", 1);
      return records?.[0] || null;
    },
    enabled: !!session?.username && isOpen,
  });

  const { data: downlineCount = 0 } = useQuery({
    queryKey: ["admin-profile-downline", session?.username],
    queryFn: async () => {
      if (!session?.username) return 0;
      const children = await Client.filter({ parent_username: session.username });
      return Array.isArray(children) ? children.length : 0;
    },
    enabled: !!session?.username && isOpen,
  });

  if (!isOpen || !session) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a new password." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }

    try {
      setIsUpdating(true);
      if (clientRecord?.id) {
        await Client.update(clientRecord.id, { password: newPassword });
      }
      toast({ title: "Success", description: "Password updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
      refetch();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message || "Failed to update password." });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div 
        className="bg-white rounded-md shadow-2xl w-full max-w-md border border-[#d2d6de] overflow-hidden text-[#212529]"
        style={{ fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="bg-[#1e282c] text-white px-4 py-3 flex items-center justify-between border-b border-[#354354]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00b181]" />
            <h3 className="font-bold text-sm tracking-wide">Account Profile</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Account Details Card */}
          <div className="bg-[#f8f9fa] rounded border border-[#dee2e6] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#e9ecef]">
              <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-gray-400" /> Username
              </span>
              <span className="font-bold text-[#212529] text-sm">{session.username}</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#e9ecef]">
              <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-gray-400" /> Role
              </span>
              <span className="inline-block px-2 py-0.5 bg-[#e8f5e9] text-[#2e7d32] font-semibold text-[11px] rounded border border-[#c8e6c9]">
                {roleLabel}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#e9ecef]">
              <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                <Wallet className="w-3.5 h-3.5 text-gray-400" /> Cash Balance
              </span>
              <span className="font-bold text-[#00b181] text-sm">
                {(Number(clientRecord?.cash) || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-gray-400" /> Direct Downlines
              </span>
              <span className="font-semibold text-gray-700">{downlineCount} Users</span>
            </div>
          </div>

          {/* Change Password Box */}
          <div className="border border-[#dee2e6] rounded p-3.5 bg-white">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <Key className="w-4 h-4 text-[#00b181]" />
              <h4 className="text-xs font-bold text-[#333]">Change Password</h4>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-white border border-[#ced4da] rounded focus:outline-none focus:border-[#00b181]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-white border border-[#ced4da] rounded focus:outline-none focus:border-[#00b181]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full h-8 bg-[#00b181] hover:bg-[#009e73] text-white text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" /> Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#f8f9fa] px-4 py-2.5 border-t border-[#dee2e6] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-[#333] text-xs font-medium rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
