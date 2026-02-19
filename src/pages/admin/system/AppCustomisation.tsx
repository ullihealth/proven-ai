import { useState, useEffect } from "react";
import { Palette, Save, RotateCcw, Trash2 } from "lucide-react";
import { GovernanceHeader } from "@/components/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  AppColorSettings,
  DEFAULT_APP_COLORS,
  getAppColors,
  saveAppColors,
  getAllPresets,
  getCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
  applyColorsToDocument,
} from "@/lib/customization";

// Helper to convert HSL string to approximate hex for color picker
function hslToHex(hsl: string): string {
  const parts = hsl.split(" ").map((p) => parseFloat(p));
  if (parts.length !== 3) return "#1e293b";
  
  const h = parts[0];
  const s = parts[1] / 100;
  const l = parts[2] / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Helper to convert hex to HSL string
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "222 47% 11%";

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (hsl: string) => void;
}

const ColorPickerField = ({ label, value, onChange }: ColorPickerFieldProps) => {
  const hexValue = hslToHex(value);
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="w-12 h-10 rounded border border-border cursor-pointer"
        />
        <Input
          value={hexValue}
          onChange={(e) => {
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
              onChange(hexToHsl(e.target.value));
            }
          }}
          placeholder="#1e293b"
          className="font-mono text-sm w-28"
        />
        <span className="text-xs text-muted-foreground font-mono">{value}</span>
      </div>
    </div>
  );
};

const AppCustomisation = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppColorSettings>(DEFAULT_APP_COLORS);
  const [presets, setPresets] = useState(getAllPresets());
  const [newPresetName, setNewPresetName] = useState("");

  // Load saved settings on mount
  useEffect(() => {
    setSettings(getAppColors());
  }, []);

  // Apply colors in real-time as preview
  useEffect(() => {
    applyColorsToDocument(settings);
  }, [settings]);

  const handleSave = async () => {
    await saveAppColors(settings);
    toast({
      title: "Colors saved",
      description: "Your app colors have been updated.",
    });
  };

  const handleReset = async () => {
    setSettings(DEFAULT_APP_COLORS);
    await saveAppColors(DEFAULT_APP_COLORS);
    toast({
      title: "Colors reset",
      description: "App colors have been reset to defaults.",
    });
  };

  const handleApplyPreset = (preset: typeof presets[0]) => {
    setSettings(preset.settings);
    toast({
      title: "Preset applied",
      description: `Applied "${preset.name}" preset.`,
    });
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your preset.",
        variant: "destructive",
      });
      return;
    }
    await saveCustomPreset(newPresetName.trim(), settings);
    setPresets(getAllPresets());
    setNewPresetName("");
    toast({
      title: "Preset saved",
      description: `"${newPresetName}" has been saved.`,
    });
  };

  const handleDeletePreset = async (id: string) => {
    await deleteCustomPreset(id);
    setPresets(getAllPresets());
    toast({
      title: "Preset deleted",
      description: "Custom preset has been removed.",
    });
  };

  const customPresets = getCustomPresets();

  return (
    <div className="space-y-8">
      <GovernanceHeader title="App Customisation" showBackButton />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Color Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Settings
            </CardTitle>
            <CardDescription>
              Adjust the sidebar and header background colors. Changes preview in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Sidebar</h4>
              <ColorPickerField
                label="Background"
                value={settings.sidebarBackground}
                onChange={(v) => setSettings((s) => ({ ...s, sidebarBackground: v }))}
              />
              <ColorPickerField
                label="Border"
                value={settings.sidebarBorder}
                onChange={(v) => setSettings((s) => ({ ...s, sidebarBorder: v }))}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Header</h4>
              <ColorPickerField
                label="Background"
                value={settings.headerBackground}
                onChange={(v) => setSettings((s) => ({ ...s, headerBackground: v }))}
              />
              <ColorPickerField
                label="Border"
                value={settings.headerBorder}
                onChange={(v) => setSettings((s) => ({ ...s, headerBorder: v }))}
              />
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Colors
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Presets */}
        <Card>
          <CardHeader>
            <CardTitle>Presets</CardTitle>
            <CardDescription>
              Quick-apply color schemes or save your own custom presets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Built-in Presets */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Built-in Themes</h4>
              <div className="grid grid-cols-2 gap-2">
                {presets
                  .filter((p) => !p.id.startsWith("custom_"))
                  .map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset(preset)}
                      className="justify-start h-auto py-2"
                    >
                      <div
                        className="w-4 h-4 rounded mr-2 border"
                        style={{ backgroundColor: `hsl(${preset.settings.sidebarBackground})` }}
                      />
                      <span className="text-xs">{preset.name}</span>
                    </Button>
                  ))}
              </div>
            </div>

            <Separator />

            {/* Custom Presets */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Custom Presets</h4>
              {customPresets.length > 0 ? (
                <div className="space-y-2">
                  {customPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApplyPreset(preset)}
                        className="justify-start flex-1"
                      >
                        <div
                          className="w-4 h-4 rounded mr-2 border"
                          style={{ backgroundColor: `hsl(${preset.settings.sidebarBackground})` }}
                        />
                        <span className="text-xs">{preset.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePreset(preset.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No custom presets saved yet.</p>
              )}
            </div>

            <Separator />

            {/* Save New Preset */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Save Current as Preset</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Preset name..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSavePreset} size="sm">
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppCustomisation;
