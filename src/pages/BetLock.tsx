import { useState } from "react";
import { readMarketRules, writeMarketRules } from "@/lib/adminAccountsApi";
import { useToast } from "@/hooks/use-toast";
import { getClientSession } from "@/hooks/useClientAuth";

const MARKET_TYPES = [
  { id: 'casino', label: 'All Casino', items: ['TeenPatti Studio', 'Royal Casino', 'BetFair Games', 'Star Casino', 'Galaxy Casino', 'Sports Book', 'Super Nowa'] },
  { id: 'cricket', label: 'Cricket', items: ['Figure', 'Fancy', 'Match Odds', 'Even / Odd', 'Toss', 'Cup Winner'] },
  { id: 'greyhound', label: 'Greyhound', items: ['Australia', 'British', 'New Zealand'] },
  { id: 'horserace', label: 'Horse Race', items: ['Dubai', 'Australia', 'Bahrain', 'France', 'England', 'England (PLACE)', 'Ireland', 'Ireland (PLACE)', 'New Zealand', 'Sweden', 'Singapore', 'America', 'Africa'] },
  { id: 'soccer', label: 'Soccer', items: ['Match Odds', 'Over/Under Goals'] },
  { id: 'tennis', label: 'Tennis', items: ['Match Odds'] },
];

export default function BetLock() {
  const { toast } = useToast();
  const session = getClientSession();
  const username = session?.username || '';
  const [operatorPassword, setOperatorPassword] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  
  const [settings, setSettings] = useState<Record<string, Record<string, boolean>>>(() => {
    
    // Default is allow; never claim a rule is active before a verified server read.
    const defaults: Record<string, Record<string, boolean>> = {};
    MARKET_TYPES.forEach(cat => {
      defaults[cat.id] = {};
      cat.items.forEach(item => {
        defaults[cat.id][item] = true;
      });
    });
    return defaults;
  });

  const handleCategoryToggle = (catId: string) => {
    const allChecked = MARKET_TYPES.find(c => c.id === catId)?.items.every(item => settings[catId]?.[item]);
    
    setSettings(prev => {
      const newCatSettings = { ...prev[catId] };
      MARKET_TYPES.find(c => c.id === catId)?.items.forEach(item => {
        newCatSettings[item] = !allChecked;
      });
      return { ...prev, [catId]: newCatSettings };
    });
  };

  const handleItemToggle = (catId: string, item: string) => {
    setSettings(prev => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        [item]: !prev[catId]?.[item]
      }
    }));
  };

  const handleLoad = async () => {
    if (!username || !operatorPassword) {
      setError("Enter your current account password.");
      return;
    }
    setBusy(true);
    setError("");
    setLoaded(false);
    try {
      const rules = await readMarketRules(username, operatorPassword);
      const next: Record<string, Record<string, boolean>> = {};
      MARKET_TYPES.forEach(cat => {
        next[cat.id] = {};
        cat.items.forEach(item => { next[cat.id][item] = true; });
      });
      for (const rule of rules) {
        if (rule.category in next && rule.market in next[rule.category] && typeof rule.allowed === "boolean") {
          next[rule.category][rule.market] = rule.allowed;
        }
      }
      setSettings(next);
      setLoaded(true);
      setOperatorPassword("");
      setSaved(false);
    } catch (e: any) {
      setError(e?.message || "Unable to load market permissions.");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!loaded || !username || !operatorPassword) {
      setError("Re-enter your current password before saving.");
      return;
    }
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const rules = MARKET_TYPES.flatMap(cat => cat.items.map(item => ({
        category: cat.id, market: item, allowed: !!settings[cat.id]?.[item],
      })));
      await writeMarketRules(username, operatorPassword, rules);
      setSaved(true);
      setOperatorPassword("");
      toast({ title: "Market settings saved", description: "Permission preferences were stored on the server." });
    } catch (e: any) {
      setError(e?.message || "Unable to save market permissions.");
      toast({ title: "Save failed", description: "Permissions were not changed.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="reference-betlock min-h-screen bg-[#e8e8e8]" style={{ fontFamily: "Roboto, sans-serif" }}>
      <div style={{ padding: "10px 5px" }}>
        <p style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px", color: "#2d2d2d" }}>
          Allowed Market Types ({username})
        </p>
        
        <div className="mb-3 max-w-[720px] rounded border border-[#dee2e6] bg-white p-3">
          <label htmlFor="market-admin-password" className="block text-[13px] font-semibold mb-1">Confirm Current Password</label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="market-admin-password"
              type="password"
              autoComplete="current-password"
              value={operatorPassword}
              onChange={e => setOperatorPassword(e.target.value)}
              className="min-w-0 flex-1 h-9 px-3 border border-[#ced4da] rounded"
              placeholder="Current account password"
            />
            <button
              type="button"
              onClick={() => void handleLoad()}
              disabled={busy || !operatorPassword}
              className="bg-[#00a65a] text-white px-4 h-9 rounded disabled:opacity-50"
            >{busy ? "Please wait..." : loaded ? "Reload" : "Load Permissions"}</button>
          </div>
          <p className="text-[12px] text-gray-600 mt-2">
            {loaded ? "Settings loaded. Select allowed markets, then re-enter password and Save." : "Verify your account to load saved market permissions."}
          </p>
          <p className="text-[12px] text-amber-900 mt-1">
            Market restrictions require enforcement by the trusted bet-placement service. Saving this form alone does not block wagers.
          </p>
          {error && <p role="alert" className="text-red-700 text-[13px] mt-2">{error}</p>}
          {saved && <p role="status" className="text-green-700 text-[13px] mt-2">Settings saved on server.</p>}
        </div>
        <div style={{ 
          background: "#fff", 
          border: "1px solid #c8c8c8", 
          borderRadius: "4px", 
          overflow: "hidden", 
          maxWidth: "720px" 
        }}>
          {MARKET_TYPES.map((cat, idx) => {
            const catChecked = cat.items.every(item => settings[cat.id]?.[item]);
            const someChecked = cat.items.some(item => settings[cat.id]?.[item]) && !catChecked;
            
            return (
              <div key={cat.id}>
                {idx > 0 && <div style={{ borderTop: "1px solid #eee" }} />}
                <div style={{ padding: "0" }}>
                  <div style={{ background: "#f8f9fa", padding: "10px 16px", borderBottom: "1px solid #dee2e6" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 700, fontSize: "14px", color: "#212529" }}>
                      <input
                          disabled={!loaded || busy}
                        type="checkbox"
                        checked={catChecked}
                        ref={el => el && (el.indeterminate = someChecked)}
                        onChange={() => handleCategoryToggle(cat.id)}
                        style={{ accentColor: "#00b181", width: "14px", height: "14px" }}
                      />
                      {cat.label}
                    </label>
                  </div>
                  
                  <div style={{ padding: "10px 16px", paddingLeft: "40px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {cat.items.map(item => (
                      <label key={item} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#212529" }}>
                        <input
                          disabled={!loaded || busy}
                          type="checkbox"
                          checked={settings[cat.id]?.[item] || false}
                          onChange={() => handleItemToggle(cat.id, item)}
                          style={{ accentColor: "#00b181", width: "14px", height: "14px" }}
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          
          <div style={{ padding: "16px", borderTop: "1px solid #eee" }}>
            <button
              disabled={!loaded || busy || !operatorPassword}
              onClick={() => void handleSave()}
              style={{
                backgroundColor: "#00b181",
                color: "#fff",
                border: "none",
                borderRadius: "3px",
                padding: "6px 16px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
