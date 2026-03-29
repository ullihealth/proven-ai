import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getProfile, saveProfile, clearProfile, type UserProfile } from "../../utils/promptGeneratorProfile";

interface AboutMePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_PROFILE: UserProfile = {
  ageRange: "",
  location: "",
  workRole: "",
  employmentStatus: "",
  industry: "",
  mainGoal: "",
  aiExperience: "",
};

const inputStyle: React.CSSProperties = {
  backgroundColor: "#0d1117",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#c9d1d9",
  borderRadius: "8px",
  padding: "10px 16px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "rgba(201,209,217,0.7)",
  marginBottom: "6px",
};

const AboutMePanel = ({ isOpen, onClose }: AboutMePanelProps) => {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);

  useEffect(() => {
    if (isOpen) {
      setProfile(getProfile() ?? EMPTY_PROFILE);
    }
  }, [isOpen]);

  const update = (field: keyof UserProfile, value: string) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    saveProfile(updated);
  };

  const handleClear = () => {
    clearProfile();
    setProfile(EMPTY_PROFILE);
  };

  const focusCyan = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#00bcd4";
  };
  const blurReset = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(13,17,23,0.6)",
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "380px",
          maxWidth: "100vw",
          backgroundColor: "#1c2128",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          zIndex: 50,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ color: "#c9d1d9", fontWeight: 600, fontSize: "16px", margin: 0 }}>
              About Me
            </h2>
            <p style={{ color: "rgba(201,209,217,0.5)", fontSize: "12px", lineHeight: "1.5", margin: "6px 0 0" }}>
              Your details are saved in your browser only and never stored on our servers. They are sent to the AI when your profile toggle is enabled.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ color: "rgba(201,209,217,0.5)", background: "none", border: "none", cursor: "pointer", padding: "4px", flexShrink: 0 }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>

          {/* Age range */}
          <div>
            <label style={labelStyle}>Age range</label>
            <select
              value={profile.ageRange}
              onChange={(e) => update("ageRange", e.target.value)}
              onFocus={focusCyan}
              onBlur={blurReset}
              style={{ ...inputStyle, appearance: "none" }}
            >
              <option value="">Prefer not to say</option>
              <option value="40-44">40–44</option>
              <option value="45-49">45–49</option>
              <option value="50-54">50–54</option>
              <option value="55-59">55–59</option>
              <option value="60-64">60–64</option>
              <option value="65+">65+</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>Location</label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. Manchester, UK"
              style={inputStyle}
              onFocus={focusCyan}
              onBlur={blurReset}
            />
          </div>

          {/* Work role */}
          <div>
            <label style={labelStyle}>Current or recent work role</label>
            <input
              type="text"
              value={profile.workRole}
              onChange={(e) => update("workRole", e.target.value)}
              placeholder="e.g. Sales Manager, Teacher, Nurse"
              style={inputStyle}
              onFocus={focusCyan}
              onBlur={blurReset}
            />
          </div>

          {/* Employment status */}
          <div>
            <label style={labelStyle}>Employment status</label>
            <select
              value={profile.employmentStatus}
              onChange={(e) => update("employmentStatus", e.target.value)}
              onFocus={focusCyan}
              onBlur={blurReset}
              style={{ ...inputStyle, appearance: "none" }}
            >
              <option value="">Select…</option>
              <option value="Employed">Employed</option>
              <option value="Self-employed">Self-employed</option>
              <option value="Career change">Career change</option>
              <option value="Semi-retired">Semi-retired</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          {/* Industry */}
          <div>
            <label style={labelStyle}>Industry</label>
            <input
              type="text"
              value={profile.industry}
              onChange={(e) => update("industry", e.target.value)}
              placeholder="e.g. Healthcare, Finance, Education"
              style={inputStyle}
              onFocus={focusCyan}
              onBlur={blurReset}
            />
          </div>

          {/* Main goal */}
          <div>
            <label style={labelStyle}>Main goal right now</label>
            <input
              type="text"
              value={profile.mainGoal}
              onChange={(e) => update("mainGoal", e.target.value)}
              placeholder="e.g. Starting a side business, updating my CV, learning AI tools"
              style={inputStyle}
              onFocus={focusCyan}
              onBlur={blurReset}
            />
          </div>

          {/* AI experience */}
          <div>
            <label style={labelStyle}>AI experience level</label>
            <select
              value={profile.aiExperience}
              onChange={(e) => update("aiExperience", e.target.value)}
              onFocus={focusCyan}
              onBlur={blurReset}
              style={{ ...inputStyle, appearance: "none" }}
            >
              <option value="">Select…</option>
              <option value="Complete beginner">Complete beginner</option>
              <option value="Some experience">Some experience</option>
              <option value="Confident user">Confident user</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleClear}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(201,209,217,0.4)", fontSize: "12px", padding: 0 }}
          >
            Clear profile
          </button>
        </div>
      </div>
    </>
  );
};

export default AboutMePanel;
