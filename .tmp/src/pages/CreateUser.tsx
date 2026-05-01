import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Client } from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getClientSession } from "@/hooks/useClientAuth";

function getCreatableRole(sessionRole: string): { label: string; role: string } {
  const r = sessionRole?.toLowerCase();
  if (r === 'company') return { label: 'SuperAdmin', role: 'superadmin' };
  if (r === 'superadmin') return { label: 'Admin', role: 'admin' };
  if (r === 'admin') return { label: 'SuperMaster', role: 'supermaster' };
  if (r === 'supermaster') return { label: 'Agent', role: 'agent' };
  return { label: 'Client', role: 'client' }; 
}

export default function CreateUser() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const session = getClientSession();
  const username = session?.username || 'Admin';
  const creatableRole = getCreatableRole(session?.role || '');

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    type: "admin_type" as "admin_type" | "bettor",
    downlineShare: 85,
    isActive: false,
    phone: "",
    reference: "",
    notes: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rowStyle: React.CSSProperties = { display: "flex", alignItems: "flex-start", marginBottom: "12px" };
  const labelStyle: React.CSSProperties = { width: "180px", fontSize: "13px", paddingTop: "6px", color: "#212529" };
  const inputStyle: React.CSSProperties = { flex: 1, border: "1px solid #ccc", borderRadius: "3px", padding: "5px 8px", fontSize: "13px", outline: "none", backgroundColor: "#fff" };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Min 6 characters";
    if (formData.downlineShare < 0 || formData.downlineShare > 85)
      newErrors.downlineShare = "Must be between 0 and 85";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await Client.create({
        username: formData.username,
        role: formData.type === "admin_type" ? creatableRole.role : "client",
        credit_received: 0,
        credit_remaining: 0,
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        status: formData.isActive ? "active" : "inactive",
        parent_username: username,
        phone: formData.phone,
        downline_share: formData.downlineShare,
        reference: formData.reference,
        notes: formData.notes,
      });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "User Created", description: `${formData.username} created successfully.` });
      navigate("/accounts");
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to create user." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen" style={{ fontFamily: "Roboto, sans-serif", width: "100%", padding: "16px 16px 80px" }}>
      <h1 style={{ fontWeight: 700, fontSize: "14px", marginBottom: "20px", color: "#212529" }}>
        Create New User under <strong>{username}</strong>
      </h1>

      <div style={{ maxWidth: "100%" }}>
        {/* Username */}
        <div style={rowStyle}>
          <div style={labelStyle}>Username</div>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              style={inputStyle}
            />
            {errors.username && <p style={{ fontSize: "11px", color: "#dc3545", marginTop: "2px" }}>{errors.username}</p>}
          </div>
        </div>

        {/* Password */}
        <div style={rowStyle}>
          <div style={labelStyle}>Password</div>
          <div style={{ flex: 1 }}>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={inputStyle}
            />
            {errors.password && <p style={{ fontSize: "11px", color: "#dc3545", marginTop: "2px" }}>{errors.password}</p>}
          </div>
        </div>

        {/* Type */}
        <div style={rowStyle}>
          <div style={labelStyle}>Type</div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "20px", paddingTop: "4px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input
                type="radio"
                name="type"
                checked={formData.type === "admin_type"}
                onChange={() => setFormData({ ...formData, type: "admin_type" })}
                style={{ accentColor: "#00b181" }}
              />
              {creatableRole.label}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input
                type="radio"
                name="type"
                checked={formData.type === "bettor"}
                onChange={() => setFormData({ ...formData, type: "bettor" })}
                style={{ accentColor: "#00b181" }}
              />
              Bettor
            </label>
          </div>
        </div>

        {/* Downline Share */}
        <div style={rowStyle}>
          <div style={labelStyle}>Downline Share</div>
          <div style={{ flex: 1 }}>
            <input
              type="number"
              value={formData.downlineShare}
              onChange={(e) => setFormData({ ...formData, downlineShare: Number(e.target.value) })}
              style={{ ...inputStyle, width: "80px", flex: "none" }}
            />
            <p style={{ fontSize: "13px", color: "#6c757d", marginTop: "4px" }}>Max allowed downline share is 0 - 85</p>
            {errors.downlineShare && <p style={{ fontSize: "11px", color: "#dc3545", marginTop: "2px" }}>{errors.downlineShare}</p>}
          </div>
        </div>

        {/* IsActive */}
        <div style={rowStyle}>
          <div style={labelStyle}>IsActive</div>
          <div style={{ flex: 1, paddingTop: "4px" }}>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ accentColor: "#00b181", width: "16px", height: "16px" }}
            />
          </div>
        </div>

        {/* Phone */}
        <div style={rowStyle}>
          <div style={labelStyle}>Phone</div>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Reference */}
        <div style={rowStyle}>
          <div style={labelStyle}>Reference</div>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Notes */}
        <div style={rowStyle}>
          <div style={labelStyle}>Notes</div>
          <div style={{ flex: 1 }}>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ ...inputStyle, height: "80px", resize: "none" }}
            />
          </div>
        </div>

        {/* Submit */}
        <div style={rowStyle}>
          <div style={labelStyle}></div>
          <div style={{ flex: 1 }}>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                backgroundColor: "#00b181",
                color: "#fff",
                border: "none",
                borderRadius: "3px",
                padding: "5px 16px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
