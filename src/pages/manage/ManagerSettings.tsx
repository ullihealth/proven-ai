import { useState, useEffect } from "react";
import { Key, Save, CheckCircle2 } from "lucide-react";

export default function ManagerSettings() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem("provenai_anthropic_key") || "");
  }, []);

  const handleSave = () => {
    localStorage.setItem("provenai_anthropic_key", apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-mono text-[#c9d1d9]">Settings</h1>
        <p className="text-sm text-[#8b949e] mt-1">Configure your ProvenAI Manager</p>
      </div>

      {/* API Key */}
      <div className="bg-[#1c2128] rounded-lg border border-[#30363d] p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5 text-[#e91e8c]" />
          <h2 className="text-lg font-semibold font-mono text-[#c9d1d9]">Anthropic API Key</h2>
        </div>
        <p className="text-sm text-[#8b949e]">
          Required for the AI Assistant. Get your key from{" "}
          <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-[#00bcd4] hover:underline">
            console.anthropic.com
          </a>
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-api..."
          className="w-full px-4 py-3 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9] placeholder-[#8b949e] focus:border-[#00bcd4] focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#00bcd4] text-[#0d1117] text-sm font-semibold hover:bg-[#00bcd4]/90">
            <Save className="h-4 w-4" />
            Save
          </button>
          {saved && (
            <span className="text-sm text-[#3fb950] flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
