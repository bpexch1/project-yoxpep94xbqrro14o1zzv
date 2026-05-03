import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getClientSession } from "@/hooks/useClientAuth";

const MARKET_TYPES = [
  { id: 'casino', label: 'All Casino', items: ['SuperBets Studio', 'Royal Casino', 'BetFair Games', 'Star Casino', 'Galaxy Casino', 'Sports Book', 'Super Nova'] },
  { id: 'cricket', label: 'Cricket', items: ['Square', 'Fancy', 'Match Odds', 'Even / Odd', 'Toss', 'Cup Winner'] },
  { id: 'greyhound', label: 'Greyhound', items: ['Australia', 'British', 'New Zealand'] },
  { id: 'horserace', label: 'Horse Race', items: ['Dubai', 'Australia', 'Bahrain', 'France', 'Zealand', 'England', 'England (PLACE)', 'Ireland', 'Ireland (PLACE)', 'New Zealand', 'Sundries', 'Singapore', 'America', 'Africa'] },
  { id: 'soccer', label: 'Soccer', items: ['Match Odds', 'Over/Under Goals'] },
  { id: 'tennis', label: 'Tennis', items: ['Match Odds'] },
];

export default function BetLock() {
  const { toast } = useToast();
  const session = getClientSession();
  const username = session?.username || 'Book7801';
  
  const [settings, setSettings] = useState<Record<string, Record<string, boolean>>>(() => {
    const saved = localStorage.getItem('betlock_settings');
    if (saved) return JSON.parse(saved);
    
    // Default: All checked
    const defaults: Record<string, Record<string, boolean>> = {};
    MARKET_TYPES.forEach(cat => {
      defaults[cat.id] = {};
      cat.items.forEach(item => {
        defaults[cat.id][item] = true;
      });
    });
    return defaults;
  });

  const handleCategoryToggle = (catId: string, label: string) => {
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

  const handleSave = () => {
    localStorage.setItem('betlock_settings', JSON.stringify(settings));
    toast({
      title: "Settings saved successfully",
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-[#e8e8e8]" style={{ fontFamily: "Roboto, sans-serif" }}>
      <div style={{ padding: "10px 5px" }}>
        <p style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px", color: "#2d2d2d" }}>
          Allowed Market Types ({username})
        </p>
        
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
                        type="checkbox"
                        checked={catChecked}
                        ref={el => el && (el.indeterminate = someChecked)}
                        onChange={() => handleCategoryToggle(cat.id, cat.label)}
                        style={{ accentColor: "#00b181", width: "14px", height: "14px" }}
                      />
                      {cat.label}
                    </label>
                  </div>
                  
                  <div style={{ padding: "10px 16px", paddingLeft: "40px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {cat.items.map(item => (
                      <label key={item} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#212529" }}>
                        <input
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
              onClick={handleSave}
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
