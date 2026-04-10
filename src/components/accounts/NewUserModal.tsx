import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  User,
  CreditCard,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Client as ClientEntity } from "@/entities";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewUserModal({ isOpen, onClose }: NewUserModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    role: "client",
    mobileNumber: "",
    creditLimit: "0",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Minimum 3 characters required";
    } else if (/\s/.test(formData.username)) {
      newErrors.username = "Spaces are not allowed";
    } else if (!/^[a-zA-Z0-9_@]+$/.test(formData.username)) {
      newErrors.username = "Only letters, numbers, _, and @ are allowed";
    }

    if (!formData.fullName) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = "Minimum 2 characters required";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    const creditLimitNum = parseFloat(formData.creditLimit);
    if (formData.creditLimit === "" || isNaN(creditLimitNum)) {
      newErrors.creditLimit = "Credit limit is required";
    } else if (creditLimitNum < 0) {
      newErrors.creditLimit = "Credit limit must be 0 or more";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Minimum 6 characters required";
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formattedCreditLimit = useMemo(() => {
    const num = parseFloat(formData.creditLimit);
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat("en-IN").format(num);
  }, [formData.creditLimit]);

  const passwordStrength = useMemo(() => {
    const len = formData.password.length;
    if (len === 0) return 0;
    if (len < 4) return 1;
    if (len < 6) return 2;
    return 3;
  }, [formData.password]);

  const isFormValid = useMemo(() => {
    return (
      formData.username.length >= 3 &&
      formData.fullName.length >= 2 &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword &&
      parseFloat(formData.creditLimit) >= 0
    );
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await ClientEntity.create({
        username: formData.username,
        full_name: formData.fullName,
        role: formData.role,
        mobile_number: formData.mobileNumber,
        credit_received: parseFloat(formData.creditLimit) || 0,
        credit_remaining: parseFloat(formData.creditLimit) || 0,
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        status: "active",
        parent_username: "NomanSA8592",
      });

      toast({
        title: "Success",
        description: `User created successfully! ${formData.username} has been added.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      handleClose();
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: "",
      fullName: "",
      role: "client",
      mobileNumber: "",
      creditLimit: "0",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-xl">
        <DialogHeader className="bg-slate-800 text-white p-6 pb-4">
          <DialogTitle className="text-xl font-bold uppercase tracking-tight">
            New User Registration
          </DialogTitle>
          <p className="text-slate-400 text-sm mt-1">
            Fill in the details to create a new account
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="bg-white p-6 space-y-4">
          {/* Username */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. JohnDoe123"
                className={cn(
                  "pl-9 rounded-lg transition-all",
                  errors.username ? "border-red-400 ring-red-400/20 ring-2" : "border-slate-200 focus:ring-emerald-500/20 focus:ring-2 focus:border-emerald-500"
                )}
              />
            </div>
            {errors.username ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.username}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 mt-1 pl-1">
                Letters, numbers, @, _ only. No spaces.
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
                className={cn(
                  "pl-9 rounded-lg transition-all",
                  errors.fullName ? "border-red-400 ring-red-400/20 ring-2" : "border-slate-200 focus:ring-emerald-500/20 focus:ring-2 focus:border-emerald-500"
                )}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.fullName}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Account Role
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger className="rounded-lg border-slate-200 focus:ring-emerald-500/20 focus:ring-2 focus:border-emerald-500">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Credit Limit + Mobile */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Credit Limit
              </Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  min="0"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  placeholder="0"
                  className={cn(
                    "pl-9 rounded-lg transition-all",
                    errors.creditLimit ? "border-red-400 ring-red-400/20 ring-2" : "border-slate-200 focus:ring-emerald-500/20 focus:ring-2 focus:border-emerald-500"
                  )}
                />
              </div>
              {errors.creditLimit ? (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.creditLimit}
                </p>
              ) : (
                parseFloat(formData.creditLimit) > 0 && (
                  <p className="text-[10px] text-emerald-600 font-medium mt-1 pl-1">
                    = ₹ {formattedCreditLimit}
                  </p>
                )
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mobile (Optional)
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  placeholder="+91"
                  className="pl-9 rounded-lg border-slate-200 focus:ring-emerald-500/20 focus:ring-2 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min. 6 characters"
                className={cn(
                  "pl-9 pr-10 rounded-lg transition-all",
                  errors.password ? "border-red-400 ring-red-400/20 ring-2" : "border-slate-200 focus:ring-emerald-500/20 focus:ring-2 focus:border-emerald-500"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.password}
              </p>
            ) : (
              <div className="flex gap-1 mt-1.5 pl-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 w-6 rounded-full transition-colors",
                      passwordStrength >= i 
                        ? (passwordStrength === 1 ? "bg-red-400" : passwordStrength === 2 ? "bg-amber-400" : "bg-emerald-400")
                        : "bg-slate-100"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className={cn(
                  "pl-9 pr-10 rounded-lg transition-all",
                  errors.confirmPassword ? "border-red-400 ring-red-400/20 ring-2" : "border-slate-200 focus:ring-emerald-500/20 focus:ring-2 focus:border-emerald-500"
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Summary Strip */}
          {isFormValid && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-2">
              <div className="bg-emerald-100 p-1.5 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-emerald-800">
                Creating <span className="font-bold">{formData.username}</span> as <span className="font-bold">{formData.role}</span> with credit limit <span className="font-bold">₹{formattedCreditLimit}</span>
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="rounded-lg px-6 text-slate-600 border-slate-200"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 font-bold rounded-lg shadow-sm shadow-emerald-200 transition-all active:scale-95 disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
