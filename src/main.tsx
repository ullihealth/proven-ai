import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeAppColors } from "./lib/customization";
import { loadPlatformUpdates } from "./lib/platformUpdates/platformUpdatesStore";
import { loadEditorsPicks } from "./lib/editorsPicks/editorsPicksStore";
import { loadControlCentreSettings } from "./lib/controlCentre/controlCentreStore";
import { loadFooterConfig } from "./lib/footer/footerStore";
import { loadGuidesData } from "./lib/guides/guidesStore";
import { loadDailyFlowData } from "./lib/dailyflow/dailyFlowStore";
import { loadGuideCardSettings } from "./lib/guides/guideCardCustomization";
import { loadToolCardSettings } from "./lib/tools/toolCardCustomization";
import { loadToolTrustOverrides } from "./lib/tools/toolsStore";
import { loadCoursePresets } from "./lib/courses/coursesStore";
import { loadUserPreferences } from "./lib/storage/userPreferencesStore";

// Pre-load all D1-backed content caches before first render
Promise.all([
  // Admin visual config
  initializeAppColors(),
  loadPlatformUpdates(),
  loadEditorsPicks(),
  loadControlCentreSettings(),
  loadFooterConfig(),
  loadGuidesData(),
  loadDailyFlowData(),
  loadGuideCardSettings(),
  loadToolCardSettings(),
  loadToolTrustOverrides(),
  loadCoursePresets(),
  // Per-user preferences (returns empty if not logged in)
  loadUserPreferences(),
]).finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
