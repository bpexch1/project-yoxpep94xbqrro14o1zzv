import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  User, 
  CreditCard, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  Loader2,
  AlertCircle,
  ShieldCheck
} from "lucide-react";
import { Client } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
        creditLimit: String(client.credit_received || 0),
        status: client.status || "active",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
    }
  }, [client]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Min 3 characters required";
    } else if (!/^[a-zA-Z0-9_@]+$/.test(formData.username)) {
      newErrors.username = "Only alphanumeric and _ @ allowed";
    } else if (formData.username.includes(" ")) {
      newErrors.username = "No spaces allowed";
    }

    if (!formData.fullName) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = "Full name too short";
    }

    if (!formData.creditLimit) {
      newErrors.creditLimit = "Credit limit is required";
    } else if (isNaN(Number(formData.creditLimit)) || Number(formData.creditLimit) < 0) {
      newErrors.creditLimit = "Must be a positive number";
    }

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = "Min 6 characters required";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const creditLimit = Number(formData.creditLimit);
      
      const updateData: any = {
        username: formData.username,
        full_name: formData.fullName,
        role: formData.role,
        credit_received: creditLimit,
        credit_remaining: creditLimit, // Resetting remaining to new limit as per plan
        status: formData.status,
      };

      // In a real app we'd handle password update separately or in the entity
      // For this implementation, we'll assume the entity handles it if provided
      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      await Client.update(client.id, updateData);

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      
      toast({
        title: "Client Updated Successfully",
        description: `Changes to ${formData.username} have been saved.`,
        variant: "default",
      });
      
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "Update Failed",
        description: "An error occurred while saving changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-slate-800 text-white p-6 space-y-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold tracking-tight">Edit Client</DialogTitle>
            {client && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2 py-0.5 font-mono text-[10px]">
                {client.username}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-slate-400 text-sm">
            Modify account details, roles, and status for this client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto bg-white">
          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-username" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={cn(
                  "pl-9 h-11 border-slate-200 focus-visible:ring-emerald-500",
                  errors.username && "border-red-400 focus-visible:ring-red-400"
                )}
              />
            </div>
            {errors.username && (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.username}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-fullName" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={cn(
                  "pl-9 h-11 border-slate-200 focus-visible:ring-emerald-500",
                  errors.fullName && "border-red-400 focus-visible:ring-red-400"
                )}
              />
            </div>
            {errors.fullName && (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.fullName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(val) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger className="h-11 border-slate-200">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="h-11 border-slate-200">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-emerald-600">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive" className="text-red-600">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Inactive
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Credit Limit */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-creditLimit" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Credit Limit</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="edit-creditLimit"
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                className={cn(
                  "pl-9 h-11 border-slate-200 focus-visible:ring-emerald-500",
                  errors.creditLimit && "border-red-400 focus-visible:ring-red-400"
                )}
              />
            </div>
            {Number(formData.creditLimit) > 0 && (
              <p className="text-[10px] text-slate-400 font-medium">
                Preview: ₹{Number(formData.creditLimit).toLocaleString("en-IN")}
              </p>
            )}
            {errors.creditLimit && (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.creditLimit}
              </p>
            )}
          </div>

          {/* Password Change Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-dashed border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-white px-3 text-slate-400">Change Password (optional)</span>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-newPassword" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="edit-newPassword"
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Leave blank to keep current"
                className={cn(
                  "pl-9 pr-10 h-11 border-slate-200 focus-visible:ring-emerald-500",
                  errors.newPassword && "border-red-400 focus-visible:ring-red-400"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password - Only show if newPassword is typed */}
          {formData.newPassword && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="edit-confirmPassword" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="edit-confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className={cn(
                    "pl-9 pr-10 h-11 border-slate-200 focus-visible:ring-emerald-500",
                    errors.confirmPassword && "border-red-400 focus-visible:ring-red-400"
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
                </p>
              )}
            </div>
          )}
        </form>

        <DialogFooter className="bg-slate-50 p-6 border-t gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="h-10 px-6 font-bold border-slate-200">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-8 font-bold shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
