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

// Initialize custom app colors from localStorage
initializeAppColors();

// Pre-load all D1-backed content caches before first render
Promise.all([
  loadPlatformUpdates(),
  loadEditorsPicks(),
  loadControlCentreSettings(),
  loadFooterConfig(),
  loadGuidesData(),
  loadDailyFlowData(),
]).finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
