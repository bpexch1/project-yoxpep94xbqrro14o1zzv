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
  Phone, 
  CreditCard, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { Client } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewUserModal({ isOpen, onClose }: NewUserModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    role: "client",
    creditLimit: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_@]+$/.test(formData.username)) {
      newErrors.username = "Only alphanumeric and _ @ allowed";
    } else if (formData.username.includes(" ")) {
      newErrors.username = "No spaces allowed";
    }

    if (!formData.fullName) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.creditLimit) {
      newErrors.creditLimit = "Credit limit is required";
    } else if (isNaN(Number(formData.creditLimit)) || Number(formData.creditLimit) < 0) {
      newErrors.creditLimit = "Must be a positive number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Min 6 characters required";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = () => {
    if (!formData.password) return 0;
    let strength = 0;
    if (formData.password.length >= 6) strength += 1;
    if (/[A-Z]/.test(formData.password)) strength += 1;
    if (/[0-9]/.test(formData.password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
    return strength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await Client.create({
        username: formData.username,
        full_name: formData.fullName,
        role: formData.role,
        credit_received: Number(formData.creditLimit),
        credit_remaining: Number(formData.creditLimit),
        mobile: formData.mobileNumber,
        cash: 0,
        pl_downline: 0,
        status: "active"
      });

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      
      toast({
        title: "User Created Successfully",
        description: `${formData.username} has been registered as ${formData.role}.`,
        variant: "default",
      });
      
      handleClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "Registration Failed",
        description: "An error occurred while creating the user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: "",
      fullName: "",
      role: "client",
      creditLimit: "",
      mobileNumber: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    onClose();
  };

  const strength = getPasswordStrength();
  const isValid = Object.keys(errors).length === 0 && formData.username && formData.password && formData.password === formData.confirmPassword;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-slate-800 text-white p-5 space-y-1">
          <DialogTitle className="text-xl font-bold tracking-tight">New User Registration</DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            Fill in the details below to create a new agent or client account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs font-bold text-slate-600 uppercase">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="noman_99"
                className={cn("pl-9 h-11", errors.username && "border-red-500 focus-visible:ring-red-500")}
              />
            </div>
            {errors.username && <p className="text-[11px] text-red-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.username}</p>}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-bold text-slate-600 uppercase">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Noman Shah"
                className={cn("pl-9 h-11", errors.fullName && "border-red-500")}
              />
            </div>
            {errors.fullName && <p className="text-[11px] text-red-500 font-medium">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase">Account Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(val) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Credit Limit */}
            <div className="space-y-1.5">
              <Label htmlFor="creditLimit" className="text-xs font-bold text-slate-600 uppercase">Credit Limit</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  placeholder="50000"
                  className={cn("pl-9 h-11", errors.creditLimit && "border-red-500")}
                />
              </div>
              {errors.creditLimit && <p className="text-[11px] text-red-500 font-medium">{errors.creditLimit}</p>}
            </div>
          </div>

          {/* Mobile */}
          <div className="space-y-1.5">
            <Label htmlFor="mobile" className="text-xs font-bold text-slate-600 uppercase">Mobile Number (Optional)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="mobile"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                placeholder="+91 98765 43210"
                className="pl-9 h-11"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold text-slate-600 uppercase">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className={cn("pl-9 pr-10 h-11", errors.password && "border-red-500")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Strength Indicator */}
            <div className="flex gap-1.5 mt-2">
              {[1, 2, 3, 4].map((step) => (
                <div 
                  key={step} 
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    strength >= step 
                      ? (strength <= 2 ? "bg-amber-500" : strength === 3 ? "bg-sky-500" : "bg-emerald-500")
                      : "bg-slate-200"
                  )}
                />
              ))}
            </div>
            {errors.password && <p className="text-[11px] text-red-500 font-medium">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-600 uppercase">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className={cn("pl-9 pr-10 h-11", errors.confirmPassword && "border-red-500")}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
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
            {errors.confirmPassword && <p className="text-[11px] text-red-500 font-medium">{errors.confirmPassword}</p>}
          </div>

          {/* Summary Strip */}
          {isValid && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-md p-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-emerald-800 font-medium">
                Creating <span className="font-bold">{formData.username}</span> as <span className="font-bold">{formData.role}</span> with credit limit <span className="font-bold">₹{Number(formData.creditLimit).toLocaleString()}</span>
              </p>
            </div>
          )}
        </form>

        <DialogFooter className="bg-slate-50 p-5 border-t gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} className="h-10 px-6 font-bold">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-8 font-bold shadow-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
