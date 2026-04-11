import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Client } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type UserType = "" | "superadmin" | "admin" | "supermaster" | "master" | "bettor";

export default function CreateUser() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState<UserType>("");
  const [isActive, setIsActive] = useState(false);
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!username) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!type) newErrors.type = "User type is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Mapping type to role
      const roleMap: Record<string, string> = {
        superadmin: "superadmin",
        admin: "admin",
        supermaster: "supermaster",
        master: "master",
        bettor: "client",
      };

      await Client.create({
        username,
        role: roleMap[type as string],
        credit_received: 0,
        credit_remaining: 0,
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        status: isActive ? "active" : "inactive",
        parent_username: "NomanSA8592",
        phone,
        reference,
        notes,
      });

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "User Created",
        description: `User ${username} has been created successfully.`,
      });
      navigate("/accounts");
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create user. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#26A69A] bg-white w-full transition-colors";
  const labelClasses = "block text-sm text-gray-800 mb-1.5 font-medium";

  return (
    <div className="min-h-screen bg-[#ECEFF1] pb-10">
      <Header />
      
      <main className="max-w-[480px] mx-auto px-4 py-6">
        <div className="bg-white rounded-sm shadow-sm border border-[#E0E0E0] overflow-hidden">
          
          {/* Header */}
          <div className="px-5 py-3 border-b border-[#E0E0E0]">
            <h1 className="text-base font-bold text-black">Create New User</h1>
          </div>

          {/* Form */}
          <div className="p-5 space-y-4">
            
            {/* Username */}
            <div>
              <label className={labelClasses}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClasses}
              />
              {errors.username && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.username}</p>}
            </div>

            {/* Password */}
            <div>
              <label className={labelClasses}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClasses}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.password}</p>}
            </div>

            {/* Type */}
            <div>
              <label className={labelClasses}>Type</label>
              {type && (
                <p className="text-sm font-semibold text-[#26A69A] mb-1">
                  {type === 'superadmin' ? 'Superadmin'
                    : type === 'admin' ? 'Admin'
                    : type === 'supermaster' ? 'Super Master'
                    : type === 'master' ? 'Master'
                    : type === 'bettor' ? 'Bettor'
                    : ''}
                </p>
              )}
              <select
                value={type}
                onChange={(e) => setType(e.target.value as UserType)}
                className={inputClasses}
              >
                <option value="">--Type--</option>
                <option value="superadmin">Superadmin</option>
                <option value="admin">Admin</option>
                <option value="supermaster">Super Master</option>
                <option value="master">Master</option>
                <option value="bettor">Bettor</option>
              </select>
              {errors.type && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.type}</p>}
            </div>

            {/* IsActive */}
            <div>
              <label className={labelClasses}>IsActive</label>
              <div className="mt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 accent-[#43A047] cursor-pointer"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={labelClasses}>Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClasses}
              />
            </div>

            {/* Reference */}
            <div>
              <label className={labelClasses}>Reference</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className={inputClasses}
              />
            </div>

            {/* Notes */}
            <div>
              <label className={labelClasses}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className={inputClasses}
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-[#43A047] hover:bg-[#388E3C] text-white font-bold py-3 rounded text-sm transition-colors shadow-sm disabled:opacity-70 active:scale-[0.98]"
              >
                {isSubmitting ? "Submitting..." : "Submit User"}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
