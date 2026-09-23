import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Client } from "@/entities";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { getClientSession } from "@/hooks/useClientAuth";
import { verifyInHierarchy } from "@/lib/hierarchyCheck";

export default function EditClientPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const session = getClientSession();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingMaxBets, setIsSubmittingMaxBets] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) {
      navigate("/login");
      return;
    }

    async function checkAuthorization() {
      if (!username) {
        setIsAuthorized(false);
        navigate("/accounts", { replace: true });
        return;
      }

      const authorized = await verifyInHierarchy(username, session!.username, session!.role);
      if (!authorized) {
        setIsAuthorized(false);
        navigate("/accounts", { replace: true });
      } else {
        setIsAuthorized(true);
      }
    }

    checkAuthorization();
  }, [session, navigate, username]);

  const { data: clients, isLoading: isFetching } = useQuery({
    queryKey: ["client", username],
    queryFn: () => Client.filter({ username }),
    enabled: !!username && isAuthorized === true,
  });

  const client = clients?.[0];

  const [formData, setFormData] = useState({
    password: "",
    isActive: true,
    bettingAllowed: true,
    canSettlePL: false,
    phone: "",
    notes: "",
    commission: "2.00",
  });

  const [maxBets, setMaxBets] = useState({
    soccer: "1000000.00",
    tennis: "250000.00",
    cricket: "5000000.00",
    fancy: "200000.00",
    races: "200000.00",
    casino: "50000.00",
    greyhound: "50000.00",
    bookmaker: "2000000.00",
    tPin: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        password: "",
        isActive: client.status === "active",
        bettingAllowed: client.betting_allowed !== false,
        canSettlePL: client.can_settle_pl === true,
        phone: client.phone || "",
        notes: client.notes || "",
        commission: (client.commission ?? 2.00).toString(),
      });
      if (client.max_bets) {
        setMaxBets((prev) => ({
          ...prev,
          ...client.max_bets,
        }));
      }
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setIsSubmitting(true);
    try {
      const commission = parseFloat(formData.commission);

      const updateData: any = {
        status: formData.isActive ? "active" : "inactive",
        betting_allowed: formData.bettingAllowed,
        can_settle_pl: formData.canSettlePL,
        phone: formData.phone || "",
        notes: formData.notes || "",
      };

      if (!isNaN(commission) && commission >= 0) {
        updateData.commission = commission;
      }

      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password.trim();
      }

      await Client.update(client.id, updateData);

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", username] });
      
      toast({ title: "Updated", description: "User details updated successfully." });
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error?.message || "An error occurred while saving changes.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaxBetsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setIsSubmittingMaxBets(true);
    try {
      await Client.update(client.id, {
        max_bets: maxBets,
      });

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", username] });

      toast({ title: "Success", description: "Max bet sizes saved successfully." });
    } catch (error: any) {
      console.error("Error saving max bets:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error?.message || "Could not update max bet sizes.",
      });
    } finally {
      setIsSubmittingMaxBets(false);
    }
  };

  if (isAuthorized === null || isFetching) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 32, height: 32, animation: "spin 1s linear infinite", color: "#00a65a" }} />
      </div>
    );
  }

  if (isAuthorized === false) return null;

  if (!client) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f0f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#212529", marginBottom: 12 }}>Client not found</h1>
        <button onClick={() => navigate("/accounts")} style={{ background: "#fff", border: "1px solid #ccc", padding: "6px 16px", borderRadius: 3, fontWeight: 600, cursor: "pointer" }}>
          Go Back
        </button>
      </div>
    );
  }

  const roleLabel = client.role === "client" || !client.role ? "Bettor" : (client.role.charAt(0).toUpperCase() + client.role.slice(1));
  const numericId = client.id?.replace?.(/\D/g, "")?.slice?.(0, 7) || "8703594";

  return (
    <div style={{ minHeight: "100vh", background: "#ececed", fontFamily: '"Roboto Condensed", HelveticaNeue, Helvetica, Arial, sans-serif', fontSize: "1rem", color: "#212529", paddingBottom: 40 }}>
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "8px 8px" }}>
        
        {/* Top Tab Bar & Large Username on Right */}
        <div style={{ background: "#ffffff", border: "1px solid #dee2e6", borderRadius: 4, padding: "10px 12px", marginBottom: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            <button
              type="button"
              style={{
                background: "#00b181",
                color: "#ffffff",
                border: "1px solid #00b181",
                borderRadius: 3,
                padding: "5px 12px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Edit User
            </button>
            <button
              type="button"
              onClick={() => navigate(`/accounts/ledger/${username}`)}
              style={{
                background: "#ffffff",
                color: "#00b181",
                border: "1px solid #00b181",
                borderRadius: 3,
                padding: "5px 12px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Ledger
            </button>
            <button
              type="button"
              onClick={() => navigate(`/reports/book-detail`)}
              style={{
                background: "#ffffff",
                color: "#00b181",
                border: "1px solid #00b181",
                borderRadius: 3,
                padding: "5px 12px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Bets
            </button>
            <button
              type="button"
              onClick={() => navigate(`/reports/daily-pl`)}
              style={{
                background: "#ffffff",
                color: "#00b181",
                border: "1px solid #00b181",
                borderRadius: 3,
                padding: "5px 12px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Profit Loss
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              type="button"
              onClick={() => navigate(`/current-position`)}
              style={{
                background: "#ffffff",
                color: "#00b181",
                border: "1px solid #00b181",
                borderRadius: 3,
                padding: "5px 12px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Current Position
            </button>

            <span style={{ fontSize: 20, fontWeight: 800, color: "#212529" }}>
              {client.username}
            </span>
          </div>
        </div>

        {/* 1. EDIT CLIENT FORM CARD */}
        <div style={{ background: "#ffffff", border: "1px solid #dee2e6", borderRadius: 4, overflow: "hidden", marginBottom: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ background: "#254465", borderBottom: "1px solid #1e3650", padding: "8px 14px", fontSize: 13.5, color: "#ffffff", fontWeight: 700 }}>
            Edit Client - <strong style={{ color: "#ffffff" }}>{client.username}</strong>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13.5 }}>
              
              {/* ID */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500 }}>ID</div>
                <div style={{ color: "#111827", fontWeight: 600 }}>{numericId}</div>
              </div>

              {/* Username */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500 }}>Username</div>
                <div style={{ color: "#111827", fontWeight: 600 }}>{client.username}</div>
              </div>

              {/* Type */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500 }}>Type</div>
                <div style={{ color: "#111827", fontWeight: 600 }}>{roleLabel}</div>
              </div>

              {/* Currency */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500 }}>Currency</div>
                <div style={{ color: "#111827", fontWeight: 600 }}>Rs.</div>
              </div>

              {/* Password */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500 }}>Password</div>
                <div style={{ flex: 1 }}>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{
                      width: "100%",
                      maxWidth: 240,
                      border: "1px solid #cbd5e1",
                      borderRadius: 3,
                      padding: "5px 8px",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* IsActive */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500 }}>IsActive</div>
                <div>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: "#0088cc", cursor: "pointer" }}
                  />
                </div>
              </div>

              {/* Betting Allowed */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500, lineHeight: 1.2 }}>Betting<br />Allowed</div>
                <div>
                  <input
                    type="checkbox"
                    checked={formData.bettingAllowed}
                    onChange={(e) => setFormData({ ...formData, bettingAllowed: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: "#0088cc", cursor: "pointer" }}
                  />
                </div>
              </div>

              {/* Can Settle PL */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500, lineHeight: 1.2 }}>Can Settle<br />PL</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    id="enableS"
                    checked={formData.canSettlePL}
                    onChange={(e) => setFormData({ ...formData, canSettlePL: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: "#0088cc", cursor: "pointer" }}
                  />
                  <label htmlFor="enableS" style={{ fontSize: 13, color: "#374151", cursor: "pointer" }}>
                    Enable S button
                  </label>
                </div>
              </div>

              {/* Phone */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500 }}>Phone</div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: "100%",
                      maxWidth: 240,
                      border: "1px solid #cbd5e1",
                      borderRadius: 3,
                      padding: "5px 8px",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500, paddingTop: 4 }}>Notes</div>
                <div style={{ flex: 1 }}>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: "100%",
                      maxWidth: 240,
                      border: "1px solid #cbd5e1",
                      borderRadius: 3,
                      padding: "5px 8px",
                      fontSize: 13,
                      outline: "none",
                      resize: "none"
                    }}
                  />
                </div>
              </div>

              {/* Commission */}
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500, paddingTop: 4, lineHeight: 1.2 }}>Commissio<br />n</div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                    style={{
                      width: "100%",
                      maxWidth: 240,
                      border: "1px solid #cbd5e1",
                      borderRadius: 3,
                      padding: "5px 8px",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                  <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 3 }}>
                    Min commission is 2.00 %
                  </div>
                </div>
              </div>

              {/* UserDomain */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500, lineHeight: 1.2 }}>UserDomai<br />n</div>
                <div style={{ color: "#374151", fontSize: 13 }}>1 ( betproexch.com )</div>
              </div>

            </div>

            {/* Submit Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: "#00a65a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 3,
                  padding: "7px 22px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>

        {/* 2. MAX BET SIZES CARD */}
        <div style={{ background: "#ffffff", border: "1px solid #d5d8dc", borderRadius: 4, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ background: "#f8f9fa", borderBottom: "1px solid #e5e7eb", padding: "8px 14px", fontSize: 13.5, fontWeight: 700, color: "#374151" }}>
            Max Bet Sizes
          </div>

          <form onSubmit={handleMaxBetsSubmit} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13.5 }}>
              
              {/* Soccer */}
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500, paddingTop: 4 }}>Soccer</div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={maxBets.soccer}
                    onChange={(e) => setMaxBets({ ...maxBets, soccer: e.target.value })}
                    style={{ width: "100%", maxWidth: 240, border: "1px solid #cbd5e1", borderRadius: 3, padding: "5px 8px", fontSize: 13, outline: "none" }}
                  />
                  <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>Max: 1,000,000</div>
                </div>
              </div>

              {/* Tennis */}
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500, paddingTop: 4 }}>Tennis</div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={maxBets.tennis}
                    onChange={(e) => setMaxBets({ ...maxBets, tennis: e.target.value })}
                    style={{ width: "100%", maxWidth: 240, border: "1px solid #cbd5e1", borderRadius: 3, padding: "5px 8px", fontSize: 13, outline: "none" }}
                  />
                  <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>Max: 250,000</div>
                </div>
              </div>

              {/* Cricket */}
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500, paddingTop: 4 }}>Cricket</div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={maxBets.cricket}
                    onChange={(e) => setMaxBets({ ...maxBets, cricket: e.target.value })}
                    style={{ width: "100%", maxWidth: 240, border: "1px solid #cbd5e1", borderRadius: 3, padding: "5px 8px", fontSize: 13, outline: "none" }}
                  />
                  <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>Max: 5,000,000</div>
                </div>
              </div>

              {/* Fancy */}
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500, paddingTop: 4 }}>Fancy</div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={maxBets.fancy}
                    onChange={(e) => setMaxBets({ ...maxBets, fancy: e.target.value })}
                    style={{ width: "100%", maxWidth: 240, border: "1px solid #cbd5e1", borderRadius: 3, padding: "5px 8px", fontSize: 13, outline: "none" }}
                  />
                  <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>Max: 200,000</div>
                </div>
              </div>

              {/* Races */}
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500, paddingTop: 4 }}>Races</div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={maxBets.races}
                    onChange={(e) => setMaxBets({ ...maxBets, races: e.target.value })}
                    style={{ width: "100%", maxWidth: 240, border: "1px solid #cbd5e1", borderRadius: 3, padding: "5px 8px", fontSize: 13, outline: "none" }}
                  />
                  <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>Max: 200,000</div>
                </div>
              </div>

              {/* Casino */}
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500, paddingTop: 4 }}>Casino</div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={maxBets.casino}
                    onChange={(e) => setMaxBets({ ...maxBets, casino: e.target.value })}
                    style={{ width: "100%", maxWidth: 240, border: "1px solid #cbd5e1", borderRadius: 3, padding: "5px 8px", fontSize: 13, outline: "none" }}
                  />
                  <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>Max: 50,000</div>
                </div>
              </div>

              {/* Greyhound */}
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500, paddingTop: 4 }}>Greyhound</div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={maxBets.greyhound}
                    onChange={(e) => setMaxBets({ ...maxBets, greyhound: e.target.value })}
                    style={{ width: "100%", maxWidth: 240, border: "1px solid #cbd5e1", borderRadius: 3, padding: "5px 8px", fontSize: 13, outline: "none" }}
                  />
                  <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>Max: 50,000</div>
                </div>
              </div>

              {/* BookMaker */}
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500, paddingTop: 4 }}>BookMaker</div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={maxBets.bookmaker}
                    onChange={(e) => setMaxBets({ ...maxBets, bookmaker: e.target.value })}
                    style={{ width: "100%", maxWidth: 240, border: "1px solid #cbd5e1", borderRadius: 3, padding: "5px 8px", fontSize: 13, outline: "none" }}
                  />
                  <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>Max: 2,000,000</div>
                </div>
              </div>

              {/* T-PIN */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 110, color: "#374151", fontWeight: 500 }}>T-PIN</div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={maxBets.tPin}
                    onChange={(e) => setMaxBets({ ...maxBets, tPin: e.target.value })}
                    style={{ width: "100%", maxWidth: 240, border: "1px solid #cbd5e1", borderRadius: 3, padding: "5px 8px", fontSize: 13, outline: "none" }}
                  />
                </div>
              </div>

            </div>

            {/* Submit Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button
                type="submit"
                disabled={isSubmittingMaxBets}
                style={{
                  background: "#00a65a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 3,
                  padding: "7px 22px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isSubmittingMaxBets ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom marquee ticker */}
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>
          Welcome to Exchange.
        </div>

      </div>
    </div>
  );
}
