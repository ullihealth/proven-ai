import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeAppColors } from "./lib/customization";

// Initialize custom app colors from localStorage
initializeAppColors();

createRoot(document.getElementById("root")!).render(<App />);
