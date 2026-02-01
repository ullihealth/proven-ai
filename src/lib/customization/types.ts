export interface AppColorSettings {
  sidebarBackground: string;
  sidebarBorder: string;
  headerBackground: string;
  headerBorder: string;
}

export interface AppColorPreset {
  id: string;
  name: string;
  settings: AppColorSettings;
  createdAt: number;
}

export const DEFAULT_APP_COLORS: AppColorSettings = {
  sidebarBackground: "222 47% 11%",
  sidebarBorder: "222 40% 18%",
  headerBackground: "222 47% 11%",
  headerBorder: "222 40% 18%",
};

export const BUILT_IN_PRESETS: AppColorPreset[] = [
  {
    id: "default",
    name: "Default (Graphite Blue)",
    settings: DEFAULT_APP_COLORS,
    createdAt: 0,
  },
  {
    id: "midnight",
    name: "Midnight",
    settings: {
      sidebarBackground: "230 35% 8%",
      sidebarBorder: "230 30% 15%",
      headerBackground: "230 35% 8%",
      headerBorder: "230 30% 15%",
    },
    createdAt: 0,
  },
  {
    id: "slate",
    name: "Slate",
    settings: {
      sidebarBackground: "215 28% 17%",
      sidebarBorder: "215 25% 25%",
      headerBackground: "215 28% 17%",
      headerBorder: "215 25% 25%",
    },
    createdAt: 0,
  },
  {
    id: "charcoal",
    name: "Charcoal",
    settings: {
      sidebarBackground: "0 0% 12%",
      sidebarBorder: "0 0% 20%",
      headerBackground: "0 0% 12%",
      headerBorder: "0 0% 20%",
    },
    createdAt: 0,
  },
  {
    id: "ocean",
    name: "Ocean Deep",
    settings: {
      sidebarBackground: "200 50% 10%",
      sidebarBorder: "200 45% 18%",
      headerBackground: "200 50% 10%",
      headerBorder: "200 45% 18%",
    },
    createdAt: 0,
  },
];
