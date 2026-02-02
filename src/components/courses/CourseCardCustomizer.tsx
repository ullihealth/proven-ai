import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw, Save, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getCourseCardSettings,
  saveCourseCardSettings,
  getAllCoursePresets,
  saveCustomCoursePreset,
  deleteCustomCoursePreset,
  hslToCss,
  shadowFromIntensity,
  SHADOW_DIRECTIONS,
  DEFAULT_COURSE_CARD_SETTINGS,
  type CourseCardSettings,
  type ShadowDirection,
  type CourseCardPreset,
} from "@/lib/courses/courseCardCustomization";
import { lifecycleStateLabels } from "@/lib/courses/types";

// HSL to Hex conversion for color picker
function hslToHex(hsl: string): string {
  const parts = hsl.split(" ");
  if (parts.length < 3) return "#888888";
  
  const h = parseFloat(parts[0]) || 0;
  const s = parseFloat(parts[1]) / 100 || 0;
  const l = parseFloat(parts[2].split("/")[0]) / 100 || 0;
  
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Hex to HSL conversion
function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
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

// Color picker component
function ColorPicker({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
}) {
  const hexValue = useMemo(() => hslToHex(value), [value]);
  
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="w-10 h-8 p-0.5 cursor-pointer"
        />
        <Input
          type="text"
          value={hexValue}
          onChange={(e) => {
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
              onChange(hexToHsl(e.target.value));
            }
          }}
          className="flex-1 h-8 text-xs font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

interface CourseCardCustomizerProps {
  onClose: () => void;
}

export function CourseCardCustomizer({ onClose }: CourseCardCustomizerProps) {
  const [settings, setSettings] = useState<CourseCardSettings>(getCourseCardSettings);
  const [presets, setPresets] = useState<CourseCardPreset[]>(getAllCoursePresets);
  const [newPresetName, setNewPresetName] = useState("");
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);

  const updateSetting = <K extends keyof CourseCardSettings>(
    key: K,
    value: CourseCardSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveCourseCardSettings(newSettings);
  };

  const handleReset = () => {
    setSettings(DEFAULT_COURSE_CARD_SETTINGS);
    saveCourseCardSettings(DEFAULT_COURSE_CARD_SETTINGS);
    toast.success("Reset to defaults");
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    saveCustomCoursePreset(newPresetName.trim(), settings);
    setPresets(getAllCoursePresets());
    setNewPresetName("");
    setShowSavePresetInput(false);
    toast.success("Preset saved");
  };

  const handleApplyPreset = (preset: CourseCardPreset) => {
    setSettings(preset.settings);
    saveCourseCardSettings(preset.settings);
    toast.success(`Applied "${preset.name}"`);
  };

  const handleDeletePreset = (id: string) => {
    if (id.startsWith("custom_")) {
      deleteCustomCoursePreset(id);
      setPresets(getAllCoursePresets());
      toast.success("Preset deleted");
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6 mt-4">
          {/* Page Background */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Page Background</h4>
            <ColorPicker
              label="Background Color"
              value={settings.pageBackground}
              onChange={(v) => updateSetting("pageBackground", v)}
            />
          </div>

          {/* Card Appearance */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Card Appearance</h4>
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker
                label="Background"
                value={settings.cardBackground}
                onChange={(v) => updateSetting("cardBackground", v)}
              />
              <ColorPicker
                label="Border"
                value={settings.cardBorder}
                onChange={(v) => updateSetting("cardBorder", v)}
              />
              <ColorPicker
                label="Hover Border"
                value={settings.cardHoverBorder}
                onChange={(v) => updateSetting("cardHoverBorder", v)}
              />
            </div>
          </div>

          {/* Shadow Controls */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Shadow</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Intensity</span>
                <span>{settings.cardShadow}%</span>
              </div>
              <Slider
                value={[settings.cardShadow]}
                onValueChange={([v]) => updateSetting("cardShadow", v)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Direction</Label>
              <Select
                value={String(settings.cardShadowDirection)}
                onValueChange={(v) => updateSetting("cardShadowDirection", Number(v) as ShadowDirection)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHADOW_DIRECTIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Typography</h4>
            <div className="grid grid-cols-3 gap-3">
              <ColorPicker
                label="Title"
                value={settings.titleColor}
                onChange={(v) => updateSetting("titleColor", v)}
              />
              <ColorPicker
                label="Description"
                value={settings.descriptionColor}
                onChange={(v) => updateSetting("descriptionColor", v)}
              />
              <ColorPicker
                label="Meta"
                value={settings.metaColor}
                onChange={(v) => updateSetting("metaColor", v)}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Capability Tags</h4>
            <div className="grid grid-cols-3 gap-3">
              <ColorPicker
                label="Background"
                value={settings.tagBackground}
                onChange={(v) => updateSetting("tagBackground", v)}
              />
              <ColorPicker
                label="Border"
                value={settings.tagBorder}
                onChange={(v) => updateSetting("tagBorder", v)}
              />
              <ColorPicker
                label="Text"
                value={settings.tagText}
                onChange={(v) => updateSetting("tagText", v)}
              />
            </div>
          </div>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-6 mt-4">
          {/* Difficulty Badges */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Difficulty Badges</h4>
            
            {/* Beginner */}
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.beginnerBadge.background),
                    borderColor: hslToCss(settings.beginnerBadge.border),
                    color: hslToCss(settings.beginnerBadge.text),
                    border: `1px solid ${hslToCss(settings.beginnerBadge.border)}`,
                  }}
                >
                  Beginner
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ColorPicker
                  label="Background"
                  value={settings.beginnerBadge.background}
                  onChange={(v) => updateSetting("beginnerBadge", { ...settings.beginnerBadge, background: v })}
                />
                <ColorPicker
                  label="Border"
                  value={settings.beginnerBadge.border}
                  onChange={(v) => updateSetting("beginnerBadge", { ...settings.beginnerBadge, border: v })}
                />
                <ColorPicker
                  label="Text"
                  value={settings.beginnerBadge.text}
                  onChange={(v) => updateSetting("beginnerBadge", { ...settings.beginnerBadge, text: v })}
                />
              </div>
            </div>

            {/* Intermediate */}
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.intermediateBadge.background),
                    borderColor: hslToCss(settings.intermediateBadge.border),
                    color: hslToCss(settings.intermediateBadge.text),
                    border: `1px solid ${hslToCss(settings.intermediateBadge.border)}`,
                  }}
                >
                  Intermediate
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ColorPicker
                  label="Background"
                  value={settings.intermediateBadge.background}
                  onChange={(v) => updateSetting("intermediateBadge", { ...settings.intermediateBadge, background: v })}
                />
                <ColorPicker
                  label="Border"
                  value={settings.intermediateBadge.border}
                  onChange={(v) => updateSetting("intermediateBadge", { ...settings.intermediateBadge, border: v })}
                />
                <ColorPicker
                  label="Text"
                  value={settings.intermediateBadge.text}
                  onChange={(v) => updateSetting("intermediateBadge", { ...settings.intermediateBadge, text: v })}
                />
              </div>
            </div>

            {/* Advanced */}
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.advancedBadge.background),
                    borderColor: hslToCss(settings.advancedBadge.border),
                    color: hslToCss(settings.advancedBadge.text),
                    border: `1px solid ${hslToCss(settings.advancedBadge.border)}`,
                  }}
                >
                  Advanced
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ColorPicker
                  label="Background"
                  value={settings.advancedBadge.background}
                  onChange={(v) => updateSetting("advancedBadge", { ...settings.advancedBadge, background: v })}
                />
                <ColorPicker
                  label="Border"
                  value={settings.advancedBadge.border}
                  onChange={(v) => updateSetting("advancedBadge", { ...settings.advancedBadge, border: v })}
                />
                <ColorPicker
                  label="Text"
                  value={settings.advancedBadge.text}
                  onChange={(v) => updateSetting("advancedBadge", { ...settings.advancedBadge, text: v })}
                />
              </div>
            </div>
          </div>

          {/* Lifecycle Badges */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Lifecycle Badges</h4>
            
            {/* Current */}
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.currentBadge.background),
                    borderColor: hslToCss(settings.currentBadge.border),
                    color: hslToCss(settings.currentBadge.text),
                    border: `1px solid ${hslToCss(settings.currentBadge.border)}`,
                  }}
                >
                  {lifecycleStateLabels.current}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ColorPicker
                  label="Background"
                  value={settings.currentBadge.background}
                  onChange={(v) => updateSetting("currentBadge", { ...settings.currentBadge, background: v })}
                />
                <ColorPicker
                  label="Border"
                  value={settings.currentBadge.border}
                  onChange={(v) => updateSetting("currentBadge", { ...settings.currentBadge, border: v })}
                />
                <ColorPicker
                  label="Text"
                  value={settings.currentBadge.text}
                  onChange={(v) => updateSetting("currentBadge", { ...settings.currentBadge, text: v })}
                />
              </div>
            </div>

            {/* Reference */}
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.referenceBadge.background),
                    borderColor: hslToCss(settings.referenceBadge.border),
                    color: hslToCss(settings.referenceBadge.text),
                    border: `1px solid ${hslToCss(settings.referenceBadge.border)}`,
                  }}
                >
                  {lifecycleStateLabels.reference}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ColorPicker
                  label="Background"
                  value={settings.referenceBadge.background}
                  onChange={(v) => updateSetting("referenceBadge", { ...settings.referenceBadge, background: v })}
                />
                <ColorPicker
                  label="Border"
                  value={settings.referenceBadge.border}
                  onChange={(v) => updateSetting("referenceBadge", { ...settings.referenceBadge, border: v })}
                />
                <ColorPicker
                  label="Text"
                  value={settings.referenceBadge.text}
                  onChange={(v) => updateSetting("referenceBadge", { ...settings.referenceBadge, text: v })}
                />
              </div>
            </div>

            {/* Legacy */}
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.legacyBadge.background),
                    borderColor: hslToCss(settings.legacyBadge.border),
                    color: hslToCss(settings.legacyBadge.text),
                    border: `1px solid ${hslToCss(settings.legacyBadge.border)}`,
                  }}
                >
                  {lifecycleStateLabels.legacy}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ColorPicker
                  label="Background"
                  value={settings.legacyBadge.background}
                  onChange={(v) => updateSetting("legacyBadge", { ...settings.legacyBadge, background: v })}
                />
                <ColorPicker
                  label="Border"
                  value={settings.legacyBadge.border}
                  onChange={(v) => updateSetting("legacyBadge", { ...settings.legacyBadge, border: v })}
                />
                <ColorPicker
                  label="Text"
                  value={settings.legacyBadge.text}
                  onChange={(v) => updateSetting("legacyBadge", { ...settings.legacyBadge, text: v })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets" className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Save Current Settings</Label>
            {showSavePresetInput ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Preset name..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                  autoFocus
                />
                <Button onClick={handleSavePreset} size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSavePresetInput(false);
                    setNewPresetName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowSavePresetInput(true)}>
                <Save className="h-4 w-4 mr-2" />
                Save as Preset
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Available Presets</Label>
            {presets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                No presets available.
              </p>
            ) : (
              <div className="grid gap-2">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <span className="font-medium text-sm">{preset.name}</span>
                      {!preset.id.startsWith("custom_") && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Built-in
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApplyPreset(preset)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Apply
                      </Button>
                      {preset.id.startsWith("custom_") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeletePreset(preset.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-4">
          <div 
            className="p-6 rounded-lg border"
            style={{ backgroundColor: hslToCss(settings.pageBackground) }}
          >
            <p className="text-sm text-muted-foreground mb-4">
              Live preview with current settings:
            </p>
            
            {/* Sample Card Preview */}
            <div 
              className="max-w-sm rounded-xl border p-5"
              style={{
                backgroundColor: hslToCss(settings.cardBackground),
                borderColor: hslToCss(settings.cardBorder),
                boxShadow: shadowFromIntensity(settings.cardShadow, settings.cardShadowDirection),
              }}
            >
              <h3
                className="text-base font-medium line-clamp-2"
                style={{ color: hslToCss(settings.titleColor) }}
              >
                AI Foundations for Professionals
              </h3>
              <p
                className="mt-2 text-sm line-clamp-1"
                style={{ color: hslToCss(settings.descriptionColor) }}
              >
                A comprehensive introduction to AI concepts...
              </p>
              
              {/* Badges Preview */}
              <div className="mt-3 flex flex-wrap gap-2">
                {/* Difficulty Badges */}
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.beginnerBadge.background),
                    border: `1px solid ${hslToCss(settings.beginnerBadge.border)}`,
                    color: hslToCss(settings.beginnerBadge.text),
                  }}
                >
                  Beginner
                </span>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.intermediateBadge.background),
                    border: `1px solid ${hslToCss(settings.intermediateBadge.border)}`,
                    color: hslToCss(settings.intermediateBadge.text),
                  }}
                >
                  Intermediate
                </span>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.advancedBadge.background),
                    border: `1px solid ${hslToCss(settings.advancedBadge.border)}`,
                    color: hslToCss(settings.advancedBadge.text),
                  }}
                >
                  Advanced
                </span>
              </div>

              {/* Lifecycle Badges */}
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.currentBadge.background),
                    border: `1px solid ${hslToCss(settings.currentBadge.border)}`,
                    color: hslToCss(settings.currentBadge.text),
                  }}
                >
                  Current
                </span>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.referenceBadge.background),
                    border: `1px solid ${hslToCss(settings.referenceBadge.border)}`,
                    color: hslToCss(settings.referenceBadge.text),
                  }}
                >
                  Stable Reference
                </span>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium opacity-70"
                  style={{
                    backgroundColor: hslToCss(settings.legacyBadge.background),
                    border: `1px solid ${hslToCss(settings.legacyBadge.border)}`,
                    color: hslToCss(settings.legacyBadge.text),
                  }}
                >
                  Legacy
                </span>
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Fundamentals", "Concepts", "Getting Started"].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: hslToCss(settings.tagBackground),
                      border: `1px solid ${hslToCss(settings.tagBorder)}`,
                      color: hslToCss(settings.tagText),
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span
                  className="text-xs"
                  style={{ color: hslToCss(settings.metaColor) }}
                >
                  Updated January 25, 2026
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}
