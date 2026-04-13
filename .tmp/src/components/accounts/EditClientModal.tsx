import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, CreditCard, Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Client } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any | null;
}

export function EditClientModal({ isOpen, onClose, client }: EditClientModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    role: "client",
    creditLimit: "",
    status: "active",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client) {
      setFormData({
        username: client.username || "",
        fullName: client.full_name || "",
        role: client.role || "client",
        creditLimit: (client.credit_received || 0).toString(),
        status: client.status || "active",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
    }
  }, [client]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = "Username is required";
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.creditLimit) newErrors.creditLimit = "Credit limit is required";
    else if (isNaN(Number(formData.creditLimit))) newErrors.creditLimit = "Must be a number";

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) newErrors.newPassword = "Min 6 characters";
      if (formData.confirmPassword !== formData.newPassword)
        newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !client) return;

    setIsSubmitting(true);
    try {
      await Client.update(client.id, {
        username: formData.username,
        full_name: formData.fullName,
        role: formData.role,
        credit_received: Number(formData.creditLimit),
        credit_remaining: Number(formData.creditLimit), // Resetting remaining to new received for simplicity in this system
        status: formData.status,
      });

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Client Updated!",
        description: `Account for ${formData.username} has been updated.`,
      });
      onClose();
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "An error occurred while saving changes.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-[#1E2936] text-white px-6 py-5 space-y-1">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl font-bold">Edit Client</DialogTitle>
            {client && (
              <span className="px-2 py-0.5 bg-[#16a085]/20 text-[#16a085] border border-[#16a085]/30 rounded text-[10px] font-bold">
                @{client.username}
              </span>
            )}
          </div>
          <DialogDescription className="text-slate-400 text-xs">
            Modify account details and permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="bg-white px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-[#7f8c8d] uppercase tracking-wider">Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="h-11 bg-slate-50 border-[#d5d8dc] text-sm text-[#2c3e50]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-[#7f8c8d] uppercase tracking-wider">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="h-11 bg-slate-50 border-[#d5d8dc] text-sm text-[#2c3e50]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">InActive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-[#7f8c8d] uppercase tracking-wider">Full Name</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="h-11 bg-slate-50 border-[#d5d8dc] text-sm text-[#2c3e50]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-[#7f8c8d] uppercase tracking-wider">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(val) => setFormData({ ...formData, role: val })}
                >
                  <SelectTrigger className="h-11 bg-slate-50 border-[#d5d8dc] text-sm text-[#2c3e50]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-[#7f8c8d] uppercase tracking-wider">Credit Limit</Label>
                <Input
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  className="h-11 bg-slate-50 border-[#d5d8dc] text-sm text-[#2c3e50]"
                />
              </div>
            </div>

            <div className="border-t border-dashed border-[#d5d8dc] pt-4">
              <p className="text-[10px] font-bold text-[#7f8c8d] uppercase tracking-wider mb-3">Change Password (optional)</p>
              <div className="space-y-3">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7f8c8d]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="New password"
                    className="pl-9 pr-10 h-11 text-sm bg-slate-50 border-[#d5d8dc] text-[#2c3e50]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f8c8d]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {formData.newPassword && (
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7f8c8d]" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="pl-9 pr-10 h-11 text-sm bg-slate-50 border-[#d5d8dc] text-[#2c3e50]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f8c8d]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-slate-50 border-t flex flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 text-xs font-bold uppercase tracking-wider border-[#d5d8dc] text-[#2c3e50]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 bg-[#16a085] hover:bg-[#138d75] text-white text-xs font-bold uppercase tracking-wider px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
