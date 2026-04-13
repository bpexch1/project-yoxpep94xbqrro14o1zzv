import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, CreditCard, Lock, Eye, EyeOff, Loader2, AlertCircle, Phone } from "lucide-react";
import { Client } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getClientSession } from "@/hooks/useClientAuth";

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewUserModal({ isOpen, onClose }: NewUserModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const session = getClientSession();
  const isCompany = session?.role === "company";
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    role: isCompany ? "superadmin" : "client",
    creditLimit: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      username: "",
      fullName: "",
      role: "client",
      creditLimit: "",
      mobile: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = "Username is required";
    else if (formData.username.length < 3) newErrors.username = "Min 3 characters";
    else if (/\s/.test(formData.username)) newErrors.username = "No spaces allowed";
    else if (!/^[a-zA-Z0-9_@]+$/.test(formData.username)) newErrors.username = "Only letters, numbers, _, @";

    if (!formData.fullName) newErrors.fullName = "Full name is required";
    else if (formData.fullName.length < 2) newErrors.fullName = "Min 2 characters";

    if (!formData.creditLimit) newErrors.creditLimit = "Credit limit is required";
    else if (isNaN(Number(formData.creditLimit)) || Number(formData.creditLimit) < 0)
      newErrors.creditLimit = "Must be a valid positive number";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Min 6 characters";

    if (formData.confirmPassword !== formData.password)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await Client.create({
        username: formData.username,
        full_name: formData.fullName,
        role: formData.role,
        credit_received: Number(formData.creditLimit),
        credit_remaining: Number(formData.creditLimit),
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        status: "active",
        parent_username: session?.username || "",
      });

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "User Created!",
        description: `${formData.username} added successfully.`,
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "An error occurred while creating the user.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    const len = formData.password.length;
    if (len === 0) return 0;
    if (len < 4) return 1;
    if (len < 6) return 2;
    if (len < 8) return 3;
    return 4;
  };

  const strength = getPasswordStrength();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-slate-800 text-white px-6 py-5 space-y-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            New User Registration
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Create a new client account in the exchange system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="bg-white px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Username */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter username"
                  className={cn(
                    "pl-9 h-11 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all",
                    errors.username && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
              </div>
              {errors.username && (
                <p className="text-[10px] text-red-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {errors.username}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter full name"
                  className={cn(
                    "pl-9 h-11 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all",
                    errors.fullName && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
              </div>
              {errors.fullName && (
                <p className="text-[10px] text-red-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {errors.fullName}
                </p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Role</Label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger className="h-11 bg-slate-50 border-slate-200 text-sm">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {isCompany && <SelectItem value="superadmin">SuperAdmin</SelectItem>}
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="Enter mobile number"
                  className="pl-9 h-11 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Credit Limit */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Opening Credit Limit</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  placeholder="0.00"
                  className={cn(
                    "pl-9 h-11 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all",
                    errors.creditLimit && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
              </div>
              {formData.creditLimit && !isNaN(Number(formData.creditLimit)) && (
                <p className="text-[10px] text-emerald-600 font-bold">
                  Preview: {Number(formData.creditLimit).toLocaleString("en-IN")}
                </p>
              )}
              {errors.creditLimit && (
                <p className="text-[10px] text-red-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {errors.creditLimit}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className={cn(
                    "pl-9 pr-10 h-11 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all",
                    errors.password && "border-red-500 focus-visible:ring-red-500"
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
              <div className="flex gap-1 mt-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full bg-slate-100 transition-colors",
                      i <= strength && [
                        "bg-red-500",
                        "bg-orange-500",
                        "bg-amber-500",
                        "bg-emerald-500"
                      ][strength - 1]
                    )}
                  />
                ))}
              </div>
              {errors.password && (
                <p className="text-[10px] text-red-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className={cn(
                    "pl-9 pr-10 h-11 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all",
                    errors.confirmPassword && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.confirmPassword === formData.password && (
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  ✓ Passwords match
                </p>
              )}
              {errors.confirmPassword && (
                <p className="text-[10px] text-red-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-slate-50 border-t flex flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="h-10 text-xs font-bold uppercase tracking-wider border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
